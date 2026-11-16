import uuid
from sqlalchemy.dialects.postgresql import UUID
from extensions import db


class FactionCategory(db.Model):
    __tablename__ = 'faction_categories'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(64), nullable=False)
    system = db.Column(db.String(32), nullable=False, index=True)

    factions = db.relationship('Faction', backref='category', lazy=True, cascade="all, delete-orphan")


class Faction(db.Model):
    __tablename__ = 'factions'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(128), nullable=False)
    category_id = db.Column(UUID(as_uuid=False), db.ForeignKey('faction_categories.id', ondelete="CASCADE"), nullable=False)