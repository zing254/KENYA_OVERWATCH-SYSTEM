"""
Database connection and operations for Kenya Overwatch Production System
PostgreSQL integration
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://overwatch:overwatch@localhost:5432/overwatch_db')

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    echo=False,
    future=True
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    from backend.app.models.database import User, Camera, Incident, DetectionEvent, EvidencePackage, ResponseTeam, Alert, AuditLog, SystemMetrics, RetentionPolicy
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized")

def check_db_connection():
    """Check database connection"""
    try:
        with engine.connect() as conn:
            return True
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
        return False
