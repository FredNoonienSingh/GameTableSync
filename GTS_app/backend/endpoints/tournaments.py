import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Tournament, TournamentParticipant, ArmyList, TournamentMatch, User
from services.discord import (
    ensure_tournament_forum_thread,
    post_tournament_round_to_discord,
    update_tournament_match_widget,
    post_tournament_reminder_to_discord,
)

from .utils import is_admin

tournaments_bp = Blueprint("tournaments", __name__)


def enforce_match_deadlines(tournament: Tournament):
    """
    1. Prüft, ob für offene Matches die 24h-Vorwarnzeit erreicht ist, und sendet einen Ping in den Forum-Thread.
    2. Prüft auf abgelaufene Abgabefristen (hand_in_by) und disqualifiziert säumige Spieler.
    """
    now = datetime.utcnow()
    dirty = False

    for match in tournament.matches.filter_by(status="Pending").all():
        if not match.hand_in_by:
            continue

        # A) 24-Stunden-Erinnerung prüfen (falls Frist noch nicht abgelaufen, aber <= 24h verbleiben)
        time_left = match.hand_in_by - now
        if timedelta(seconds=0) < time_left <= timedelta(hours=24) and not match.reminder_sent:
            if not (match.p1_submitted and match.p2_submitted):
                if post_tournament_reminder_to_discord(match, tournament):
                    match.reminder_sent = True
                    dirty = True

        # B) Frist abgelaufen -> Disqualifikation prüfen
        if now > match.hand_in_by:
            dirty = True
            p1_part = TournamentParticipant.query.filter_by(
                tournament_id=tournament.id, user_id=match.player1_id
            ).first()
            p2_part = TournamentParticipant.query.filter_by(
                tournament_id=tournament.id, user_id=match.player2_id
            ).first() if match.player2_id else None

            if not match.p1_submitted and not match.p2_submitted:
                if p1_part:
                    p1_part.is_disqualified = True
                if p2_part:
                    p2_part.is_disqualified = True
                match.status = "Disqualified"
                match.winner_id = None
            elif not match.p1_submitted:
                if p1_part:
                    p1_part.is_disqualified = True
                match.winner_id = match.player2_id
                match.status = "Completed"
                if match.player1 and match.player2 and not match.elo_processed:
                    s1 = match.score_player1 if match.score_player1 is not None else 0
                    s2 = match.score_player2 if match.score_player2 is not None else 100
                    User.update_system_elos(match.player1, match.player2, tournament.system, s1, s2)
                    match.elo_processed = True
            elif not match.p2_submitted:
                if p2_part:
                    p2_part.is_disqualified = True
                match.winner_id = match.player1_id
                match.status = "Completed"
                if match.player1 and match.player2 and not match.elo_processed:
                    s1 = match.score_player1 if match.score_player1 is not None else 100
                    s2 = match.score_player2 if match.score_player2 is not None else 0
                    User.update_system_elos(match.player1, match.player2, tournament.system, s1, s2)
                    match.elo_processed = True

            update_tournament_match_widget(match, tournament)

    if dirty:
        db.session.commit()


def serialize_tournament(t: Tournament):
    enforce_match_deadlines(t)

    participants = [
        {
            "id": p.id,
            "user_id": p.user_id,
            "display_name": p.user.display_name if p.user else "Unbekannt",
            "army_list_id": p.army_list_id,
            "army_list_name": p.army_list.name if p.army_list else None,
            "is_disqualified": p.is_disqualified
        }
        for p in t.participants
    ]

    matches = [
        {
            "id": m.id,
            "round_number": m.round_number,
            "player1_id": m.player1_id,
            "player1_name": m.player1.display_name if m.player1 else None,
            "player2_id": m.player2_id,
            "player2_name": m.player2.display_name if m.player2 else None,
            "score_player1": m.score_player1,
            "score_player2": m.score_player2,
            "hand_in_by": m.hand_in_by.isoformat() if m.hand_in_by else None,
            "p1_submitted": m.p1_submitted,
            "p2_submitted": m.p2_submitted,
            "winner_id": m.winner_id,
            "status": m.status
        }
        for m in t.matches
    ]

    return {
        "id": t.id,
        "name": t.name,
        "system": t.system,
        "format_type": t.format_type,
        "max_players": t.max_players,
        "round_duration_days": t.round_duration_days,
        "discord_thread_id": t.discord_thread_id,
        "status": t.status,
        "start_date": t.start_date.isoformat(),
        "participants_count": t.participants.count(),
        "participants": participants,
        "matches": matches
    }


