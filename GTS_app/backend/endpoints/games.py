from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, Game, GamePlayer, FactionCategory, Club, ClubTable, infer_table_category
from .club import find_available_club_tables
from services.discord import (
    create_game_webhook,
    update_game_webhook,
    delete_game_webhook,
)
from .utils import (
    log, 
    validate_and_resolve_army_list, 
    is_banned_from_club,
    get_banned_club_ids,
    get_optional_jwt_user_id,
    is_club_keymaster
)

games_bp = Blueprint("games", __name__)


@games_bp.route("/api/factions/structure", methods=["GET"])
def get_factions_structure():
    categories = FactionCategory.query.all()
    systems_dict = {}

    for cat in categories:
        if cat.system not in systems_dict:
            systems_dict[cat.system] = []

        factions_list = [{"id": f.id, "name": f.name} for f in cat.factions]
        systems_dict[cat.system].append(
            {
                "category_id": cat.id,
                "category_name": cat.name,
                "factions": factions_list,
            }
        )

    return jsonify(systems_dict), 200


@games_bp.route("/api/games", methods=["GET"])
def get_games():
    viewer_id = get_optional_jwt_user_id()
    banned_clubs = get_banned_club_ids(viewer_id)

    now = datetime.utcnow()
    games = (
        Game.query.filter(Game.end_time >= now)
        .order_by(Game.start_time.asc())
        .all()
    )

    result = []
    for g in games:
        if g.club_id in banned_clubs:
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
                    "discord_account": p.user.discord_account,
                    "army": army_name,
                    "team": p.team,
                    "faction_id": p.faction_id,
                    "custom_army": p.custom_army,
                    "army_list_id": p.army_list_id,
                    "army_list_name": p.army_list.name if p.army_list else None,
                }
            )

        result.append(
            {
                "id": g.id,
                "system": g.system,
                "is_structured": g.is_structured,
                "is_open_list": bool(g.is_open_list),
                "format_type": g.format_type,
                "points": g.points,
                "description": g.description,
                "start_time": g.start_time.isoformat(),
                "end_time": g.end_time.isoformat() if g.end_time else None,
                "club_id": g.club_id,
                "table_id": g.table_id,
                "required_table_type": g.required_table_type,
                "status": g.status,
                "is_virtual": g.is_virtual,
                "is_approved": g.is_approved,
                "created_by_id": g.created_by_id,
                "players": players,
            }
        )

    return jsonify(result), 200


