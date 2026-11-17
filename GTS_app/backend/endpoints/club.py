import os
import re
import uuid
import secrets
import stripe
from datetime import datetime, time, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import (
    User,
    Club,
    ClubLicense,
    ClubPicture,
    ClubMember,
    ClubEmployee,
    ClubEmployeeShift,
    ClubTable,
    ClubTableSchedule,
    ClubTableReservation,
    ClubBan,
    Game,
    GamePlayer,
    Tournament,
    TournamentParticipant,
    Event,
    load_club_tiers,
    get_all_tiers,
    infer_table_category,
)
from .tournaments import serialize_tournament
from storage import upload_bytes_to_s3
from .auth import ALLOWED_IMAGE_MIMES
from services.discord import update_game_webhook
from .utils import (
    log,
    is_club_owner,
    is_club_keymaster,
    can_manage_club_events,
    is_banned_from_club,
    get_banned_club_ids,
    get_optional_jwt_user_id,
)

clubs_bp = Blueprint("clubs", __name__)


def _is_stripe_mock_mode() -> bool:
    return os.environ.get("STRIPE_MOCK_MODE", "true").strip().lower() in ("true", "1", "yes")


def _init_stripe():
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")


def _resolve_tier_from_price_id(price_id: str) -> str | None:
    """Finds the tier key ('tier_1', 'tier_2', 'tier_3') matching a Stripe price_id in tiers.json."""
    if not price_id:
        return None
    for tier_key, cfg in get_all_tiers().items():
        if cfg.get("stripe_price_id") == price_id:
            return tier_key
    return None


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    return re.sub(r"[\s-]+", "-", value).strip("-")


def find_available_club_tables(
    club_id: str,
    category: str,
    start_time: datetime,
    end_time: datetime,
    exclude_game_id: str = None,
) -> list[ClubTable]:
    candidate_tables = ClubTable.query.filter_by(club_id=club_id, is_active=True).all()
    capable_tables = [
        t for t in candidate_tables
        if t.supports_category(category) and t.is_open_during(start_time, end_time)
    ]
    if not capable_tables:
        return []

    overlap_query = Game.query.filter(
        Game.club_id == club_id,
        Game.status == "Matched",
        Game.is_virtual == False,
        Game.table_id.isnot(None),
        Game.start_time < end_time,
        Game.end_time > start_time,
    )
    if exclude_game_id:
        overlap_query = overlap_query.filter(Game.id != exclude_game_id)

    busy_table_ids = {g.table_id for g in overlap_query.all()}
    return [t for t in capable_tables if t.id not in busy_table_ids]


def serialize_club(c: Club, include_internal: bool = False) -> dict:
    payload = {
        "id": c.id,
        "owner_id": c.owner_id,
        "name": c.name,
        "slug": c.slug,
        "description": c.description,
        "logo_url": getattr(c, "logo_url", None) or (c.theme_config or {}).get("logo_url"),
        "is_private": bool(getattr(c, "is_private", False)),
        "tier": c.tier,
        "tier_limits": c.tier_limits,
        "address": {
            "street": c.address_street,
            "city": c.address_city,
            "postal_code": c.address_postal_code,
            "country": c.address_country,
        },
        "contact": {
            "email": c.contact_email,
            "phone": c.contact_phone,
            "website_url": c.website_url,
            "online_store_url": c.online_store_url,
            "social_links": c.social_links or {},
        },
        "discord": {
            "guild_id": c.discord_guild_id,
            "invite_url": c.discord_invite_url,
            "bot_access_level": c.tier_limits.get("discord_bot_access_level", "basic"),
        },
        "theme_config": c.theme_config or {},
        "opening_hours": getattr(c, "opening_hours", None)
        or {
            "0": {"is_open": True, "open": "14:00", "close": "22:00"},
            "1": {"is_open": True, "open": "14:00", "close": "22:00"},
            "2": {"is_open": True, "open": "14:00", "close": "22:00"},
            "3": {"is_open": True, "open": "14:00", "close": "22:00"},
            "4": {"is_open": True, "open": "14:00", "close": "23:00"},
            "5": {"is_open": True, "open": "10:00", "close": "22:00"},
            "6": {"is_open": False, "open": "12:00", "close": "18:00"},
        },
        "tables": [
            {
                "id": t.id,
                "name": t.name,
                "supports_tabletop": t.supports_tabletop,
                "supports_tcg": t.supports_tcg,
                "supports_rpg": t.supports_rpg,
                "dimensions": t.dimensions,
                "max_players": t.max_players,
                "is_active": t.is_active,
                "schedules": [
                    {
                        "id": s.id,
                        "day_of_week": s.day_of_week,
                        "specific_date": s.specific_date.isoformat() if s.specific_date else None,
                        "open_time": s.open_time.strftime("%H:%M") if s.open_time else None,
                        "close_time": s.close_time.strftime("%H:%M") if s.close_time else None,
                        "is_blocked": s.is_blocked,
                        "note": s.note,
                    }
                    for s in t.schedules.all()
                ] if include_internal else [],
            }
            for t in c.tables
        ],
    }
    if include_internal:
        payload["license_id"] = c.license_id
        payload["discord"]["config"] = c.discord_config or {}
        payload["employees"] = [
            {
                "id": e.id,
                "user_id": e.user_id,
                "display_name": e.user.display_name if e.user else "Unbekannt",
                "email": e.user.email if e.user else None,
                "role_title": e.role_title,
                "weekly_hours": float(getattr(e, "weekly_hours", None) or 20.0),
                "is_keymaster": e.is_keymaster,
                "can_manage_tournaments": e.can_manage_tournaments,
                "can_manage_events": e.can_manage_events,
            }
            for e in c.employees
        ]
    return payload


# ==========================================
# 1. STRIPE / MOCK BILLING, PORTAL & WEBHOOKS
# ==========================================

def _tier_rank(tier_key: str, tiers: dict) -> int:
    cfg = tiers.get(tier_key) or {}
    if "rank" in cfg:
        return int(cfg["rank"])
    order = {"tier_1": 1, "tier_2": 2, "tier_3": 3, "tier_4": 4}
    return order.get(tier_key, 1)


def _compute_slot_price(tier_cfg: dict, billing_cycle: str, discount_percent: int = 0) -> float:
    base = (
        float(tier_cfg.get("yearly_monthly_price_eur", tier_cfg.get("monthly_price_eur", 0)))
        if billing_cycle == "yearly"
        else float(tier_cfg.get("monthly_price_eur", 0))
    )
    if discount_percent > 0:
        base = round(base * (1.0 - (discount_percent / 100.0)), 2)
    return base


def _serialize_license(lic: ClubLicense, tiers: dict) -> dict:
    tier_cfg = tiers.get(lic.tier) or {}
    return {
        "id": lic.id,
        "tier": lic.tier,
        "tier_rank": _tier_rank(lic.tier, tiers),
        "tier_details": tier_cfg,
        "status": lic.status,
        "license_type": getattr(lic, "license_type", "single") or "single",
        "bundle_id": getattr(lic, "bundle_id", None),
        "is_primary_slot": bool(getattr(lic, "is_primary_slot", True)),
        "billing_cycle": getattr(lic, "billing_cycle", "yearly") or "yearly",
        "discount_percent": int(getattr(lic, "discount_percent", 0) or 0),
        "price_eur": getattr(lic, "price_eur", None)
        or _compute_slot_price(
            tier_cfg,
            getattr(lic, "billing_cycle", "yearly") or "yearly",
            int(getattr(lic, "discount_percent", 0) or 0),
        ),
        "is_mock": lic.is_mock,
        "stripe_subscription_id": lic.stripe_subscription_id,
        "club_id": lic.club.id if lic.club else None,
        "club_name": lic.club.name if lic.club else None,
        "valid_until": lic.valid_until.isoformat() if lic.valid_until else None,
        "created_at": lic.created_at.isoformat() if lic.created_at else None,
    }


@clubs_bp.route("/api/billing/pricing", methods=["GET"])
def get_pricing_catalog():
    """Single source of truth for Landingpage and App pricing & combined license rules."""
    return jsonify(load_club_tiers()), 200


@clubs_bp.route("/api/billing/tiers", methods=["GET"])
def get_available_tiers():
    return jsonify(get_all_tiers()), 200


@clubs_bp.route("/api/billing/licenses", methods=["GET"])
@jwt_required()
def get_my_licenses():
    user_id = get_jwt_identity()
    licenses = (
        ClubLicense.query.filter_by(owner_id=user_id)
        .order_by(ClubLicense.created_at.asc())
        .all()
    )
    tiers = get_all_tiers()
    return jsonify([_serialize_license(lic, tiers) for lic in licenses]), 200


