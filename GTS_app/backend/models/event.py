from extensions import db

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(128), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text)
    discord_message_id = db.Column(db.String(100), nullable=True)