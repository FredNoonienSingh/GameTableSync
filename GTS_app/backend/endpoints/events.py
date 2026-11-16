from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, Event
from services.discord import update_event_webhook
from .utils import is_banned_from_club, get_banned_club_ids, get_optional_jwt_user_id

events_bp = Blueprint("events", __name__)


@events_bp.route("/api/events", methods=["GET"])
def get_public_events():
    viewer_id = get_optional_jwt_user_id()
    banned_clubs = get_banned_club_ids(viewer_id)
    
    now = datetime.utcnow()
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
                    "club_id": e.club_id,
                    "start_time": e.start_time.isoformat(),
                    "description": e.description,
                    "attendees": [
                        {"id": a.id, "display_name": a.display_name}
                        for a in e.attendees.all()
                    ],
                }
                for e in events
                if e.club_id not in banned_clubs
            ]
        ),
        200,
    )


@events_bp.route("/api/events/<string:event_id>/attend", methods=["POST"])
@jwt_required()
def toggle_attendance(event_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user:
        return jsonify({"msg": "Session abgelaufen. Bitte neu einloggen."}), 401

    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"msg": "Event nicht gefunden"}), 404
        
    if is_banned_from_club(user.id, event.club_id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club."}), 403

    if event.attendees.filter_by(id=user.id).first():
        event.attendees.remove(user)
        msg = "Teilnahme zurückgenommen"
    else:
        event.attendees.append(user)
        msg = "Erfolgreich angemeldet!"

    db.session.commit()
    update_event_webhook(event)
    return jsonify({"msg": msg}), 200