@clubs_bp.route("/api/billing/checkout", methods=["POST"])
@jwt_required()
def create_checkout_session():
    """
    Initiates a Single or Combined (Multi-Store) License Checkout / Provisioning flow:
    - Single License: mode='single', tier='tier_1'|'tier_2'|'tier_3', billing_cycle='monthly'|'yearly'
    - Combined License: mode='combined', primary_tier='tier_3' (Citadel required),
      additional_tiers=['tier_2', 'tier_3', ...] (each receives -10% discount).
    - Fortress of Terra ('tier_4') is contact_only and cannot be bought via checkout.
    - When upgrading an existing club (club_id provided), enforces strict UPGRADE-ONLY rule.
    """
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    data = request.get_json() or {}
    mode = (data.get("mode") or data.get("license_type") or "single").strip().lower()
    billing_cycle = (data.get("billing_cycle") or "yearly").strip().lower()
    if billing_cycle not in ("monthly", "yearly"):
        billing_cycle = "yearly"

    pricing_doc = load_club_tiers()
    tiers = pricing_doc.get("tiers", {})
    combined_rules = pricing_doc.get("combined_rules", {})

    frontend_url = (os.environ.get("FRONTEND_URL") or "https://app.gametablesync.com").rstrip("/")

    # --- COMBINED (MULTI-STORE) LICENSE WORKFLOW ---
    if mode == "combined":
        req_primary = combined_rules.get("primary_required_tier", "tier_3")
        allowed_extra = set(combined_rules.get("allowed_additional_tiers", ["tier_2", "tier_3"]))
        extra_discount = int(combined_rules.get("additional_slot_discount_percent", 10))

        primary_tier = data.get("primary_tier") or req_primary
        if primary_tier != req_primary:
            return jsonify({
                "msg": f"Für eine Kombi-Lizenz (Multi-Store) muss die Hauptlizenz '{tiers.get(req_primary, {}).get('name', 'Citadel')}' sein."
            }), 400

        additional_tiers = data.get("additional_tiers") or []
        if not isinstance(additional_tiers, list) or len(additional_tiers) < 1:
            return jsonify({
                "msg": "Bitte wähle mindestens einen zusätzlichen Store (Stronghold oder Citadel) für die Kombi-Lizenz aus."
            }), 400

        for extra_t in additional_tiers:
            if extra_t not in allowed_extra:
                return jsonify({
                    "msg": f"Zusätzliche Lizenzen müssen Stronghold oder Citadel sein (Outpost ist nur für nicht-kommerzielle Einzel-Clubs)."
                }), 400

        bundle_id = f"bundle_{uuid.uuid4().hex[:10]}"
        created_licenses = []

        # 1. Primary Citadel slot
        p_cfg = tiers[primary_tier]
        p_lic = ClubLicense(
            owner_id=user.id,
            tier=primary_tier,
            status="active",
            license_type="combined",
            bundle_id=bundle_id,
            is_primary_slot=True,
            billing_cycle=billing_cycle,
            discount_percent=0,
            price_eur=_compute_slot_price(p_cfg, billing_cycle, 0),
            is_mock=True,
            stripe_subscription_id=f"sub_mock_{uuid.uuid4().hex[:12]}",
            valid_until=datetime.utcnow() + timedelta(days=365 if billing_cycle == "yearly" else 31),
        )
        db.session.add(p_lic)
        created_licenses.append(p_lic)

        # 2. Additional discounted slots (-10%)
        for extra_t in additional_tiers:
            e_cfg = tiers[extra_t]
            e_lic = ClubLicense(
                owner_id=user.id,
                tier=extra_t,
                status="active",
                license_type="combined",
                bundle_id=bundle_id,
                is_primary_slot=False,
                billing_cycle=billing_cycle,
                discount_percent=extra_discount,
                price_eur=_compute_slot_price(e_cfg, billing_cycle, extra_discount),
                is_mock=True,
                stripe_subscription_id=f"sub_mock_{uuid.uuid4().hex[:12]}",
                valid_until=datetime.utcnow() + timedelta(days=365 if billing_cycle == "yearly" else 31),
            )
            db.session.add(e_lic)
            created_licenses.append(e_lic)

        db.session.commit()
        return jsonify({
            "msg": f"Kombi-Lizenz ({1 + len(additional_tiers)} Stores) erfolgreich eingerichtet!",
            "bundle_id": bundle_id,
            "licenses": [_serialize_license(l, tiers) for l in created_licenses],
            "mock": True,
        }), 201

    # --- SINGLE LICENSE WORKFLOW ---
    tier = data.get("tier", "tier_1")
    club_id = data.get("club_id")

    if tier not in tiers:
        return jsonify({"msg": "Ungültiges Lizenz-Tier ausgewählt."}), 400

    tier_cfg = tiers[tier]
    if tier_cfg.get("purchase_mode") == "contact_only":
        return jsonify({
            "msg": f"{tier_cfg.get('name', 'Fortress of Terra')} kann nur auf Anfrage per E-Mail gebucht werden."
        }), 400

    if club_id:
        club = db.session.get(Club, str(club_id))
        if not club or club.owner_id != user_id:
            return jsonify({"msg": "Club nicht gefunden oder keine Berechtigung."}), 403
        # Enforce UPGRADE-ONLY rule if club already has a license
        if club.license:
            current_rank = _tier_rank(club.license.tier, tiers)
            target_rank = _tier_rank(tier, tiers)
            if target_rank <= current_rank:
                return jsonify({
                    "msg": "Downgrades sind nicht möglich. Du kannst deine Lizenz nur auf ein höheres Tier upgraden."
                }), 400

    success_url = data.get("success_url") or f"{frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = data.get("cancel_url") or f"{frontend_url}/billing/cancel"

    # --- A) MOCK MODE ---
    if _is_stripe_mock_mode():
        if club_id:
            club = db.session.get(Club, str(club_id))
            if club.license:
                club.license.tier = tier
                club.license.status = "active"
                club.license.billing_cycle = billing_cycle
                club.license.price_eur = _compute_slot_price(
                    tier_cfg, billing_cycle, club.license.discount_percent or 0
                )
                club.license.valid_until = datetime.utcnow() + timedelta(days=365)
                db.session.commit()
                return jsonify({
                    "msg": f"Club '{club.name}' erfolgreich auf {tier_cfg['name']} hochgestuft!",
                    "license": _serialize_license(club.license, tiers),
                    "license_id": club.license.id,
                    "tier": tier,
                    "mock": True,
                }), 200

        new_license = ClubLicense(
            owner_id=user.id,
            tier=tier,
            status="active",
            license_type="single",
            is_primary_slot=True,
            billing_cycle=billing_cycle,
            discount_percent=0,
            price_eur=_compute_slot_price(tier_cfg, billing_cycle, 0),
            is_mock=True,
            stripe_subscription_id=f"sub_mock_{uuid.uuid4().hex[:12]}",
            valid_until=datetime.utcnow() + timedelta(days=365 if billing_cycle == "yearly" else 31),
        )
        db.session.add(new_license)
        db.session.flush()

        if club_id:
            club = db.session.get(Club, str(club_id))
            club.license_id = new_license.id

        db.session.commit()
        return jsonify({
            "msg": f"Lizenz für {tier_cfg['name']} erfolgreich aktiviert!",
            "license": _serialize_license(new_license, tiers),
            "license_id": new_license.id,
            "tier": tier,
            "mock": True,
        }), 201


@clubs_bp.route("/api/billing/licenses/<string:license_id>/upgrade", methods=["PUT"])
@jwt_required()
def upgrade_club_license(license_id):
    """
    Strictly upgrades an existing ClubLicense to a higher tier (no downgrades allowed).
    If the license is part of a Combined bundle or upgrading a Single Citadel to Combined,
    preserves discounts and updates price_eur.
    """
    user_id = get_jwt_identity()
    lic = db.session.get(ClubLicense, license_id)
    if not lic or lic.owner_id != user_id:
        return jsonify({"msg": "Lizenz nicht gefunden."}), 404

    data = request.get_json() or {}
    target_tier = data.get("tier")
    tiers = get_all_tiers()

    if target_tier not in tiers:
        return jsonify({"msg": "Ungültiges Ziel-Tier."}), 400

    target_cfg = tiers[target_tier]
    if target_cfg.get("purchase_mode") == "contact_only":
        return jsonify({
            "msg": f"{target_cfg.get('name')} erfordert eine individuelle Anfrage per E-Mail."
        }), 400

    current_rank = _tier_rank(lic.tier, tiers)
    target_rank = _tier_rank(target_tier, tiers)

    if target_rank <= current_rank:
        return jsonify({
            "msg": f"Ein Downgrade oder Wechsel auf dasselbe Tier ({target_cfg.get('name')}) ist nicht erlaubt. Nur Upgrades sind möglich."
        }), 400

    lic.tier = target_tier
    lic.price_eur = _compute_slot_price(
        target_cfg,
        getattr(lic, "billing_cycle", "yearly") or "yearly",
        int(getattr(lic, "discount_percent", 0) or 0),
    )
    db.session.commit()

    return jsonify({
        "msg": f"Lizenz erfolgreich auf {target_cfg.get('name')} hochgestuft!",
        "license": _serialize_license(lic, tiers),
    }), 200


