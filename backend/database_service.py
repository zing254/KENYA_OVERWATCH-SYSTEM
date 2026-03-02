"""
Kenya NTSA Road Safety - Database Integration Service
Bridges in-memory data with SQLite for persistence
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

# Database file path
DB_DIR = Path(__file__).parent.parent / "data"
DB_DIR.mkdir(exist_ok=True)
DB_FILE = DB_DIR / "ntsa_overwatch.json"

# In-memory database (loaded from file)
_db_data = {
    "vehicles": {},
    "accidents": {},
    "violations": {},
    "drivers": {},
    "speed_detections": {},
    "citizen_reports": {},
    "last_updated": None
}


def _get_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_database() -> Dict:
    """Load database from JSON file"""
    global _db_data
    
    if DB_FILE.exists():
        try:
            with open(DB_FILE, 'r') as f:
                _db_data = json.load(f)
            logger.info(f"Database loaded from {DB_FILE}")
        except Exception as e:
            logger.warning(f"Failed to load database: {e}")
            _db_data = {"vehicles": {}, "accidents": {}, "violations": {}, "drivers": {}, "speed_detections": {}, "citizen_reports": {}, "last_updated": None}
    else:
        logger.info("No existing database, starting fresh")
    
    return _db_data


def save_database():
    """Save database to JSON file"""
    global _db_data
    
    _db_data["last_updated"] = _get_timestamp()
    
    try:
        with open(DB_FILE, 'w') as f:
            json.dump(_db_data, f, indent=2, default=str)
        logger.info(f"Database saved to {DB_FILE}")
    except Exception as e:
        logger.error(f"Failed to save database: {e}")


def initialize_from_engine(engine_data: Dict):
    """Initialize database from road safety engine data"""
    global _db_data
    
    load_database()
    
    # Import from engine data
    if "vehicles" in engine_data:
        _db_data["vehicles"] = engine_data["vehicles"]
    
    if "accidents" in engine_data:
        _db_data["accidents"] = {}
        for acc in engine_data["accidents"]:
            _db_data["accidents"][acc.id] = _accident_to_dict(acc)
    
    if "violations" in engine_data:
        _db_data["violations"] = {}
        for viol in engine_data["violations"]:
            _db_data["violations"][viol.id] = _violation_to_dict(viol)
    
    if "drivers" in engine_data:
        _db_data["drivers"] = engine_data["drivers"]
    
    if "speed_detections" in engine_data:
        _db_data["speed_detections"] = engine_data["speed_detections"]
    
    save_database()
    logger.info("Database initialized from engine data")


def _accident_to_dict(accident) -> Dict:
    """Convert accident object to dict"""
    return {
        "id": accident.id,
        "accident_type": accident.accident_type.value if hasattr(accident.accident_type, 'value') else str(accident.accident_type),
        "cause": accident.cause.value if hasattr(accident.cause, 'value') else str(accident.cause),
        "location": accident.location,
        "road_name": accident.road_name,
        "coordinates": {
            "lat": accident.coordinates.lat,
            "lng": accident.coordinates.lng
        },
        "severity": accident.severity.value if hasattr(accident.severity, 'value') else str(accident.severity),
        "status": accident.status.value if hasattr(accident.status, 'value') else str(accident.status),
        "vehicles_involved": accident.vehicles_involved,
        "casualties": accident.casualties,
        "injuries": accident.injuries,
        "description": accident.description,
        "weather_conditions": accident.weather_conditions,
        "road_conditions": accident.road_conditions,
        "reported_at": accident.reported_at.isoformat() if accident.reported_at else None,
        "response_time_minutes": accident.response_time_minutes,
        "cleared_at": accident.cleared_at.isoformat() if accident.cleared_at else None,
    }


def _violation_to_dict(violation) -> Dict:
    """Convert violation object to dict"""
    return {
        "id": violation.id,
        "violation_type": violation.violation_type.value if hasattr(violation.violation_type, 'value') else str(violation.violation_type),
        "plate_number": violation.plate_number,
        "vehicle_type": violation.vehicle_type.value if hasattr(violation.vehicle_type, 'value') else str(violation.vehicle_type),
        "location": violation.location,
        "road_name": violation.road_name,
        "coordinates": {
            "lat": violation.coordinates.lat,
            "lng": violation.coordinates.lng
        },
        "status": violation.status.value if hasattr(violation.status, 'value') else str(violation.status),
        "speed_detected": violation.speed_detected,
        "speed_limit": violation.speed_limit,
        "speed_excess": violation.speed_excess,
        "fine_amount": violation.fine_amount,
        "penalty_points": violation.penalty_points,
        "detected_at": violation.detected_at.isoformat() if violation.detected_at else None,
        "issued_at": violation.issued_at.isoformat() if violation.issued_at else None,
        "due_date": violation.due_date.isoformat() if violation.due_date else None,
        "paid_at": violation.paid_at.isoformat() if violation.paid_at else None,
        "officer_id": violation.officer_id,
        "notes": violation.notes,
    }


# Database operations
def save_accident(accident) -> Dict:
    """Save accident to database"""
    global _db_data
    load_database()
    
    _db_data["accidents"][accident.id] = _accident_to_dict(accident)
    save_database()
    return _db_data["accidents"][accident.id]


def save_violation(violation) -> Dict:
    """Save violation to database"""
    global _db_data
    load_database()
    
    _db_data["violations"][violation.id] = _violation_to_dict(violation)
    save_database()
    return _db_data["violations"][violation.id]


def get_accidents(filters: Optional[Dict] = None, limit: int = 100) -> List[Dict]:
    """Get accidents from database"""
    global _db_data
    load_database()
    
    accidents = list(_db_data["accidents"].values())
    
    if filters:
        if "status" in filters:
            accidents = [a for a in accidents if a.get("status") == filters["status"]]
        if "severity" in filters:
            accidents = [a for a in accidents if a.get("severity") == filters["severity"]]
        if "plate_number" in filters:
            accidents = [a for a in accidents if filters["plate_number"] in a.get("vehicles_involved", [])]
    
    return accidents[:limit]


def get_violations(filters: Optional[Dict] = None, limit: int = 100) -> List[Dict]:
    """Get violations from database"""
    global _db_data
    load_database()
    
    violations = list(_db_data["violations"].values())
    
    if filters:
        if "status" in filters:
            violations = [v for v in violations if v.get("status") == filters["status"]]
        if "plate_number" in filters:
            violations = [v for v in violations if v.get("plate_number") == filters["plate_number"]]
        if "violation_type" in filters:
            violations = [v for v in violations if v.get("violation_type") == filters["violation_type"]]
    
    return violations[:limit]


def get_vehicles(limit: int = 100) -> List[Dict]:
    """Get vehicles from database"""
    global _db_data
    load_database()
    
    return list(_db_data["vehicles"].values())[:limit]


def get_vehicle(plate_number: str) -> Optional[Dict]:
    """Get vehicle by plate number"""
    global _db_data
    load_database()
    
    return _db_data["vehicles"].get(plate_number)


def get_statistics() -> Dict:
    """Get database statistics"""
    global _db_data
    load_database()
    
    return {
        "total_vehicles": len(_db_data["vehicles"]),
        "total_accidents": len(_db_data["accidents"]),
        "total_violations": len(_db_data["violations"]),
        "total_drivers": len(_db_data["drivers"]),
        "total_speed_detections": len(_db_data["speed_detections"]),
        "last_updated": _db_data.get("last_updated"),
        "database_file": str(DB_FILE)
    }


def backup_database(backup_name: Optional[str] = None) -> str:
    """Create a backup of the database"""
    global _db_data
    load_database()
    
    if backup_name is None:
        backup_name = f"backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    
    backup_file = DB_DIR / f"{backup_name}.json"
    
    with open(backup_file, 'w') as f:
        json.dump(_db_data, f, indent=2, default=str)
    
    logger.info(f"Database backed up to {backup_file}")
    return str(backup_file)


def restore_database(backup_file: str) -> bool:
    """Restore database from backup"""
    global _db_data
    
    try:
        with open(backup_file, 'r') as f:
            _db_data = json.load(f)
        save_database()
        logger.info(f"Database restored from {backup_file}")
        return True
    except Exception as e:
        logger.error(f"Failed to restore database: {e}")
        return False


def clear_database():
    """Clear all database data"""
    global _db_data
    
    _db_data = {
        "vehicles": {},
        "accidents": {},
        "violations": {},
        "drivers": {},
        "speed_detections": {},
        "citizen_reports": {},
        "last_updated": None
    }
    save_database()
    logger.info("Database cleared")


# Initialize on import
load_database()
logger.info(f"Database service initialized - File: {DB_FILE}")