@games_bp.route("/api/games", methods=["POST"])
@jwt_required()
def create_game():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    data = request.get_json()

    if not user:
        return jsonify({"msg": "Sitzung ungültig."}), 401

    club_id = data.get("club_id")
    if not data.get("is_virtual", False) and not club_id:
        first_club = Club.query.first()
        if first_club:
            club_id = first_club.id
            
    if club_id and is_banned_from_club(user_id, club_id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club."}), 403

    try:
        start_time = datetime.fromisoformat(data["start_time"])
    except (ValueError, KeyError):
        return jsonify({"msg": "Ungültiges Datumsformat"}), 400

    duration_minutes = int(data.get("duration_minutes", 180))
    end_time = start_time + timedelta(minutes=duration_minutes)

    system = data.get("system")
    points = data.get("points")
    is_structured = data.get("is_structured", True)
    is_open_list = bool(data.get("is_open_list", False))
    format_type = data.get("format_type", "1v1")
    is_virtual = data.get("is_virtual", False)
    team = data.get("team") if format_type == "2v2" else None
    army_list_id = data.get("army_list_id")
    required_table_type = data.get("required_table_type") or infer_table_category(system)

    if format_type == "2v2" and not team:
        return jsonify({"msg": "Bitte wähle ein Team (Team 1 oder Team 2) aus!"}), 400

    if is_open_list and not army_list_id:
        return jsonify({"msg": "Für ein 'Open List'-Spiel musst du eine gültige Armeeliste auswählen!"}), 400

    if army_list_id:
        _, faction_id, custom_army, err = validate_and_resolve_army_list(
            str(army_list_id), user_id, system, points
        )
        if err:
            return jsonify({"msg": err}), 400
    else:
        faction_id = data.get("faction_id") if is_structured else None
        custom_army = None if is_structured else (data.get("army") or "").strip()
        if is_structured and not faction_id:
            return jsonify({"msg": "Bitte wähle eine Fraktion aus!"}), 400
        if not is_structured and not custom_army:
            return jsonify({"msg": "Du musst eine Armee angeben!"}), 400

    if not is_virtual and club_id:
        free_tables = find_available_club_tables(club_id, required_table_type, start_time, end_time)
        if not free_tables:
            return jsonify({
                "msg": f"Für diesen Zeitraum gibt es keine freien '{required_table_type.upper()}'-Tische im Club."
            }), 400

    is_approved = (
        True
        if is_virtual or (club_id and is_club_keymaster(user.id, club_id))
        else False
    )

    try:
        new_game = Game(
            system=system,
            is_structured=is_structured,
            is_open_list=is_open_list,
            format_type=format_type,
            points=points,
            description=data.get("description"),
            start_time=start_time,
            end_time=end_time,
            club_id=club_id,
            required_table_type=required_table_type,
            is_virtual=is_virtual,
            is_approved=is_approved,
            created_by_id=user.id,
            status="Open",
        )
        db.session.add(new_game)
        db.session.flush()

        creator_player = GamePlayer(
            user_id=user.id,
            game_id=new_game.id,
            faction_id=faction_id,
            custom_army=custom_army,
            army_list_id=str(army_list_id) if army_list_id else None,
            team=team,
        )
        db.session.add(creator_player)
        db.session.commit()

        create_game_webhook(new_game)
        db.session.commit()

        return jsonify({"msg": "Herausforderung erstellt!", "id": new_game.id}), 201

    except Exception as e:
        log(f"DEBUG [Games]: CRITICAL ERROR in create_game: {e}")
        db.session.rollback()
        return jsonify({"msg": f"Serverfehler beim Erstellen: {str(e)}"}), 500


@games_bp.route("/api/games/<string:game_id>/join", methods=["POST"])
@jwt_required()
def join_game(game_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Sitzung abgelaufen. Bitte logge dich neu ein!"}), 401

    game = db.session.get(Game, game_id)
    if not game:
        return jsonify({"msg": "Spiel nicht gefunden"}), 404

    if game.club_id and is_banned_from_club(user_id, game.club_id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club."}), 403

    if game.status != "Open":
        return jsonify({"msg": "Dieses Spiel ist bereits voll oder abgeschlossen."}), 400

    if any(p.user_id == user_id for p in game.participations):
        return jsonify({"msg": "Du bist diesem Spiel bereits beigetreten."}), 400

    data = request.get_json()
    team = data.get("team") if game.format_type == "2v2" else None
    army_list_id = data.get("army_list_id")

    if game.format_type == "2v2":
        if not team:
            return jsonify({"msg": "Bitte wähle ein Team (Team 1 oder Team 2) aus!"}), 400
        team_count = GamePlayer.query.filter_by(game_id=game.id, team=team).count()
        if team_count >= 2:
            return jsonify({"msg": f"{team} ist bereits voll (max. 2 Spieler)!"}), 400

    if game.is_open_list and not army_list_id:
        return jsonify({"msg": "Dieses Spiel erfordert eine hochgeladene Armeeliste (Open List)!"}), 400

    if army_list_id:
        _, faction_id, custom_army, err = validate_and_resolve_army_list(
            str(army_list_id), user_id, game.system, game.points
        )
        if err:
            return jsonify({"msg": err}), 400
    else:
        faction_id = data.get("faction_id") if game.is_structured else None
        custom_army = (data.get("army") or "").strip() if not game.is_structured else None
        if game.is_structured and not faction_id:
            return jsonify({"msg": "Bitte wähle eine Fraktion aus!"}), 400
        if not game.is_structured and not custom_army:
            return jsonify({"msg": "Du musst eine Armee angeben!"}), 400

    max_players = 2 if game.format_type == "1v1" else 4
    current_players = game.participations.count()

    conflicting_game = (
        GamePlayer.query.join(Game)
        .filter(
            GamePlayer.user_id == user_id,
            Game.status == "Matched",
            Game.start_time < game.end_time,
            Game.end_time > game.start_time,
        )
        .first()
    )

    if conflicting_game:
        return jsonify({"msg": "Du bist in diesem Zeitraum bereits für ein anderes Spiel fest eingetragen."}), 400

    if current_players + 1 == max_players and not game.is_virtual:
        if game.club_id:
            free_tables = find_available_club_tables(
                game.club_id,
                game.required_table_type,
                game.start_time,
                game.end_time,
                exclude_game_id=game.id,
            )
            if not free_tables:
                return jsonify({
                    "msg": f"Alle passenden '{game.required_table_type.upper()}'-Tische im Club sind in diesem Zeitraum belegt oder geschlossen!"
                }), 400

            if game.table_id and any(t.id == game.table_id for t in free_tables):
                assigned_table = next(t for t in free_tables if t.id == game.table_id)
            else:
                assigned_table = free_tables[0]
            game.table_id = assigned_table.id

    try:
        new_player = GamePlayer(
            user_id=user_id,
            game_id=game.id,
            faction_id=faction_id,
            custom_army=custom_army,
            army_list_id=str(army_list_id) if army_list_id else None,
            team=team,
        )
        db.session.add(new_player)

        if current_players + 1 == max_players:
            game.status = "Matched"
            msg = "Match bestätigt! Bereite deine Truppen vor."
        else:
            msg = "Herausforderung angenommen! Warte auf weitere Spieler."

        db.session.commit()
        update_game_webhook(game)

        return jsonify({"msg": msg}), 200
    except Exception as e:
        log(f"DEBUG [Games]: CRITICAL ERROR in join_game: {e}")
        db.session.rollback()
        return jsonify({"msg": "Serverfehler beim Beitreten."}), 500


@games_bp.route("/api/games/<string:game_id>", methods=["DELETE"])
@jwt_required()
def delete_game(game_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Sitzung abgelaufen."}), 401

    game = db.session.get(Game, game_id)
    if not game:
        return jsonify({"msg": "Spiel nicht gefunden"}), 404

    if game.created_by_id != user_id and not (game.club_id and is_club_keymaster(user_id, game.club_id)):
        return jsonify({"msg": "Keine Berechtigung"}), 403

    try:
        delete_game_webhook(game)
        db.session.delete(game)
        db.session.commit()
        return jsonify({"msg": "Herausforderung gelöscht."}), 200
    except Exception as e:
        log(f"DEBUG [Games]: Error in delete_game: {e}")
        db.session.rollback()
        return jsonify({"msg": "Serverfehler beim Löschen."}), 500


@games_bp.route("/api/games/<string:game_id>/leave", methods=["POST"])
@jwt_required()
def leave_game(game_id):
    user_id = get_jwt_identity()
    game = db.session.get(Game, game_id)

    if not game:
        return jsonify({"msg": "Spiel nicht gefunden"}), 404

    try:
        if game.created_by_id == user_id:
            delete_game_webhook(game)
            db.session.delete(game)
            db.session.commit()
            return jsonify({"msg": "Da du der Ersteller bist, wurde das Spiel komplett gelöscht."}), 200

        participation = GamePlayer.query.filter_by(game_id=game.id, user_id=user_id).first()
        if not participation:
            return jsonify({"msg": "Du bist nicht in diesem Spiel."}), 400

        db.session.delete(participation)

        if game.status == "Matched":
            game.status = "Open"
            game.table_id = None

        db.session.commit()
        update_game_webhook(game)
        return jsonify({"msg": "Spiel verlassen. Platz ist wieder frei."}), 200
    except Exception as e:
        log(f"DEBUG [Games]: Error in leave_game: {e}")
        db.session.rollback()
        return jsonify({"msg": "Serverfehler beim Verlassen."}), 500


@games_bp.route("/api/games/<string:game_id>/result", methods=["POST"])
@jwt_required()
def submit_game_result(game_id):
    user_id = get_jwt_identity()
    game = db.session.get(Game, game_id)

    if not game:
        return jsonify({"msg": "Spiel nicht gefunden"}), 404

    if not any(p.user_id == user_id for p in game.participations):
        return jsonify({"msg": "Nur Teilnehmer können Ergebnisse eintragen."}), 403

    data = request.get_json()
    scores = data.get("scores", {})

    for p in game.participations:
        uid_str = str(p.user_id)
        if uid_str in scores and scores[uid_str] is not None:
            p.score = int(scores[uid_str])

    game.status = "Completed"
    db.session.commit()
    return jsonify({"msg": "Spielergebnis gespeichert!"}), 200