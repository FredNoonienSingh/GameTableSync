import os
import json
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from extensions import db

_TIERS_CACHE = None
_TIERS_MTIME = None


def load_club_tiers() -> dict:
    """Loads and caches tier definitions from tiers.json, auto-reloading if the file changes."""
    global _TIERS_CACHE, _TIERS_MTIME
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tiers.json")

    if os.path.exists(json_path):
        mtime = os.path.getmtime(json_path)
        if _TIERS_CACHE is None or _TIERS_MTIME != mtime:
            with open(json_path, "r", encoding="utf-8") as f:
                _TIERS_CACHE = json.load(f)
                _TIERS_MTIME = mtime
        return _TIERS_CACHE

    # Safe fallback if tiers.json is missing
    return {
        "default_tier": "tier_1",
        "tiers": {
            "tier_1": {
                "name": "Outpost",
                "display_label": "Outpost (Tier 1)",
                "monthly_price_eur": 19,
                "stripe_price_id": "price_replace_me_tier_1",
                "max_active_signup_tournaments": 1,
                "max_tables": 4,
                "can_schedule_employees": False,
                "discord_bot_access_level": "basic",
                "custom_theming": True,
            },
            "tier_2": {
                "name": "Stronghold",
                "display_label": "Stronghold (Tier 2)",
                "monthly_price_eur": 49,
                "stripe_price_id": "price_replace_me_tier_2",
                "max_active_signup_tournaments": 3,
                "max_tables": 12,
                "can_schedule_employees": True,
                "discord_bot_access_level": "standard",
                "custom_theming": True,
            },
            "tier_3": {
                "name": "Fortress",
                "display_label": "Fortress (Tier 3)",
                "monthly_price_eur": 99,
                "stripe_price_id": "price_replace_me_tier_3",
                "max_active_signup_tournaments": 999,
                "max_tables": 999,
                "can_schedule_employees": True,
                "discord_bot_access_level": "full",
                "custom_theming": True,
            },
        },
    }


def get_all_tiers() -> dict:
    return load_club_tiers().get("tiers", {})


def get_tier_limits(tier_key: str) -> dict:
    data = load_club_tiers()
    tiers = data.get("tiers", {})
    default_key = data.get("default_tier", "tier_1")
    return tiers.get(tier_key) or tiers.get(default_key) or {}


def infer_table_category(system_name: str) -> str:
    """Maps a game system string to its required table capability ('tabletop', 'tcg', or 'rpg')."""
    s = (system_name or "").lower().strip()
    tcg_keywords = (
        "magic",
        "mtg",
        "pokémon",
        "pokemon",
        "yu-gi-oh",
        "yugioh",
        "one piece",
        "lorcana",
        "flesh and blood",
        "star wars: unlimited",
        "tcg",
    )
    rpg_keywords = (
        "d&d",
        "dungeons",
        "pathfinder",
        "call of cthulhu",
        "shadowrun",
        "warhammer fantasy roleplay",
        "pen & paper",
        "rpg",
    )
    if any(k in s for k in tcg_keywords):
        return "tcg"
    if any(k in s for k in rpg_keywords):
        return "rpg"
    return "tabletop"


class ClubLicense(db.Model):
    __tablename__ = 'club_licenses'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    tier = db.Column(db.String(32), default="tier_1", nullable=False)
    status = db.Column(db.String(32), default="active", nullable=False)

    # Single vs. Combined (Multi-Store) License metadata
    license_type = db.Column(db.String(32), default="single", nullable=False)  # 'single' | 'combined'
    bundle_id = db.Column(db.String(64), nullable=True, index=True)
    is_primary_slot = db.Column(db.Boolean, default=True, nullable=False)
    billing_cycle = db.Column(db.String(32), default="yearly", nullable=False)  # 'monthly' | 'yearly'
    discount_percent = db.Column(db.Integer, default=0, nullable=False)
    price_eur = db.Column(db.Float, nullable=True)

    stripe_subscription_id = db.Column(db.String(128), unique=True, nullable=True)
    stripe_checkout_session_id = db.Column(db.String(128), nullable=True)
    is_mock = db.Column(db.Boolean, default=False, nullable=False)

    valid_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship('User', backref=db.backref('club_licenses', lazy='dynamic'))
    club = db.relationship('Club', back_populates='license', uselist=False)


