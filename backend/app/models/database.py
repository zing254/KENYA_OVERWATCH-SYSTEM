"""
Database Models for Kenya Overwatch Production System
"""

from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
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
    permissions = Column(JSON)
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
    ai_models = Column(JSON)
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
    risk_factors = Column(JSON)
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
    assigned_team = relationship("ResponseTeam", back_populates="incidents", foreign_keys="Incident.assigned_team_id")
    evidence_packages = relationship("EvidencePackage", back_populates="incident")
    alerts = relationship("Alert", back_populates="incident")

class DetectionEvent(Base):
    __tablename__ = "detection_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    detection_type = Column(String(50), nullable=False)  # person, vehicle, weapon, license_plate
    confidence = Column(Float, nullable=False)
    bounding_box = Column(JSON)  # {x, y, w, h}
    attributes = Column(JSON)  # Additional attributes based on detection type
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
    meta_data = Column(JSON)
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
    equipment = Column(JSON)
    current_incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    incidents = relationship("Incident", back_populates="assigned_team", foreign_keys="Incident.assigned_team_id")

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
    meta_data = Column(JSON)
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
    old_values = Column(JSON)
    new_values = Column(JSON)
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
    tags = Column(JSON)

class RetentionPolicy(Base):
    __tablename__ = "retention_policies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    data_type = Column(String(50), nullable=False)  # incidents, evidence, audit_logs, etc.
    retention_period_days = Column(Integer, nullable=False)
    conditions = Column(JSON)  # Additional conditions for retention
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FlaggedInterest(Base):
    __tablename__ = "flagged_interests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plate_number = Column(String(20), nullable=False, index=True)
    vehicle_model = Column(String(100))
    vehicle_make = Column(String(100))
    vehicle_color = Column(String(50))
    vehicle_type = Column(String(50))  # truck, bike, saloon, suv, lorry, trailer, etc.
    priority = Column(String(20), nullable=False)  # HIGH, MEDIUM, LOW
    status = Column(String(20), default="active")  # active, captured, escaped
    notes = Column(Text)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    detection_count = Column(Integer, default=1)
    last_seen_camera = Column(String(50))
    last_seen_location = Column(String(200))
    last_seen_latitude = Column(Float)
    last_seen_longitude = Column(Float)
    last_seen_timestamp = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ReidentificationEvent(Base):
    __tablename__ = "reidentification_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flagged_interest_id = Column(UUID(as_uuid=True), ForeignKey("flagged_interests.id"), nullable=False)
    camera_id = Column(String(50), ForeignKey("cameras.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String(200))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    dispatched_team_id = Column(UUID(as_uuid=True), ForeignKey("response_teams.id"))
    response_time_seconds = Column(Integer)
    
    flagged_interest = relationship("FlaggedInterest")
    camera = relationship("Camera")
    dispatched_team = relationship("ResponseTeam")


class Citizen(Base):
    __tablename__ = "citizens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_id = Column(String(100), unique=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    phone = Column(String(20))
    avatar_url = Column(String(500))
    notifications_enabled = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    vehicles = relationship("CitizenVehicle", back_populates="citizen")
    reports = relationship("CitizenReport", back_populates="citizen")


class CitizenVehicle(Base):
    __tablename__ = "citizen_vehicles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id = Column(UUID(as_uuid=True), ForeignKey("citizens.id"), nullable=False)
    plate_number = Column(String(20), nullable=False)
    model = Column(String(100))
    make = Column(String(100))
    color = Column(String(50))
    year = Column(Integer)
    chassis_number = Column(String(50))
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    citizen = relationship("Citizen", back_populates="vehicles")
    alerts = relationship("CitizenVehicleAlert", back_populates="vehicle")


class CitizenVehicleAlert(Base):
    __tablename__ = "citizen_vehicle_alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("citizen_vehicles.id"), nullable=False)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    plate_number = Column(String(20), nullable=False)
    offense_type = Column(String(100))
    location = Column(String(200))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    viewed = Column(Boolean, default=False)
    
    vehicle = relationship("CitizenVehicle", back_populates="alerts")
    incident = relationship("Incident")


class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id = Column(UUID(as_uuid=True), ForeignKey("citizens.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(String(200))
    status = Column(String(20), default="pending")  # pending, acknowledged, resolved
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    citizen = relationship("Citizen", back_populates="reports")
    incident = relationship("Incident")


class GPSPosition(Base):
    __tablename__ = "gps_positions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_type = Column(String(20), nullable=False)  # responder, citizen
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float)
    altitude = Column(Float)
    speed = Column(Float)
    heading = Column(Float)
    battery_level = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class PhoneStream(Base):
    __tablename__ = "phone_streams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_id = Column(String(100), unique=True, nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner_name = Column(String(100))
    stream_id = Column(String(50))
    status = Column(String(20), default="disconnected")  # connected, streaming, disconnected
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String(200))
    facing = Column(String(20))  # front, back
    resolution = Column(String(20))
    last_seen = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    model_type = Column(String(50), nullable=False)  # yolo, faster_rcnn, custom
    dataset_path = Column(String(500))
    hyperparameters = Column(JSON)
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    progress = Column(Float, default=0.0)
    current_epoch = Column(Integer)
    total_epochs = Column(Integer)
    metrics = Column(JSON)  # loss, mAP, etc.
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TrainingModel(Base):
    __tablename__ = "training_models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    version = Column(String(50), nullable=False)
    model_type = Column(String(50), nullable=False)
    model_path = Column(String(500))
    meta_data = Column(JSON)
    metrics = Column(JSON)
    is_active = Column(Boolean, default=False)
    is_production = Column(Boolean, default=False)
    training_job_id = Column(UUID(as_uuid=True), ForeignKey("training_jobs.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(JSON)
    description = Column(Text)
    category = Column(String(50))  # ai, alerts, cameras, map, audio, system
    is_public = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class RoadAnalytics(Base):
    __tablename__ = "road_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    road_name = Column(String(200), nullable=False, index=True)
    road_type = Column(String(50))  # highway, avenue, street, road
    total_incidents = Column(Integer, default=0)
    total_violations = Column(Integer, default=0)
    common_offenses = Column(JSON)
    peak_hours = Column(JSON)
    risk_score = Column(Float)
    camera_coverage = Column(Boolean, default=False)
    patrol_frequency = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())


class VehicleAnalytics(Base):
    __tablename__ = "vehicle_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_type = Column(String(50), nullable=False)  # truck, bike, saloon, suv, lorry, trailer
    total_offenses = Column(Integer, default=0)
    common_violations = Column(JSON)
    peak_locations = Column(JSON)
    peak_times = Column(JSON)
    risk_score = Column(Float)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())