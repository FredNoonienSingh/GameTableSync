import os
import sys
import json
import requests


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def format_discord_user(user):
    if not user:
        return "Unbekannt"
    discord_acc = getattr(user, "discord_account", None)
    if discord_acc:
        clean_acc = discord_acc.strip()
        if clean_acc.isdigit():
            return f"**{user.display_name}** (<@{clean_acc}>)"
        else:
            handle = clean_acc if clean_acc.startswith("@") else f"@{clean_acc}"
            return f"**{user.display_name}** ({handle})"
    return f"**{user.display_name}**"


def build_game_embed(game):
    participations = game.participations.all()
    max_players = 2 if game.format_type == "1v1" else 4
    is_matched = game.status == "Matched" or len(participations) >= max_players

    if not game.is_virtual and not game.is_approved:
        color = 16098851
    elif is_matched:
        color = 3492704
    else:
        color = 3066993

    player_lines = []
    for p in participations:
        army = p.faction.name if p.faction else (p.custom_army or "Unbekannte Armee")
        user_str = format_discord_user(p.user)
        team_prefix = f"[{p.team}] " if game.format_type == "2v2" and p.team else ""
        player_lines.append(f"• {team_prefix}{user_str} — *{army}*")

    empty_slots = max(0, max_players - len(participations))
    for _ in range(empty_slots):
        player_lines.append("• *Freier Slot (Wartet auf Mitspieler...)*")

    player_text = "\n".join(player_lines) if player_lines else "*Wartet auf Gegner...*"

    if game.is_virtual:
        location = "🌐 Virtuell (TTS / Online)"
        approval_status = "✅ Keine Freigabe nötig (Online)"
    else:
        location = "🏠 Physisch (Clubhaus Tisch)"
        if game.is_approved:
            approval_status = "✅ Genehmigt (Schlüsselmeister bestätigt)"
        else:
            approval_status = "⏳ Wartet auf Schlüsselmeister-Freigabe"

    status_display = (
        "🔒 Vollzählig (Matched)"
        if is_matched
        else f"🟢 Offen ({len(participations)}/{max_players} Spieler)"
    )
    formatted_time = (
        game.start_time.strftime("%d.%m.%Y um %H:%M Uhr")
        if game.start_time
        else "Unbekannt"
    )
    points_str = f" ({game.points} Pkt)" if game.points else ""

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    game_link = f"{frontend_url}/game-finder"

    return {
        "title": f"⚔️ Spielersuche: {game.system}{points_str}",
        "url": game_link,
        "description": game.description or "Keine speziellen Details angegeben.",
        "color": color,
        "fields": [
            {"name": "📅 Datum & Uhrzeit", "value": formatted_time, "inline": True},
            {"name": "🎲 Format", "value": game.format_type, "inline": True},
            {"name": "📍 Austragungsort", "value": location, "inline": False},
            {"name": "🔑 Tisch-Freigabe", "value": approval_status, "inline": True},
            {"name": "📊 Match-Status", "value": status_display, "inline": True},
            {"name": "🛡️ Aufstellung", "value": player_text, "inline": False},
        ],
        "footer": {"text": "Klicke auf den Titel, um über das Dashboard beizutreten"},
    }


def create_game_webhook(game):
    webhook_url = os.environ.get("GAMEFINDER")
    log(
        f"DEBUG [Discord]: create_game_webhook for Game ID {game.id} | URL set: {bool(webhook_url)}"
    )
    if not webhook_url:
        log("DEBUG [Discord]: GAMEFINDER is empty or missing in container env!")
        return

    url = f"{webhook_url}?wait=true"
    payload = {
        "username": "Matchmaking Auspex",
        "embeds": [build_game_embed(game)],
    }

    try:
        log(f"DEBUG [Discord]: Sending POST to Discord webhook...")
        response = requests.post(url, json=payload, timeout=5.0)
        log(f"DEBUG [Discord]: POST status={response.status_code}, body={response.text}")
        if response.status_code in [200, 201]:
            message_data = response.json()
            game.discord_message_id = message_data.get("id")
            log(f"DEBUG [Discord]: Stored discord_message_id={game.discord_message_id}")
    except Exception as e:
        log(f"DEBUG [Discord Webhook Error]: {e}")