class ClubPicture(db.Model):
    __tablename__ = 'club_pictures'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="SET NULL"), nullable=True)
    gallery_name = db.Column(db.String(128), default="IMPRESSIONEN // GALERIE", nullable=False)
    title = db.Column(db.String(128), nullable=True)
    s3_key = db.Column(db.String(256), nullable=False)
    url = db.Column(db.String(512), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    club = db.relationship('Club', back_populates='pictures')


class Club(db.Model):
    __tablename__ = 'clubs'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="RESTRICT"), nullable=False, index=True)
    license_id = db.Column(UUID(as_uuid=False), db.ForeignKey('club_licenses.id', ondelete="SET NULL"), unique=True, nullable=True)

    name = db.Column(db.String(120), unique=True, nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(512), nullable=True)
    is_private = db.Column(db.Boolean, default=False, nullable=False)

    # Physical Address
    address_street = db.Column(db.String(256), nullable=True)
    address_city = db.Column(db.String(128), nullable=True)
    address_postal_code = db.Column(db.String(32), nullable=True)
    address_country = db.Column(db.String(64), default="DE", nullable=True)

    # Contact & Store Links
    contact_email = db.Column(db.String(120), nullable=True)
    contact_phone = db.Column(db.String(64), nullable=True)
    website_url = db.Column(db.String(256), nullable=True)
    online_store_url = db.Column(db.String(256), nullable=True)
    social_links = db.Column(JSONB, default=dict, nullable=False)

    # Discord Server & Bot Configuration
    discord_guild_id = db.Column(db.String(64), nullable=True)
    discord_invite_url = db.Column(db.String(256), nullable=True)
    discord_config = db.Column(JSONB, default=dict, nullable=False)

    # Custom Club Page Theming
    theme_config = db.Column(
        JSONB,
        default=lambda: {
            "primary_color": "#d97706",
            "accent_color": "#f59e0b",
            "background_style": "dark",
            "logo_s3_key": None,
            "banner_s3_key": None,
        },
        nullable=False,
    )

    # Global Store Weekly Opening Hours (0=Mon .. 6=Sun)
    opening_hours = db.Column(
        JSONB,
        default=lambda: {
            "0": {"is_open": True, "open": "14:00", "close": "22:00"},
            "1": {"is_open": True, "open": "14:00", "close": "22:00"},
            "2": {"is_open": True, "open": "14:00", "close": "22:00"},
            "3": {"is_open": True, "open": "14:00", "close": "22:00"},
            "4": {"is_open": True, "open": "14:00", "close": "23:00"},
            "5": {"is_open": True, "open": "10:00", "close": "22:00"},
            "6": {"is_open": False, "open": "12:00", "close": "18:00"},
        },
        nullable=True,
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship('User', backref=db.backref('owned_clubs', lazy='dynamic'))
    license = db.relationship('ClubLicense', back_populates='club')
    tables = db.relationship('ClubTable', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    employees = db.relationship('ClubEmployee', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    employee_shifts = db.relationship('ClubEmployeeShift', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    bans = db.relationship('ClubBan', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    pictures = db.relationship('ClubPicture', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    table_reservations = db.relationship('ClubTableReservation', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    members = db.relationship('ClubMember', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')

    @property
    def tier(self) -> str:
        if self.license and self.license.status == "active":
            return self.license.tier
        return load_club_tiers().get("default_tier", "tier_1")

    @property
    def tier_limits(self) -> dict:
        return get_tier_limits(self.tier)


class ClubBan(db.Model):
    """
    Store Ban: Blocks a specific User from viewing or participating in a Club's
    games, events, tables, and tournaments without deleting their platform account.
    """
    __tablename__ = 'club_bans'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    banned_by_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="SET NULL"), nullable=True)

    reason = db.Column(db.String(256), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)  # None = permanent store ban
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('club_id', 'user_id', name='uq_club_ban_user'),
    )

    club = db.relationship('Club', back_populates='bans')
    user = db.relationship(
        'User',
        foreign_keys=[user_id],
        backref=db.backref('store_bans', lazy='dynamic', cascade='all, delete-orphan'),
    )
    banned_by = db.relationship('User', foreign_keys=[banned_by_id])

    @property
    def is_currently_active(self) -> bool:
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True


class ClubEmployee(db.Model):
    __tablename__ = 'club_employees'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)

    role_title = db.Column(db.String(64), default="Staff", nullable=False)
    weekly_hours = db.Column(db.Float, default=20.0, nullable=False)
    is_keymaster = db.Column(db.Boolean, default=False, nullable=False)
    can_manage_tournaments = db.Column(db.Boolean, default=False, nullable=False)
    can_manage_events = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('club_id', 'user_id', name='uq_club_employee_user'),
    )

    club = db.relationship('Club', back_populates='employees')
    user = db.relationship('User', backref=db.backref('club_employments', lazy='dynamic'))
    shifts = db.relationship('ClubEmployeeShift', back_populates='employee', lazy='dynamic', cascade='all, delete-orphan')


class ClubEmployeeShift(db.Model):
    __tablename__ = 'club_employee_shifts'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    employee_id = db.Column(UUID(as_uuid=False), db.ForeignKey('club_employees.id', ondelete="CASCADE"), nullable=False, index=True)

    start_time = db.Column(db.DateTime, nullable=False, index=True)
    end_time = db.Column(db.DateTime, nullable=False, index=True)
    note = db.Column(db.String(256), nullable=True)

    club = db.relationship('Club', back_populates='employee_shifts')
    employee = db.relationship('ClubEmployee', back_populates='shifts')


class ClubTable(db.Model):
    __tablename__ = 'club_tables'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(64), nullable=False)
    
    supports_tabletop = db.Column(db.Boolean, default=True, nullable=False)
    supports_tcg = db.Column(db.Boolean, default=False, nullable=False)
    supports_rpg = db.Column(db.Boolean, default=False, nullable=False)
    
    dimensions = db.Column(db.String(64), nullable=True)
    max_players = db.Column(db.Integer, default=4, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    club = db.relationship('Club', back_populates='tables')
    schedules = db.relationship('ClubTableSchedule', back_populates='table', lazy='dynamic', cascade='all, delete-orphan')

    def supports_category(self, category: str) -> bool:
        if category == "tabletop":
            return self.supports_tabletop
        if category == "tcg":
            return self.supports_tcg
        if category == "rpg":
            return self.supports_rpg
        return False

    def is_open_during(self, start_time: datetime, end_time: datetime) -> bool:
        if not self.is_active:
            return False

        target_date = start_time.date()
        weekday_str = str(start_time.weekday())

        # 1. Check Global Store Opening Hours first (if configured on the Club)
        store_hours = getattr(self.club, "opening_hours", None) if self.club else None
        if isinstance(store_hours, dict) and weekday_str in store_hours:
            day_cfg = store_hours[weekday_str] or {}
            if not day_cfg.get("is_open", True):
                return False
            open_str = day_cfg.get("open")
            close_str = day_cfg.get("close")
            if open_str and close_str:
                try:
                    from datetime import time as dt_time
                    s_open = datetime.combine(target_date, dt_time.fromisoformat(open_str))
                    s_close = datetime.combine(target_date, dt_time.fromisoformat(close_str))
                    if start_time < s_open or end_time > s_close:
                        return False
                except ValueError:
                    pass

        # 2. Check Date-Specific Table Blockers
        all_schedules = self.schedules.all()
        date_overrides = [s for s in all_schedules if s.specific_date == target_date]
        for s in date_overrides:
            if s.is_blocked:
                if not s.open_time or not s.close_time:
                    return False
                block_start = datetime.combine(target_date, s.open_time)
                block_end = datetime.combine(target_date, s.close_time)
                if start_time < block_end and end_time > block_start:
                    return False

        return True


class ClubTableSchedule(db.Model):
    __tablename__ = 'club_table_schedules'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    table_id = db.Column(UUID(as_uuid=False), db.ForeignKey('club_tables.id', ondelete="CASCADE"), nullable=False, index=True)
    
    day_of_week = db.Column(db.Integer, nullable=True)
    specific_date = db.Column(db.Date, nullable=True)
    
    open_time = db.Column(db.Time, nullable=True)
    close_time = db.Column(db.Time, nullable=True)
    
    is_blocked = db.Column(db.Boolean, default=False, nullable=False)
    note = db.Column(db.String(128), nullable=True)

    table = db.relationship('ClubTable', back_populates='schedules')


class ClubTableReservation(db.Model):
    __tablename__ = 'club_table_reservations'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    table_id = db.Column(UUID(as_uuid=False), db.ForeignKey('club_tables.id', ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    game_id = db.Column(UUID(as_uuid=False), db.ForeignKey('games.id', ondelete="SET NULL"), nullable=True)

    system = db.Column(db.String(64), nullable=True)
    start_time = db.Column(db.DateTime, nullable=False, index=True)
    end_time = db.Column(db.DateTime, nullable=False, index=True)
    # 'Pending', 'Approved', 'Rejected'
    status = db.Column(db.String(32), default='Pending', nullable=False)
    note = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    club = db.relationship('Club', back_populates='table_reservations')
    table = db.relationship('ClubTable', backref=db.backref('reservations', lazy='dynamic', cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('table_reservations', lazy='dynamic'))


class ClubMember(db.Model):
    """
    Represents a Player's association/membership with a Club or Store.
    - For Outpost (tier_1): Join requests start as 'Pending' and must be approved by Owner/Keymaster.
    - For Commercial Stores (Stronghold/Citadel/Fortress): Players can associate ('Approved' or 'Pending').
    """
    __tablename__ = 'club_members'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    # 'Pending', 'Approved'
    status = db.Column(db.String(32), default="Pending", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('club_id', 'user_id', name='uq_club_member_user'),
    )

    club = db.relationship('Club', back_populates='members')
    user = db.relationship('User', backref=db.backref('club_memberships', lazy='dynamic', cascade='all, delete-orphan'))