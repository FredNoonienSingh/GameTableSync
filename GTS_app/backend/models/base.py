from extensions import db
from sqlalchemy.dialects.postgresql import UUID

event_attendees = db.Table(
    'event_attendees',
    db.Column('user_id', UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    db.Column('event_id', UUID(as_uuid=False), db.ForeignKey('events.id', ondelete="CASCADE"), primary_key=True)
)