def update_game_webhook(game):
    webhook_url = os.environ.get("GAMEFINDER")
    log(
        f"DEBUG [Discord]: update_game_webhook for Game ID {game.id} | msg_id={game.discord_message_id}"
    )
    if not webhook_url or not game.discord_message_id:
        return

    url = f"{webhook_url}/messages/{game.discord_message_id}"
    payload = {"embeds": [build_game_embed(game)]}

    try:
        response = requests.patch(url, json=payload, timeout=5.0)
        log(f"DEBUG [Discord]: PATCH status={response.status_code}")
    except Exception as e:
        log(f"DEBUG [Discord Edit Error]: {e}")


def delete_game_webhook(game):
    webhook_url = os.environ.get("GAMEFINDER")
    log(
        f"DEBUG [Discord]: delete_game_webhook for Game ID {game.id} | msg_id={game.discord_message_id}"
    )
    if not webhook_url or not game.discord_message_id:
        return

    url = f"{webhook_url}/messages/{game.discord_message_id}"
    try:
        response = requests.delete(url, timeout=5.0)
        log(f"DEBUG [Discord]: DELETE status={response.status_code}")
    except Exception as e:
        log(f"DEBUG [Discord Delete Error]: {e}")


def build_event_embed(event):
    attendees = event.attendees.all()
    attendee_lines = [f"• {format_discord_user(a)}" for a in attendees]
    attendee_text = (
        "\n".join(attendee_lines) if attendee_lines else "*Noch keine Anmeldungen*"
    )

    formatted_time = (
        event.start_time.strftime("%d.%m.%Y um %H:%M Uhr")
        if event.start_time
        else "Unbekannt"
    )
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    return {
        "title": f"📅 Event: {event.title}",
        "url": f"{frontend_url}/",
        "description": event.description or "Keine speziellen Details angegeben.",
        "color": 14705451,
        "fields": [
            {"name": "🕒 Wann?", "value": formatted_time, "inline": True},
            {
                "name": f"👥 Teilnehmer ({len(attendees)})",
                "value": attendee_text,
                "inline": False,
            },
        ],
        "footer": {"text": "Melde dich über das Dashboard an!"},
    }


def create_event_webhook(event):
    webhook_url = os.environ.get("ANNOCEMENTS") or os.environ.get(
        "DISCORD_WEBHOOK_URL"
    )
    log(
        f"DEBUG [Discord]: create_event_webhook for Event ID {event.id} | URL set: {bool(webhook_url)}"
    )
    if not webhook_url:
        return

    url = f"{webhook_url}?wait=true"
    payload = {
        "username": "Event Auspex",
        "embeds": [build_event_embed(event)],
    }

    try:
        response = requests.post(url, json=payload, timeout=5.0)
        log(f"DEBUG [Discord]: Event POST status={response.status_code}")
        if response.status_code in [200, 201]:
            event.discord_message_id = response.json().get("id")
    except Exception as e:
        log(f"DEBUG [Discord Event Webhook Error]: {e}")


def update_event_webhook(event):
    webhook_url = os.environ.get("ANNOCEMENTS") or os.environ.get(
        "DISCORD_WEBHOOK_URL"
    )
    if not webhook_url or not getattr(event, "discord_message_id", None):
        return

    url = f"{webhook_url}/messages/{event.discord_message_id}"
    payload = {"embeds": [build_event_embed(event)]}

    try:
        response = requests.patch(url, json=payload, timeout=5.0)
        log(f"DEBUG [Discord]: Event PATCH status={response.status_code}")
    except Exception as e:
        log(f"DEBUG [Discord Event Edit Error]: {e}")

# --- TOURNAMENT FORUM WEBHOOK INTEGRATION ---

