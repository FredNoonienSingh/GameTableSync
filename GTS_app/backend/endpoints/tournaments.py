import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import (
    Tournament,
    TournamentParticipant,
    TournamentJudge,
    ArmyList,
    TournamentMatch,
    User,
    Club,
    ClubEmployee,
    ClubTable,
    infer_table_category,
)
from services.discord import (
    ensure_tournament_forum_thread,
    post_tournament_round_to_discord,
    update_tournament_match_widget,
    post_tournament_reminder_to_discord,
)

from .utils import (
    is_app_admin, 
    can_manage_club_tournaments, 
    is_banned_from_club, 
    get_banned_club_ids, 
    get_optional_jwt_user_id
)

tournaments_bp = Blueprint("tournaments", __name__)


def compute_swiss_standings(tournament: Tournament, active_participants: list[TournamentParticipant]):
    completed_matches = tournament.matches.filter(
        TournamentMatch.status.in_(["Completed", "Disqualified"])
    ).all()

    stats = {}
    for p in active_participants:
        elo = p.user.get_elo_for_system(tournament.system) if p.user else 1500
        stats[p.user_id] = {
            "user_id": p.user_id,
            "display_name": p.user.display_name if p.user else "Unbekannt",
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "tournament_points": 0,
            "vp_for": 0,
            "vp_against": 0,
            "vp_diff": 0,
            "opponents": [],
            "buchholz": 0,
            "elo": elo,
        }

    played_pairs = set()
    past_bye_users = set()

    for m in completed_matches:
        p1, p2 = m.player1_id, m.player2_id
        s1 = m.score_player1 or 0
        s2 = m.score_player2 or 0

        if p1 and p2 is None:
            past_bye_users.add(p1)
            if p1 in stats:
                stats[p1]["wins"] += 1
                stats[p1]["tournament_points"] += 3
                stats[p1]["vp_for"] += s1
                stats[p1]["vp_diff"] += s1
            continue

        if p1 and p2:
            played_pairs.add(frozenset([p1, p2]))

        if p1 in stats:
            stats[p1]["vp_for"] += s1
            stats[p1]["vp_against"] += s2
            stats[p1]["vp_diff"] += (s1 - s2)
            if p2:
                stats[p1]["opponents"].append(p2)
            if m.winner_id == p1:
                stats[p1]["wins"] += 1
                stats[p1]["tournament_points"] += 3
            elif m.winner_id is None and m.status == "Completed":
                stats[p1]["draws"] += 1
                stats[p1]["tournament_points"] += 1
            else:
                stats[p1]["losses"] += 1

        if p2 in stats:
            stats[p2]["vp_for"] += s2
            stats[p2]["vp_against"] += s1
            stats[p2]["vp_diff"] += (s2 - s1)
            if p1:
                stats[p2]["opponents"].append(p1)
            if m.winner_id == p2:
                stats[p2]["wins"] += 1
                stats[p2]["tournament_points"] += 3
            elif m.winner_id is None and m.status == "Completed":
                stats[p2]["draws"] += 1
                stats[p2]["tournament_points"] += 1
            else:
                stats[p2]["losses"] += 1

    for uid, st in stats.items():
        st["buchholz"] = sum(
            stats[opp_id]["tournament_points"] for opp_id in st["opponents"] if opp_id in stats
        )

    sorted_stats = sorted(
        stats.values(),
        key=lambda x: (
            x["tournament_points"],
            x["buchholz"],
            x["vp_diff"],
            x["vp_for"],
            x["elo"],
        ),
        reverse=True,
    )

    ordered_user_ids = [s["user_id"] for s in sorted_stats]
    return ordered_user_ids, played_pairs, past_bye_users, sorted_stats


def pair_players_swiss(ordered_players: list[str], played_pairs: set[frozenset]) -> list[tuple[str, str]]:
    def backtrack(remaining: list[str], allow_repeats: bool):
        if not remaining:
            return []
        first = remaining[0]
        for i in range(1, len(remaining)):
            candidate = remaining[i]
            if not allow_repeats and frozenset([first, candidate]) in played_pairs:
                continue
            next_remaining = remaining[1:i] + remaining[i + 1:]
            sub_result = backtrack(next_remaining, allow_repeats)
            if sub_result is not None:
                return [(first, candidate)] + sub_result
        return None

    pairs = backtrack(ordered_players, allow_repeats=False)
    if pairs is None:
        pairs = backtrack(ordered_players, allow_repeats=True)
    return pairs or []


