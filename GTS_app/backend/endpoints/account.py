import secrets
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import (
    User,
    Event,
    ArmyList,
    ShowcasePicture,
    Game,
    GamePlayer,
    Tournament,
    TournamentParticipant,
)
from storage import upload_bytes_to_s3
from .auth import ALLOWED_IMAGE_MIMES, _ensure_user_profile_columns, _serialize_user
from .utils import log, get_user_club_roles, get_banned_club_ids

account_bp = Blueprint("account", __name__)


def _as_list(rel_obj):
    """Safely converts either a dynamic AppenderQuery or an InstrumentedList into a Python list."""
    if rel_obj is None:
        return []
    if hasattr(rel_obj, "all") and callable(rel_obj.all):
        return rel_obj.all()
    return list(rel_obj)


@account_bp.route("/api/account/overview", methods=["GET"])
@jwt_required()
def get_account_overview():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    now = datetime.utcnow()
    banned_clubs = get_banned_club_ids(user.id)

    # 1. Events the user is attending
    raw_events = _as_list(getattr(user, "events", None))
    upcoming_events = sorted(
        [
            e for e in raw_events
            if getattr(e, "start_time", None) and e.start_time >= now and getattr(e, "club_id", None) not in banned_clubs
        ],
        key=lambda x: x.start_time,
    )

    events_data = [
        {
            "id": e.id,
            "title": getattr(e, "title", getattr(e, "name", "")),
            "system": getattr(e, "system", None),
            "club_id": getattr(e, "club_id", None),
            "start_time": e.start_time.isoformat() if getattr(e, "start_time", None) else None,
            "end_time": e.end_time.isoformat() if getattr(e, "end_time", None) else None,
            "location": getattr(e, "location", None),
        }
        for e in upcoming_events
    ]

    # 2. User's Army Lists (ordered by created_at)
    army_lists = (
        ArmyList.query.filter_by(user_id=user.id)
        .order_by(ArmyList.created_at.desc())
        .all()
    )
    lists_data = [
        {
            "id": al.id,
            "name": getattr(al, "name", getattr(al, "title", "Unbenannte Liste")),
            "system": getattr(al, "system", None),
            "faction": al.faction.name if getattr(al, "faction", None) else getattr(al, "faction_name", None),
            "points": getattr(al, "points", 0),
            "created_at": al.created_at.isoformat() if getattr(al, "created_at", None) else None,
        }
        for al in army_lists
    ]

    # 3. User's Upcoming & Recent Games
    participations = GamePlayer.query.filter_by(user_id=user.id).all()
    game_ids = {p.game_id for p in participations}
    created_games = Game.query.filter_by(created_by_id=user.id).all()
    for g in created_games:
        game_ids.add(g.id)

    user_games = (
        Game.query.filter(Game.id.in_(game_ids))
        .order_by(Game.start_time.asc())
        .all()
        if game_ids
        else []
    )

    games_data = [
        {
            "id": g.id,
            "title": getattr(g, "title", None),
            "system": getattr(g, "system", None),
            "points": getattr(g, "points", 0),
            "status": getattr(g, "status", "Open"),
            "club_id": getattr(g, "club_id", None),
            "table_id": getattr(g, "table_id", None),
            "is_virtual": getattr(g, "is_virtual", False),
            "start_time": g.start_time.isoformat() if getattr(g, "start_time", None) else None,
            "end_time": g.end_time.isoformat() if getattr(g, "end_time", None) else None,
        }
        for g in user_games
        if getattr(g, "club_id", None) not in banned_clubs
    ]

    # 4. User's Registered Tournaments
    t_parts = TournamentParticipant.query.filter_by(user_id=user.id).all()
    tournaments_data = []
    for tp in t_parts:
        t = db.session.get(Tournament, tp.tournament_id)
        if t and getattr(t, "club_id", None) not in banned_clubs:
            tournaments_data.append({
                "id": t.id,
                "name": getattr(t, "name", getattr(t, "title", "")),
                "system": getattr(t, "system", None),
                "status": getattr(t, "status", "Registration"),
                "club_id": getattr(t, "club_id", None),
                "start_time": t.start_time.isoformat() if getattr(t, "start_time", None) else None,
                "participant_status": getattr(tp, "status", "Registered"),
            })

    # 5. User's ELO Ratings per System
    raw_elos = _as_list(getattr(user, "system_elos", None))
    elos_data = [
        {
            "system": getattr(elo, "system", None),
            "elo": getattr(elo, "elo", 1200),
            "games_played": getattr(elo, "games_played", 0),
        }
        for elo in raw_elos
    ]

    # 6. Showcase Pictures
    raw_pics = _as_list(getattr(user, "showcase_pictures", None))
    showcase_data = [
        {
            "id": pic.id,
            "title": getattr(pic, "title", None),
            "s3_key": getattr(pic, "s3_key", getattr(pic, "image_url", None)),
            "url": getattr(pic, "url", getattr(pic, "image_url", None)),
            "created_at": pic.created_at.isoformat() if getattr(pic, "created_at", None) else None,
        }
        for pic in raw_pics
    ]

    return jsonify({
        "user": {
            "id": user.id,
            "display_name": user.display_name,
            "email": user.email,
            "discord_id": getattr(user, "discord_id", None),
            "discord_account": getattr(user, "discord_account", None),
            "discord_avatar": getattr(user, "discord_avatar", None),
            "is_app_admin": bool(getattr(user, "is_app_admin", False)),
            "created_at": user.created_at.isoformat() if getattr(user, "created_at", None) else None,
        },
        "club_roles": get_user_club_roles(user.id),
        "events": events_data,
        "army_lists": lists_data,
        "games": games_data,
        "tournaments": tournaments_data,
        "elos": elos_data,
        "showcase_pictures": showcase_data,
    }), 200


