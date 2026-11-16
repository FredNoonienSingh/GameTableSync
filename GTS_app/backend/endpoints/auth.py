import os
import secrets
import urllib.parse
import requests
from flask import Blueprint, request, jsonify, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import User
from .utils import log, get_user_club_roles

auth_bp = Blueprint("auth", __name__)

DISCORD_API_BASE = "https://discord.com/api/v10"


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
        # Free up the unverified handle on the other account so the verified Discord owner gets it
        if not existing.discord_id:
            existing.discord_account = None
            db.session.flush()
        else:
            clean = f"{clean}_{secrets.token_hex(2)}"
    return clean


def _exchange_discord_code_for_user(code: str, redirect_uri: str = None) -> tuple[User | None, str | None]:
    """
    Exchanges a Discord OAuth2 authorization code for an access token,
    fetches the Discord user profile, and resolves or creates the local User.
    """
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    client_secret = os.environ.get("DISCORD_CLIENT_SECRET")
    resolved_redirect_uri = redirect_uri or os.environ.get("DISCORD_REDIRECT_URI")

    if not client_id or not client_secret or not resolved_redirect_uri:
        return None, "Discord OAuth ist auf dem Server noch nicht konfiguriert (.env fehlt)."

    # 1. Exchange authorization code for Discord access token
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

    # 2. Fetch Discord user profile (/users/@me)
    user_resp = requests.get(
        f"{DISCORD_API_BASE}/users/@me",
        headers={"Authorization": f"Bearer {discord_access_token}"},
        timeout=10,
    )

    if not user_resp.ok:
        log(f"DEBUG [Discord OAuth]: /users/@me failed: {user_resp.status_code} {user_resp.text}")
        return None, "Discord-Profil konnte nicht geladen werden."

    profile = user_resp.json()
    discord_id = str(profile.get("id") or "").strip()
    discord_username = (profile.get("username") or "").strip()
    global_name = (profile.get("global_name") or discord_username or "TabletopPlayer").strip()
    email = (profile.get("email") or "").strip().lower()
    email_verified = profile.get("verified", False)
    avatar_hash = profile.get("avatar")

    if not discord_id:
        return None, "Ungültige Discord-Benutzer-ID."

    if not email or not email_verified:
        return None, "Dein Discord-Account benötigt eine verifizierte E-Mail-Adresse."

    avatar_url = (
        f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.png"
        if avatar_hash
        else None
    )

    # 3. Match existing user by discord_id OR verified email, else create a new User
    user = User.query.filter_by(discord_id=discord_id).first()

    if not user:
        user = User.query.filter(func.lower(User.email) == email).first()

    try:
        if user:
            # Link or update existing account
            user.discord_id = discord_id
            user.discord_account = _build_unique_discord_handle(discord_username, user.id)
            if avatar_url:
                user.avatar_url = avatar_url
            db.session.commit()
            log(f"DEBUG [Discord OAuth]: Linked/Logged in existing user ID={user.id}")
        else:
            # Register brand new account via Discord
            unique_display_name = _build_unique_display_name(global_name)
            unique_handle = _build_unique_discord_handle(discord_username)
            user = User(
                display_name=unique_display_name,
                email=email,
                discord_id=discord_id,
                discord_account=unique_handle,
                avatar_url=avatar_url,
                password_hash=None,  # OAuth user without local password initially
                is_app_admin=False,
            )
            db.session.add(user)
            db.session.commit()
            log(f"DEBUG [Discord OAuth]: Created new user ID={user.id} ({user.display_name})")

        return user, None
    except Exception as e:
        db.session.rollback()
        log(f"DEBUG [Discord OAuth]: DB error saving user: {e}")
        return None, "Datenbankfehler bei der Discord-Anmeldung."


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
        "user": {
            "id": user.id,
            "username": user.display_name,
            "email": user.email,
            "discord_id": user.discord_id,
            "discord_account": user.discord_account,
            "avatar_url": user.avatar_url,
        },
    }


# ==========================================
# STANDARD EMAIL & PASSWORD AUTH
# ==========================================

@auth_bp.route("/api/register", methods=["POST"])
def register():
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
    """Returns the Discord OAuth2 authorization URL as JSON (or use /api/auth/discord/login to redirect directly)."""
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    redirect_uri = request.args.get("redirect_uri") or os.environ.get("DISCORD_REDIRECT_URI")

    if not client_id or not redirect_uri:
        return jsonify({"msg": "DISCORD_CLIENT_ID oder DISCORD_REDIRECT_URI fehlt in .env"}), 500

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "identify email",
        "prompt": "none",
    }
    url = f"https://discord.com/oauth2/authorize?{urllib.parse.urlencode(params)}"
    return jsonify({"url": url}), 200


@auth_bp.route("/api/auth/discord/login", methods=["GET"])
def discord_login_redirect():
    """Redirects the browser straight to Discord's OAuth2 consent screen."""
    client_id = os.environ.get("DISCORD_CLIENT_ID")
    redirect_uri = os.environ.get("DISCORD_REDIRECT_URI")

    if not client_id or not redirect_uri:
        return jsonify({"msg": "DISCORD_CLIENT_ID oder DISCORD_REDIRECT_URI fehlt in .env"}), 500

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "identify email",
    }
    return redirect(f"https://discord.com/oauth2/authorize?{urllib.parse.urlencode(params)}")


@auth_bp.route("/api/auth/discord/callback", methods=["GET"])
def discord_oauth_callback():
    """
    Handles the GET redirect back from Discord, issues the GTS JWT,
    and redirects the user to the Next.js frontend callback page.
    """
    frontend_url = (os.environ.get("FRONTEND_URL") or "http://localhost:3000").rstrip("/")
    error = request.args.get("error")
    if error:
        return redirect(f"{frontend_url}/login?error={urllib.parse.quote(error)}")

    code = request.args.get("code")
    if not code:
        return redirect(f"{frontend_url}/login?error=missing_code")

    user, err = _exchange_discord_code_for_user(code)
    if err or not user:
        return redirect(f"{frontend_url}/login?error={urllib.parse.quote(err or 'oauth_failed')}")

    payload = _issue_gts_jwt_payload(user)
    query = urllib.parse.urlencode({
        "access_token": payload["access_token"],
        "is_app_admin": str(payload["is_app_admin"]).lower(),
    })
    return redirect(f"{frontend_url}/auth/discord-callback?{query}")


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
    Allows an already logged-in user to cryptographically verify and link their Discord account via OAuth code.
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

    profile = user_resp.json()
    discord_id = str(profile.get("id") or "").strip()
    discord_username = (profile.get("username") or "").strip()
    avatar_hash = profile.get("avatar")

    other_owner = User.query.filter_by(discord_id=discord_id).first()
    if other_owner and str(other_owner.id) != str(user.id):
        return jsonify({"msg": "Dieser Discord-Account ist bereits mit einem anderen Benutzer verknüpft."}), 409

    user.discord_id = discord_id
    user.discord_account = _build_unique_discord_handle(discord_username, user.id)
    if avatar_hash:
        user.avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.png"

    db.session.commit()
    return jsonify({
        "msg": "Discord-Account erfolgreich verifiziert und verknüpft!",
        "discord_id": user.discord_id,
        "discord_account": user.discord_account,
        "avatar_url": user.avatar_url,
    }), 200