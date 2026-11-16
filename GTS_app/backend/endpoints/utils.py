import sys

from datetime import datetime
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from extensions import db
from models import User, Club, ClubEmployee, ClubBan
from sqlalchemy import func
from flask_jwt_extended import get_jwt
from extensions import db
from models import ArmyList, Faction
from models import Club, ClubEmployee


def is_club_owner(user_id: str, club_id: str) -> bool:
    if not user_id or not club_id:
        return False
    club = db.session.get(Club, club_id)
    return bool(club and club.owner_id == user_id)


def get_club_employee(user_id: str, club_id: str) -> ClubEmployee | None:
    if not user_id or not club_id:
        return None
    return ClubEmployee.query.filter_by(club_id=club_id, user_id=user_id).first()


def is_club_keymaster(user_id: str, club_id: str) -> bool:
    """True if the user owns the club OR is an employee with the KEYMASTER attribute."""
    if is_club_owner(user_id, club_id):
        return True
    emp = get_club_employee(user_id, club_id)
    return bool(emp and emp.is_keymaster)


def can_manage_club_tournaments(user_id: str, club_id: str) -> bool:
    """True if the user owns the club OR is an employee with tournament permissions."""
    if is_club_owner(user_id, club_id):
        return True
    emp = get_club_employee(user_id, club_id)
    return bool(emp and (emp.can_manage_tournaments or emp.is_keymaster))


def can_manage_club_events(user_id: str, club_id: str) -> bool:
    """True if the user owns the club OR is an employee with event permissions."""
    if is_club_owner(user_id, club_id):
        return True
    emp = get_club_employee(user_id, club_id)
    return bool(emp and (emp.can_manage_events or emp.is_keymaster))


def get_user_club_roles(user_id: str) -> list[dict]:
    """Returns a summary of all clubs the user owns or works at (used for JWT/frontend UI)."""
    owned = Club.query.filter_by(owner_id=user_id).all()
    employed = ClubEmployee.query.filter_by(user_id=user_id).all()

    roles = []
    for c in owned:
        roles.append({
            "club_id": c.id,
            "club_name": c.name,
            "club_slug": c.slug,
            "tier": c.tier,
            "tier_limits": c.tier_limits,
            "is_owner": True,
            "is_keymaster": True,
            "can_manage_tournaments": True,
            "can_manage_events": True,
        })

    owned_ids = {c.id for c in owned}
    for e in employed:
        if e.club_id in owned_ids or not e.club:
            continue
        roles.append({
            "club_id": e.club_id,
            "club_name": e.club.name,
            "club_slug": e.club.slug,
            "tier": e.club.tier,
            "tier_limits": e.club.tier_limits,
            "is_owner": False,
            "role_title": e.role_title,
            "is_keymaster": e.is_keymaster,
            "can_manage_tournaments": e.can_manage_tournaments,
            "can_manage_events": e.can_manage_events,
        })
    return roles


def log(msg):
    print(msg, file=sys.stderr, flush=True)


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

    meta = parse_roster_metadata(
        army_list.roster_data) if army_list.roster_data else {}
    list_sys = meta.get("system") or army_list.system
    list_faction = meta.get("faction") if army_list.faction in (
        None, "Unknown Faction") else army_list.faction
    list_pts = meta.get("points") if meta.get(
        "points") is not None else (army_list.points or 0)

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


def is_app_admin() -> bool:
    """True if the current JWT belongs to a platform-level AppAdmin (sudo)."""
    try:
        claims = get_jwt()
        if claims.get("is_app_admin") is True:
            return True
        uid = get_jwt_identity()
        if uid:
            u = db.session.get(User, uid)
            return bool(u and u.is_app_admin)
    except Exception:
        pass
    return False


def get_optional_jwt_user_id() -> str | None:
    """Extracts user_id on public GET endpoints if a Bearer token is present, else None."""
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt_identity()
    except Exception:
        return None


def is_banned_from_club(user_id: str | None, club_id: str | None) -> bool:
    """Checks if a user has an active Store Ban for the given club (AppAdmins cannot be banned)."""
    if not user_id or not club_id:
        return False
    user = db.session.get(User, user_id)
    if user and user.is_app_admin:
        return False
    ban = ClubBan.query.filter_by(club_id=club_id, user_id=user_id).first()
    if not ban:
        return False
    if ban.expires_at and datetime.utcnow() > ban.expires_at:
        db.session.delete(ban)
        db.session.commit()
        return False
    return True


def get_banned_club_ids(user_id: str | None) -> set[str]:
    """Returns the set of club_ids the user is currently banned from."""
    if not user_id:
        return set()
    now = datetime.utcnow()
    bans = ClubBan.query.filter_by(user_id=user_id).all()
    active_banned_clubs = set()
    for b in bans:
        if b.expires_at and now > b.expires_at:
            continue
        active_banned_clubs.add(b.club_id)
    return active_banned_clubs


def is_club_owner(user_id: str, club_id: str) -> bool:
    if is_app_admin():
        return True
    if not user_id or not club_id:
        return False
    club = db.session.get(Club, club_id)
    return bool(club and club.owner_id == user_id)


def get_club_employee(user_id: str, club_id: str) -> ClubEmployee | None:
    if not user_id or not club_id:
        return None
    return ClubEmployee.query.filter_by(club_id=club_id, user_id=user_id).first()


def is_club_keymaster(user_id: str, club_id: str) -> bool:
    if is_club_owner(user_id, club_id):
        return True
    emp = get_club_employee(user_id, club_id)
    return bool(emp and emp.is_keymaster)


def can_manage_club_tournaments(user_id: str, club_id: str) -> bool:
    if is_club_owner(user_id, club_id):
        return True
    emp = get_club_employee(user_id, club_id)
    return bool(emp and (emp.can_manage_tournaments or emp.is_keymaster))


def can_manage_club_events(user_id: str, club_id: str) -> bool:
    if is_club_owner(user_id, club_id):
        return True
    emp = get_club_employee(user_id, club_id)
    return bool(emp and (emp.can_manage_events or emp.is_keymaster))
