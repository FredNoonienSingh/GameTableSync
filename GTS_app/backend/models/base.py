from extensions import db


event_attendees = db.Table(
    'event_attendees',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('event_id', db.Integer, db.ForeignKey('events.id'), primary_key=True)
)