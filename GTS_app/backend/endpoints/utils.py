import sys
from sqlalchemy import func
from flask_jwt_extended import get_jwt
from extensions import db
from models import ArmyList, Faction


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def is_admin():
    claims = get_jwt()
    return claims.get("is_admin") is True


def systems_match(game_sys: str, list_sys: str) -> bool:
    if not game_sys or not list_sys:
        return False
    g = game_sys.lower().strip()
    l = list_sys.lower().strip()
    if g == l:
        return True
    if g in ("warhammer 40k", "combat patrol") and l in ("warhammer 40k", "combat patrol"):
        return True
    if g in ("age of sigmar", "spearhead") and l in ("age of sigmar", "spearhead"):
        return True
    return False


def parse_roster_metadata(data):
    roster = data.get("roster", {})
    forces = roster.get("forces", [])
    primary_force = forces[0] if forces else {}

    name = (roster.get("name") or "Unbenannte Armee").strip()

    raw_sys = roster.get("gameSystemName", "Unknown System")
    sys_lower = raw_sys.lower()
    if "40,000" in sys_lower or "40k" in sys_lower:
        system = "Warhammer 40k"
    elif "heresy" in sys_lower or "30k" in sys_lower or "age of darkness" in sys_lower:
        system = "Horus Heresy (30k)"
    elif "sigmar" in sys_lower or "aos" in sys_lower:
        system = "Age of Sigmar"
    elif "old world" in sys_lower:
        system = "Old World"
    elif "kill team" in sys_lower:
        system = "Kill Team"
    else:
        system = raw_sys

    raw_faction = (
        primary_force.get("catalogueName")
        or roster.get("catalogueName")
        or "Unknown Faction"
    ).strip()

    if " - " in raw_faction:
        raw_faction = raw_faction.split(" - ", 1)[1].strip()

    points = 0
    points_limit = 0
    for cost in roster.get("costs", []):
        c_name = (cost.get("name") or "").lower()
        if "pt" in c_name or "point" in c_name or "pkt" in c_name:
            points = int(float(cost.get("value", 0)))
            break

    for limit in roster.get("costLimits", []):
        l_name = (limit.get("name") or "").lower()
        if "pt" in l_name or "point" in l_name or "pkt" in l_name:
            points_limit = int(float(limit.get("value", 0)))
            break

    detachment = None
    sub_detachments = []

    def scan_selections(selections):
        nonlocal detachment, points_limit
        for sel in selections:
            sel_name = sel.get("name", "")
            sel_group = sel.get("group", "")

            if sel_name == "Points limit" and sel.get("number"):
                points_limit = int(sel.get("number"))

            if sel_name in ("Detachment", "Rite of War", "Battle Formation") or sel_group in ("Detachment", "Rite of War", "Battle Formation"):
                sub_sels = sel.get("selections", [])
                if sub_sels and sel_name in ("Detachment", "Rite of War", "Battle Formation"):
                    detachment = sub_sels[0].get("name")
                elif sel_group in ("Detachment", "Rite of War", "Battle Formation"):
                    detachment = sel_name

            if sel.get("selections"):
                scan_selections(sel.get("selections", []))

    def scan_forces(force_list):
        for f in force_list:
            f_name = f.get("name", "")
            if f_name and f_name not in ("Army Roster", "Crusade Force Organization Chart"):
                sub_detachments.append(f_name)
            scan_selections(f.get("selections", []))
            if f.get("forces"):
                scan_forces(f.get("forces", []))

    scan_forces(forces)

    if not detachment and sub_detachments:
        detachment = ", ".join(sub_detachments)

    return {
        "name": name,
        "system": system,
        "raw_system": raw_sys,
        "faction": raw_faction,
        "detachment": detachment,
        "points": points,
        "points_limit": points_limit,
    }


def validate_and_resolve_army_list(army_list_id, user_id, game_system, game_points):
    """Validates an ArmyList against game rules and returns (army_list, faction_id, custom_army, error_msg)."""
    army_list = db.session.get(ArmyList, army_list_id)
    if not army_list or army_list.user_id != user_id:
        return None, None, None, "Ungültige Armeeliste ausgewählt."

    meta = parse_roster_metadata(army_list.roster_data) if army_list.roster_data else {}
    list_sys = meta.get("system") or army_list.system
    list_faction = meta.get("faction") if army_list.faction in (None, "Unknown Faction") else army_list.faction
    list_pts = meta.get("points") if meta.get("points") is not None else (army_list.points or 0)

    if not systems_match(game_system, list_sys):
        return (
            None,
            None,
            None,
            f"Deine Liste ist für '{list_sys}', aber das Spiel erfordert '{game_system}'.",
        )

    if game_points and int(game_points) > 0 and list_pts > int(game_points):
        return (
            None,
            None,
            None,
            f"Deine Liste hat {list_pts} Pkt., erlaubt sind maximal {game_points} Pkt.",
        )

    matched_faction = Faction.query.filter(
        func.lower(Faction.name) == (list_faction or "").lower()
    ).first()
    faction_id = matched_faction.id if matched_faction else None
    custom_army = list_faction or army_list.name

    return army_list, faction_id, custom_army, None