def get_tournament_webhook_url():
    return (
        os.environ.get("TOURNAMENTS")
    )


def get_discord_ping(user):
    """Gibt einen echten <@ID> Ping zurück, falls eine numerische Discord-ID hinterlegt ist, sonst den Namen."""
    if not user:
        return "Freilos (Bye)"
    discord_acc = getattr(user, "discord_account", None)
    if discord_acc:
        clean_acc = discord_acc.strip()
        if clean_acc.isdigit():
            return f"<@{clean_acc}> (**{user.display_name}**)"
        else:
            handle = clean_acc if clean_acc.startswith("@") else f"@{clean_acc}"
            return f"**{user.display_name}** ({handle})"
    return f"**{user.display_name}**"


def build_tournament_overview_embed(tournament):
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    start_str = (
        tournament.start_date.strftime("%d.%m.%Y um %H:%M Uhr")
        if tournament.start_date
        else "Unbekannt"
    )
    return {
        "title": f"🏆 Turnier: {tournament.name}",
        "url": f"{frontend_url}/tournaments/{tournament.id}",
        "description": (
            f"Willkommen im offiziellen Turnier-Thread für **{tournament.name}**!\n"
            f"Alle Paarungen, Ergebnisse und Hand-in-Erinnerungen werden hier veröffentlicht."
        ),
        "color": 14690347,  # #e0282b
        "fields": [
            {"name": "🎲 Spielsystem", "value": tournament.system, "inline": True},
            {"name": "⚔️ Format", "value": tournament.format_type, "inline": True},
            {"name": "👥 Max. Spieler", "value": str(tournament.max_players), "inline": True},
            {"name": "📅 Turnierstart", "value": start_str, "inline": True},
            {
                "name": "⏳ Rundendauer (Hand-in)",
                "value": f"{tournament.round_duration_days} Tage pro Runde",
                "inline": True,
            },
        ],
        "footer": {"text": "Viel Erfolg auf dem Schlachtfeld!"},
    }


def ensure_tournament_forum_thread(tournament):
    """
    Erstellt einen neuen Forum-Post im Discord-Forum-Channel, falls noch keine discord_thread_id existiert.
    """
    webhook_url = get_tournament_webhook_url()
    if not webhook_url:
        log("DEBUG [Discord]: Kein TOURNAMENTS Webhook in .env konfiguriert.")
        return None

    if tournament.discord_thread_id:
        return tournament.discord_thread_id

    url = f"{webhook_url}?wait=true"
    payload = {
        "username": "Turnier Auspex",
        "thread_name": f"🏆 {tournament.name} ({tournament.system})",
        "content": f"Turnier-Thread für **{tournament.name}** eröffnet.",
        "embeds": [build_tournament_overview_embed(tournament)],
    }

    try:
        log(f"DEBUG [Discord]: Sende Forum Thread POST an Webhook...")
        log(f"DEBUG [Discord Payload]: {json.dumps(payload, default=str)}")
        response = requests.post(url, json=payload, timeout=5.0)
        log(f"DEBUG [Discord]: Forum Thread POST status={response.status_code}")
        log(f"DEBUG [Discord Response Body]: {response.text}")

        if response.status_code in [200, 201]:
            data = response.json()
            thread_id = data.get("channel_id") or data.get("id")
            tournament.discord_thread_id = str(thread_id)
            log(f"DEBUG [Discord]: Thread erfolgreich erstellt! thread_id={tournament.discord_thread_id}")
            return tournament.discord_thread_id
    except Exception as e:
        log(f"DEBUG [Discord Tournament Thread Error]: {e}")
    return None