def enforce_match_deadlines(tournament: Tournament):
    now = datetime.utcnow()
    dirty = False

    for match in tournament.matches.filter(TournamentMatch.status.in_(["Pending", "Disputed"])).all():
        if not match.hand_in_by:
            continue

        time_left = match.hand_in_by - now
        if timedelta(seconds=0) < time_left <= timedelta(hours=24) and not match.reminder_sent:
            if not (match.p1_submitted and match.p2_submitted):
                if post_tournament_reminder_to_discord(match, tournament):
                    match.reminder_sent = True
                    dirty = True

        if now > match.hand_in_by and match.status == "Pending":
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
                match.score_player1 = match.p2_reported_s1 if match.p2_reported_s1 is not None else 0
                match.score_player2 = match.p2_reported_s2 if match.p2_reported_s2 is not None else 100
                match.status = "Completed"
                if match.player1 and match.player2 and not match.elo_processed:
                    User.update_system_elos(
                        match.player1, match.player2, tournament.system, match.score_player1, match.score_player2
                    )
                    match.elo_processed = True
            elif not match.p2_submitted:
                if p2_part:
                    p2_part.is_disqualified = True
                match.winner_id = match.player1_id
                match.score_player1 = match.p1_reported_s1 if match.p1_reported_s1 is not None else 100
                match.score_player2 = match.p1_reported_s2 if match.p1_reported_s2 is not None else 0
                match.status = "Completed"
                if match.player1 and match.player2 and not match.elo_processed:
                    User.update_system_elos(
                        match.player1, match.player2, tournament.system, match.score_player1, match.score_player2
                    )
                    match.elo_processed = True

            update_tournament_match_widget(match, tournament)

    if dirty:
        db.session.commit()


def serialize_tournament(t: Tournament):
    enforce_match_deadlines(t)

    all_participants = t.participants.all()
    active_parts = [p for p in all_participants if not p.is_disqualified]
    _, _, _, standings_data = compute_swiss_standings(t, all_participants)

    def _mini_profile(u: User | None):
        if not u:
            return None
        return {
            "ID": u.id,
            "DisplayName": u.display_name,
            "Avatar": u.avatar_url,
            "city_or_zip": u.city_or_zip,
            "bio": u.bio,
            "discord_account": u.discord_account,
        }

    participants = [
        {
            "id": p.id,
            "user_id": p.user_id,
            "display_name": p.user.display_name if p.user else "Unbekannt",
            "avatar_url": p.user.avatar_url if p.user else None,
            "city_or_zip": p.user.city_or_zip if p.user else None,
            "bio": p.user.bio if p.user else None,
            "discord_account": p.user.discord_account if p.user else None,
            "profile": _mini_profile(p.user),
            "army_list_id": p.army_list_id,
            "army_list_name": p.army_list.name if p.army_list else None,
            "is_disqualified": p.is_disqualified,
        }
        for p in all_participants
    ]

    matches = [
        {
            "id": m.id,
            "round_number": m.round_number,
            "player1_id": m.player1_id,
            "player1_name": m.player1.display_name if m.player1 else None,
            "player1_profile": _mini_profile(m.player1),
            "player2_id": m.player2_id,
            "player2_name": m.player2.display_name if m.player2 else None,
            "player2_profile": _mini_profile(m.player2),
            "score_player1": m.score_player1,
            "score_player2": m.score_player2,
            "p1_reported_s1": m.p1_reported_s1,
            "p1_reported_s2": m.p1_reported_s2,
            "p2_reported_s1": m.p2_reported_s1,
            "p2_reported_s2": m.p2_reported_s2,
            "hand_in_by": m.hand_in_by.isoformat() if m.hand_in_by else None,
            "scheduled_at": getattr(m, "scheduled_at", None).isoformat()
            if getattr(m, "scheduled_at", None)
            else None,
            "table_id": getattr(m, "table_id", None),
            "p1_submitted": m.p1_submitted,
            "p2_submitted": m.p2_submitted,
            "winner_id": m.winner_id,
            "status": m.status,
        }
        for m in t.matches.order_by(TournamentMatch.round_number.asc()).all()
    ]

    cat = getattr(t, "category", None) or infer_table_category(t.system or "tabletop")
    if cat == "rpg":
        cat = "tabletop"

    judges_list = [
        {
            "id": j.id,
            "user_id": j.user_id,
            "display_name": j.user.display_name if j.user else "Unbekannt",
            "is_employee": bool(j.is_employee),
            "role_label": j.role_label or "Judge",
        }
        for j in (t.judges.all() if hasattr(t, "judges") else [])
    ]

    return {
        "id": t.id,
        "name": t.name,
        "club_id": t.club_id,
        "system": t.system,
        "category": cat,
        "format_type": t.format_type,
        "pairing_system": getattr(t, "pairing_system", None) or "swiss",
        "schedule_mode": getattr(t, "schedule_mode", None) or "sync",
        "is_virtual": bool(t.is_virtual),
        "max_players": t.max_players,
        "round_duration_days": t.round_duration_days,
        "round_duration_hours": float(getattr(t, "round_duration_hours", None) or 3.0),
        "discord_thread_id": t.discord_thread_id,
        "status": t.status,
        "start_date": t.start_date.isoformat(),
        "participants_count": len(all_participants),
        "active_participants_count": len(active_parts),
        "participants": participants,
        "judges": judges_list,
        "standings": standings_data,
        "matches": matches,
    }


