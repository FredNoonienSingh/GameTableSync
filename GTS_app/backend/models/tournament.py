import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from extensions import db


class Tournament(db.Model):
    __tablename__ = 'tournaments'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    system = db.Column(db.String(64), nullable=False, index=True)
    format_type = db.Column(db.String(64), nullable=False)
    is_virtual = db.Column(db.Boolean, default=False, nullable=False)
    max_players = db.Column(db.Integer, default=8, nullable=False)
    round_duration_days = db.Column(db.Integer, default=14, nullable=False)
    discord_thread_id = db.Column(db.String(64), nullable=True)
    status = db.Column(db.String(32), default='Registration', nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    club = db.relationship('Club', backref=db.backref('tournaments', lazy='dynamic', cascade='all, delete-orphan'))
    participants = db.relationship('TournamentParticipant', backref='tournament', lazy='dynamic', cascade='all, delete-orphan')
    matches = db.relationship('TournamentMatch', backref='tournament', lazy='dynamic', cascade='all, delete-orphan')

class TournamentParticipant(db.Model):
    __tablename__ = 'tournament_participants'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(UUID(as_uuid=False), db.ForeignKey('tournaments.id', ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    army_list_id = db.Column(UUID(as_uuid=False), db.ForeignKey('army_lists.id', ondelete="SET NULL"), nullable=True)
    seed = db.Column(db.Integer, nullable=True)
    is_disqualified = db.Column(db.Boolean, default=False, nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='tournament_participations')
    army_list = db.relationship('ArmyList')


class TournamentMatch(db.Model):
    __tablename__ = 'tournament_matches'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(UUID(as_uuid=False), db.ForeignKey('tournaments.id', ondelete="CASCADE"), nullable=False, index=True)
    round_number = db.Column(db.Integer, nullable=False)
    
    player1_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="SET NULL"), nullable=True)
    player2_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="SET NULL"), nullable=True)
    
    # Official verified scores (populated once both players agree or Admin resolves)
    score_player1 = db.Column(db.Integer, nullable=True)
    score_player2 = db.Column(db.Integer, nullable=True)

    # Individual reported scores for conflict detection
    p1_reported_s1 = db.Column(db.Integer, nullable=True)
    p1_reported_s2 = db.Column(db.Integer, nullable=True)
    p2_reported_s1 = db.Column(db.Integer, nullable=True)
    p2_reported_s2 = db.Column(db.Integer, nullable=True)
    
    hand_in_by = db.Column(db.DateTime, nullable=True)
    p1_submitted = db.Column(db.Boolean, default=False, nullable=False)
    p2_submitted = db.Column(db.Boolean, default=False, nullable=False)
    elo_processed = db.Column(db.Boolean, default=False, nullable=False)
    reminder_sent = db.Column(db.Boolean, default=False, nullable=False)
    discord_message_id = db.Column(db.String(64), nullable=True)
    
    winner_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="SET NULL"), nullable=True)
    # Status values: 'Pending', 'Disputed', 'Completed', 'Disqualified'
    status = db.Column(db.String(32), default='Pending', nullable=False)

    player1 = db.relationship('User', foreign_keys=[player1_id])
    player2 = db.relationship('User', foreign_keys=[player2_id])
    winner = db.relationship('User', foreign_keys=[winner_id])