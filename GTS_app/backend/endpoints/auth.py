import os
import secrets
import urllib.parse
import requests
from flask import Blueprint, request, jsonify, redirect, Response
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import User
from storage import mirror_remote_image_to_s3, upload_bytes_to_s3, get_object_from_s3
from .utils import log, get_user_club_roles

auth_bp = Blueprint("auth", __name__)

DISCORD_API_BASE = "https://discord.com/api/v10"
ALLOWED_LOCALES = {"de", "en"}
ALLOWED_IMAGE_MIMES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
}

_COLUMNS_CHECKED = False


def _ensure_user_profile_columns() -> None:
    """Safely adds the new profile columns to the existing PostgreSQL table if missing."""
    global _COLUMNS_CHECKED
    if _COLUMNS_CHECKED:
        return
    table_name = getattr(User, "__tablename__", "users")
    statements = [
        f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS real_name VARCHAR(80)',
        f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS age INTEGER',
        f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS city_or_zip VARCHAR(100)',
        f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS bio VARCHAR(300)',
        'ALTER TABLE "club_licenses" ADD COLUMN IF NOT EXISTS license_type VARCHAR(32) DEFAULT \'single\'',
        'ALTER TABLE "club_licenses" ADD COLUMN IF NOT EXISTS bundle_id VARCHAR(64)',
        'ALTER TABLE "club_licenses" ADD COLUMN IF NOT EXISTS is_primary_slot BOOLEAN DEFAULT TRUE',
        'ALTER TABLE "club_licenses" ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(32) DEFAULT \'yearly\'',
        'ALTER TABLE "club_licenses" ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0',
        'ALTER TABLE "club_licenses" ADD COLUMN IF NOT EXISTS price_eur DOUBLE PRECISION',
        'ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT \'tabletop\'',
        'ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS pairing_system VARCHAR(32) DEFAULT \'swiss\'',
        'ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS schedule_mode VARCHAR(32) DEFAULT \'sync\'',
        'ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS round_duration_hours DOUBLE PRECISION DEFAULT 3.0',
        'ALTER TABLE "tournament_matches" ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP',
        'ALTER TABLE "tournament_matches" ADD COLUMN IF NOT EXISTS table_id UUID',
        'ALTER TABLE "club_employees" ADD COLUMN IF NOT EXISTS weekly_hours DOUBLE PRECISION DEFAULT 20.0',
        'ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS opening_hours JSONB',
        'ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS logo_url VARCHAR(512)',
        'ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE',
        'ALTER TABLE "club_pictures" ADD COLUMN IF NOT EXISTS gallery_name VARCHAR(128) DEFAULT \'IMPRESSIONEN // GALERIE\'',
    ]
    try:
        for stmt in statements:
            db.session.execute(text(stmt))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        log(f"WARN [Auth DB]: Could not auto-migrate profile columns: {e}")
    _COLUMNS_CHECKED = True


def _resolve_locale(raw_locale: str | None) -> str:
    """Safely resolves a locale string, defaulting to 'de' if invalid or missing."""
    if raw_locale:
        clean = raw_locale.strip().lower()[:5]
        if clean in ALLOWED_LOCALES:
            return clean
    return "de"


def _build_unique_display_name(preferred_name: str) -> str:
    """Ensures display_name is unique when creating a new user via Discord OAuth."""
    base = (preferred_name or "Player").strip()[:50]
    candidate = base
    while User.query.filter(func.lower(User.display_name) == candidate.lower()).first():
        suffix = secrets.token_hex(2)
        candidate = f"{base}_{suffix}"
    return candidate


def _build_unique_discord_handle(handle: str, current_user_id: str = None) -> str:
    """Ensures discord_account string doesn't collide with an unverified manual entry."""
    clean = (handle or "").strip()[:60]
    if not clean:
        return None
    existing = User.query.filter(func.lower(User.discord_account) == clean.lower()).first()
    if existing and str(existing.id) != str(current_user_id):
        if not existing.discord_id:
            existing.discord_account = None
            db.session.flush()
        else:
            clean = f"{clean}_{secrets.token_hex(2)}"
    return clean


