from extensions import db
from datetime import datetime

class Tournament(db.Model):
    __tablename__ = 'tournaments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    system = db.Column(db.String(64), nullable=False) # e.g. "Warhammer 40k"
    format_type = db.Column(db.String(64), nullable=False) # e.g. "2000 Pkt", "Strike Force"
    max_players = db.Column(db.Integer, default=8, nullable=False)
    round_duration_days = db.Column(db.Integer, default=14, nullable=False) # Standard: 14 Tage (2 Wochen) pro Runde
    discord_thread_id = db.Column(db.String(64), nullable=True) # ID des Discord Forum-Posts
    status = db.Column(db.String(32), default='Registration', nullable=False) # 'Registration', 'In Progress', 'Completed'
    start_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    participants = db.relationship('TournamentParticipant', backref='tournament', lazy='dynamic', cascade='all, delete-orphan')
    matches = db.relationship('TournamentMatch', backref='tournament', lazy='dynamic', cascade='all, delete-orphan')


class TournamentParticipant(db.Model):
    __tablename__ = 'tournament_participants'

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id', ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    army_list_id = db.Column(db.Integer, db.ForeignKey('army_lists.id', ondelete="SET NULL"), nullable=True)
    seed = db.Column(db.Integer, nullable=True)
    is_disqualified = db.Column(db.Boolean, default=False, nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='tournament_participations')
    army_list = db.relationship('ArmyList')


class TournamentMatch(db.Model):
    __tablename__ = 'tournament_matches'

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id', ondelete="CASCADE"), nullable=False)
    round_number = db.Column(db.Integer, nullable=False)
    
    player1_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="SET NULL"), nullable=True)
    player2_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="SET NULL"), nullable=True)
    
    score_player1 = db.Column(db.Integer, nullable=True)
    score_player2 = db.Column(db.Integer, nullable=True)
    
    # Tracking für Abgabefrist (Hand-in by time), ELO & Discord
    hand_in_by = db.Column(db.DateTime, nullable=True)
    p1_submitted = db.Column(db.Boolean, default=False, nullable=False)
    p2_submitted = db.Column(db.Boolean, default=False, nullable=False)
    elo_processed = db.Column(db.Boolean, default=False, nullable=False)
    reminder_sent = db.Column(db.Boolean, default=False, nullable=False)
    discord_message_id = db.Column(db.String(64), nullable=True)
    
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="SET NULL"), nullable=True)
    status = db.Column(db.String(32), default='Pending', nullable=False) # 'Pending', 'In Progress', 'Completed', 'Disqualified'

    # Relationships
    player1 = db.relationship('User', foreign_keys=[player1_id])
    player2 = db.relationship('User', foreign_keys=[player2_id])
    winner = db.relationship('User', foreign_keys=[winner_id])