@tournaments_bp.route("/api/admin/tournaments/<string:tournament_id>/generate-round", methods=["POST"])
@jwt_required()
def generate_swiss_round(tournament_id):
    user_id = get_jwt_identity()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404

    if not can_manage_club_tournaments(user_id, tournament.club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    if tournament.status == "Completed":
        return jsonify({"msg": "Dieses Turnier ist bereits abgeschlossen."}), 400

    enforce_match_deadlines(tournament)

    unresolved = tournament.matches.filter(
        TournamentMatch.status.in_(["Pending", "Disputed"])
    ).count()
    if unresolved > 0:
        return jsonify({
            "msg": f"Es gibt noch {unresolved} offene oder strittige Matches in der aktuellen Runde."
        }), 400

    active_participants = [p for p in tournament.participants if not p.is_disqualified]
    if len(active_participants) < 2:
        return jsonify({"msg": "Zu wenig aktive Teilnehmer für Paarungen."}), 400

    existing_rounds = [m.round_number for m in tournament.matches]
    next_round = max(existing_rounds) + 1 if existing_rounds else 1

    pairing_sys = (getattr(tournament, "pairing_system", "swiss") or "swiss").lower()
    sched_mode = (getattr(tournament, "schedule_mode", "sync") or "sync").lower()

    data = request.get_json(silent=True) or {}
    hand_in_by_str = data.get("hand_in_by")
    if hand_in_by_str:
        try:
            hand_in_by = datetime.fromisoformat(hand_in_by_str)
        except ValueError:
            return jsonify({"msg": "Ungültiges Datumsformat für Abgabefrist."}), 400
    else:
        if sched_mode == "sync":
            duration_hours = float(getattr(tournament, "round_duration_hours", 3.0) or 3.0)
            hand_in_by = datetime.utcnow() + timedelta(hours=duration_hours)
        else:
            duration_days = int(tournament.round_duration_days or 14)
            hand_in_by = datetime.utcnow() + timedelta(days=duration_days)

    tournament.status = "In Progress"

    ordered_players, played_pairs, past_bye_users, _ = compute_swiss_standings(
        tournament, active_participants
    )

    bye_player_id = None
    paired_tuples = []

    if pairing_sys == "ko":
        # Single Elimination KO Logic
        if next_round == 1:
            contenders = list(ordered_players)
        else:
            prev_round_matches = (
                tournament.matches.filter_by(round_number=next_round - 1)
                .order_by(TournamentMatch.id.asc())
                .all()
            )
            contenders = [m.winner_id for m in prev_round_matches if m.winner_id]
            if len(contenders) < 2:
                tournament.status = "Completed"
                db.session.commit()
                return jsonify({"msg": "KO-Turnier abgeschlossen! Ein Gesamtsieger steht fest."}), 200

        if len(contenders) % 2 != 0:
            for candidate_id in reversed(contenders):
                if candidate_id not in past_bye_users:
                    bye_player_id = candidate_id
                    break
            if bye_player_id is None:
                bye_player_id = contenders[-1]
            contenders = [uid for uid in contenders if uid != bye_player_id]

        if next_round == 1:
            # Top seed vs Bottom seed (1 vs N, 2 vs N-1)
            half = len(contenders) // 2
            for i in range(half):
                paired_tuples.append((contenders[i], contenders[len(contenders) - 1 - i]))
        else:
            # Sequential bracket advancement
            for i in range(0, len(contenders) - 1, 2):
                paired_tuples.append((contenders[i], contenders[i + 1]))
    else:
        # Swiss Pairing Logic
        if len(ordered_players) % 2 != 0:
            for candidate_id in reversed(ordered_players):
                if candidate_id not in past_bye_users:
                    bye_player_id = candidate_id
                    break
            if bye_player_id is None:
                bye_player_id = ordered_players[-1]
            ordered_players = [uid for uid in ordered_players if uid != bye_player_id]

        paired_tuples = pair_players_swiss(ordered_players, played_pairs)

    created_matches = []

    for p1_id, p2_id in paired_tuples:
        match = TournamentMatch(
            tournament_id=tournament_id,
            round_number=next_round,
            player1_id=p1_id,
            player2_id=p2_id,
            hand_in_by=hand_in_by,
            status="Pending",
        )
        db.session.add(match)
        created_matches.append(match)

    if bye_player_id:
        match = TournamentMatch(
            tournament_id=tournament_id,
            round_number=next_round,
            player1_id=bye_player_id,
            player2_id=None,
            score_player1=100 if getattr(tournament, "category", "tabletop") == "tabletop" else 2,
            score_player2=0,
            p1_reported_s1=100 if getattr(tournament, "category", "tabletop") == "tabletop" else 2,
            p1_reported_s2=0,
            p1_submitted=True,
            p2_submitted=True,
            elo_processed=True,
            reminder_sent=True,
            winner_id=bye_player_id,
            status="Completed",
        )
        db.session.add(match)
        created_matches.append(match)

    db.session.flush()
    post_tournament_round_to_discord(tournament, next_round, created_matches)
    db.session.commit()

    algo_label = "KO-Bracket" if pairing_sys == "ko" else "Swiss"
    return jsonify({"msg": f"Runde {next_round} ({algo_label}) erfolgreich generiert!"}), 201


@tournaments_bp.route("/api/tournaments/matches/<string:match_id>/schedule", methods=["PUT"])
@jwt_required()
def schedule_async_tournament_match(match_id):
    """
    Allows players in an async tournament (or club tournament managers) to set/agree on
    their own match date/time and optional club table before playing and pushing results.
    """
    user_id = get_jwt_identity()
    match = db.session.get(TournamentMatch, match_id)
    if not match:
        return jsonify({"msg": "Match nicht gefunden."}), 404

    tournament = match.tournament
    is_participant = user_id in (match.player1_id, match.player2_id)
    is_manager = can_manage_club_tournaments(user_id, tournament.club_id)

    if not is_participant and not is_manager:
        return jsonify({"msg": "Nur die beteiligten Spieler oder die Turnierleitung können den Spieltermin planen."}), 403

    data = request.get_json() or {}
    scheduled_at_str = data.get("scheduled_at")
    table_id = data.get("table_id")

    if scheduled_at_str:
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_at_str)
            if match.hand_in_by and scheduled_dt > match.hand_in_by:
                return jsonify({
                    "msg": "Der geplante Spieltermin liegt nach der Runden-Abgabefrist."
                }), 400
            match.scheduled_at = scheduled_dt
        except ValueError:
            return jsonify({"msg": "Ungültiges Datumsformat."}), 400
    else:
        match.scheduled_at = None

    if table_id:
        table = db.session.get(ClubTable, str(table_id))
        if not table or table.club_id != tournament.club_id:
            return jsonify({"msg": "Ungültiger Spieltisch für diesen Club."}), 400
        match.table_id = table.id
    elif "table_id" in data and data["table_id"] is None:
        match.table_id = None

    db.session.commit()
    return jsonify({
        "msg": "Spieltermin für das Match gespeichert!",
        "scheduled_at": match.scheduled_at.isoformat() if match.scheduled_at else None,
        "table_id": match.table_id,
    }), 200