def _parse_discord_profile_data(profile: dict) -> dict:
    """
    Extracts all useful fields from Discord's /users/@me payload,
    including high-res animated/static avatar URLs, banners, and accent colors.
    """
    discord_id = str(profile.get("id") or "").strip()
    discord_username = (profile.get("username") or "").strip()
    global_name = (profile.get("global_name") or discord_username or "TabletopPlayer").strip()
    email = (profile.get("email") or "").strip().lower()
    email_verified = bool(profile.get("verified", False))
    avatar_hash = profile.get("avatar")
    banner_hash = profile.get("banner")
    accent_color_int = profile.get("accent_color")
    discord_locale = (profile.get("locale") or "").strip()
    mfa_enabled = bool(profile.get("mfa_enabled", False))

    if discord_id and avatar_hash:
        ext = "gif" if str(avatar_hash).startswith("a_") else "png"
        cdn_avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.{ext}?size=512"
    elif discord_id:
        default_index = (int(discord_id) >> 22) % 6 if discord_id.isdigit() else 0
        cdn_avatar_url = f"https://cdn.discordapp.com/embed/avatars/{default_index}.png"
    else:
        cdn_avatar_url = None

    if discord_id and banner_hash:
        b_ext = "gif" if str(banner_hash).startswith("a_") else "png"
        cdn_banner_url = f"https://cdn.discordapp.com/banners/{discord_id}/{banner_hash}.{b_ext}?size=1024"
    else:
        cdn_banner_url = None

    accent_hex = f"#{accent_color_int:06x}" if isinstance(accent_color_int, int) else None

    return {
        "discord_id": discord_id,
        "discord_username": discord_username,
        "global_name": global_name,
        "email": email,
        "email_verified": email_verified,
        "cdn_avatar_url": cdn_avatar_url,
        "cdn_banner_url": cdn_banner_url,
        "accent_color": accent_hex,
        "discord_locale": discord_locale,
        "mfa_enabled": mfa_enabled,
        "raw_profile": profile,
    }


def _apply_discord_data_to_user(user: User, d_data: dict) -> None:
    """
    Mirrors the Discord avatar (and banner) into SeaweedFS S3 and updates all available
    fields on the SQLAlchemy User instance.
    """
    discord_id = d_data["discord_id"]
    user.discord_id = discord_id
    user.discord_account = _build_unique_discord_handle(d_data["discord_username"], user.id)

    if d_data["cdn_avatar_url"]:
        s3_avatar_url = mirror_remote_image_to_s3(
            d_data["cdn_avatar_url"],
            key_prefix=f"avatars/discord/{discord_id}",
        )
        if s3_avatar_url:
            user.avatar_url = s3_avatar_url

    if hasattr(user, "banner_url") and d_data["cdn_banner_url"]:
        s3_banner_url = mirror_remote_image_to_s3(
            d_data["cdn_banner_url"],
            key_prefix=f"banners/discord/{discord_id}",
        )
        if s3_banner_url:
            setattr(user, "banner_url", s3_banner_url)

    if hasattr(user, "accent_color") and d_data["accent_color"]:
        setattr(user, "accent_color", d_data["accent_color"])
    if hasattr(user, "discord_global_name") and d_data["global_name"]:
        setattr(user, "discord_global_name", d_data["global_name"])
    if hasattr(user, "locale") and d_data["discord_locale"]:
        setattr(user, "locale", d_data["discord_locale"][:10])


def _exchange_discord_code_for_user(code: str, redirect_uri: str = None) -> tuple[User | None, str | None]:
    """
    Exchanges a Discord OAuth2 authorization code for an access token,
    fetches the Discord user profile, mirrors assets to SeaweedFS, and resolves or creates the local User.
    """
    _ensure_user_profile_columns()
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    client_secret = os.environ.get("DISCORD_CLIENT_SECRET")
    resolved_redirect_uri = redirect_uri or os.environ.get("DISCORD_REDIRECT_URI")

    if not client_id or not client_secret or not resolved_redirect_uri:
        return None, "Discord OAuth ist auf dem Server noch nicht konfiguriert (.env fehlt)."

    token_resp = requests.post(
        f"{DISCORD_API_BASE}/oauth2/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": resolved_redirect_uri,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )

    if not token_resp.ok:
        log(f"DEBUG [Discord OAuth]: Token exchange failed: {token_resp.status_code} {token_resp.text}")
        return None, "Discord-Autorisierungscode ungültig oder abgelaufen."

    discord_access_token = token_resp.json().get("access_token")
    if not discord_access_token:
        return None, "Kein Access-Token von Discord erhalten."

    user_resp = requests.get(
        f"{DISCORD_API_BASE}/users/@me",
        headers={"Authorization": f"Bearer {discord_access_token}"},
        timeout=10,
    )

    if not user_resp.ok:
        log(f"DEBUG [Discord OAuth]: /users/@me failed: {user_resp.status_code} {user_resp.text}")
        return None, "Discord-Profil konnte nicht geladen werden."

    d_data = _parse_discord_profile_data(user_resp.json())

    if not d_data["discord_id"]:
        return None, "Ungültige Discord-Benutzer-ID."

    if not d_data["email"] or not d_data["email_verified"]:
        return None, "Dein Discord-Account benötigt eine verifizierte E-Mail-Adresse."

    user = User.query.filter_by(discord_id=d_data["discord_id"]).first()
    if not user:
        user = User.query.filter(func.lower(User.email) == d_data["email"]).first()

    try:
        if user:
            _apply_discord_data_to_user(user, d_data)
            db.session.commit()
            log(f"DEBUG [Discord OAuth]: Linked/Updated existing user ID={user.id}")
        else:
            unique_display_name = _build_unique_display_name(d_data["global_name"])
            user = User(
                display_name=unique_display_name,
                email=d_data["email"],
                discord_id=d_data["discord_id"],
                password_hash=None,
                is_app_admin=False,
            )
            db.session.add(user)
            db.session.flush()
            _apply_discord_data_to_user(user, d_data)
            db.session.commit()
            log(f"DEBUG [Discord OAuth]: Created new user ID={user.id} ({user.display_name})")

        return user, None
    except Exception as e:
        db.session.rollback()
        log(f"DEBUG [Discord OAuth]: DB error saving user: {e}")
        return None, "Datenbankfehler bei der Discord-Anmeldung."


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.display_name,
        "email": user.email,
        "discord_id": user.discord_id,
        "discord_account": user.discord_account,
        "avatar_url": user.avatar_url,
        "banner_url": getattr(user, "banner_url", None),
        "accent_color": getattr(user, "accent_color", None),
        "real_name": getattr(user, "real_name", None) or "",
        "age": getattr(user, "age", None),
        "city_or_zip": getattr(user, "city_or_zip", None) or "",
        "bio": getattr(user, "bio", None) or "",
        "has_password": bool(user.password_hash),
        "is_app_admin": bool(user.is_app_admin),
    }


