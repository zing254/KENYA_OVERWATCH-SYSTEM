"""
Database Models for Kenya Overwatch Production System
"""

from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # operator, supervisor, admin
    permissions = Column(JSONB)
    active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_incidents = relationship("Incident", back_populates="created_by_user")
    reviewed_evidence = relationship("EvidencePackage", back_populates="reviewer")

class Camera(Base):
    __tablename__ = "cameras"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float)
    status = Column(String(20), default="offline")  # online, offline, maintenance
    ai_enabled = Column(Boolean, default=False)
    ai_models = Column(JSONB)
    resolution = Column(String(20))
    fps = Column(Integer)
    rtsp_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    incidents = relationship("Incident", back_populates="camera")
    detection_events = relationship("DetectionEvent", back_populates="camera")

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    location = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    status = Column(String(20), default="active")  # active, responding, resolved, monitoring, under_review
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # low, medium, high, critical
    risk_factors = Column(JSONB)
    recommended_action = Column(String(200))
    confidence = Column(Float)
    reported_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    camera_id = Column(String(50), ForeignKey("cameras.id"))
    assigned_team_id = Column(UUID(as_uuid=True), ForeignKey("response_teams.id"))
    requires_human_review = Column(Boolean, default=False)
    human_review_completed = Column(Boolean, default=False)
    appeal_deadline = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_by_user = relationship("User", back_populates="created_incidents")
    camera = relationship("Camera", back_populates="incidents")
    assigned_team = relationship("ResponseTeam", back_populates="incidents")
    evidence_packages = relationship("EvidencePackage", back_populates="incident")
    alerts = relationship("Alert", back_populates="incident")

class DetectionEvent(Base):
    __tablename__ = "detection_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    detection_type = Column(String(50), nullable=False)  # person, vehicle, weapon, license_plate
    confidence = Column(Float, nullable=False)
    bounding_box = Column(JSONB)  # {x, y, w, h}
    attributes = Column(JSONB)  # Additional attributes based on detection type
    frame_hash = Column(String(64))  # SHA-256 hash of frame
    model_version = Column(String(20))
    
    # Relationships
    camera = relationship("Camera", back_populates="detection_events")
    evidence_packages = relationship("evidence_package_events", back_populates="detection_event")

class EvidencePackage(Base):
    __tablename__ = "evidence_packages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    metadata = Column(JSONB)
    status = Column(String(20), default="created")  # created, under_review, approved, rejected, appealed, archived
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    review_notes = Column(Text)
    appeal_status = Column(String(20))
    appeal_reason = Column(Text)
    appeal_citizen_id = Column(String(100))
    appeal_date = Column(DateTime(timezone=True))
    retention_until = Column(DateTime(timezone=True))
    package_hash = Column(String(64))  # SHA-256 hash of entire package
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    incident = relationship("Incident", back_populates="evidence_packages")
    reviewer = relationship("User", back_populates="reviewed_evidence")
    detection_events = relationship("evidence_package_events", back_populates="evidence_package")
    files = relationship("EvidenceFile", back_populates="package")

# Association table for evidence packages and detection events
class EvidencePackageEvent(Base):
    __tablename__ = "evidence_package_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_package_id = Column(UUID(as_uuid=True), ForeignKey("evidence_packages.id"), nullable=False)
    detection_event_id = Column(UUID(as_uuid=True), ForeignKey("detection_events.id"), nullable=False)
    
    # Relationships
    evidence_package = relationship("EvidencePackage", back_populates="detection_events")
    detection_event = relationship("DetectionEvent", back_populates="evidence_packages")

class EvidenceFile(Base):
    __tablename__ = "evidence_files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_package_id = Column(UUID(as_uuid=True), ForeignKey("evidence_packages.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)  # image, video, document
    file_size = Column(Integer)
    mime_type = Column(String(100))
    checksum = Column(String(64))  # SHA-256 checksum
    storage_url = Column(String(500))  # S3/MinIO URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    package = relationship("EvidencePackage", back_populates="files")

class ResponseTeam(Base):
    __tablename__ = "response_teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # police, medical, fire, security
    status = Column(String(20), default="available")  # available, deployed, unavailable
    location = Column(String(200))
    contact = Column(String(100))
    members = Column(Integer)
    equipment = Column(JSONB)
    current_incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    incidents = relationship("Incident", back_populates="assigned_team")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    camera_id = Column(String(50), ForeignKey("cameras.id"))
    risk_score = Column(Float)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime(timezone=True))
    action_taken = Column(Text)
    requires_action = Column(Boolean, default=True)
    metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    incident = relationship("Incident", back_populates="alerts")
    camera = relationship("Camera")
    acknowledger = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String(50), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(UUID(as_uuid=True))
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    session_id = Column(String(100))
    
    # Relationships
    user = relationship("User")

class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    metric_type = Column(String(50), nullable=False)
    metric_name = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(20))
    tags = Column(JSONB)

class RetentionPolicy(Base):
    __tablename__ = "retention_policies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    data_type = Column(String(50), nullable=False)  # incidents, evidence, audit_logs, etc.
    retention_period_days = Column(Integer, nullable=False)
    conditions = Column(JSONB)  # Additional conditions for retention
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())