@tournaments_bp.route("/api/tournaments/matches/<string:match_id>/hand-in", methods=["POST"])
@jwt_required()
def hand_in_match_score(match_id):
    user_id = get_jwt_identity()
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
        match.p1_reported_s1 = my_score
        match.p1_reported_s2 = opponent_score
        match.p1_submitted = True
        if not match.p2_submitted:
            match.score_player1 = my_score
            match.score_player2 = opponent_score
    else:
        match.p2_reported_s1 = opponent_score
        match.p2_reported_s2 = my_score
        match.p2_submitted = True
        if not match.p1_submitted:
            match.score_player1 = opponent_score
            match.score_player2 = my_score

    if match.p1_submitted and match.p2_submitted:
        if (
            match.p1_reported_s1 == match.p2_reported_s1
            and match.p1_reported_s2 == match.p2_reported_s2
        ):
            match.score_player1 = match.p1_reported_s1
            match.score_player2 = match.p1_reported_s2
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
                    score2=match.score_player2,
                )
                match.elo_processed = True

            msg = "Ergebnis bestätigt! Beide Spieler haben identische Punkte eingereicht."
        else:
            match.status = "Disputed"
            match.winner_id = None
            msg = (
                f"Abweichende Eingaben erkannt (Spieler 1 meldet {match.p1_reported_s1}:{match.p1_reported_s2}, "
                f"Spieler 2 meldet {match.p2_reported_s1}:{match.p2_reported_s2}). "
                "Das Match wurde zur Klärung markiert – ihr könnt eure Eingabe korrigieren oder einen Admin rufen."
            )
    else:
        msg = "Ergebnis eingereicht! Warte auf Bestätigung durch deinen Gegner."

    update_tournament_match_widget(match, tournament)
    db.session.commit()

    return jsonify({
        "msg": msg,
        "status": match.status,
        "both_submitted": match.p1_submitted and match.p2_submitted,
    }), 200