def build_match_widget_embed(match, tournament, table_number=1):
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    p1_str = format_discord_user(match.player1) if match.player1 else "Freilos (Bye)"
    p2_str = format_discord_user(match.player2) if match.player2 else "Freilos (Bye)"

    # Armeelisten-Links ermitteln
    p1_part = tournament.participants.filter_by(user_id=match.player1_id).first() if match.player1_id else None
    p2_part = tournament.participants.filter_by(user_id=match.player2_id).first() if match.player2_id else None

    p1_list_str = (
        f"[📄 {p1_part.army_list.name or 'Armeeliste'}]({frontend_url}/army-viewer/{p1_part.army_list_id})"
        if (p1_part and p1_part.army_list_id)
        else "*Keine Liste hinterlegt*"
    )
    p2_list_str = (
        f"[📄 {p2_part.army_list.name or 'Armeeliste'}]({frontend_url}/army-viewer/{p2_part.army_list_id})"
        if (p2_part and p2_part.army_list_id)
        else "*Keine Liste hinterlegt*"
    )

    s1 = str(match.score_player1) if match.score_player1 is not None else "—"
    s2 = str(match.score_player2) if match.score_player2 is not None else "—"

    p1_submit_icon = "✅" if match.p1_submitted else "⏳"
    p2_submit_icon = "✅" if match.p2_submitted else "⏳"

    if match.status == "Completed":
        color = 3066993  # Grün
        status_text = "✅ Beendet & Ausgewertet"
    elif match.status == "Disqualified":
        color = 15158332  # Rot
        status_text = "❌ Disqualifikation (Hand-in Frist abgelaufen)"
    else:
        color = 16098851  # Orange
        status_text = "⚔️ Laufendes Match (Wartet auf Score Hand-in)"

    deadline_str = (
        match.hand_in_by.strftime("%d.%m.%Y um %H:%M Uhr")
        if match.hand_in_by
        else "Keine Frist"
    )

    return {
        "title": f"Runde {match.round_number} • Tisch #{table_number}",
        "url": f"{frontend_url}/tournaments/{tournament.id}",
        "color": color,
        "fields": [
            {
                "name": f"🛡️ Spieler 1 {p1_submit_icon}",
                "value": f"{p1_str}\n{p1_list_str}\n**Score:** {s1} VP",
                "inline": True,
            },
            {
                "name": "⚡",
                "value": "**VS**",
                "inline": True,
            },
            {
                "name": f"🛡️ Spieler 2 {p2_submit_icon}",
                "value": f"{p2_str}\n{p2_list_str}\n**Score:** {s2} VP",
                "inline": True,
            },
            {
                "name": "⏰ Hand-in Deadline",
                "value": deadline_str,
                "inline": True,
            },
            {
                "name": "📊 Status",
                "value": status_text,
                "inline": True,
            },
        ],
        "footer": {"text": "Scores bitte rechtzeitig unter 'Mein Account -> Meine Turniere' eintragen!"},
    }


def post_tournament_round_to_discord(tournament, round_number, matches):
    """
    Postet die Runden-Ankündigung mit Pings aller gepaarten Spieler sowie ein eigenes Widget-Embed
    für jedes Match in den Forum-Thread des Turniers.
    """
    webhook_url = get_tournament_webhook_url()
    if not webhook_url:
        return

    thread_id = ensure_tournament_forum_thread(tournament)
    if not thread_id:
        return

    post_url = f"{webhook_url}?wait=true&thread_id={thread_id}"

    # 1. Ankündigungs-Post mit allen Spieler-Pings
    pings = []
    for m in matches:
        if m.player1:
            pings.append(get_discord_ping(m.player1))
        if m.player2:
            pings.append(get_discord_ping(m.player2))

    deadline_str = (
        matches[0].hand_in_by.strftime("%d.%m.%Y um %H:%M Uhr")
        if (matches and matches[0].hand_in_by)
        else "Unbekannt"
    )

    announcement_text = (
        f"## 📢 RUNDE {round_number} GESTARTET!\n"
        f"Die Paarungen für **Runde {round_number}** stehen fest! "
        f"Ihr habt **{tournament.round_duration_days} Tage** Zeit (Hand-in bis **{deadline_str}**), "
        f"um euer Spiel auszutragen und die Ergebnisse im Dashboard unter *Mein Account -> Meine Turniere* einzutragen.\n\n"
        f"🔔 **Aktive Generäle dieser Runde:** {', '.join(pings)}"
    )

    try:
        requests.post(
            post_url,
            json={"username": "Turnier Auspex", "content": announcement_text},
            timeout=5.0,
        )
    except Exception as e:
        log(f"DEBUG [Discord Round Announcement Error]: {e}")

    # 2. Für jedes Match ein eigenes Paarungs-Widget posten und Message-ID speichern
    for idx, m in enumerate(matches, start=1):
        match_payload = {
            "username": "Turnier Auspex",
            "embeds": [build_match_widget_embed(m, tournament, table_number=idx)],
        }
        try:
            res = requests.post(post_url, json=match_payload, timeout=5.0)
            if res.status_code in [200, 201]:
                m.discord_message_id = str(res.json().get("id"))
        except Exception as e:
            log(f"DEBUG [Discord Match Widget Error]: {e}")