@account_bp.route("/api/account/me", methods=["GET"])
@jwt_required()
def get_current_account_profile():
    """Returns the authenticated user's profile, SeaweedFS avatar_url, bio, city, and club roles."""
    _ensure_user_profile_columns()
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    return jsonify({
        "user": _serialize_user(user),
        "club_roles": get_user_club_roles(str(user.id)),
    }), 200


@account_bp.route("/api/account/profile", methods=["PUT"])
@jwt_required()
def update_account_profile():
    """Updates username (or display_name), real_name, age, city_or_zip, and bio."""
    _ensure_user_profile_columns()
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    data = request.get_json() or {}
    new_username = (data.get("username") or data.get("display_name") or "").strip()
    real_name = (data.get("real_name") or "").strip()[:80]
    city_or_zip = (data.get("city_or_zip") or "").strip()[:100]
    bio = (data.get("bio") or "").strip()[:300]
    raw_age = data.get("age")

    if not new_username:
        return jsonify({"msg": "Benutzername darf nicht leer sein."}), 400

    if len(new_username) < 2 or len(new_username) > 50:
        return jsonify({"msg": "Benutzername muss zwischen 2 und 50 Zeichen lang sein."}), 400

    # Check if another user already owns this display_name
    existing = User.query.filter(func.lower(User.display_name) == new_username.lower()).first()
    if existing and str(existing.id) != str(user.id):
        return jsonify({"msg": "Dieser Benutzername ist bereits vergeben."}), 409

    parsed_age = None
    if raw_age not in (None, ""):
        try:
            parsed_age = int(raw_age)
            if parsed_age < 6 or parsed_age > 120:
                return jsonify({"msg": "Bitte gib ein gültiges Alter zwischen 6 und 120 ein."}), 400
        except (ValueError, TypeError):
            return jsonify({"msg": "Alter muss eine Zahl sein."}), 400

    user.display_name = new_username

    if "discord_account" in data:
        new_discord = (data.get("discord_account") or "").strip()
        user.discord_account = new_discord or None

    if hasattr(user, "real_name"):
        user.real_name = real_name or None
    if hasattr(user, "age"):
        user.age = parsed_age
    if hasattr(user, "city_or_zip"):
        user.city_or_zip = city_or_zip or None
    if hasattr(user, "bio"):
        user.bio = bio or None

    try:
        table_name = getattr(User, "__tablename__", "users")
        db.session.execute(
            text(
                f'UPDATE "{table_name}" '
                "SET display_name = :dn, real_name = :rn, age = :age, city_or_zip = :cz, bio = :bio "
                "WHERE id = :uid"
            ),
            {
                "dn": new_username,
                "rn": real_name or None,
                "age": parsed_age,
                "cz": city_or_zip or None,
                "bio": bio or None,
                "uid": user.id,
            },
        )
        db.session.commit()
        db.session.refresh(user)
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Dieser Benutzername ist bereits vergeben."}), 409
    except Exception as e:
        db.session.rollback()
        log(f"ERROR [Account]: Failed to update profile for user {user.id}: {e}")
        return jsonify({"msg": "Fehler beim Speichern des Profils."}), 500

    serialized = _serialize_user(user)
    serialized["real_name"] = real_name
    serialized["age"] = parsed_age
    serialized["city_or_zip"] = city_or_zip
    serialized["bio"] = bio

    return jsonify({
        "msg": "Profil erfolgreich gespeichert!",
        "user": serialized,
    }), 200


