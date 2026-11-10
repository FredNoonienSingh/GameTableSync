from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, Event, Game
from services.discord import (
    create_event_webhook,
    update_event_webhook,
    update_game_webhook,
)
from .utils import is_admin

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/api/admin/users", methods=["GET"])
@jwt_required()
def get_users():
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    users = User.query.all()
    return (
        jsonify(
            [
                {
                    "id": u.id,
                    "display_name": u.display_name,
                    "email": u.email,
                    "is_admin": u.is_admin,
                }
                for u in users
            ]
        ),
        200,
    )


@admin_bp.route("/api/admin/users/<int:user_id>/role", methods=["PUT"])
@jwt_required()
def toggle_user_role(user_id):
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden"}), 404

    user.is_admin = not user.is_admin
    db.session.commit()
    return jsonify({"msg": "Rolle aktualisiert"}), 200


@admin_bp.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    data = request.get_json()
    admin_password = data.get("password")

    admin_id = int(get_jwt_identity())
    admin_user = db.session.get(User, admin_id)

    if not admin_user or not check_password_hash(
        admin_user.password_hash, admin_password
    ):
        return (
            jsonify({"msg": "Falsches Admin-Passwort. Löschung abgebrochen."}),
            401,
        )

    if str(admin_user.id) == str(user_id):
        return jsonify({"msg": "Du kannst dich nicht selbst löschen."}), 400

    user_to_delete = db.session.get(User, user_id)
    if not user_to_delete:
        return jsonify({"msg": "Benutzer nicht gefunden"}), 404

    db.session.delete(user_to_delete)
    db.session.commit()

    return jsonify({"msg": "Benutzer erfolgreich gelöscht"}), 200


@admin_bp.route("/api/admin/events", methods=["POST"])
@jwt_required()
def create_event():
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    data = request.get_json()
    title = data.get("title")
    start_time_str = data.get("start_time")
    description = data.get("description")

    if not title or not start_time_str:
        return jsonify({"msg": "Titel und Startzeit sind erforderlich"}), 400

    try:
        start_time = datetime.fromisoformat(start_time_str)
    except ValueError:
        return jsonify({"msg": "Ungültiges Datumsformat"}), 400

    new_event = Event(title=title, start_time=start_time, description=description)
    db.session.add(new_event)
    db.session.commit()

    create_event_webhook(new_event)
    db.session.commit()

    return jsonify({"msg": "Event erfolgreich erstellt!"}), 201


@admin_bp.route("/api/admin/events", methods=["GET"])
@jwt_required()
def get_admin_events():
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    events = Event.query.order_by(Event.start_time.desc()).all()

    return (
        jsonify(
            [
                {
                    "id": e.id,
                    "title": e.title,
                    "start_time": e.start_time.isoformat(),
                    "description": e.description,
                    "attendees": [
                        {"id": a.id, "display_name": a.display_name}
                        for a in e.attendees.all()
                    ],
                }
                for e in events
            ]
        ),
        200,
    )


@admin_bp.route("/api/admin/events/<int:event_id>", methods=["PUT", "DELETE"])
@jwt_required()
def manage_event(event_id):
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    event_target = db.session.get(Event, event_id)
    if not event_target:
        return jsonify({"msg": "Event nicht gefunden"}), 404

    if request.method == "DELETE":
        db.session.delete(event_target)
        db.session.commit()
        return jsonify({"msg": "Event erfolgreich gelöscht"}), 200

    if request.method == "PUT":
        data = request.get_json()
        title = data.get("title")
        start_time_str = data.get("start_time")
        description = data.get("description")

        if title:
            event_target.title = title
        if description is not None:
            event_target.description = description
        if start_time_str:
            try:
                event_target.start_time = datetime.fromisoformat(start_time_str)
            except ValueError:
                return jsonify({"msg": "Ungültiges Datumsformat"}), 400

        db.session.commit()
        update_event_webhook(event_target)
        return jsonify({"msg": "Event erfolgreich aktualisiert"}), 200


@admin_bp.route("/api/admin/games/<int:game_id>/approve", methods=["PUT"])
@jwt_required()
def toggle_game_approval(game_id):
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    game = db.session.get(Game, game_id)
    if not game:
        return jsonify({"msg": "Spiel nicht gefunden"}), 404

    game.is_approved = not game.is_approved
    db.session.commit()

    update_game_webhook(game)

    status_text = "genehmigt" if game.is_approved else "auf 'wartend' gesetzt"
    return (
        jsonify(
            {
                "msg": f"Spiel erfolgreich {status_text}!",
                "is_approved": game.is_approved,
            }
        ),
        200,
    )