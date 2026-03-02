"""
Kenya NTSA Road Safety - Database Models
SQLAlchemy models for PostgreSQL integration
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone
import enum

Base = declarative_base()


class UserRole(enum.Enum):
    ADMIN = "admin"
    OFFICER = "officer"
    DISPATCHER = "dispatcher"
    VIEWER = "viewer"


class UserStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class VehicleType(enum.Enum):
    MOTORCYCLE = "motorcycle"
    SALOON = "saloon"
    STATION_WAGON = "station_wagon"
    PICKUP = "pickup"
    LORRY = "lorry"
    BUS = "bus"
    MATATU = "matatu"
    TAXI = "taxi"
    OTHER = "other"


class SeverityLevel(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(enum.Enum):
    REPORTED = "reported"
    DISPATCHED = "dispatched"
    ON_SCENE = "on_scene"
    TREATMENT = "treatment"
    CLEARED = "cleared"
    INVESTIGATION = "investigation"
    CLOSED = "closed"


class ViolationStatus(enum.Enum):
    DETECTED = "detected"
    CAPTURED = "captured"
    REVIEWED = "reviewed"
    ISSUED = "issued"
    PAID = "paid"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


class AccidentType(enum.Enum):
    HEAD_ON = "head_on"
    REAR_END = "rear_end"
    SIDE_IMPACT = "side_impact"
    ROLLOVER = "rollover"
    HIT_PEDESTRIAN = "hit_pedestrian"
    HIT_ANIMAL = "hit_animal"
    OBJECT_STRIKE = "object_strike"
    SINGLE_VEHICLE = "single_vehicle"
    MULTI_VEHICLE = "multi_vehicle"
    PARKED_VEHICLE = "parked_vehicle"


# SQLAlchemy Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.OFFICER)
    badge_number = Column(String, nullable=True)
    station = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)


class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.SALOON)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    owner_id = Column(String, nullable=False)
    owner_phone = Column(String, nullable=True)
    insurance_status = Column(String, default="valid")
    inspection_status = Column(String, default="valid")
    license_expiry = Column(DateTime, nullable=True)
    license_category = Column(String, nullable=True)
    is_stolen = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    license_number = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    nationality = Column(String, default="Kenyan")
    license_class = Column(String, nullable=False)
    license_expiry = Column(DateTime, nullable=False)
    points_remaining = Column(Integer, default=14)
    total_points_deducted = Column(Integer, default=0)
    violations_count = Column(Integer, default=0)
    accidents_count = Column(Integer, default=0)
    status = Column(String, default="valid")
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Accident(Base):
    __tablename__ = "accidents"
    
    id = Column(String, primary_key=True, index=True)
    accident_type = Column(Enum(AccidentType), nullable=False)
    cause = Column(String, nullable=False)
    location = Column(String, nullable=False)
    road_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    severity = Column(Enum(SeverityLevel), nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.REPORTED)
    casualties = Column(Integer, default=0)
    injuries = Column(Integer, default=0)
    vehicles_involved = Column(JSON, default=list)
    description = Column(Text, nullable=True)
    weather_conditions = Column(String, default="clear")
    road_conditions = Column(String, default="good")
    evidence_images = Column(JSON, default=list)
    responding_units = Column(JSON, default=list)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = Column(DateTime, nullable=True)
    cleared_at = Column(DateTime, nullable=True)
    response_time_minutes = Column(Float, nullable=True)


class Violation(Base):
    __tablename__ = "violations"
    
    id = Column(String, primary_key=True, index=True)
    violation_type = Column(String, nullable=False)
    plate_number = Column(String, ForeignKey("vehicles.plate_number"), nullable=False)
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    location = Column(String, nullable=False)
    road_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    camera_id = Column(String, nullable=True)
    speed_detected = Column(Float, nullable=True)
    speed_limit = Column(Float, nullable=True)
    evidence_image = Column(String, nullable=True)
    video_clip = Column(String, nullable=True)
    status = Column(Enum(ViolationStatus), default=ViolationStatus.DETECTED)
    fine_amount = Column(Float, default=0)
    penalty_points = Column(Integer, default=0)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    issued_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    officer_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)


class RoadSegment(Base):
    __tablename__ = "road_segments"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    speed_limit = Column(Float, nullable=False)
    start_latitude = Column(Float, nullable=True)
    start_longitude = Column(Float, nullable=True)
    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)
    average_daily_traffic = Column(Integer, default=0)
    accidents_30d = Column(Integer, default=0)
    accidents_90d = Column(Integer, default=0)
    risk_level = Column(String, default="medium")
    risk_score = Column(Float, default=0.5)


class Camera(Base):
    __tablename__ = "cameras"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    road_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    camera_type = Column(String, nullable=False)  # speed, red_light, surveillance, ANPR
    status = Column(String, default="online")
    speed_limit = Column(Float, nullable=True)
    last_update = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_image_url = Column(String, nullable=True)


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    team_type = Column(String, nullable=False)  # ambulance, police, fire, traffic
    status = Column(String, default="available")
    base = Column(String, nullable=True)
    members = Column(Integer, default=1)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    current_incident_id = Column(String, nullable=True)
    eta = Column(String, nullable=True)
    phone = Column(String, nullable=True)


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)


class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    
    id = Column(String, primary_key=True, index=True)
    report_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    anonymous = Column(Boolean, default=False)
    attachments = Column(JSON, default=list)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)


# Database connection
DATABASE_URL = "postgresql://overwatch:overwatch_secure_pass@localhost:5432/overwatch_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
