import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, Club, ClubLicense, get_all_tiers
from .utils import is_app_admin

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/api/admin/users", methods=["GET"])
@jwt_required()
def get_all_users():
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert (Nur AppAdmin)."}), 403

    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([
        {
            "id": u.id,
            "display_name": u.display_name,
            "email": u.email,
            "discord_account": u.discord_account,
            "is_app_admin": u.is_app_admin,
            "owned_clubs_count": u.owned_clubs.count(),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]), 200


@admin_bp.route("/api/admin/users/<string:user_id>/sudo-role", methods=["PUT"])
@jwt_required()
def toggle_app_admin_role(user_id):
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert."}), 403

    admin_id = get_jwt_identity()
    if str(admin_id) == str(user_id):
        return jsonify({"msg": "Du kannst dir nicht selbst den AppAdmin-Status entziehen."}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    user.is_app_admin = not user.is_app_admin
    db.session.commit()
    return jsonify({"msg": "AppAdmin-Rolle aktualisiert.", "is_app_admin": user.is_app_admin}), 200


@admin_bp.route("/api/admin/users/<string:user_id>", methods=["DELETE"])
@jwt_required()
def sudo_delete_user(user_id):
    """Global account deletion — strictly reserved for AppAdmin."""
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert."}), 403

    data = request.get_json() or {}
    admin_password = data.get("password")

    admin_id = get_jwt_identity()
    admin_user = db.session.get(User, admin_id)

    if not admin_user or not admin_password or not check_password_hash(admin_user.password_hash, admin_password):
        return jsonify({"msg": "Falsches AppAdmin-Passwort. Löschung abgebrochen."}), 401

    if str(admin_user.id) == str(user_id):
        return jsonify({"msg": "Du kannst deinen eigenen Sudo-Account nicht löschen."}), 400

    user_to_delete = db.session.get(User, user_id)
    if not user_to_delete:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    db.session.delete(user_to_delete)
    db.session.commit()
    return jsonify({"msg": f"Benutzer '{user_to_delete.display_name}' global gelöscht."}), 200


@admin_bp.route("/api/admin/clubs", methods=["GET"])
@jwt_required()
def sudo_get_all_clubs():
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert."}), 403

    clubs = Club.query.order_by(Club.created_at.desc()).all()
    return jsonify([
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "owner_id": c.owner_id,
            "owner_name": c.owner.display_name if c.owner else None,
            "tier": c.tier,
            "tables_count": c.tables.count(),
            "employees_count": c.employees.count(),
            "bans_count": c.bans.count(),
        }
        for c in clubs
    ]), 200


@admin_bp.route("/api/admin/clubs/<string:club_id>/tier", methods=["PUT"])
@jwt_required()
def sudo_override_club_tier(club_id):
    """Allows AppAdmin to manually set or upgrade any Club's tier without Stripe."""
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert."}), 403

    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    data = request.get_json() or {}
    tier = data.get("tier")
    tiers = get_all_tiers()
    if tier not in tiers:
        return jsonify({"msg": f"Ungültiges Tier. Verfügbar: {list(tiers.keys())}"}), 400

    if club.license:
        club.license.tier = tier
        club.license.status = "active"
    else:
        lic = ClubLicense(
            owner_id=club.owner_id,
            tier=tier,
            status="active",
            is_mock=True,
            stripe_subscription_id=f"sub_sudo_{uuid.uuid4().hex[:12]}",
            valid_until=datetime.utcnow() + timedelta(days=3650),
        )
        db.session.add(lic)
        db.session.flush()
        club.license_id = lic.id

    db.session.commit()
    return jsonify({"msg": f"Club '{club.name}' durch AppAdmin auf '{tier}' gesetzt!"}), 200


@admin_bp.route("/api/admin/clubs/<string:club_id>", methods=["DELETE"])
@jwt_required()
def sudo_delete_club(club_id):
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert."}), 403

    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    db.session.delete(club)
    db.session.commit()
    return jsonify({"msg": f"Club '{club.name}' vollständig gelöscht."}), 200