@account_bp.route("/api/account/avatar", methods=["POST"])
@jwt_required()
def upload_custom_avatar():
    """Uploads a custom profile picture to SeaweedFS S3 and updates user.avatar_url."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    if "file" not in request.files:
        return jsonify({"msg": "Keine Bilddatei übermittelt."}), 400

    file = request.files["file"]
    content_type = (file.mimetype or "").lower()
    if content_type not in ALLOWED_IMAGE_MIMES:
        return jsonify({"msg": "Nur PNG, JPG, WEBP oder GIF erlaubt."}), 400

    raw_bytes = file.read()
    if len(raw_bytes) > 5 * 1024 * 1024:
        return jsonify({"msg": "Bild darf maximal 5 MB groß sein."}), 400

    ext = ALLOWED_IMAGE_MIMES[content_type]
    token_hex = secrets.token_hex(6)
    object_key = f"avatars/custom/{user.id}/{token_hex}.{ext}"

    s3_url = upload_bytes_to_s3(raw_bytes, object_key, content_type=content_type)
    if not s3_url:
        return jsonify({"msg": "S3-Upload fehlgeschlagen."}), 500

    user.avatar_url = s3_url
    db.session.commit()

    return jsonify({
        "msg": "Profilbild erfolgreich aktualisiert!",
        "avatar_url": user.avatar_url,
        "user": _serialize_user(user),
    }), 200


@account_bp.route("/api/account/password-mock", methods=["POST"])
@jwt_required()
def mock_password_change():
    """Mock endpoint for password change (email confirmation flow will be wired up later)."""
    data = request.get_json() or {}
    new_password = data.get("new_password") or ""
    if len(new_password) < 8:
        return jsonify({"msg": "Das neue Passwort muss mindestens 8 Zeichen lang sein."}), 400

    return jsonify({
        "msg": "Vorgemerkt: Passwort-Änderung angefordert (E-Mail-Bestätigungs-Service wird in Kürze aktiviert)."
    }), 200


@account_bp.route("/api/account/password", methods=["PUT"])
@jwt_required()
def change_account_password():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    data = request.get_json() or {}
    current_pw = data.get("current_password") or ""
    new_pw = data.get("new_password") or ""

    if len(new_pw) < 6:
        return jsonify({"msg": "Das neue Passwort muss mindestens 6 Zeichen lang sein."}), 400

    if user.password_hash and not check_password_hash(user.password_hash, current_pw):
        return jsonify({"msg": "Aktuelles Passwort ist falsch."}), 401

    user.password_hash = generate_password_hash(new_pw)
    db.session.commit()
    return jsonify({"msg": "Passwort erfolgreich geändert!"}), 200