# --- ADMIN ROUND GENERATION ---

@tournaments_bp.route("/api/admin/tournaments/<int:tournament_id>/generate-round", methods=["POST"])
@jwt_required()
def generate_swiss_round(tournament_id):
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404

    enforce_match_deadlines(tournament)

    active_participants = [p for p in tournament.participants if not p.is_disqualified]
    if len(active_participants) < 2:
        return jsonify({"msg": "Zu wenig aktive Teilnehmer für Paarungen."}), 400

    existing_rounds = [m.round_number for m in tournament.matches]
    next_round = max(existing_rounds) + 1 if existing_rounds else 1

    # Abgabefrist: Entweder explizit übergeben oder automatisch Start + round_duration_days (Standard: 14 Tage)
    data = request.get_json(silent=True) or {}
    hand_in_by_str = data.get("hand_in_by")
    if hand_in_by_str:
        try:
            hand_in_by = datetime.fromisoformat(hand_in_by_str)
        except ValueError:
            return jsonify({"msg": "Ungültiges Datumsformat für Abgabefrist."}), 400
    else:
        duration_days = tournament.round_duration_days or 14
        hand_in_by = datetime.utcnow() + timedelta(days=duration_days)

    tournament.status = "In Progress"

    players = [p.user_id for p in active_participants]
    random.shuffle(players)

    created_matches = []

    for i in range(0, len(players) - 1, 2):
        match = TournamentMatch(
            tournament_id=tournament_id,
            round_number=next_round,
            player1_id=players[i],
            player2_id=players[i+1],
            hand_in_by=hand_in_by,
            status="Pending"
        )
        db.session.add(match)
        created_matches.append(match)

    # Falls ungerade Anzahl an aktiven Spielern -> Freilos (Bye)
    if len(players) % 2 != 0:
        match = TournamentMatch(
            tournament_id=tournament_id,
            round_number=next_round,
            player1_id=players[-1],
            player2_id=None,
            score_player1=100,
            score_player2=0,
            p1_submitted=True,
            p2_submitted=True,
            elo_processed=True,
            reminder_sent=True,
            winner_id=players[-1],
            status="Completed"
        )
        db.session.add(match)
        created_matches.append(match)

    db.session.flush()

    # Discord Forum-Thread sicherstellen & Runden-Widgets + Pings posten
    post_tournament_round_to_discord(tournament, next_round, created_matches)

    db.session.commit()
    return jsonify({"msg": f"Runde {next_round} erfolgreich generiert und auf Discord veröffentlicht!"}), 201


# --- PUBLIC & PARTICIPANT ENDPOINTS ---

@tournaments_bp.route("/api/tournaments", methods=["GET"])
def get_public_tournaments():
    tournaments = Tournament.query.order_by(Tournament.start_date.desc()).all()
    return jsonify([serialize_tournament(t) for t in tournaments]), 200


@tournaments_bp.route("/api/tournaments/<int:tournament_id>", methods=["GET"])
def get_tournament_detail(tournament_id):
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404

    return jsonify(serialize_tournament(tournament)), 200


@tournaments_bp.route("/api/tournaments/<int:tournament_id>/register", methods=["POST"])
@jwt_required()
def register_tournament(tournament_id):
    user_id = int(get_jwt_identity())
    tournament = db.session.get(Tournament, tournament_id)
    
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404
        
    if tournament.status != "Registration":
        return jsonify({"msg": "Die Anmeldephase für dieses Turnier ist bereits beendet."}), 400

    if tournament.participants.count() >= tournament.max_players:
        return jsonify({"msg": "Dieses Turnier ist bereits voll."}), 400

    existing = TournamentParticipant.query.filter_by(tournament_id=tournament_id, user_id=user_id).first()
    if existing:
        return jsonify({"msg": "Du bist bereits für dieses Turnier angemeldet."}), 400

    data = request.get_json() or {}
    army_list_id = data.get("army_list_id")

    if army_list_id:
        army_list = db.session.get(ArmyList, army_list_id)
        if not army_list or army_list.user_id != user_id:
            return jsonify({"msg": "Ungültige Armeeliste ausgewählt."}), 400

    try:
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=user_id,
            army_list_id=int(army_list_id) if army_list_id else None
        )
        db.session.add(participant)
        if participant.user:
            participant.user.get_or_create_system_elo(tournament.system)
        db.session.commit()
        return jsonify({"msg": "Erfolgreich für das Turnier angemeldet!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Serverfehler bei der Anmeldung: {str(e)}"}), 500