def update_tournament_match_widget(match, tournament):
    """Aktualisiert das Paarungs-Widget im Discord-Forum-Thread, sobald ein Spieler seinen Score einträgt."""
    webhook_url = get_tournament_webhook_url()
    if not webhook_url or not tournament.discord_thread_id or not match.discord_message_id:
        return

    # Tischnummer innerhalb der Runde bestimmen
    round_matches = (
        tournament.matches.filter_by(round_number=match.round_number)
        .order_by(match.id.__class__.asc( tournament.matches.property.mapper.class_.id ))
        .all()
    )
    table_num = 1
    for idx, rm in enumerate(round_matches, start=1):
        if rm.id == match.id:
            table_num = idx
            break

    patch_url = f"{webhook_url}/messages/{match.discord_message_id}?thread_id={tournament.discord_thread_id}"
    payload = {
        "embeds": [build_match_widget_embed(match, tournament, table_number=table_num)]
    }

    try:
        requests.patch(patch_url, json=payload, timeout=5.0)
    except Exception as e:
        log(f"DEBUG [Discord Match Widget Patch Error]: {e}")


def post_tournament_reminder_to_discord(match, tournament):
    """
    Sendet 24h vor Ablauf der Hand-in-Frist eine Erinnerung in den Turnier-Forum-Thread
    und pingt gezielt die Spieler, deren Score-Eingabe noch fehlt.
    """
    webhook_url = get_tournament_webhook_url()
    if not webhook_url:
        return False

    thread_id = ensure_tournament_forum_thread(tournament)
    if not thread_id:
        return False

    missing_pings = []
    if not match.p1_submitted and match.player1:
        missing_pings.append(get_discord_ping(match.player1))
    if not match.p2_submitted and match.player2:
        missing_pings.append(get_discord_ping(match.player2))

    if not missing_pings:
        return False

    deadline_str = (
        match.hand_in_by.strftime("%d.%m.%Y um %H:%M Uhr")
        if match.hand_in_by
        else "Unbekannt"
    )
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    content = (
        f"⚠️ **24h HAND-IN ERINNERUNG (Runde {match.round_number})** ⚠️\n"
        f"Hallo {', '.join(missing_pings)} — euer Match (**{match.player1.display_name if match.player1 else 'TBD'}** vs. "
        f"**{match.player2.display_name if match.player2 else 'TBD'}**) hat noch keine vollständige Ergebnismeldung!\n"
        f"⏰ **Fristende:** {deadline_str}\n"
        f"Bitte tragt euren Score rechtzeitig unter [Mein Account -> Meine Turniere]({frontend_url}/account) ein, "
        f"um eine automatische Disqualifikation zu vermeiden!"
    )

    post_url = f"{webhook_url}?wait=true&thread_id={thread_id}"
    try:
        res = requests.post(
            post_url,
            json={"username": "Turnier Auspex", "content": content},
            timeout=5.0,
        )
        return res.status_code in [200, 201]
    except Exception as e:
        log(f"DEBUG [Discord Reminder Error]: {e}")
        return False