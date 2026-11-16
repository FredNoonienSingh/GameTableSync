import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from extensions import db
from .base import event_attendees


class UserSystemElo(db.Model):
    __tablename__ = 'user_system_elos'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    system = db.Column(db.String(64), nullable=False, index=True)
    elo = db.Column(db.Integer, default=1500, nullable=False)
    matches_played = db.Column(db.Integer, default=0, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'system', name='uq_user_system_elo'),
    )


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    display_name = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    # Discord OAuth2 & Identity
    discord_id = db.Column(db.String(64), unique=True, nullable=True, index=True)  # Immutable Discord Snowflake ID
    discord_account = db.Column(db.String(64), unique=True, nullable=True)         # Discord username / handle
    avatar_url = db.Column(db.String(256), nullable=True)

    # Nullable so users who sign up via Discord OAuth don't require a local password initially
    password_hash = db.Column(db.String(256), nullable=True)
    
    is_app_admin = db.Column(db.Boolean, default=False, nullable=False)
    stripe_customer_id = db.Column(db.String(128), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    showcase_pictures = db.relationship('ShowcasePicture', backref='author', lazy=True, cascade="all, delete-orphan")
    events = db.relationship('Event', secondary=event_attendees, backref=db.backref('attendees', lazy='dynamic'))
    army_lists = db.relationship('ArmyList', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    system_elos = db.relationship('UserSystemElo', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def get_or_create_system_elo(self, system: str) -> UserSystemElo:
        elo_entry = self.system_elos.filter_by(system=system).first()
        if not elo_entry:
            elo_entry = UserSystemElo(user_id=self.id, system=system, elo=1500, matches_played=0)
            db.session.add(elo_entry)
            db.session.flush()
        return elo_entry

    def get_elo_for_system(self, system: str) -> int:
        elo_entry = self.system_elos.filter_by(system=system).first()
        return elo_entry.elo if elo_entry else 1500

    @staticmethod
    def update_system_elos(
        player1: 'User',
        player2: 'User',
        system: str,
        score1: int,
        score2: int,
        max_vp: int = 100,
        k_factor: int = 32
    ) -> tuple[int, int]:
        p1_entry = player1.get_or_create_system_elo(system)
        p2_entry = player2.get_or_create_system_elo(system)

        r1 = p1_entry.elo
        r2 = p2_entry.elo

        e1 = 1.0 / (1.0 + 10.0 ** ((r2 - r1) / 400.0))
        e2 = 1.0 / (1.0 + 10.0 ** ((r1 - r2) / 400.0))

        if score1 > score2:
            s1, s2 = 1.0, 0.0
        elif score2 > score1:
            s1, s2 = 0.0, 1.0
        else:
            s1, s2 = 0.5, 0.5

        vp_delta = abs(score1 - score2)
        clamped_delta = min(vp_delta, max_vp)
        mov_multiplier = 1.0 + (clamped_delta / float(max_vp))

        delta1 = round(k_factor * mov_multiplier * (s1 - e1))
        delta2 = round(k_factor * mov_multiplier * (s2 - e2))

        p1_entry.elo = max(100, r1 + delta1)
        p2_entry.elo = max(100, r2 + delta2)
        p1_entry.matches_played += 1
        p2_entry.matches_played += 1

        return p1_entry.elo, p2_entry.elo

    def __repr__(self):
        return f'<User {self.display_name}>'