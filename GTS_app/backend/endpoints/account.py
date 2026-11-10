from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import User, Event, GamePlayer

account_bp = Blueprint("account", __name__)


@account_bp.route("/api/account/overview", methods=["GET"])
@jwt_required()
def get_account_overview():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden"}), 404

    now = datetime.now()

    attended_events = [
        {
            "id": e.id,
            "title": e.title,
            "start_time": e.start_time.isoformat(),
            "description": e.description,
        }
        for e in Event.query.filter(Event.start_time >= now)
        .order_by(Event.start_time.asc())
        .all()
        if user in e.attendees.all()
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
                "is_structured": g.is_structured,
                "is_open_list": bool(g.is_open_list),
                "format_type": g.format_type,
                "points": g.points,
                "start_time": g.start_time.isoformat(),
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
                    "discord_account": user.discord_account,
                },
                "events": attended_events,
                "games": user_games,
            }
        ),
        200,
    )


@account_bp.route("/api/account/password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden"}), 404

    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"msg": "Bitte altes und neues Passwort eingeben."}), 400

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({"msg": "Aktuelles Passwort ist falsch."}), 401

    if len(new_password) < 6:
        return (
            jsonify({"msg": "Neues Passwort muss mindestens 6 Zeichen lang sein."}),
            400,
        )

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"msg": "Passwort erfolgreich geändert!"}), 200


@account_bp.route("/api/account/discord", methods=["PUT"])
@jwt_required()
def update_discord_account():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden"}), 404

    data = request.get_json()
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