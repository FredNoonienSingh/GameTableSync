import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from extensions import db


class CatalogSystem(db.Model):
    __tablename__ = 'catalog_systems'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(64), nullable=False, index=True)
    github_repo = db.Column(db.String(128), unique=True, nullable=False)
    default_branch = db.Column(db.String(32), default="main", nullable=False)
    
    last_sync_sha = db.Column(db.String(64), nullable=True)
    last_synced_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    factions = db.relationship('CatalogFaction', backref='system', lazy='dynamic', cascade='all, delete-orphan')


class CatalogFaction(db.Model):
    __tablename__ = 'catalog_factions'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    system_id = db.Column(UUID(as_uuid=False), db.ForeignKey('catalog_systems.id', ondelete="CASCADE"), nullable=False, index=True)
    
    name = db.Column(db.String(128), nullable=False, index=True)
    bs_uuid = db.Column(db.String(64), nullable=False, index=True)
    revision = db.Column(db.String(32), nullable=True)
    is_library = db.Column(db.Boolean, default=False, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('system_id', 'bs_uuid', name='uq_catalog_faction_system_bs_uuid'),
    )

    entries = db.relationship('CatalogEntry', backref='faction', lazy='dynamic', cascade='all, delete-orphan')


class CatalogEntry(db.Model):
    __tablename__ = 'catalog_entries'

    id = db.Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    faction_id = db.Column(UUID(as_uuid=False), db.ForeignKey('catalog_factions.id', ondelete="CASCADE"), nullable=False, index=True)
    
    bs_uuid = db.Column(db.String(64), nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False, index=True)
    entry_type = db.Column(db.String(64), nullable=False)  # 'unit', 'model', 'upgrade', 'weapon'
    
    base_points = db.Column(db.Integer, default=0, nullable=False)
    raw_profile_data = db.Column(JSONB, default=dict, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('faction_id', 'bs_uuid', name='uq_catalog_entry_faction_bs_uuid'),
    )