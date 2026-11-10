import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import ArmyList
from .utils import log, parse_roster_metadata

armylists_bp = Blueprint("armylists", __name__)


@armylists_bp.route("/api/armylists", methods=["POST"])
@jwt_required()
def upload_army_list():
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify({"msg": "Keine Datei hochgeladen"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".json"):
        return jsonify({"msg": "Nur .json Dateien sind erlaubt"}), 400

    try:
        data = json.load(file)
        meta = parse_roster_metadata(data)

        new_list = ArmyList(
            user_id=user_id,
            name=meta["name"],
            system=meta["system"],
            faction=meta["faction"],
            points=meta["points"],
            points_limit=meta["points_limit"],
            roster_data=data,
        )

        db.session.add(new_list)
        db.session.commit()

        return jsonify({"msg": "Armeeliste erfolgreich gespeichert!", "id": new_list.id}), 201

    except json.JSONDecodeError:
        return jsonify({"msg": "Die Datei ist kein gültiges JSON Format."}), 400
    except Exception as e:
        db.session.rollback()
        log(f"DEBUG [ArmyList]: Error saving list - {e}")
        return jsonify({"msg": "Serverfehler beim Verarbeiten der Liste."}), 500


@armylists_bp.route("/api/armylists", methods=["GET"])
@jwt_required()
def get_user_army_lists():
    user_id = int(get_jwt_identity())
    lists = ArmyList.query.filter_by(user_id=user_id).order_by(ArmyList.created_at.desc()).all()

    result = []
    for l in lists:
        meta = parse_roster_metadata(l.roster_data) if l.roster_data else {}
        result.append(
            {
                "id": l.id,
                "name": l.name,
                "system": meta.get("system") or l.system,
                "faction": meta.get("faction") if l.faction in (None, "Unknown Faction") else l.faction,
                "detachment": meta.get("detachment"),
                "points": l.points,
                "points_limit": meta.get("points_limit") or l.points_limit,
                "created_at": l.created_at.isoformat(),
            }
        )
    return jsonify(result), 200


@armylists_bp.route("/api/armylists/<int:list_id>", methods=["GET"])
def get_army_list_detail(list_id):
    army_list = db.session.get(ArmyList, list_id)
    if not army_list:
        return jsonify({"msg": "Liste nicht gefunden"}), 404

    meta = parse_roster_metadata(army_list.roster_data)
    return (
        jsonify(
            {
                "metadata": {
                    "name": army_list.name,
                    "system": meta["system"],
                    "raw_system": meta["raw_system"],
                    "faction": meta["faction"],
                    "detachment": meta["detachment"],
                    "points": meta["points"],
                    "points_limit": meta["points_limit"],
                },
                "roster_data": army_list.roster_data,
            }
        ),
        200,
    )


@armylists_bp.route("/api/armylists/<int:list_id>", methods=["DELETE"])
@jwt_required()
def delete_army_list(list_id):
    user_id = int(get_jwt_identity())
    army_list = db.session.get(ArmyList, list_id)

    if not army_list:
        return jsonify({"msg": "Liste nicht gefunden"}), 404

    if army_list.user_id != user_id:
        return jsonify({"msg": "Keine Berechtigung"}), 403

    db.session.delete(army_list)
    db.session.commit()
    return jsonify({"msg": "Liste gelöscht"}), 200