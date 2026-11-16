import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from extensions import db


class ShowcasePicture(db.Model):
    __tablename__ = 'showcase_pictures'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(UUID(as_uuid=False), db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    s3_key = db.Column(db.String(256), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)