def _issue_gts_jwt_payload(user: User) -> dict:
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "username": user.display_name,
            "is_app_admin": user.is_app_admin,
        },
    )
    return {
        "access_token": access_token,
        "is_app_admin": user.is_app_admin,
        "club_roles": get_user_club_roles(str(user.id)),
        "user": _serialize_user(user),
    }


# ==========================================
# SEAWEEDFS S3 MEDIA STREAMING ROUTE
# ==========================================

@auth_bp.route("/api/media/<path:object_key>", methods=["GET"])
def serve_s3_media(object_key: str):
    """Serves avatars, banners, and club logos stored in SeaweedFS S3."""
    body, content_type = get_object_from_s3(object_key)
    if body is None:
        return jsonify({"msg": "Medium nicht gefunden."}), 404

    return Response(
        body,
        mimetype=content_type or "image/png",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# ==========================================
# STANDARD EMAIL & PASSWORD AUTH
# ==========================================

@auth_bp.route("/api/register", methods=["POST"])
def register():
    _ensure_user_profile_columns()
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    discord_account = (data.get("discord_account") or "").strip() or None

    log(f"DEBUG [Auth]: POST /api/register for username={username}, email={email}, discord={discord_account}")

    if not username or not email or not password:
        return jsonify({"msg": "Bitte alle Pflichtfelder ausfüllen"}), 400

    hashed_pw = generate_password_hash(password)
    new_user = User(
        display_name=username,
        email=email,
        password_hash=hashed_pw,
        discord_account=discord_account,
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        log(f"DEBUG [Auth]: Registered new user ID={new_user.id}")
        return jsonify({"msg": "Account erfolgreich erstellt!"}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "msg": "Benutzername, E-Mail oder Discord-Account ist bereits vergeben"
        }), 409


@auth_bp.route("/api/login", methods=["POST"])
def login():
    _ensure_user_profile_columns()
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"msg": "Bitte E-Mail und Passwort eingeben"}), 400

    user = User.query.filter(func.lower(User.email) == email).first()

    if user and not user.password_hash:
        return jsonify({
            "msg": "Dieser Account wurde über Discord erstellt. Bitte logge dich mit Discord ein."
        }), 401

    if user and user.password_hash and check_password_hash(user.password_hash, password):
        log(f"DEBUG [Auth]: Login successful for user ID={user.id} ({user.display_name})")
        return jsonify(_issue_gts_jwt_payload(user)), 200

    log(f"DEBUG [Auth]: Login failed for email={email}")
    return jsonify({"msg": "Falsche E-Mail oder Passwort"}), 401


# ==========================================
# DISCORD OAUTH2 ENDPOINTS
# ==========================================

@auth_bp.route("/api/auth/discord/url", methods=["GET"])
def get_discord_oauth_url():
    """Returns the Discord OAuth2 authorization URL as JSON."""
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    redirect_uri = request.args.get("redirect_uri") or os.environ.get("DISCORD_REDIRECT_URI")
    locale = _resolve_locale(request.args.get("locale"))

    if not client_id or not redirect_uri:
        return jsonify({"msg": "DISCORD_CLIENT_ID oder DISCORD_REDIRECT_URI fehlt in .env"}), 500

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "identify email",
        "state": locale,
        "prompt": "none",
    }
    url = f"https://discord.com/oauth2/authorize?{urllib.parse.urlencode(params)}"
    return jsonify({"url": url}), 200