@tournaments_bp.route("/api/admin/tournaments/matches/<string:match_id>/resolve", methods=["POST"])
@jwt_required()
def admin_resolve_match_dispute(match_id):
    user_id = get_jwt_identity()
    match = db.session.get(TournamentMatch, match_id)
    if not match:
        return jsonify({"msg": "Match nicht gefunden."}), 404

    is_judge = bool(
        TournamentJudge.query.filter_by(
            tournament_id=match.tournament_id, user_id=user_id
        ).first()
    )
    if not can_manage_club_tournaments(user_id, match.tournament.club_id) and not is_judge:
        return jsonify({"msg": "Keine Berechtigung."}), 403

    data = request.get_json() or {}
    s1 = data.get("score_player1")
    s2 = data.get("score_player2")

    if s1 is None or s2 is None:
        return jsonify({"msg": "score_player1 und score_player2 sind erforderlich."}), 400

    s1, s2 = int(s1), int(s2)
    match.score_player1 = s1
    match.score_player2 = s2
    match.p1_reported_s1 = s1
    match.p1_reported_s2 = s2
    match.p2_reported_s1 = s1
    match.p2_reported_s2 = s2
    match.p1_submitted = True
    match.p2_submitted = True
    match.status = "Completed"

    if s1 > s2:
        match.winner_id = match.player1_id
    elif s2 > s1:
        match.winner_id = match.player2_id
    else:
        match.winner_id = None

    tournament = match.tournament
    if match.player1 and match.player2 and not match.elo_processed:
        User.update_system_elos(
            player1=match.player1,
            player2=match.player2,
            system=tournament.system,
            score1=s1,
            score2=s2,
        )
        match.elo_processed = True

    update_tournament_match_widget(match, tournament)
    db.session.commit()

    return jsonify({"msg": "Match-Ergebnis durch Admin festgesetzt und ELO aktualisiert!"}), 200


@tournaments_bp.route("/api/tournaments", methods=["GET"])
def get_public_tournaments():
    viewer_id = get_optional_jwt_user_id()
    banned_clubs = get_banned_club_ids(viewer_id)
    
    tournaments = Tournament.query.order_by(Tournament.start_date.desc()).all()
    return jsonify([
        serialize_tournament(t) for t in tournaments
        if t.club_id not in banned_clubs
    ]), 200