@clubs_bp.route("/api/billing/licenses/add-slot", methods=["POST"])
@jwt_required()
def add_combined_license_slot():
    """
    Adds an additional Store License slot (Stronghold or Citadel at -10% discount)
    to an owner's existing Citadel license (converting a single Citadel license into a Combined bundle if needed).
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    slot_tier = data.get("tier", "tier_2")

    pricing_doc = load_club_tiers()
    tiers = pricing_doc.get("tiers", {})
    combined_rules = pricing_doc.get("combined_rules", {})
    req_primary = combined_rules.get("primary_required_tier", "tier_3")
    allowed_extra = set(combined_rules.get("allowed_additional_tiers", ["tier_2", "tier_3"]))
    extra_discount = int(combined_rules.get("additional_slot_discount_percent", 10))

    if slot_tier not in allowed_extra:
        return jsonify({
            "msg": "Zusätzliche Store-Lizenzen müssen Stronghold oder Citadel sein."
        }), 400

    # Verify the owner has at least one active Citadel (tier_3) primary license
    owner_licenses = ClubLicense.query.filter_by(owner_id=user_id, status="active").all()
    primary_citadel = next((l for l in owner_licenses if l.tier == req_primary), None)
    if not primary_citadel:
        return jsonify({
            "msg": "Um zusätzliche Store-Lizenzen (-10%) hinzuzufügen, benötigst du mindestens eine aktive Citadel-Hauptlizenz."
        }), 400

    bundle_id = primary_citadel.bundle_id or f"bundle_{uuid.uuid4().hex[:10]}"
    primary_citadel.bundle_id = bundle_id
    primary_citadel.license_type = "combined"
    primary_citadel.is_primary_slot = True

    cycle = getattr(primary_citadel, "billing_cycle", "yearly") or "yearly"
    slot_cfg = tiers[slot_tier]

    new_slot = ClubLicense(
        owner_id=user_id,
        tier=slot_tier,
        status="active",
        license_type="combined",
        bundle_id=bundle_id,
        is_primary_slot=False,
        billing_cycle=cycle,
        discount_percent=extra_discount,
        price_eur=_compute_slot_price(slot_cfg, cycle, extra_discount),
        is_mock=True,
        stripe_subscription_id=f"sub_mock_{uuid.uuid4().hex[:12]}",
        valid_until=primary_citadel.valid_until or (datetime.utcnow() + timedelta(days=365)),
    )
    db.session.add(new_slot)
    db.session.commit()

    return jsonify({
        "msg": f"Zusätzliche {slot_cfg['name']}-Lizenz (-{extra_discount}%) erfolgreich zu deinem Bundle hinzugefügt!",
        "license": _serialize_license(new_slot, tiers),
    }), 201


@clubs_bp.route("/api/billing/portal", methods=["POST"])
@jwt_required()
def create_customer_portal_session():
    """
    Generates a Stripe Customer Portal link so a Club Owner can manage payment methods,
    download invoices, or upgrade/cancel subscriptions.
    """
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    frontend_url = (os.environ.get("FRONTEND_URL") or "https://app.gametablesync.com").rstrip("/")
    data = request.get_json(silent=True) or {}
    return_url = data.get("return_url") or f"{frontend_url}/account/billing"

    if _is_stripe_mock_mode():
        return jsonify({
            "msg": "[MOCK STRIPE] Im Mock-Modus gibt es kein externes Stripe-Portal.",
            "portal_url": return_url,
            "mock": True,
        }), 200

    if not user.stripe_customer_id:
        return jsonify({"msg": "Kein aktives Stripe-Kundenkonto für diesen Account gefunden."}), 400

    _init_stripe()
    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url,
        )
        return jsonify({"portal_url": portal_session.url, "mock": False}), 200
    except Exception as e:
        log(f"DEBUG [Stripe Portal]: Error creating portal session - {e}")
        return jsonify({"msg": f"Fehler beim Öffnen des Stripe-Portals: {str(e)}"}), 500


@clubs_bp.route("/api/billing/webhook", methods=["POST"])
def stripe_webhook():
    """
    Asynchronous Stripe Webhook listener (No JWT required; authenticated via Stripe-Signature).
    Handles:
      - checkout.session.completed
      - customer.subscription.updated
      - customer.subscription.deleted
      - invoice.payment_failed
    """
    payload = request.get_data(as_text=False)
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        log("⚠️ [Stripe Webhook]: STRIPE_WEBHOOK_SECRET missing in .env")
        return jsonify({"msg": "Webhook secret not configured"}), 500

    _init_stripe()
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        log("⚠️ [Stripe Webhook]: Invalid payload")
        return jsonify({"msg": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:
        log("⚠️ [Stripe Webhook]: Invalid signature")
        return jsonify({"msg": "Invalid signature"}), 400

    event_type = event["type"]
    data_object = event["data"]["object"]
    log(f"🔔 [Stripe Webhook]: Received event '{event_type}'")

    try:
        # 1. Initial Checkout Completed -> Provision or Upgrade License
        if event_type == "checkout.session.completed":
            metadata = data_object.get("metadata") or {}
            gts_user_id = metadata.get("gts_user_id")
            tier = metadata.get("tier", "tier_1")
            club_id = metadata.get("club_id")
            subscription_id = data_object.get("subscription")
            session_id = data_object.get("id")
            customer_id = data_object.get("customer")

            if gts_user_id:
                user = db.session.get(User, gts_user_id)
                if user and customer_id and not user.stripe_customer_id:
                    user.stripe_customer_id = customer_id

                # Calculate period end from subscription if available
                valid_until = datetime.utcnow() + timedelta(days=32)
                if subscription_id:
                    sub = stripe.Subscription.retrieve(subscription_id)
                    if sub and sub.get("current_period_end"):
                        valid_until = datetime.utcfromtimestamp(sub["current_period_end"])

                existing_lic = (
                    ClubLicense.query.filter_by(stripe_subscription_id=subscription_id).first()
                    if subscription_id else None
                )

                if club_id:
                    club = db.session.get(Club, club_id)
                    if club and club.license:
                        existing_lic = club.license

                if existing_lic:
                    existing_lic.tier = tier
                    existing_lic.status = "active"
                    existing_lic.is_mock = False
                    existing_lic.stripe_subscription_id = subscription_id
                    existing_lic.stripe_checkout_session_id = session_id
                    existing_lic.valid_until = valid_until
                else:
                    new_lic = ClubLicense(
                        owner_id=gts_user_id,
                        tier=tier,
                        status="active",
                        is_mock=False,
                        stripe_subscription_id=subscription_id,
                        stripe_checkout_session_id=session_id,
                        valid_until=valid_until,
                    )
                    db.session.add(new_lic)
                    db.session.flush()

                    if club_id:
                        club = db.session.get(Club, club_id)
                        if club and club.owner_id == gts_user_id:
                            club.license_id = new_lic.id

                db.session.commit()
                log(f"✅ [Stripe Webhook]: Provisioned '{tier}' license for user={gts_user_id}")

        # 2. Subscription Renewed, Upgraded, Downgraded, or Past Due
        elif event_type in ("customer.subscription.updated", " customer.subscription.created"):
            subscription_id = data_object.get("id")
            sub_status = data_object.get("status")  # 'active', 'past_due', 'canceled', 'unpaid'
            period_end = data_object.get("current_period_end")

            lic = ClubLicense.query.filter_by(stripe_subscription_id=subscription_id).first()
            if lic:
                # Check if user changed plans in Customer Portal
                items = data_object.get("items", {}).get("data", [])
                if items:
                    new_price_id = items[0].get("price", {}).get("id")
                    resolved_tier = _resolve_tier_from_price_id(new_price_id)
                    if resolved_tier:
                        lic.tier = resolved_tier

                if sub_status in ("active", "trialing"):
                    lic.status = "active"
                elif sub_status in ("past_due", "unpaid"):
                    lic.status = "past_due"
                elif sub_status == "canceled":
                    lic.status = "canceled"

                if period_end:
                    lic.valid_until = datetime.utcfromtimestamp(period_end)

                db.session.commit()
                log(f"ℹ️ [Stripe Webhook]: Updated license {lic.id} (tier={lic.tier}, status={lic.status})")

        # 3. Subscription Canceled / Expired
        elif event_type == "customer.subscription.deleted":
            subscription_id = data_object.get("id")
            lic = ClubLicense.query.filter_by(stripe_subscription_id=subscription_id).first()
            if lic:
                lic.status = "canceled"
                db.session.commit()
                log(f"⚠️ [Stripe Webhook]: Canceled license {lic.id}")

        # 4. Invoice Payment Failed
        elif event_type == "invoice.payment_failed":
            subscription_id = data_object.get("subscription")
            if subscription_id:
                lic = ClubLicense.query.filter_by(stripe_subscription_id=subscription_id).first()
                if lic:
                    lic.status = "past_due"
                    db.session.commit()
                    log(f"⚠️ [Stripe Webhook]: Payment failed for license {lic.id}")

    except Exception as e:
        db.session.rollback()
        log(f"CRITICAL [Stripe Webhook]: Error handling {event_type} - {e}")
        return jsonify({"msg": "Webhook handler error"}), 500

    return jsonify({"received": True}), 200


# ==========================================
# 2. CLUB CRUD, THEMING & METADATA
# ==========================================

@clubs_bp.route("/api/clubs", methods=["GET"])
def get_clubs():
    viewer_id = get_optional_jwt_user_id()
    banned_clubs = get_banned_club_ids(viewer_id)

    clubs = Club.query.order_by(Club.name.asc()).all()
    result = []
    for c in clubs:
        if c.id in banned_clubs:
            continue
        item = serialize_club(c, include_internal=False)
        membership_status = None
        is_staff = False
        if viewer_id:
            if is_club_keymaster(viewer_id, c.id) or ClubEmployee.query.filter_by(
                club_id=c.id, user_id=viewer_id
            ).first():
                is_staff = True
                membership_status = "Approved"
            else:
                mem = ClubMember.query.filter_by(club_id=c.id, user_id=viewer_id).first()
                if mem:
                    membership_status = mem.status
        item["membership_status"] = membership_status
        item["is_owner_or_staff"] = is_staff

        # Hide address & contact for Outpost (tier_1) or private pages from non-members
        is_approved = is_staff or (membership_status == "Approved")
        if (c.tier == "tier_1" or getattr(c, "is_private", False)) and not is_approved:
            item["address"] = None
            item["contact"] = None
            item["opening_hours"] = None
            item["tables"] = []

        result.append(item)
    return jsonify(result), 200


@clubs_bp.route("/api/clubs/<string:slug_or_id>", methods=["GET"])
def get_club_detail(slug_or_id):
    viewer_id = get_optional_jwt_user_id()
    club = db.session.get(Club, slug_or_id) or Club.query.filter_by(slug=slug_or_id).first()
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    if is_banned_from_club(viewer_id, club.id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club und kannst dessen Seite nicht aufrufen."}), 403

    return jsonify(serialize_club(club, include_internal=False)), 200


@clubs_bp.route("/api/clubs/<string:slug_or_id>/public", methods=["GET"])
def get_public_club_page(slug_or_id):
    """
    Returns the Public Store / Club Page payload with tier-specific & membership-specific visibility:
    - If club.is_private is True and viewer is not an approved member/employee/owner:
      returns restricted private view (Name, Description, Join Request button).
    - If Outpost (tier_1) and viewer is not an approved member/employee/owner:
      hides address, contact, gallery, events, and tournaments (shows Name, Description, and Join Request button).
    - For Stronghold (tier_2): shows Gallery, Events, Tournaments, Address, Contact, Opening Hours, and Associate button.
    - For Citadel (tier_3+): also unlocks custom Subdomain (`slug.gametablesync.com`), custom Store Logo, and full branding.
    """
    viewer_id = get_optional_jwt_user_id()
    club = Club.query.filter_by(slug=slug_or_id).first()
    if not club:
        try:
            uuid.UUID(str(slug_or_id))
            club = db.session.get(Club, slug_or_id)
        except ValueError:
            club = None

    if not club:
        return jsonify({"msg": "Club oder Store nicht gefunden."}), 404

    if is_banned_from_club(viewer_id, club.id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club."}), 403

    is_owner_or_staff = False
    membership_status = None  # None | 'Pending' | 'Approved'

    if viewer_id:
        if is_club_keymaster(viewer_id, club.id) or ClubEmployee.query.filter_by(
            club_id=club.id, user_id=viewer_id
        ).first():
            is_owner_or_staff = True
            membership_status = "Approved"
        else:
            mem = ClubMember.query.filter_by(club_id=club.id, user_id=viewer_id).first()
            if mem:
                membership_status = mem.status

    is_approved_member = is_owner_or_staff or (membership_status == "Approved")
    is_outpost = (club.tier == "tier_1")
    is_private_page = bool(getattr(club, "is_private", False))
    is_citadel_or_above = club.tier in ("tier_3", "tier_4") or bool(
        club.tier_limits.get("can_edit_logo_and_description", False)
    )

    members_count = ClubMember.query.filter_by(club_id=club.id, status="Approved").count() + 1

    # Private page guard: outsiders only see name, private badge, and join request button
    if is_private_page and not is_approved_member:
        return jsonify({
            "id": club.id,
            "name": club.name,
            "slug": club.slug,
            "tier": club.tier,
            "tier_limits": club.tier_limits,
            "is_outpost": is_outpost,
            "is_private": True,
            "restricted_view": True,
            "restriction_reason": "private",
            "description": club.description,
            "logo_url": getattr(club, "logo_url", None) if is_citadel_or_above else None,
            "theme_config": club.theme_config or {},
            "membership_status": membership_status,
            "is_owner_or_staff": is_owner_or_staff,
            "members_count": members_count,
            "address": None,
            "contact": None,
            "opening_hours": None,
            "pictures": [],
            "events": [],
            "tournaments": [],
        }), 200

    # Outpost (tier_1) non-member guard: only Name, Description, and Join button (no address, no events, no tournaments)
    if is_outpost and not is_approved_member:
        return jsonify({
            "id": club.id,
            "name": club.name,
            "slug": club.slug,
            "tier": club.tier,
            "tier_limits": club.tier_limits,
            "is_outpost": True,
            "is_private": is_private_page,
            "restricted_view": True,
            "restriction_reason": "outpost_members_only",
            "description": club.description,
            "logo_url": None,
            "theme_config": club.theme_config or {},
            "membership_status": membership_status,
            "is_owner_or_staff": is_owner_or_staff,
            "members_count": members_count,
            "address": None,
            "contact": None,
            "opening_hours": None,
            "pictures": [],
            "events": [],
            "tournaments": [],
        }), 200

    # Full Store / Member View
    now = datetime.utcnow()
    pics = club.pictures.order_by(ClubPicture.created_at.desc()).all()
    upcoming_events = (
        club.events.filter(Event.start_time >= now)
        .order_by(Event.start_time.asc())
        .all()
    )
    club_tournaments = (
        Tournament.query.filter_by(club_id=club.id)
        .order_by(Tournament.start_date.desc())
        .all()
    )

    base_data = serialize_club(club, include_internal=False)

    # Collect active reservations, games, and table blockers to compute live & future table status
    raw_reservations = (
        club.table_reservations.filter(
            ClubTableReservation.status.in_(["Approved", "Pending"]),
            ClubTableReservation.end_time >= now - timedelta(hours=12),
        )
        .order_by(ClubTableReservation.start_time.asc())
        .all()
    )
    raw_games = (
        Game.query.filter(
            Game.club_id == club.id,
            Game.is_virtual.is_(False),
            Game.table_id.isnot(None),
        )
        .all()
    )

    table_bookings = []
    for r in raw_reservations:
        table_bookings.append({
            "id": r.id,
            "table_id": r.table_id,
            "start_time": r.start_time.isoformat(),
            "end_time": r.end_time.isoformat(),
            "status": r.status,
            "system": r.system or "Tabletop",
        })
    for g in raw_games:
        end_dt = g.end_time or (g.start_time + timedelta(hours=3))
        if end_dt >= now - timedelta(hours=12):
            table_bookings.append({
                "id": g.id,
                "table_id": g.table_id,
                "start_time": g.start_time.isoformat(),
                "end_time": end_dt.isoformat(),
                "status": "Approved" if g.is_approved else "Pending",
                "system": g.system,
            })

    # Enrich each active table with live status & blocker schedules
    enriched_tables = []
    for t in club.tables.filter_by(is_active=True).all():
        occupied_until = None
        for b in table_bookings:
            if b["table_id"] == t.id and b["status"] == "Approved":
                st = datetime.fromisoformat(b["start_time"])
                et = datetime.fromisoformat(b["end_time"])
                if st <= now <= et:
                    occupied_until = b["end_time"]
                    break
        blockers = [
            {
                "id": s.id,
                "specific_date": s.specific_date.isoformat() if s.specific_date else None,
                "open_time": s.open_time.strftime("%H:%M") if s.open_time else None,
                "close_time": s.close_time.strftime("%H:%M") if s.close_time else None,
                "is_blocked": s.is_blocked,
                "note": s.note,
            }
            for s in t.schedules.filter_by(is_blocked=True).all()
        ]
        enriched_tables.append({
            "id": t.id,
            "name": t.name,
            "supports_tabletop": t.supports_tabletop,
            "supports_tcg": t.supports_tcg,
            "supports_rpg": t.supports_rpg,
            "dimensions": t.dimensions,
            "max_players": t.max_players,
            "is_active": t.is_active,
            "status": "occupied" if occupied_until else "free",
            "occupied_until": occupied_until,
            "blockers": blockers,
        })

    return jsonify({
        **base_data,
        "tables": enriched_tables,
        "table_bookings": table_bookings,
        "is_outpost": is_outpost,
        "is_private": is_private_page,
        "restricted_view": False,
        "restriction_reason": None,
        "logo_url": base_data.get("logo_url") if is_citadel_or_above else None,
        "custom_subdomain_url": f"https://{club.slug}.gametablesync.com"
        if club.tier_limits.get("custom_subdomain")
        else None,
        "membership_status": membership_status,
        "is_owner_or_staff": is_owner_or_staff,
        "members_count": members_count,
        "pictures": [
            {
                "id": p.id,
                "gallery_name": getattr(p, "gallery_name", None) or "IMPRESSIONEN // GALERIE",
                "title": p.title or club.name,
                "url": p.url,
            }
            for p in pics
        ],
        "events": [
            {
                "id": e.id,
                "title": e.title,
                "start_time": e.start_time.isoformat() if e.start_time else None,
                "description": e.description,
                "attendees_count": e.attendees.count(),
                "is_attending": bool(
                    viewer_id and e.attendees.filter_by(id=viewer_id).first()
                ),
            }
            for e in upcoming_events
        ],
        "tournaments": [serialize_tournament(t) for t in club_tournaments],
    }), 200


@clubs_bp.route("/api/clubs/<string:club_id>/manage", methods=["GET"])
@jwt_required()
def get_club_management_detail(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404
    is_staff = is_club_keymaster(user_id, club_id) or bool(
        ClubEmployee.query.filter_by(club_id=club_id, user_id=user_id).first()
    )
    if not is_staff:
        return jsonify({"msg": "Zugriff verweigert."}), 403
    return jsonify(serialize_club(club, include_internal=True)), 200


@clubs_bp.route("/api/clubs", methods=["POST"])
@jwt_required()
def create_club():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"msg": "Club-Name ist erforderlich."}), 400

    license_id = data.get("license_id")
    if license_id:
        lic = db.session.get(ClubLicense, license_id)
        if not lic or lic.owner_id != user_id or lic.status != "active":
            return jsonify({"msg": "Ungültige oder inaktive Lizenz."}), 400
        if lic.club:
            return jsonify({"msg": "Diese Lizenz ist bereits einem anderen Club zugewiesen."}), 400
    else:
        unassigned = [
            l for l in ClubLicense.query.filter_by(owner_id=user_id, status="active").all()
            if l.club is None
        ]
        if unassigned:
            lic = unassigned[0]
        elif _is_stripe_mock_mode():
            requested_tier = data.get("tier", "tier_1")
            tiers = get_all_tiers()
            lic = ClubLicense(
                owner_id=user_id,
                tier=requested_tier if requested_tier in tiers else "tier_1",
                status="active",
                is_mock=True,
                stripe_subscription_id=f"sub_mock_{uuid.uuid4().hex[:12]}",
                valid_until=datetime.utcnow() + timedelta(days=365),
            )
            db.session.add(lic)
            db.session.flush()
        else:
            return jsonify({"msg": "Du benötigst eine aktive Club-Lizenz, um einen Club zu gründen."}), 402

    base_slug = slugify(data.get("slug") or name)
    slug = base_slug
    counter = 1
    while Club.query.filter_by(slug=slug).first():
        counter += 1
        slug = f"{base_slug}-{counter}"

    club = Club(
        owner_id=user_id,
        license_id=lic.id,
        name=name,
        slug=slug,
        description=data.get("description"),
        address_street=data.get("address_street"),
        address_city=data.get("address_city"),
        address_postal_code=data.get("address_postal_code"),
        address_country=data.get("address_country", "DE"),
        contact_email=data.get("contact_email"),
        contact_phone=data.get("contact_phone"),
        website_url=data.get("website_url"),
        online_store_url=data.get("online_store_url"),
        social_links=data.get("social_links") or {},
        discord_guild_id=data.get("discord_guild_id"),
        discord_invite_url=data.get("discord_invite_url"),
        discord_config=data.get("discord_config") or {},
    )
    if data.get("theme_config") and isinstance(data["theme_config"], dict):
        club.theme_config = data["theme_config"]

    db.session.add(club)
    db.session.commit()

    return jsonify({"msg": "Club erfolgreich erstellt!", "club": serialize_club(club, include_internal=True)}), 201


@clubs_bp.route("/api/clubs/<string:club_id>", methods=["PUT"])
@jwt_required()
def update_club_settings(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404
    if not is_club_owner(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer kann die Club-Einstellungen bearbeiten."}), 403

    data = request.get_json() or {}

    for field in (
        "name",
        "description",
        "address_street",
        "address_city",
        "address_postal_code",
        "address_country",
        "contact_email",
        "contact_phone",
        "website_url",
        "online_store_url",
        "discord_guild_id",
        "discord_invite_url",
    ):
        if field in data:
            setattr(club, field, data[field])

    if "is_private" in data:
        club.is_private = bool(data["is_private"])

    if "logo_url" in data:
        can_edit_logo = bool(
            club.tier_limits.get("can_edit_logo_and_description", False)
            or club.tier in ("tier_3", "tier_4")
        )
        if not can_edit_logo:
            return jsonify({"msg": "Eigenes Store-Logo erfordert mindestens Citadel (Tier 3)."}), 403
        club.logo_url = data["logo_url"]

    if "social_links" in data and isinstance(data["social_links"], dict):
        club.social_links = data["social_links"]

    if "theme_config" in data and isinstance(data["theme_config"], dict):
        merged_theme = dict(club.theme_config or {})
        merged_theme.update(data["theme_config"])
        club.theme_config = merged_theme

    if "opening_hours" in data and isinstance(data["opening_hours"], dict):
        club.opening_hours = data["opening_hours"]

    if "discord_config" in data and isinstance(data["discord_config"], dict):
        bot_level = club.tier_limits.get("discord_bot_access_level", "basic")
        incoming_cfg = data["discord_config"]
        if bot_level == "basic" and ("forum_channel_id" in incoming_cfg or "custom_bot_name" in incoming_cfg):
            return jsonify({
                "msg": "Automatische Forum-Threads und Custom-Bot-Features erfordern mindestens Tier 2 / Tier 3."
            }), 403
        merged_discord = dict(club.discord_config or {})
        merged_discord.update(incoming_cfg)
        club.discord_config = merged_discord

    db.session.commit()
    return jsonify({"msg": "Club-Einstellungen aktualisiert!", "club": serialize_club(club, include_internal=True)}), 200


# ==========================================
# 3. EMPLOYEES, KEYMASTERS & SHIFT SCHEDULING
# ==========================================

@clubs_bp.route("/api/clubs/<string:club_id>/employees", methods=["POST"])
@jwt_required()
def add_club_employee(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404
    if not is_club_owner(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer kann Mitarbeiter hinzufügen."}), 403

    data = request.get_json() or {}
    identifier = (data.get("user_identifier") or "").strip()
    target_user_id = data.get("user_id")

    if target_user_id:
        target_user = db.session.get(User, str(target_user_id))
    else:
        target_user = User.query.filter(
            (User.email.ilike(identifier)) | (User.display_name.ilike(identifier))
        ).first()

    if not target_user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    if target_user.id == club.owner_id:
        return jsonify({"msg": "Du bist bereits der Besitzer dieses Clubs."}), 400

    existing = ClubEmployee.query.filter_by(club_id=club.id, user_id=target_user.id).first()
    if existing:
        return jsonify({"msg": "Dieser Benutzer ist bereits als Mitarbeiter eingetragen."}), 409

    emp = ClubEmployee(
        club_id=club.id,
        user_id=target_user.id,
        role_title=(data.get("role_title") or "Staff").strip(),
        weekly_hours=float(data.get("weekly_hours", 20.0)),
        is_keymaster=bool(data.get("is_keymaster", False)),
        can_manage_tournaments=bool(data.get("can_manage_tournaments", False)),
        can_manage_events=bool(data.get("can_manage_events", False)),
    )
    db.session.add(emp)
    db.session.commit()

    return jsonify({
        "msg": f"{target_user.display_name} wurde als Mitarbeiter hinzugefügt!",
        "employee_id": emp.id,
    }), 201


@clubs_bp.route("/api/clubs/<string:club_id>/employees/<string:employee_id>", methods=["PUT", "DELETE"])
@jwt_required()
def manage_club_employee(club_id, employee_id):
    user_id = get_jwt_identity()
    if not is_club_owner(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer kann Mitarbeiter verwalten."}), 403

    emp = db.session.get(ClubEmployee, employee_id)
    if not emp or emp.club_id != club_id:
        return jsonify({"msg": "Mitarbeiter nicht gefunden."}), 404

    if request.method == "DELETE":
        db.session.delete(emp)
        db.session.commit()
        return jsonify({"msg": "Mitarbeiter entfernt."}), 200

    data = request.get_json() or {}
    if "role_title" in data:
        emp.role_title = (data["role_title"] or "Staff").strip()
    if "weekly_hours" in data:
        emp.weekly_hours = max(0.0, float(data["weekly_hours"]))
    if "is_keymaster" in data:
        emp.is_keymaster = bool(data["is_keymaster"])
    if "can_manage_tournaments" in data:
        emp.can_manage_tournaments = bool(data["can_manage_tournaments"])
    if "can_manage_events" in data:
        emp.can_manage_events = bool(data["can_manage_events"])

    db.session.commit()
    return jsonify({"msg": "Mitarbeiter-Berechtigungen aktualisiert!"}), 200


@clubs_bp.route("/api/clubs/<string:club_id>/shifts", methods=["GET", "POST"])
@jwt_required()
def manage_employee_shifts(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    if not club.tier_limits.get("can_schedule_employees", False):
        return jsonify({
            "msg": f"Mitarbeiter-Schichtplanung ist in '{club.tier_limits.get('name', 'Tier 1')}' nicht enthalten."
        }), 403

    if request.method == "GET":
        if not is_club_keymaster(user_id, club_id) and not ClubEmployee.query.filter_by(club_id=club_id, user_id=user_id).first():
            return jsonify({"msg": "Zugriff verweigert."}), 403

        shifts = club.employee_shifts.order_by(ClubEmployeeShift.start_time.asc()).all()
        return jsonify([
            {
                "id": s.id,
                "employee_id": s.employee_id,
                "user_id": s.employee.user_id if s.employee else None,
                "display_name": s.employee.user.display_name if (s.employee and s.employee.user) else "Unbekannt",
                "is_keymaster": s.employee.is_keymaster if s.employee else False,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "note": s.note,
            }
            for s in shifts
        ]), 200

    if not is_club_owner(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer kann Mitarbeiter-Schichten einteilen."}), 403

    data = request.get_json() or {}
    employee_id = data.get("employee_id")
    emp = db.session.get(ClubEmployee, str(employee_id)) if employee_id else None
    if not emp or emp.club_id != club_id:
        return jsonify({"msg": "Ungültiger Mitarbeiter ausgewählt."}), 400

    try:
        start_time = datetime.fromisoformat(data["start_time"])
        end_time = datetime.fromisoformat(data["end_time"])
    except (KeyError, ValueError):
        return jsonify({"msg": "Ungültiges Start- oder Enddatum."}), 400

    shift = ClubEmployeeShift(
        club_id=club.id,
        employee_id=emp.id,
        start_time=start_time,
        end_time=end_time,
        note=data.get("note"),
    )
    db.session.add(shift)
    db.session.commit()

    return jsonify({"msg": "Mitarbeiter-Schicht erfolgreich eingetragen!", "id": shift.id}), 201


@clubs_bp.route("/api/clubs/<string:club_id>/shifts/<string:shift_id>", methods=["DELETE"])
@jwt_required()
def delete_employee_shift(club_id, shift_id):
    user_id = get_jwt_identity()
    if not is_club_owner(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer kann Schichten löschen."}), 403

    shift = db.session.get(ClubEmployeeShift, shift_id)
    if not shift or shift.club_id != club_id:
        return jsonify({"msg": "Schicht nicht gefunden."}), 404

    db.session.delete(shift)
    db.session.commit()
    return jsonify({"msg": "Schicht entfernt."}), 200


# ==========================================
# 4. TABLES & KEYMASTER GAME APPROVAL
# ==========================================

@clubs_bp.route("/api/clubs/<string:club_id>/tables", methods=["POST"])
@jwt_required()
def create_club_table(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404
    if not is_club_owner(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer kann neue Tische anlegen."}), 403

    max_tables = club.tier_limits.get("max_tables", 4)
    current_tables = club.tables.count()
    if current_tables >= max_tables:
        return jsonify({
            "msg": f"Dein aktuelles Tier ({club.tier_limits.get('name', 'Tier 1')}) erlaubt maximal {max_tables} Tische."
        }), 403

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"msg": "Tischname ist erforderlich."}), 400

    new_table = ClubTable(
        club_id=club.id,
        name=name,
        supports_tabletop=bool(data.get("supports_tabletop", True)),
        supports_tcg=bool(data.get("supports_tcg", False)),
        supports_rpg=bool(data.get("supports_rpg", False)),
        dimensions=data.get("dimensions"),
        max_players=int(data.get("max_players", 4)),
        is_active=bool(data.get("is_active", True)),
    )
    db.session.add(new_table)
    db.session.commit()

    return jsonify({"msg": "Tisch erfolgreich angelegt!", "id": new_table.id}), 201


@clubs_bp.route("/api/clubs/<string:club_id>/tables/<string:table_id>", methods=["PUT", "DELETE"])
@jwt_required()
def manage_club_table(club_id, table_id):
    user_id = get_jwt_identity()
    if not is_club_owner(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer kann Tische bearbeiten oder löschen."}), 403

    table = db.session.get(ClubTable, table_id)
    if not table or table.club_id != club_id:
        return jsonify({"msg": "Tisch nicht gefunden."}), 404

    if request.method == "DELETE":
        db.session.delete(table)
        db.session.commit()
        return jsonify({"msg": "Tisch entfernt."}), 200

    data = request.get_json() or {}
    if "name" in data and (data["name"] or "").strip():
        table.name = data["name"].strip()
    if "supports_tabletop" in data:
        table.supports_tabletop = bool(data["supports_tabletop"])
    if "supports_tcg" in data:
        table.supports_tcg = bool(data["supports_tcg"])
    if "supports_rpg" in data:
        table.supports_rpg = bool(data["supports_rpg"])
    if "dimensions" in data:
        table.dimensions = data["dimensions"]
    if "max_players" in data:
        table.max_players = int(data["max_players"])
    if "is_active" in data:
        table.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify({"msg": "Tisch aktualisiert!"}), 200


@clubs_bp.route("/api/clubs/tables/<string:table_id>/schedules/<string:schedule_id>", methods=["DELETE"])
@jwt_required()
def delete_table_schedule(table_id, schedule_id):
    user_id = get_jwt_identity()
    table = db.session.get(ClubTable, table_id)
    if not table:
        return jsonify({"msg": "Tisch nicht gefunden."}), 404
    if not is_club_keymaster(user_id, table.club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    sched = db.session.get(ClubTableSchedule, schedule_id)
    if not sched or sched.table_id != table.id:
        return jsonify({"msg": "Zeitplan-Eintrag nicht gefunden."}), 404

    db.session.delete(sched)
    db.session.commit()
    return jsonify({"msg": "Zeitplan-Eintrag gelöscht."}), 200


@clubs_bp.route("/api/clubs/tables/<string:table_id>/schedules", methods=["POST"])
@jwt_required()
def add_table_schedule(table_id):
    user_id = get_jwt_identity()
    table = db.session.get(ClubTable, table_id)
    if not table:
        return jsonify({"msg": "Tisch nicht gefunden."}), 404
    if not is_club_keymaster(user_id, table.club_id):
        return jsonify({"msg": "Nur der Club-Besitzer oder ein Keymaster kann Tischzeiten planen."}), 403

    data = request.get_json() or {}
    day_of_week = data.get("day_of_week")
    specific_date_str = data.get("specific_date")
    open_time_str = data.get("open_time")
    close_time_str = data.get("close_time")
    is_blocked = bool(data.get("is_blocked", False))
    note = data.get("note")

    specific_date = datetime.fromisoformat(specific_date_str).date() if specific_date_str else None
    open_t = time.fromisoformat(open_time_str) if open_time_str else None
    close_t = time.fromisoformat(close_time_str) if close_time_str else None

    sched = ClubTableSchedule(
        table_id=table.id,
        day_of_week=int(day_of_week) if day_of_week is not None else None,
        specific_date=specific_date,
        open_time=open_t,
        close_time=close_t,
        is_blocked=is_blocked,
        note=note,
    )
    db.session.add(sched)
    db.session.commit()

    return jsonify({"msg": "Tisch-Zeitplan gespeichert!", "id": sched.id}), 201


@clubs_bp.route("/api/clubs/<string:club_id>/tables/availability", methods=["GET"])
def check_club_table_availability(club_id):
    start_str = request.args.get("start_time")
    duration_minutes = int(request.args.get("duration_minutes", 180))
    category = request.args.get("category")
    system = request.args.get("system")

    if not start_str:
        return jsonify({"msg": "start_time Parameter fehlt."}), 400

    try:
        start_time = datetime.fromisoformat(start_str)
        end_time = start_time + timedelta(minutes=duration_minutes)
    except ValueError:
        return jsonify({"msg": "Ungültiges Datumsformat."}), 400

    resolved_category = category or infer_table_category(system or "tabletop")
    free_tables = find_available_club_tables(club_id, resolved_category, start_time, end_time)

    return jsonify({
        "club_id": club_id,
        "category": resolved_category,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "available_count": len(free_tables),
        "available_tables": [
            {
                "id": t.id,
                "name": t.name,
                "dimensions": t.dimensions,
                "supports_tabletop": t.supports_tabletop,
                "supports_tcg": t.supports_tcg,
                "supports_rpg": t.supports_rpg,
            }
            for t in free_tables
        ],
    }), 200


@clubs_bp.route("/api/clubs/<string:club_id>/games/<string:game_id>/approve", methods=["PUT"])
@jwt_required()
def keymaster_toggle_game_approval(club_id, game_id):
    user_id = get_jwt_identity()
    if not is_club_keymaster(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer oder ein Keymaster kann Spiele im Store freigeben."}), 403

    game = db.session.get(Game, game_id)
    if not game or game.club_id != club_id:
        return jsonify({"msg": "Spiel in diesem Club nicht gefunden."}), 404

    game.is_approved = not game.is_approved
    db.session.commit()

    update_game_webhook(game)

    status_text = "genehmigt" if game.is_approved else "auf 'wartend' gesetzt"
    return jsonify({
        "msg": f"Spiel durch Keymaster {status_text}!",
        "is_approved": game.is_approved,
    }), 200


@clubs_bp.route("/api/clubs/<string:club_id>/reservations", methods=["GET", "POST"])
@jwt_required()
def manage_table_reservations(club_id):
    """
    Lists or creates table reservations for the club (used by LFG & Store Calendar).
    Also returns table-bound Games in the club so Keymasters have a unified reservation view.
    """
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    if request.method == "GET":
        reservations = club.table_reservations.order_by(ClubTableReservation.start_time.asc()).all()
        res_list = [
            {
                "id": r.id,
                "source": "reservation",
                "club_id": r.club_id,
                "table_id": r.table_id,
                "table_name": r.table.name if r.table else "Tisch",
                "user_id": r.user_id,
                "user_name": r.user.display_name if r.user else "Unbekannt",
                "system": r.system or "Tabletop",
                "start_time": r.start_time.isoformat(),
                "end_time": r.end_time.isoformat(),
                "status": r.status,
                "is_approved": r.status == "Approved",
                "note": r.note,
            }
            for r in reservations
        ]

        # Also include store games that need or have table reservations
        club_games = Game.query.filter_by(club_id=club_id, is_virtual=False).order_by(Game.start_time.asc()).all()
        for g in club_games:
            tbl = db.session.get(ClubTable, g.table_id) if g.table_id else None
            creator = db.session.get(User, g.created_by_id) if g.created_by_id else None
            res_list.append({
                "id": g.id,
                "source": "game",
                "club_id": g.club_id,
                "table_id": g.table_id,
                "table_name": tbl.name if tbl else f"Auto ({g.required_table_type.upper()})",
                "user_id": g.created_by_id,
                "user_name": creator.display_name if creator else "LFG Match",
                "system": f"{g.system} ({g.points} Pkt.)",
                "start_time": g.start_time.isoformat(),
                "end_time": g.end_time.isoformat() if g.end_time else g.start_time.isoformat(),
                "status": "Approved" if g.is_approved else "Pending",
                "is_approved": bool(g.is_approved),
                "note": g.description,
            })

        res_list.sort(key=lambda x: x["start_time"])
        return jsonify(res_list), 200

    if is_banned_from_club(user_id, club_id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club."}), 403

    data = request.get_json() or {}
    table_id = data.get("table_id")
    table = db.session.get(ClubTable, str(table_id)) if table_id else None
    if not table or table.club_id != club_id:
        return jsonify({"msg": "Bitte einen gültigen Tisch auswählen."}), 400

    try:
        start_time = datetime.fromisoformat(data["start_time"])
        end_time = datetime.fromisoformat(data["end_time"])
    except (KeyError, ValueError):
        return jsonify({"msg": "Ungültiger Zeitraum."}), 400

    if end_time <= start_time:
        return jsonify({"msg": "Endzeit muss nach der Startzeit liegen."}), 400

    auto_approve = is_club_keymaster(user_id, club_id)
    new_res = ClubTableReservation(
        club_id=club_id,
        table_id=table.id,
        user_id=user_id,
        system=(data.get("system") or "Tabletop").strip(),
        start_time=start_time,
        end_time=end_time,
        status="Approved" if auto_approve else "Pending",
        note=(data.get("note") or "").strip() or None,
    )
    db.session.add(new_res)
    db.session.commit()

    return jsonify({
        "msg": "Tisch-Reservierung eingetragen!",
        "id": new_res.id,
        "status": new_res.status,
    }), 201


@clubs_bp.route("/api/clubs/<string:club_id>/reservations/<string:res_id>/status", methods=["PUT"])
@jwt_required()
def update_table_reservation_status(club_id, res_id):
    user_id = get_jwt_identity()
    if not is_club_keymaster(user_id, club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    data = request.get_json() or {}
    new_status = data.get("status", "Approved")
    source = data.get("source", "reservation")

    if source == "game":
        game = db.session.get(Game, res_id)
        if not game or game.club_id != club_id:
            return jsonify({"msg": "Spiel nicht gefunden."}), 404
        game.is_approved = (new_status == "Approved")
        db.session.commit()
        update_game_webhook(game)
        return jsonify({"msg": "Spiel-Tischreservierung aktualisiert!", "status": new_status}), 200

    res_obj = db.session.get(ClubTableReservation, res_id)
    if not res_obj or res_obj.club_id != club_id:
        return jsonify({"msg": "Reservierung nicht gefunden."}), 404

    if new_status == "Deleted":
        db.session.delete(res_obj)
        db.session.commit()
        return jsonify({"msg": "Reservierung gelöscht."}), 200

    res_obj.status = new_status
    db.session.commit()
    return jsonify({"msg": f"Reservierung auf '{new_status}' gesetzt!", "status": res_obj.status}), 200


# ==========================================
# 5. STORE BANS (CLUB OWNER & KEYMASTER)
# ==========================================

@clubs_bp.route("/api/clubs/<string:club_id>/bans", methods=["GET"])
@jwt_required()
def get_club_bans(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404
    if not is_club_keymaster(user_id, club_id):
        return jsonify({"msg": "Zugriff verweigert."}), 403

    bans = ClubBan.query.filter_by(club_id=club_id).order_by(ClubBan.created_at.desc()).all()
    return jsonify([
        {
            "id": b.id,
            "user_id": b.user_id,
            "display_name": b.user.display_name if b.user else "Unbekannt",
            "banned_by_name": b.banned_by.display_name if b.banned_by else None,
            "reason": b.reason,
            "expires_at": b.expires_at.isoformat() if b.expires_at else None,
            "created_at": b.created_at.isoformat(),
        }
        for b in bans
        if b.is_currently_active
    ]), 200


@clubs_bp.route("/api/clubs/<string:club_id>/bans", methods=["POST"])
@jwt_required()
def ban_user_from_club(club_id):
    actor_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404
    if not is_club_keymaster(actor_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer oder ein Keymaster kann Hausverbote erteilen."}), 403

    data = request.get_json() or {}
    target_user_id = data.get("user_id")
    identifier = (data.get("user_identifier") or "").strip()

    if target_user_id:
        target_user = db.session.get(User, str(target_user_id))
    else:
        target_user = User.query.filter(
            (User.email.ilike(identifier)) | (User.display_name.ilike(identifier))
        ).first()

    if not target_user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    if target_user.is_app_admin or target_user.id == club.owner_id:
        return jsonify({"msg": "Der Club-Besitzer oder ein AppAdmin kann nicht gebannt werden."}), 400

    emp = ClubEmployee.query.filter_by(club_id=club.id, user_id=target_user.id).first()
    if emp:
        if not is_club_owner(actor_id, club_id):
            return jsonify({"msg": "Nur der Club-Besitzer kann Mitarbeiter bannen."}), 403
        db.session.delete(emp)

    expires_at_str = data.get("expires_at")
    expires_at = datetime.fromisoformat(expires_at_str) if expires_at_str else None

    existing_ban = ClubBan.query.filter_by(club_id=club.id, user_id=target_user.id).first()
    if existing_ban:
        existing_ban.reason = data.get("reason")
        existing_ban.expires_at = expires_at
        existing_ban.banned_by_id = actor_id
    else:
        new_ban = ClubBan(
            club_id=club.id,
            user_id=target_user.id,
            banned_by_id=actor_id,
            reason=data.get("reason"),
            expires_at=expires_at,
        )
        db.session.add(new_ban)

    now = datetime.utcnow()
    club_games = Game.query.filter(Game.club_id == club.id, Game.start_time >= now).all()
    for g in club_games:
        if g.created_by_id == target_user.id:
            db.session.delete(g)
        else:
            part = GamePlayer.query.filter_by(game_id=g.id, user_id=target_user.id).first()
            if part:
                db.session.delete(part)
                if g.status == "Matched":
                    g.status = "Open"
                    g.table_id = None

    reg_tournaments = Tournament.query.filter_by(club_id=club.id, status="Registration").all()
    for t in reg_tournaments:
        tp = TournamentParticipant.query.filter_by(tournament_id=t.id, user_id=target_user.id).first()
        if tp:
            db.session.delete(tp)

    db.session.commit()
    return jsonify({"msg": f"Hausverbot (Store-Ban) für '{target_user.display_name}' im Club '{club.name}' aktiviert."}), 201


@clubs_bp.route("/api/clubs/<string:club_id>/bans/<string:banned_user_id>", methods=["DELETE"])
@jwt_required()
def unban_user_from_club(club_id, banned_user_id):
    actor_id = get_jwt_identity()
    if not is_club_keymaster(actor_id, club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    ban = ClubBan.query.filter_by(club_id=club_id, user_id=banned_user_id).first()
    if not ban:
        return jsonify({"msg": "Kein aktiver Ban für diesen Benutzer gefunden."}), 404

    db.session.delete(ban)
    db.session.commit()
    return jsonify({"msg": "Hausverbot aufgehoben."}), 200


# ==========================================
# 6. CLUB EVENTS & SHOWCASE PICTURES
# ==========================================

@clubs_bp.route("/api/clubs/<string:club_id>/events", methods=["GET", "POST"])
@jwt_required()
def manage_club_events(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    if request.method == "GET":
        events = club.events.order_by(Event.start_time.asc()).all()
        return jsonify([
            {
                "id": e.id,
                "title": e.title,
                "club_id": e.club_id,
                "start_time": e.start_time.isoformat() if e.start_time else None,
                "description": e.description,
                "attendees_count": e.attendees.count(),
                "attendees": [
                    {"id": a.id, "display_name": a.display_name}
                    for a in e.attendees.all()
                ],
            }
            for e in events
        ]), 200

    if not can_manage_club_events(user_id, club_id):
        return jsonify({"msg": "Keine Berechtigung zum Erstellen von Events."}), 403

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    start_time_str = data.get("start_time")
    description = (data.get("description") or "").strip()

    if not title or not start_time_str:
        return jsonify({"msg": "Titel und Startzeit sind erforderlich."}), 400

    try:
        start_time = datetime.fromisoformat(start_time_str)
    except ValueError:
        return jsonify({"msg": "Ungültiges Datumsformat."}), 400

    new_event = Event(
        club_id=club.id,
        title=title,
        start_time=start_time,
        description=description,
    )
    db.session.add(new_event)
    db.session.commit()
    return jsonify({"msg": "Club-Event erfolgreich erstellt!", "id": new_event.id}), 201


@clubs_bp.route("/api/clubs/<string:club_id>/events/<string:event_id>", methods=["DELETE"])
@jwt_required()
def delete_club_event(club_id, event_id):
    user_id = get_jwt_identity()
    if not can_manage_club_events(user_id, club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    ev = db.session.get(Event, event_id)
    if not ev or ev.club_id != club_id:
        return jsonify({"msg": "Event nicht gefunden."}), 404

    db.session.delete(ev)
    db.session.commit()
    return jsonify({"msg": "Event gelöscht."}), 200


@clubs_bp.route("/api/clubs/<string:club_id>/pictures", methods=["GET", "POST"])
@jwt_required()
def manage_club_pictures(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    if request.method == "GET":
        pics = club.pictures.order_by(ClubPicture.created_at.desc()).all()
        return jsonify([
            {
                "id": p.id,
                "club_id": p.club_id,
                "gallery_name": getattr(p, "gallery_name", None) or "IMPRESSIONEN // GALERIE",
                "title": p.title or "",
                "s3_key": p.s3_key,
                "url": p.url,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in pics
        ]), 200

    if not is_club_keymaster(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer oder ein Keymaster kann Club-Bilder hochladen."}), 403

    if "file" not in request.files:
        return jsonify({"msg": "Keine Bilddatei übermittelt."}), 400

    file = request.files["file"]
    content_type = (file.mimetype or "").lower()
    if content_type not in ALLOWED_IMAGE_MIMES:
        return jsonify({"msg": "Nur PNG, JPG, WEBP oder GIF erlaubt."}), 400

    raw_bytes = file.read()
    if len(raw_bytes) > 8 * 1024 * 1024:
        return jsonify({"msg": "Bild darf maximal 8 MB groß sein."}), 400

    title = (request.form.get("title") or "").strip()[:120]
    gallery_name = (request.form.get("gallery_name") or "").strip()[:120] or "IMPRESSIONEN // GALERIE"

    # Enforce max_galleries per tier (1 for Outpost/Stronghold, multiple for Citadel+)
    max_galleries = int(club.tier_limits.get("max_galleries", 10 if club.tier in ("tier_3", "tier_4") else 1))
    existing_galleries = {
        (getattr(p, "gallery_name", None) or "IMPRESSIONEN // GALERIE")
        for p in club.pictures.all()
    }
    if gallery_name not in existing_galleries and len(existing_galleries) >= max_galleries:
        return jsonify({
            "msg": f"Dein aktuelles Tier ({club.tier_limits.get('name', club.tier)}) erlaubt maximal {max_galleries} Galerie(n). Mehrere Galerien sind ab Citadel (Tier 3) verfügbar."
        }), 403

    ext = ALLOWED_IMAGE_MIMES[content_type]
    token_hex = secrets.token_hex(6)
    object_key = f"clubs/{club.id}/gallery/{token_hex}.{ext}"

    s3_url = upload_bytes_to_s3(raw_bytes, object_key, content_type=content_type)
    if not s3_url:
        return jsonify({"msg": "S3-Upload fehlgeschlagen."}), 500

    pic = ClubPicture(
        club_id=club.id,
        uploaded_by_id=user_id,
        gallery_name=gallery_name,
        title=title or None,
        s3_key=object_key,
        url=s3_url,
    )
    db.session.add(pic)
    db.session.commit()

    return jsonify({
        "msg": "Club-Bild erfolgreich hochgeladen!",
        "picture": {
            "id": pic.id,
            "club_id": pic.club_id,
            "gallery_name": pic.gallery_name,
            "title": pic.title or "",
            "s3_key": pic.s3_key,
            "url": pic.url,
            "created_at": pic.created_at.isoformat() if pic.created_at else None,
        },
    }), 201


@clubs_bp.route("/api/clubs/<string:club_id>/pictures/<string:picture_id>", methods=["DELETE"])
@jwt_required()
def delete_club_picture(club_id, picture_id):
    user_id = get_jwt_identity()
    if not is_club_keymaster(user_id, club_id):
        return jsonify({"msg": "Keine Berechtigung."}), 403

    pic = db.session.get(ClubPicture, picture_id)
    if not pic or pic.club_id != club_id:
        return jsonify({"msg": "Bild nicht gefunden."}), 404

    db.session.delete(pic)
    db.session.commit()
    return jsonify({"msg": "Bild entfernt."}), 200


# ==========================================
# 7. CLUB LOGO UPLOAD & PLAYER MEMBERSHIP / JOIN REQUESTS
# ==========================================

@clubs_bp.route("/api/clubs/<string:club_id>/logo", methods=["POST"])
@jwt_required()
def upload_club_logo(club_id):
    """Uploads a custom Store/Club Logo to SeaweedFS S3 (strictly reserved for Citadel / Tier 3+)."""
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404
    if not is_club_owner(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer kann das Store-Logo hochladen."}), 403

    can_edit_logo = bool(
        club.tier_limits.get("can_edit_logo_and_description", False)
        or club.tier in ("tier_3", "tier_4")
    )
    if not can_edit_logo:
        return jsonify({
            "msg": "Ein eigenes Store-Logo ist erst ab Citadel (Tier 3) verfügbar."
        }), 403

    if "file" not in request.files:
        return jsonify({"msg": "Keine Bilddatei übermittelt."}), 400

    file = request.files["file"]
    content_type = (file.mimetype or "").lower()
    if content_type not in ALLOWED_IMAGE_MIMES:
        return jsonify({"msg": "Nur PNG, JPG, WEBP oder GIF erlaubt."}), 400

    raw_bytes = file.read()
    if len(raw_bytes) > 5 * 1024 * 1024:
        return jsonify({"msg": "Logo darf maximal 5 MB groß sein."}), 400

    ext = ALLOWED_IMAGE_MIMES[content_type]
    token_hex = secrets.token_hex(6)
    object_key = f"clubs/{club.id}/logo/{token_hex}.{ext}"

    s3_url = upload_bytes_to_s3(raw_bytes, object_key, content_type=content_type)
    if not s3_url:
        return jsonify({"msg": "S3-Upload fehlgeschlagen."}), 500

    club.logo_url = s3_url
    merged_theme = dict(club.theme_config or {})
    merged_theme["logo_url"] = s3_url
    club.theme_config = merged_theme
    db.session.commit()

    return jsonify({
        "msg": "Store-Logo erfolgreich hochgeladen!",
        "logo_url": s3_url,
    }), 200


@clubs_bp.route("/api/clubs/<string:slug_or_id>/join", methods=["POST", "DELETE"])
@jwt_required()
def player_join_or_leave_club(slug_or_id):
    """
    Allows a player to associate with a Store or request to join a Club:
    - Outpost (tier_1) or Private pages: sets status='Pending' (requires Owner/Keymaster approval).
    - Public Commercial Stores (Stronghold / Citadel) when not private: sets status='Approved' (or 'Pending' if store is private).
    """
    user_id = get_jwt_identity()
    club = Club.query.filter_by(slug=slug_or_id).first()
    if not club:
        try:
            uuid.UUID(str(slug_or_id))
            club = db.session.get(Club, slug_or_id)
        except ValueError:
            club = None

    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    if is_banned_from_club(user_id, club.id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club."}), 403

    existing = ClubMember.query.filter_by(club_id=club.id, user_id=user_id).first()

    if request.method == "DELETE":
        if not existing:
            return jsonify({"msg": "Du bist nicht mit diesem Club verknüpft."}), 404
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"msg": "Mitgliedschaft / Zuordnung beendet.", "membership_status": None}), 200

    if existing:
        return jsonify({
            "msg": "Anfrage oder Mitgliedschaft besteht bereits.",
            "membership_status": existing.status,
        }), 200

    # Outpost (tier_1) or Private clubs ALWAYS require Keymaster/Admin approval
    requires_approval = (club.tier == "tier_1") or bool(getattr(club, "is_private", False))
    initial_status = "Pending" if requires_approval else "Approved"

    mem = ClubMember(
        club_id=club.id,
        user_id=user_id,
        status=initial_status,
    )
    db.session.add(mem)
    db.session.commit()

    msg = (
        "Beitrittsanfrage gesendet! Ein Admin oder Keymaster muss deine Anfrage bestätigen."
        if initial_status == "Pending"
        else f"Du bist jetzt mit '{club.name}' verknüpft!"
    )
    return jsonify({"msg": msg, "membership_status": initial_status}), 201


@clubs_bp.route("/api/clubs/<string:club_id>/members", methods=["GET"])
@jwt_required()
def get_club_members_and_requests(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    if not is_club_keymaster(user_id, club_id) and not ClubEmployee.query.filter_by(
        club_id=club_id, user_id=user_id
    ).first():
        return jsonify({"msg": "Zugriff verweigert."}), 403

    members = club.members.order_by(ClubMember.created_at.desc()).all()
    return jsonify([
        {
            "id": m.id,
            "user_id": m.user_id,
            "display_name": m.user.display_name if m.user else "Unbekannt",
            "email": m.user.email if m.user else None,
            "discord_account": m.user.discord_account if m.user else None,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in members
    ]), 200


@clubs_bp.route("/api/clubs/<string:club_id>/members/<string:member_id>", methods=["PUT", "DELETE"])
@jwt_required()
def manage_club_member_request(club_id, member_id):
    user_id = get_jwt_identity()
    if not is_club_keymaster(user_id, club_id):
        return jsonify({"msg": "Nur der Club-Besitzer oder ein Keymaster kann Beitrittsanfragen bestätigen."}), 403

    mem = db.session.get(ClubMember, member_id)
    if not mem or mem.club_id != club_id:
        return jsonify({"msg": "Mitglieds-Eintrag nicht gefunden."}), 404

    if request.method == "DELETE":
        db.session.delete(mem)
        db.session.commit()
        return jsonify({"msg": "Mitglied / Anfrage entfernt."}), 200

    data = request.get_json() or {}
    new_status = data.get("status", "Approved")
    mem.status = new_status
    db.session.commit()
    return jsonify({"msg": "Mitgliedsstatus aktualisiert!", "status": mem.status}), 200

