"""
Kenya NTSA Road Safety - Database Layer
SQLAlchemy-based database with SQLite for local development
"""

from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from datetime import datetime, timezone
from typing import Optional, List, Generator
import os
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./ntsa_overwatch.db")

# Create engine with optimized connection pooling
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=os.environ.get("SQL_ECHO", "false").lower() == "true",
        pool_pre_ping=True,  # Check connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
    )
else:
    # Production PostgreSQL with optimized pool settings
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,           # Number of connections to keep open
        max_overflow=30,        # Additional connections beyond pool_size
        pool_timeout=30,        # Timeout for getting a connection from pool
        pool_recycle=1800,     # Recycle connections every 30 minutes
        pool_pre_ping=True,    # Check connections before using
        echo=os.environ.get("SQL_ECHO", "false").lower() == "true",
        future=True            # Use SQLAlchemy 2.0 style
    )

# Create session factory with expire_on_commit=False for better performance
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Improves performance by not expiring objects
)

# Create base class
Base = declarative_base()


# ==================== DATABASE MODELS ====================
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="officer")
    badge_number = Column(String, nullable=True)
    station = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)


class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(String, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    owner_id = Column(String, nullable=False)
    insurance_status = Column(String, nullable=False)
    inspection_status = Column(String, nullable=False)
    license_expiry = Column(DateTime, nullable=False)
    license_category = Column(String, nullable=False)
    points = Column(Integer, default=12)
    violations_count = Column(Integer, default=0)


class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(String, primary_key=True, index=True)
    license_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    license_expiry = Column(DateTime, nullable=False)
    license_category = Column(String, nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    address = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    points = Column(Integer, default=12)
    violations_count = Column(Integer, default=0)


class Accident(Base):
    __tablename__ = "accidents"
    
    id = Column(String, primary_key=True, index=True)
    accident_type = Column(String, nullable=False)
    cause = Column(String, nullable=False)
    location = Column(String, nullable=False)
    road_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    casualties = Column(Integer, default=0)
    injuries = Column(Integer, default=0)
    status = Column(String, nullable=False, default="reported")
    description = Column(Text, nullable=True)
    weather_conditions = Column(String, nullable=True)
    road_conditions = Column(String, nullable=True)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    response_time_minutes = Column(Float, nullable=True)
    cleared_at = Column(DateTime, nullable=True)


class Violation(Base):
    __tablename__ = "violations"
    
    id = Column(String, primary_key=True, index=True)
    violation_type = Column(String, nullable=False)
    plate_number = Column(String, index=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    road_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    evidence_image = Column(String, nullable=True)
    camera_id = Column(String, nullable=True)
    status = Column(String, nullable=False, default="detected")
    speed_detected = Column(Float, nullable=True)
    speed_limit = Column(Float, nullable=True)
    speed_excess = Column(Float, nullable=True)
    fine_amount = Column(Float, default=0.0)
    penalty_points = Column(Integer, default=0)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    issued_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    officer_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)


class Camera(Base):
    __tablename__ = "cameras"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    road_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    camera_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="online")
    speed_limit = Column(Float, nullable=True)
    is_recording = Column(Boolean, default=True)
    last_update = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    team_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="available")
    base_location = Column(String, nullable=False)
    members = Column(Integer, default=1)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    current_incident_id = Column(String, nullable=True)
    eta = Column(String, nullable=True)


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
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, index=True)
    event = Column(String, nullable=False)
    user_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ==================== DATABASE FUNCTIONS ====================
def get_db() -> Generator[Session, None, None]:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


def seed_demo_data():
    """Seed demo data for development"""
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(User).first():
            logger.info("Database already has data, skipping seed")
            return
        
        # Create demo users
        users = [
            User(
                id="admin_001",
                username="admin",
                email="admin@ntsa.go.ke",
                password_hash=pwd_context.hash("Admin@123"),
                first_name="System",
                last_name="Administrator",
                role="admin",
                badge_number="NTSA001",
                station="Headquarters",
                phone="+254709932000",
                status="active",
                is_active=True,
                is_verified=True
            ),
            User(
                id="officer_001",
                username="officer",
                email="officer@ntsa.go.ke",
                password_hash=pwd_context.hash("Officer@123"),
                first_name="John",
                last_name="Njoroge",
                role="officer",
                badge_number="NTSA234",
                station="Nairobi Central",
                phone="+254700123456",
                status="active",
                is_active=True,
                is_verified=True
            ),
        ]
        
        db.add_all(users)
        db.commit()
        
        logger.info("Demo data seeded successfully")
        
    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


# Initialize on import
init_db()
