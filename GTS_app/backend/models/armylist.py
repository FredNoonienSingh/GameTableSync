import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from extensions import db


class ArmyList(db.Model):
    __tablename__ = 'army_lists'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    
    name = db.Column(db.String(150), nullable=False)
    system = db.Column(db.String(100), nullable=False, index=True)
    faction = db.Column(db.String(100))
    points = db.Column(db.Integer)
    points_limit = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    roster_data = db.Column(JSONB, nullable=False)