@tournaments_bp.route("/api/tournaments/<int:tournament_id>/register", methods=["DELETE"])
@jwt_required()
def unregister_tournament(tournament_id):
    user_id = int(get_jwt_identity())
    tournament = db.session.get(Tournament, tournament_id)
    
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404
        
    if tournament.status != "Registration":
        return jsonify({"msg": "Das Turnier läuft bereits oder ist beendet. Abmeldung nicht mehr möglich."}), 400

    participant = TournamentParticipant.query.filter_by(tournament_id=tournament_id, user_id=user_id).first()
    if not participant:
        return jsonify({"msg": "Du bist nicht für dieses Turnier angemeldet."}), 404

    try:
        db.session.delete(participant)
        db.session.commit()
        return jsonify({"msg": "Anmeldung erfolgreich zurückgezogen."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Serverfehler beim Abmelden: {str(e)}"}), 500


# --- ADMIN ENDPOINTS ---

@tournaments_bp.route("/api/admin/tournaments", methods=["GET"])
@jwt_required()
def get_admin_tournaments():
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    tournaments = Tournament.query.order_by(Tournament.start_date.desc()).all()
    return jsonify([serialize_tournament(t) for t in tournaments]), 200


@tournaments_bp.route("/api/admin/tournaments", methods=["POST"])
@jwt_required()
def create_tournament():
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    data = request.get_json()
    name = (data.get("name") or "").strip()
    system = (data.get("system") or "").strip()
    format_type = (data.get("format_type") or "").strip()
    max_players = int(data.get("max_players", 8))
    round_duration_days = int(data.get("round_duration_days", 14))
    start_date_str = data.get("start_date")

    if not name or not system or not start_date_str:
        return jsonify({"msg": "Bitte alle Pflichtfelder ausfüllen."}), 400

    try:
        start_date = datetime.fromisoformat(start_date_str)
    except ValueError:
        return jsonify({"msg": "Ungültiges Datumsformat."}), 400

    new_tournament = Tournament(
        name=name,
        system=system,
        format_type=format_type,
        max_players=max_players,
        round_duration_days=max(1, round_duration_days),
        start_date=start_date,
        status="Registration"
    )

    db.session.add(new_tournament)
    db.session.flush()

    # Direkt beim Anlegen des Turniers den Forum-Post im Discord-Channel erstellen
    ensure_tournament_forum_thread(new_tournament)

    db.session.commit()

    return jsonify({"msg": "Turnier erfolgreich erstellt!", "id": new_tournament.id}), 201


@tournaments_bp.route("/api/admin/tournaments/<int:tournament_id>", methods=["DELETE"])
@jwt_required()
def delete_tournament(tournament_id):
    if not is_admin():
        return jsonify({"msg": "Zugriff verweigert"}), 403

    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404

    db.session.delete(tournament)
    db.session.commit()
    return jsonify({"msg": "Turnier erfolgreich gelöscht."}), 200


@tournaments_bp.route("/api/account/tournaments", methods=["GET"])
@jwt_required()
def get_account_tournaments():
    user_id = int(get_jwt_identity())
    participations = TournamentParticipant.query.filter_by(user_id=user_id).all()

    result = []
    for p in participations:
        t = p.tournament
        if not t:
            continue

        enforce_match_deadlines(t)

        user_matches = TournamentMatch.query.filter(
            TournamentMatch.tournament_id == t.id,
            (TournamentMatch.player1_id == user_id) | (TournamentMatch.player2_id == user_id)
        ).order_by(TournamentMatch.round_number.asc()).all()

        matches_data = []
        for m in user_matches:
            is_p1 = (m.player1_id == user_id)
            my_part = p
            opp_id = m.player2_id if is_p1 else m.player1_id
            opp_user = m.player2 if is_p1 else m.player1
            opp_part = TournamentParticipant.query.filter_by(
                tournament_id=t.id, user_id=opp_id
            ).first() if opp_id else None

            matches_data.append({
                "id": m.id,
                "round_number": m.round_number,
                "status": m.status,
                "hand_in_by": m.hand_in_by.isoformat() if m.hand_in_by else None,
                "is_player1": is_p1,
                "my_score": m.score_player1 if is_p1 else m.score_player2,
                "opponent_score": m.score_player2 if is_p1 else m.score_player1,
                "my_submitted": m.p1_submitted if is_p1 else m.p2_submitted,
                "opponent_submitted": m.p2_submitted if is_p1 else m.p1_submitted,
                "opponent_id": opp_id,
                "opponent_name": opp_user.display_name if opp_user else "Freilos (Bye)",
                "opponent_army_list_id": opp_part.army_list_id if opp_part else None,
                "opponent_army_list_name": opp_part.army_list.name if (opp_part and opp_part.army_list) else None,
                "my_army_list_id": my_part.army_list_id,
                "my_army_list_name": my_part.army_list.name if my_part.army_list else None,
                "winner_id": m.winner_id
            })

        result.append({
            "tournament_id": t.id,
            "tournament_name": t.name,
            "system": t.system,
            "format_type": t.format_type,
            "round_duration_days": t.round_duration_days,
            "status": t.status,
            "start_date": t.start_date.isoformat(),
            "is_disqualified": p.is_disqualified,
            "army_list_id": p.army_list_id,
            "army_list_name": p.army_list.name if p.army_list else None,
            "matches": matches_data
        })

    return jsonify(result), 200


@tournaments_bp.route("/api/tournaments/matches/<int:match_id>/hand-in", methods=["POST"])
@jwt_required()
def hand_in_match_score(match_id):
    user_id = int(get_jwt_identity())
    match = db.session.get(TournamentMatch, match_id)

    if not match:
        return jsonify({"msg": "Match nicht gefunden."}), 404

    if user_id not in (match.player1_id, match.player2_id):
        return jsonify({"msg": "Du bist kein Teilnehmer dieses Matches."}), 403

    tournament = match.tournament
    enforce_match_deadlines(tournament)

    participant = TournamentParticipant.query.filter_by(
        tournament_id=tournament.id, user_id=user_id
    ).first()
    if participant and participant.is_disqualified:
        return jsonify({"msg": "Abgabefrist abgelaufen – du wurdest für dieses Turnier disqualifiziert."}), 400

    if match.status in ("Completed", "Disqualified"):
        return jsonify({"msg": "Dieses Match ist bereits abgeschlossen."}), 400

    if match.hand_in_by and datetime.utcnow() > match.hand_in_by:
        return jsonify({"msg": "Die Abgabefrist (Hand-in) für dieses Match ist abgelaufen."}), 400

    data = request.get_json() or {}
    my_score = data.get("my_score")
    opponent_score = data.get("opponent_score")

    if my_score is None or opponent_score is None:
        return jsonify({"msg": "Bitte beide Punktestände eintragen."}), 400

    my_score = int(my_score)
    opponent_score = int(opponent_score)

    if user_id == match.player1_id:
        match.score_player1 = my_score
        match.score_player2 = opponent_score
        match.p1_submitted = True
    else:
        match.score_player2 = my_score
        match.score_player1 = opponent_score
        match.p2_submitted = True

    if match.p1_submitted and match.p2_submitted:
        match.status = "Completed"
        if match.score_player1 > match.score_player2:
            match.winner_id = match.player1_id
        elif match.score_player2 > match.score_player1:
            match.winner_id = match.player2_id
        else:
            match.winner_id = None

        if match.player1 and match.player2 and not match.elo_processed:
            User.update_system_elos(
                player1=match.player1,
                player2=match.player2,
                system=tournament.system,
                score1=match.score_player1,
                score2=match.score_player2
            )
            match.elo_processed = True

    # Discord-Widget des Matches im Forum-Thread live aktualisieren
    update_tournament_match_widget(match, tournament)

    db.session.commit()
    return jsonify({
        "msg": "Ergebnis erfolgreich eingereicht!",
        "both_submitted": match.p1_submitted and match.p2_submitted
    }), 200