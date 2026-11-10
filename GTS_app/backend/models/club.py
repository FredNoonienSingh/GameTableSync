from uuid import uuid4
from extensions import db
from datetime import datetime

class Club(db.Model):
    __tablename__ = 'club'