@auth_bp.route("/api/auth/discord/login", methods=["GET"])
def discord_login_redirect():
    """Redirects the browser straight to Discord's OAuth2 consent screen, passing locale in state."""
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    redirect_uri = os.environ.get("DISCORD_REDIRECT_URI")
    locale = _resolve_locale(request.args.get("locale"))

    if not client_id or not redirect_uri:
        return jsonify({"msg": "DISCORD_CLIENT_ID oder DISCORD_REDIRECT_URI fehlt in .env"}), 500

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "identify email",
        "state": locale,
    }
    return redirect(f"https://discord.com/oauth2/authorize?{urllib.parse.urlencode(params)}")


@auth_bp.route("/api/auth/discord/callback", methods=["GET"])
def discord_oauth_callback():
    """
    Handles the GET redirect back from Discord, reads the locale from the OAuth2 `state` parameter,
    mirrors the Discord avatar into SeaweedFS, issues the GTS JWT, and redirects to `/{locale}/auth/discord-callback`.
    """
    frontend_url = (os.environ.get("FRONTEND_URL") or "http://localhost:3001").rstrip("/")
    locale = _resolve_locale(request.args.get("state"))

    error = request.args.get("error")
    if error:
        return redirect(f"{frontend_url}/{locale}?error={urllib.parse.quote(error)}")

    code = request.args.get("code")
    if not code:
        return redirect(f"{frontend_url}/{locale}?error=missing_code")

    user, err = _exchange_discord_code_for_user(code)
    if err or not user:
        return redirect(f"{frontend_url}/{locale}?error={urllib.parse.quote(err or 'oauth_failed')}")

    payload = _issue_gts_jwt_payload(user)
    query = urllib.parse.urlencode({
        "access_token": payload["access_token"],
        "is_app_admin": str(payload["is_app_admin"]).lower(),
    })
    return redirect(f"{frontend_url}/{locale}/auth/discord-callback?{query}")


@auth_bp.route("/api/auth/discord/exchange", methods=["POST"])
def discord_oauth_code_exchange():
    """
    Alternative SPA endpoint: Next.js receives the ?code=... from Discord directly
    and POSTs it here to receive the JSON JWT payload.
    """
    data = request.get_json() or {}
    code = data.get("code")
    redirect_uri = data.get("redirect_uri")

    if not code:
        return jsonify({"msg": "Autorisierungscode ('code') fehlt."}), 400

    user, err = _exchange_discord_code_for_user(code, redirect_uri=redirect_uri)
    if err or not user:
        return jsonify({"msg": err or "Discord-Anmeldung fehlgeschlagen."}), 400

    return jsonify(_issue_gts_jwt_payload(user)), 200


@auth_bp.route("/api/account/discord/link", methods=["POST"])
@jwt_required()
def link_discord_to_logged_in_account():
    """
    Allows an already logged-in user to cryptographically verify and link their Discord account
    via OAuth code, automatically pulling and mirroring their Discord avatar to SeaweedFS.
    """
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    data = request.get_json() or {}
    code = data.get("code")
    redirect_uri = data.get("redirect_uri") or os.environ.get("DISCORD_REDIRECT_URI")
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    client_secret = os.environ.get("DISCORD_CLIENT_SECRET")

    if not code:
        return jsonify({"msg": "Discord OAuth Code fehlt."}), 400

    token_resp = requests.post(
        f"{DISCORD_API_BASE}/oauth2/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    if not token_resp.ok:
        return jsonify({"msg": "Discord-Verknüpfung fehlgeschlagen (Code ungültig)."}), 400

    discord_access_token = token_resp.json().get("access_token")
    user_resp = requests.get(
        f"{DISCORD_API_BASE}/users/@me",
        headers={"Authorization": f"Bearer {discord_access_token}"},
        timeout=10,
    )
    if not user_resp.ok:
        return jsonify({"msg": "Discord-Profil konnte nicht geladen werden."}), 400

    d_data = _parse_discord_profile_data(user_resp.json())

    other_owner = User.query.filter_by(discord_id=d_data["discord_id"]).first()
    if other_owner and str(other_owner.id) != str(user.id):
        return jsonify({"msg": "Dieser Discord-Account ist bereits mit einem anderen Benutzer verknüpft."}), 409

    _apply_discord_data_to_user(user, d_data)
    db.session.commit()

    return jsonify({
        "msg": "Discord-Account erfolgreich verifiziert und verknüpft!",
        "user": _serialize_user(user),
    }), 200