@tournaments_bp.route("/api/tournaments/<string:tournament_id>", methods=["GET"])
def get_tournament_detail(tournament_id):
    viewer_id = get_optional_jwt_user_id()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404
        
    if is_banned_from_club(viewer_id, tournament.club_id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club."}), 403

    return jsonify(serialize_tournament(tournament)), 200


@tournaments_bp.route("/api/tournaments/<string:tournament_id>/register", methods=["POST"])
@jwt_required()
def register_tournament(tournament_id):
    user_id = get_jwt_identity()
    tournament = db.session.get(Tournament, tournament_id)
    
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404
        
    if is_banned_from_club(user_id, tournament.club_id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club."}), 403
        
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
        army_list = db.session.get(ArmyList, str(army_list_id))
        if not army_list or army_list.user_id != user_id:
            return jsonify({"msg": "Ungültige Armeeliste ausgewählt."}), 400

    try:
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=user_id,
            army_list_id=str(army_list_id) if army_list_id else None
        )
        db.session.add(participant)
        if participant.user:
            participant.user.get_or_create_system_elo(tournament.system)
        db.session.commit()
        return jsonify({"msg": "Erfolgreich für das Turnier angemeldet!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Serverfehler bei der Anmeldung: {str(e)}"}), 500


@tournaments_bp.route("/api/tournaments/<string:tournament_id>/register", methods=["DELETE"])
@jwt_required()
def unregister_tournament(tournament_id):
    user_id = get_jwt_identity()
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


@tournaments_bp.route("/api/admin/tournaments", methods=["GET"])
@jwt_required()
def get_admin_tournaments():
    user_id = get_jwt_identity()
    
    if is_app_admin():
        tournaments = Tournament.query.order_by(Tournament.start_date.desc()).all()
    else:
        tournaments = [
            t for t in Tournament.query.order_by(Tournament.start_date.desc()).all()
            if can_manage_club_tournaments(user_id, t.club_id)
        ]
        
    return jsonify([serialize_tournament(t) for t in tournaments]), 200


@tournaments_bp.route("/api/admin/tournaments", methods=["POST"])
@jwt_required()
def create_tournament():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    club_id = data.get("club_id")
    club = db.session.get(Club, club_id) if club_id else None
    if not club:
        return jsonify({"msg": "Jedes Turnier muss einem Club zugeordnet sein."}), 400

    if not can_manage_club_tournaments(user_id, club.id):
        return jsonify({"msg": "Keine Berechtigung, Turniere für diesen Club zu erstellen."}), 403

    max_signup_tournaments = club.tier_limits.get("max_active_signup_tournaments", 1)
    current_signup_count = Tournament.query.filter_by(
        club_id=club.id, status="Registration"
    ).count()

    if current_signup_count >= max_signup_tournaments:
        return jsonify({
            "msg": (
                f"Dein Club-Tier ({club.tier_limits.get('name', 'Tier 1')}) erlaubt maximal "
                f"{max_signup_tournaments} Turnier(e) gleichzeitig in der offenen Anmeldephase."
            )
        }), 403

    name = (data.get("name") or "").strip()
    system = (data.get("system") or "").strip()
    format_type = (data.get("format_type") or "").strip()
    raw_category = (data.get("category") or "").strip().lower()
    if raw_category not in ("tabletop", "tcg"):
        inferred = infer_table_category(system)
        raw_category = "tcg" if inferred == "tcg" else "tabletop"

    pairing_system = (data.get("pairing_system") or "swiss").strip().lower()
    if pairing_system not in ("swiss", "ko"):
        pairing_system = "swiss"

    schedule_mode = (data.get("schedule_mode") or "sync").strip().lower()
    if schedule_mode not in ("sync", "async"):
        schedule_mode = "sync"

    # Default is in-person (is_virtual = False)
    is_virtual = bool(data.get("is_virtual", False))
    max_players = int(data.get("max_players", 8))
    round_duration_days = int(data.get("round_duration_days", 14))
    round_duration_hours = float(data.get("round_duration_hours", 3.0 if raw_category == "tabletop" else 1.0))
    start_date_str = data.get("start_date")

    if not name or not system or not start_date_str:
        return jsonify({"msg": "Bitte alle Pflichtfelder ausfüllen."}), 400

    try:
        start_date = datetime.fromisoformat(start_date_str)
    except ValueError:
        return jsonify({"msg": "Ungültiges Datumsformat."}), 400

    new_tournament = Tournament(
        club_id=club.id,
        name=name,
        system=system,
        category=raw_category,
        format_type=format_type,
        pairing_system=pairing_system,
        schedule_mode=schedule_mode,
        is_virtual=is_virtual,
        max_players=max_players,
        round_duration_days=max(1, round_duration_days),
        round_duration_hours=max(0.5, round_duration_hours),
        start_date=start_date,
        status="Registration"
    )

    db.session.add(new_tournament)
    db.session.flush()

    ensure_tournament_forum_thread(new_tournament)

    db.session.commit()

    return jsonify({"msg": "Turnier erfolgreich erstellt!", "id": new_tournament.id}), 201


@tournaments_bp.route("/api/admin/tournaments/<string:tournament_id>", methods=["DELETE"])
@jwt_required()
def delete_tournament(tournament_id):
    user_id = get_jwt_identity()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404
        
    if not can_manage_club_tournaments(user_id, tournament.club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    db.session.delete(tournament)
    db.session.commit()
    return jsonify({"msg": "Turnier erfolgreich gelöscht."}), 200


@tournaments_bp.route("/api/admin/tournaments/<string:tournament_id>/judges", methods=["POST"])
@jwt_required()
def add_tournament_judge(tournament_id):
    """
    Assigns a Judge to a tournament. The Judge can be either a Club Employee
    or a regular User (by user_id, username, or email).
    """
    actor_id = get_jwt_identity()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404

    if not can_manage_club_tournaments(actor_id, tournament.club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    data = request.get_json() or {}
    target_user_id = data.get("user_id")
    identifier = (data.get("user_identifier") or "").strip()
    role_label = (data.get("role_label") or "Judge").strip()

    if target_user_id:
        target_user = db.session.get(User, str(target_user_id))
    else:
        target_user = User.query.filter(
            (User.email.ilike(identifier)) | (User.display_name.ilike(identifier))
        ).first()

    if not target_user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    existing = TournamentJudge.query.filter_by(
        tournament_id=tournament.id, user_id=target_user.id
    ).first()
    if existing:
        return jsonify({"msg": "Dieser Benutzer ist bereits als Judge eingetragen."}), 409

    is_emp = bool(
        ClubEmployee.query.filter_by(
            club_id=tournament.club_id, user_id=target_user.id
        ).first()
    ) or (tournament.club and tournament.club.owner_id == target_user.id)

    judge = TournamentJudge(
        tournament_id=tournament.id,
        user_id=target_user.id,
        is_employee=is_emp,
        role_label=role_label,
    )
    db.session.add(judge)
    db.session.commit()

    return jsonify({
        "msg": f"{target_user.display_name} als Judge hinzugefügt!",
        "judge": {
            "id": judge.id,
            "user_id": judge.user_id,
            "display_name": target_user.display_name,
            "is_employee": judge.is_employee,
            "role_label": judge.role_label,
        },
    }), 201


@tournaments_bp.route("/api/admin/tournaments/<string:tournament_id>/judges/<string:judge_id>", methods=["DELETE"])
@jwt_required()
def remove_tournament_judge(tournament_id, judge_id):
    actor_id = get_jwt_identity()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return jsonify({"msg": "Turnier nicht gefunden."}), 404

    if not can_manage_club_tournaments(actor_id, tournament.club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    judge = db.session.get(TournamentJudge, judge_id)
    if not judge or judge.tournament_id != tournament.id:
        return jsonify({"msg": "Judge nicht gefunden."}), 404

    db.session.delete(judge)
    db.session.commit()
    return jsonify({"msg": "Judge entfernt."}), 200


@tournaments_bp.route("/api/account/tournaments", methods=["GET"])
@jwt_required()
def get_account_tournaments():
    user_id = get_jwt_identity()
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
                "scheduled_at": getattr(m, "scheduled_at", None).isoformat()
                if getattr(m, "scheduled_at", None)
                else None,
                "table_id": getattr(m, "table_id", None),
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

        cat = getattr(t, "category", None) or infer_table_category(t.system or "tabletop")
        if cat == "rpg":
            cat = "tabletop"

        result.append({
            "tournament_id": t.id,
            "tournament_name": t.name,
            "club_id": t.club_id,
            "system": t.system,
            "category": cat,
            "format_type": t.format_type,
            "pairing_system": getattr(t, "pairing_system", None) or "swiss",
            "schedule_mode": getattr(t, "schedule_mode", None) or "sync",
            "is_virtual": bool(t.is_virtual),
            "round_duration_days": t.round_duration_days,
            "round_duration_hours": float(getattr(t, "round_duration_hours", None) or 3.0),
            "status": t.status,
            "start_date": t.start_date.isoformat(),
            "is_disqualified": p.is_disqualified,
            "army_list_id": p.army_list_id,
            "army_list_name": p.army_list.name if p.army_list else None,
            "matches": matches_data
        })

    return jsonify(result), 200