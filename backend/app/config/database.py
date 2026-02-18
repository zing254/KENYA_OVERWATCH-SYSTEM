"""
Database Configuration and Connection Management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://overwatch:password@localhost:5432/kenya_overwatch")
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create engines
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=os.getenv("DEBUG", "false").lower() == "true"
)

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=os.getenv("DEBUG", "false").lower() == "true"
)

# Create session factories
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
AsyncSessionLocal = sessionmaker(
    async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def get_sync_db():
    """Get synchronous database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """Initialize database tables"""
    try:
        async with async_engine.begin() as conn:
            # Import all models to ensure they are registered
            from app.models.database import Base
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
            
            # Create indexes for performance
            await create_indexes(conn)
            
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

async def create_indexes(conn):
    """Create performance indexes"""
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);",
        "CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);",
        "CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_detection_events_timestamp ON detection_events(timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_detection_events_camera_timestamp ON detection_events(camera_id, timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_evidence_packages_status ON evidence_packages(status);",
        "CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);",
        "CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);",
    ]
    
    for index_sql in indexes:
        try:
            await conn.execute(index_sql)
            logger.info(f"Created index: {index_sql}")
        except Exception as e:
            logger.warning(f"Failed to create index {index_sql}: {e}")

async def close_db():
    """Close database connections"""
    await async_engine.dispose()

# Database health check
async def check_db_health():
    """Check database connectivity"""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute("SELECT 1")
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

# Transaction management
class DatabaseTransaction:
    """Context manager for database transactions"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def __aenter__(self):
        return self.session
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            await self.session.commit()
        else:
            await self.session.rollback()

# Database backup utilities
async def backup_database(backup_path: str):
    """Create database backup"""
    import subprocess
    
    try:
        # Extract connection info from DATABASE_URL
        db_info = parse_database_url(DATABASE_URL)
        
        # Use pg_dump for backup
        cmd = [
            "pg_dump",
            "-h", db_info["host"],
            "-p", str(db_info["port"]),
            "-U", db_info["user"],
            "-d", db_info["database"],
            "-f", backup_path,
            "--verbose",
            "--no-password"
        ]
        
        env = os.environ.copy()
        env["PGPASSWORD"] = db_info["password"]
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Database backup created: {backup_path}")
            return True
        else:
            logger.error(f"Database backup failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Database backup error: {e}")
        return False

def parse_database_url(url: str) -> dict:
    """Parse database URL into components"""
    import re
    
    pattern = r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^/]+)"
    match = re.match(pattern, url)
    
    if match:
        return {
            "user": match.group(1),
            "password": match.group(2),
            "host": match.group(3),
            "port": int(match.group(4)),
            "database": match.group(5)
        }
    else:
        raise ValueError("Invalid database URL format")

# Connection pooling configuration
def configure_connection_pool():
    """Configure database connection pool"""
    from sqlalchemy.pool import QueuePool
    
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=30,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    
    return engine