from extensions import db
from datetime import datetime

class Game(db.Model):
    __tablename__ = 'games'
    id = db.Column(db.Integer, primary_key=True)
    system = db.Column(db.String(64), nullable=False)
    is_structured = db.Column(db.Boolean, default=True, nullable=False)
    format_type = db.Column(db.String(10), nullable=False, default="1v1")
    points = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    
    start_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="Open")
    
    is_virtual = db.Column(db.Boolean, default=False, nullable=False)
    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    is_open_list = db.Column(db.Boolean, default=False)
    discord_message_id = db.Column(db.String(100), nullable=True)

    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    participations = db.relationship(
        'GamePlayer', 
        back_populates='game_ref',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )


class GamePlayer(db.Model):
    __tablename__ = 'game_players'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id', ondelete="CASCADE"), primary_key=True)
    
    faction_id = db.Column(db.Integer, db.ForeignKey('factions.id', ondelete="SET NULL"), nullable=True)
    custom_army = db.Column(db.String(128), nullable=True)
    team = db.Column(db.String(32), nullable=True)
    score = db.Column(db.Integer, nullable=True)
    
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('game_participations', lazy='dynamic'))
    game_ref = db.relationship('Game', back_populates='participations')
    faction = db.relationship('Faction', backref='participations', lazy=True)

    army_list_id = db.Column(
        db.Integer, db.ForeignKey("army_lists.id", ondelete="SET NULL"), nullable=True
    )
    army_list = db.relationship("ArmyList")

    @property
    def game(self):
        return self.game_ref