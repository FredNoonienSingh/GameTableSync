from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, Event
from services.discord import update_event_webhook

events_bp = Blueprint("events", __name__)


@events_bp.route("/api/events", methods=["GET"])
def get_public_events():
    now = datetime.now()
    events = (
        Event.query.filter(Event.start_time >= now)
        .order_by(Event.start_time.asc())
        .all()
    )

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


@events_bp.route("/api/events/<int:event_id>/attend", methods=["POST"])
@jwt_required()
def toggle_attendance(event_id):
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    if not user:
        return jsonify({"msg": "Session abgelaufen. Bitte neu einloggen."}), 401

    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"msg": "Event nicht gefunden"}), 404

    if user in event.attendees.all():
        event.attendees.remove(user)
        msg = "Teilnahme zurückgenommen"
    else:
        event.attendees.append(user)
        msg = "Erfolgreich angemeldet!"

    db.session.commit()
    update_event_webhook(event)
    return jsonify({"msg": msg}), 200