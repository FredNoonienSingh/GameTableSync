import uuid
from sqlalchemy.dialects.postgresql import UUID
from extensions import db


class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    club_id = db.Column(UUID(as_uuid=False), db.ForeignKey('clubs.id', ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(128), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text)
    discord_message_id = db.Column(db.String(100), nullable=True)

    club = db.relationship('Club', backref=db.backref('events', lazy='dynamic', cascade='all, delete-orphan'))