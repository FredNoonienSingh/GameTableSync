from extensions import db

class FactionCategory(db.Model):
    __tablename__ = 'faction_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    system = db.Column(db.String(32), nullable=False)

    factions = db.relationship('Faction', backref='category', lazy=True, cascade="all, delete-orphan")


class Faction(db.Model):
    __tablename__ = 'factions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('faction_categories.id', ondelete="CASCADE"), nullable=False)