from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

from extensions import db
from models import CatalogSystem, CatalogFaction, CatalogEntry
from services.bsdata_sync import spawn_sync_process, get_sync_status
from .utils import is_app_admin

catalog_bp = Blueprint("catalog", __name__)


@catalog_bp.route("/api/catalog/sync-status", methods=["GET"])
def get_catalog_sync_status():
    return jsonify(get_sync_status()), 200


@catalog_bp.route("/api/catalog/systems", methods=["GET"])
def get_catalog_systems():
    systems = CatalogSystem.query.order_by(CatalogSystem.name.asc()).all()
    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "github_repo": s.github_repo,
            "last_sync_sha": s.last_sync_sha,
            "last_synced_at": s.last_synced_at.isoformat() if s.last_synced_at else None,
            "factions_count": s.factions.filter_by(is_library=False).count(),
        }
        for s in systems
    ]), 200


@catalog_bp.route("/api/catalog/systems/<string:system_id>/factions", methods=["GET"])
def get_catalog_factions(system_id):
    include_libraries = request.args.get("include_libraries", "false").lower() == "true"
    query = CatalogFaction.query.filter_by(system_id=system_id)
    if not include_libraries:
        query = query.filter_by(is_library=False)

    factions = query.order_by(CatalogFaction.name.asc()).all()
    return jsonify([
        {
            "id": f.id,
            "name": f.name,
            "bs_uuid": f.bs_uuid,
            "revision": f.revision,
            "is_library": f.is_library,
        }
        for f in factions
    ]), 200


@catalog_bp.route("/api/catalog/factions/<string:faction_id>/entries", methods=["GET"])
def get_faction_entries(faction_id):
    entry_type = request.args.get("type")
    search_q = (request.args.get("q") or "").strip()

    query = CatalogEntry.query.filter_by(faction_id=faction_id)
    if entry_type:
        query = query.filter_by(entry_type=entry_type.lower())
    if search_q:
        query = query.filter(CatalogEntry.name.ilike(f"%{search_q}%"))

    entries = query.order_by(CatalogEntry.name.asc()).all()
    return jsonify([
        {
            "id": e.id,
            "bs_uuid": e.bs_uuid,
            "name": e.name,
            "entry_type": e.entry_type,
            "base_points": e.base_points,
            "profile_data": e.raw_profile_data,
        }
        for e in entries
    ]), 200


@catalog_bp.route("/api/admin/catalog/sync", methods=["POST"])
@jwt_required()
def trigger_manual_catalog_sync():
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert (Nur AppAdmin)."}), 403

    body = request.get_json(silent=True) or {}
    force = bool(body.get("force", False))
    discover_all_org = bool(body.get("discover_all_org", False))

    app = current_app._get_current_object()
    spawn_sync_process(app, force=force, discover_all_org=discover_all_org)

    return jsonify({"msg": "BSData Katalog-Synchronisation in eigenem Prozess gestartet!"}), 202


@catalog_bp.route("/api/admin/catalog/repos", methods=["POST"])
@jwt_required()
def add_custom_catalog_repo():
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert (Nur AppAdmin)."}), 403

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    repo = (data.get("github_repo") or "").strip().strip("/")

    if not name or not repo or "/" not in repo:
        return jsonify({"msg": "Name und gültiges GitHub-Repo ('Owner/Repo') erforderlich."}), 400

    existing = CatalogSystem.query.filter_by(github_repo=repo).first()
    if existing:
        return jsonify({"msg": "Dieses Repository ist bereits registriert."}), 409

    sys_rec = CatalogSystem(name=name[:64], github_repo=repo[:128])
    db.session.add(sys_rec)
    db.session.commit()

    return jsonify({"msg": f"System '{name}' ({repo}) hinzugefügt!", "id": sys_rec.id}), 201


@catalog_bp.route("/api/admin/catalog/repos/<string:system_id>", methods=["DELETE"])
@jwt_required()
def delete_catalog_repo(system_id):
    if not is_app_admin():
        return jsonify({"msg": "Sudo-Zugriff verweigert (Nur AppAdmin)."}), 403

    sys_rec = db.session.get(CatalogSystem, system_id)
    if not sys_rec:
        return jsonify({"msg": "System nicht gefunden."}), 404

    db.session.delete(sys_rec)
    db.session.commit()
    return jsonify({"msg": f"System '{sys_rec.name}' gelöscht."}), 200