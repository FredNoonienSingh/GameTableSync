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

    stripe_subscription_id = db.Column(db.String(128), unique=True, nullable=True)
    stripe_checkout_session_id = db.Column(db.String(128), nullable=True)
    is_mock = db.Column(db.Boolean, default=False, nullable=False)

    valid_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship('User', backref=db.backref('club_licenses', lazy='dynamic'))
    club = db.relationship('Club', back_populates='license', uselist=False)


class Club(db.Model):
    __tablename__ = 'clubs'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="RESTRICT"), nullable=False, index=True)
    license_id = db.Column(UUID(as_uuid=False), db.ForeignKey('club_licenses.id', ondelete="SET NULL"), unique=True, nullable=True)

    name = db.Column(db.String(120), unique=True, nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)

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

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship('User', backref=db.backref('owned_clubs', lazy='dynamic'))
    license = db.relationship('ClubLicense', back_populates='club')
    tables = db.relationship('ClubTable', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    employees = db.relationship('ClubEmployee', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    employee_shifts = db.relationship('ClubEmployeeShift', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')
    bans = db.relationship('ClubBan', back_populates='club', lazy='dynamic', cascade='all, delete-orphan')

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

        all_schedules = self.schedules.all()
        if not all_schedules:
            return True

        target_date = start_time.date()
        weekday = start_time.weekday()

        date_overrides = [s for s in all_schedules if s.specific_date == target_date]
        for s in date_overrides:
            if s.is_blocked:
                if not s.open_time or not s.close_time:
                    return False
                block_start = datetime.combine(target_date, s.open_time)
                block_end = datetime.combine(target_date, s.close_time)
                if start_time < block_end and end_time > block_start:
                    return False

        positive_date_windows = [s for s in date_overrides if not s.is_blocked and s.open_time and s.close_time]
        if positive_date_windows:
            return any(
                datetime.combine(target_date, s.open_time) <= start_time
                and end_time <= datetime.combine(target_date, s.close_time)
                for s in positive_date_windows
            )

        weekly_rules = [s for s in all_schedules if s.specific_date is None and not s.is_blocked]
        if not weekly_rules:
            return True

        day_rules = [s for s in weekly_rules if s.day_of_week == weekday and s.open_time and s.close_time]
        if not day_rules:
            return False

        return any(
            datetime.combine(target_date, s.open_time) <= start_time
            and end_time <= datetime.combine(target_date, s.close_time)
            for s in day_rules
        )


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