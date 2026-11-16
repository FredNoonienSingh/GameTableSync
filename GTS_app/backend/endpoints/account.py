from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import User, Event, GamePlayer
from .utils import get_user_club_roles

account_bp = Blueprint("account", __name__)


@account_bp.route("/api/account/overview", methods=["GET"])
@jwt_required()
def get_account_overview():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden"}), 404

    now = datetime.utcnow()

    attended_events = [
        {
            "id": e.id,
            "title": e.title,
            "club_id": e.club_id,
            "start_time": e.start_time.isoformat(),
            "description": e.description,
        }
        for e in user.events.filter(Event.start_time >= now)
        .order_by(Event.start_time.asc())
        .all()
    ]

    user_participations = GamePlayer.query.filter_by(user_id=user_id).all()
    user_games = []
    for part in user_participations:
        g = part.game
        if not g:
            continue
        players = []
        for p in g.participations:
            army_name = (
                p.faction.name if p.faction else (p.custom_army or "Unbekannt")
            )
            players.append(
                {
                    "user_id": p.user.id,
                    "display_name": p.user.display_name,
                    "army": army_name,
                    "team": p.team,
                    "score": getattr(p, "score", None),
                    "army_list_id": p.army_list_id,
                    "army_list_name": p.army_list.name if p.army_list else None,
                }
            )
        user_games.append(
            {
                "id": g.id,
                "system": g.system,
                "club_id": g.club_id,
                "table_id": g.table_id,
                "is_structured": g.is_structured,
                "is_open_list": bool(g.is_open_list),
                "format_type": g.format_type,
                "points": g.points,
                "start_time": g.start_time.isoformat(),
                "end_time": g.end_time.isoformat() if g.end_time else None,
                "status": g.status,
                "created_by_id": g.created_by_id,
                "is_past": g.start_time < now,
                "players": players,
            }
        )

    user_games.sort(key=lambda x: x["start_time"], reverse=True)

    return (
        jsonify(
            {
                "user": {
                    "id": user.id,
                    "username": user.display_name,
                    "email": user.email,
                    "discord_id": user.discord_id,
                    "discord_account": user.discord_account,
                    "avatar_url": user.avatar_url,
                    "has_password": bool(user.password_hash),
                    "is_app_admin": user.is_app_admin,
                },
                "club_roles": get_user_club_roles(str(user.id)),
                "events": attended_events,
                "games": user_games,
            }
        ),
        200,
    )


@account_bp.route("/api/account/password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden"}), 404

    data = request.get_json() or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not new_password or len(new_password) < 6:
        return jsonify({"msg": "Neues Passwort muss mindestens 6 Zeichen lang sein."}), 400

    # If the user already has a password, require current_password verification.
    # If they registered via Discord OAuth (password_hash is None), allow setting an initial password directly.
    if user.password_hash:
        if not current_password:
            return jsonify({"msg": "Bitte aktuelles Passwort eingeben."}), 400
        if not check_password_hash(user.password_hash, current_password):
            return jsonify({"msg": "Aktuelles Passwort ist falsch."}), 401

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"msg": "Passwort erfolgreich gespeichert!"}), 200


@account_bp.route("/api/account/discord", methods=["PUT"])
@jwt_required()
def update_discord_account():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden"}), 404

    data = request.get_json() or {}
    discord_acc = (data.get("discord_account") or "").strip() or None

    user.discord_account = discord_acc
    try:
        db.session.commit()
        return (
            jsonify(
                {
                    "msg": "Discord-Account aktualisiert!",
                    "discord_account": user.discord_account,
                }
            ),
            200,
        )
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Dieser Discord-Account wird bereits verwendet."}), 409