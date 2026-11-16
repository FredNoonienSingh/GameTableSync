import os
import re
import uuid
import stripe
from datetime import datetime, time, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import (
    User,
    Club,
    ClubLicense,
    ClubEmployee,
    ClubEmployeeShift,
    ClubTable,
    ClubTableSchedule,
    ClubBan,
    Game,
    GamePlayer,
    Tournament,
    TournamentParticipant,
    Event,
    get_all_tiers,
    infer_table_category,
)
from services.discord import update_game_webhook
from .utils import (
    log,
    is_club_owner,
    is_club_keymaster,
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

@clubs_bp.route("/api/billing/tiers", methods=["GET"])
def get_available_tiers():
    return jsonify(get_all_tiers()), 200


@clubs_bp.route("/api/billing/licenses", methods=["GET"])
@jwt_required()
def get_my_licenses():
    user_id = get_jwt_identity()
    licenses = ClubLicense.query.filter_by(owner_id=user_id).order_by(ClubLicense.created_at.desc()).all()
    tiers = get_all_tiers()
    return jsonify([
        {
            "id": lic.id,
            "tier": lic.tier,
            "tier_details": tiers.get(lic.tier),
            "status": lic.status,
            "is_mock": lic.is_mock,
            "stripe_subscription_id": lic.stripe_subscription_id,
            "club_id": lic.club.id if lic.club else None,
            "club_name": lic.club.name if lic.club else None,
            "valid_until": lic.valid_until.isoformat() if lic.valid_until else None,
        }
        for lic in licenses
    ]), 200


@clubs_bp.route("/api/billing/checkout", methods=["POST"])
@jwt_required()
def create_checkout_session():
    """
    Initiates a Stripe Subscription Checkout Session for 'tier_1', 'tier_2', or 'tier_3'.
    - If STRIPE_MOCK_MODE=true, immediately provisions/upgrades the ClubLicense in Postgres
      and returns a direct frontend success URL so the frontend code stays identical.
    - If STRIPE_MOCK_MODE=false, creates a real Stripe Checkout Session and returns session.url.
    """
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Benutzer nicht gefunden."}), 404

    data = request.get_json() or {}
    tier = data.get("tier", "tier_1")
    club_id = data.get("club_id")
    tiers = get_all_tiers()

    if tier not in tiers:
        return jsonify({"msg": "Ungültiges Lizenz-Tier ausgewählt."}), 400

    if club_id:
        club = db.session.get(Club, str(club_id))
        if not club or club.owner_id != user_id:
            return jsonify({"msg": "Club nicht gefunden oder keine Berechtigung."}), 403

    frontend_url = (os.environ.get("FRONTEND_URL") or "https://app.gametablesync.com").rstrip("/")
    success_url = data.get("success_url") or f"{frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = data.get("cancel_url") or f"{frontend_url}/billing/cancel"

    # --- A) MOCK MODE ---
    if _is_stripe_mock_mode():
        if club_id:
            club = db.session.get(Club, str(club_id))
            if club.license:
                club.license.tier = tier
                club.license.status = "active"
                club.license.valid_until = datetime.utcnow() + timedelta(days=365)
                db.session.commit()
                return jsonify({
                    "msg": f"[MOCK STRIPE] Club '{club.name}' erfolgreich auf {tiers[tier]['name']} aktualisiert!",
                    "license_id": club.license.id,
                    "tier": tier,
                    "mock": True,
                    "checkout_url": f"{frontend_url}/billing/success?mock=true&tier={tier}&club_id={club.id}",
                }), 200

        new_license = ClubLicense(
            owner_id=user.id,
            tier=tier,
            status="active",
            is_mock=True,
            stripe_subscription_id=f"sub_mock_{uuid.uuid4().hex[:12]}",
            valid_until=datetime.utcnow() + timedelta(days=365),
        )
        db.session.add(new_license)
        db.session.flush()

        if club_id:
            club = db.session.get(Club, str(club_id))
            club.license_id = new_license.id

        db.session.commit()
        return jsonify({
            "msg": f"[MOCK STRIPE] Lizenz für {tiers[tier]['name']} erfolgreich aktiviert!",
            "license_id": new_license.id,
            "tier": tier,
            "mock": True,
            "checkout_url": f"{frontend_url}/billing/success?mock=true&tier={tier}&license_id={new_license.id}",
        }), 201

    # --- B) LIVE STRIPE CHECKOUT SESSION ---
    _init_stripe()
    price_id = tiers[tier].get("stripe_price_id")
    if not price_id or price_id.startswith("price_replace_me"):
        return jsonify({"msg": f"Stripe Price-ID für '{tier}' ist in tiers.json noch nicht hinterlegt."}), 500

    try:
        # Ensure the user has a Stripe Customer record
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.display_name,
                metadata={"gts_user_id": str(user.id)},
            )
            user.stripe_customer_id = customer.id
            db.session.commit()

        metadata = {
            "gts_user_id": str(user.id),
            "tier": tier,
        }
        if club_id:
            metadata["club_id"] = str(club_id)

        checkout_session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=["card", "paypal", "sepa_debit"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            metadata=metadata,
            subscription_data={"metadata": metadata},
            allow_promotion_codes=True,
            billing_address_collection="required",
            tax_id_collection={"enabled": True},
            success_url=success_url,
            cancel_url=cancel_url,
        )

        return jsonify({
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "mock": False,
        }), 200

    except Exception as e:
        log(f"DEBUG [Stripe Checkout]: Error creating session - {e}")
        return jsonify({"msg": f"Fehler beim Verbinden mit Stripe: {str(e)}"}), 500


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
    return jsonify([
        serialize_club(c, include_internal=False)
        for c in clubs
        if c.id not in banned_clubs
    ]), 200


@clubs_bp.route("/api/clubs/<string:slug_or_id>", methods=["GET"])
def get_club_detail(slug_or_id):
    viewer_id = get_optional_jwt_user_id()
    club = db.session.get(Club, slug_or_id) or Club.query.filter_by(slug=slug_or_id).first()
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404

    if is_banned_from_club(viewer_id, club.id):
        return jsonify({"msg": "Du hast Hausverbot in diesem Club und kannst dessen Seite nicht aufrufen."}), 403

    return jsonify(serialize_club(club, include_internal=False)), 200


@clubs_bp.route("/api/clubs/<string:club_id>/manage", methods=["GET"])
@jwt_required()
def get_club_management_detail(club_id):
    user_id = get_jwt_identity()
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({"msg": "Club nicht gefunden."}), 404
    if not is_club_keymaster(user_id, club_id):
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

    if "social_links" in data and isinstance(data["social_links"], dict):
        club.social_links = data["social_links"]

    if "theme_config" in data and isinstance(data["theme_config"], dict):
        merged_theme = dict(club.theme_config or {})
        merged_theme.update(data["theme_config"])
        club.theme_config = merged_theme

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