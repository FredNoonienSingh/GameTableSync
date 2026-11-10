from extensions import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

class ArmyList(db.Model):
    __tablename__ = 'army_lists'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    name = db.Column(db.String(150), nullable=False)
    system = db.Column(db.String(100), nullable=False)
    faction = db.Column(db.String(100))
    points = db.Column(db.Integer)
    points_limit = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    roster_data = db.Column(JSONB, nullable=False)