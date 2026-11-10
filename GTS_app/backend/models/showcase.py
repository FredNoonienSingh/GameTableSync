from extensions import db
from datetime import datetime

class ShowcasePicture(db.Model):
    __tablename__ = 'showcase_pictures'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    s3_key = db.Column(db.String(256), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)