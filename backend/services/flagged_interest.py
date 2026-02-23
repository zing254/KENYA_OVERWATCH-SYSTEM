"""
Flagged Interest & Re-identification Service
Tracks offenders and triggers alerts when re-identified
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

class Priority(Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class FlaggedStatus(Enum):
    ACTIVE = "active"
    CAPTURED = "captured"
    ESCAPED = "escaped"

@dataclass
class FlaggedInterest:
    """Represents a flagged vehicle/person of interest"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    plate_number: str = ""
    vehicle_model: str = ""
    vehicle_make: str = ""
    vehicle_color: str = ""
    vehicle_type: str = ""
    priority: Priority = Priority.MEDIUM
    status: FlaggedStatus = FlaggedStatus.ACTIVE
    notes: str = ""
    incident_id: str = ""
    detection_count: int = 1
    last_seen_camera: str = ""
    last_seen_location: str = ""
    last_seen_latitude: float = 0.0
    last_seen_longitude: float = 0.0
    last_seen_timestamp: datetime = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    image_url: str = ""

class FlaggedInterestService:
    """
    Manages flagged interests and handles re-identification
    """
    
    def __init__(self):
        self.flagged_interests: Dict[str, FlaggedInterest] = {}
        self.reidentification_history: List[Dict] = []
        
    async def add_flagged_interest(
        self,
        plate_number: str,
        vehicle_info: Dict[str, Any],
        priority: str = "MEDIUM",
        incident_id: str = "",
        notes: str = "",
        image_url: str = ""
    ) -> FlaggedInterest:
        """Add a new flagged interest"""
        flagged = FlaggedInterest(
            id=str(uuid.uuid4()),
            plate_number=plate_number.upper(),
            vehicle_model=vehicle_info.get("model", ""),
            vehicle_make=vehicle_info.get("make", ""),
            vehicle_color=vehicle_info.get("color", ""),
            vehicle_type=vehicle_info.get("type", ""),
            priority=Priority(priority),
            incident_id=incident_id,
            notes=notes,
            image_url=image_url,
            last_seen_timestamp=datetime.utcnow()
        )
        
        self.flagged_interests[flagged.id] = flagged
        
        return flagged
    
    async def check_reidentification(
        self,
        plate_number: str,
        camera_id: str,
        location: str,
        latitude: float,
        longitude: float,
        timestamp: datetime = None
    ) -> Optional[Dict[str, Any]]:
        """Check if detected plate matches any flagged interest"""
        plate_upper = plate_number.upper()
        
        for flagged_id, flagged in self.flagged_interests.items():
            if flagged.plate_number == plate_upper and flagged.status == FlaggedStatus.ACTIVE:
                flagged.detection_count += 1
                flagged.last_seen_camera = camera_id
                flagged.last_seen_location = location
                flagged.last_seen_latitude = latitude
                flagged.last_seen_longitude = longitude
                flagged.last_seen_timestamp = timestamp or datetime.utcnow()
                
                reidentification_event = {
                    "id": str(uuid.uuid4()),
                    "flagged_interest_id": flagged_id,
                    "plate_number": plate_number,
                    "camera_id": camera_id,
                    "location": location,
                    "latitude": latitude,
                    "longitude": longitude,
                    "timestamp": (timestamp or datetime.utcnow()).isoformat(),
                    "detection_count": flagged.detection_count,
                    "priority": flagged.priority.value,
                    "is_reidentification": True
                }
                
                self.reidentification_history.append(reidentification_event)
                
                return {
                    "is_match": True,
                    "flagged_interest": {
                        "id": flagged.id,
                        "plate_number": flagged.plate_number,
                        "priority": flagged.priority.value,
                        "status": flagged.status.value,
                        "detection_count": flagged.detection_count,
                        "incident_id": flagged.incident_id,
                        "notes": flagged.notes,
                        "last_seen": {
                            "camera": camera_id,
                            "location": location,
                            "timestamp": (timestamp or datetime.utcnow()).isoformat()
                        }
                    },
                    "event": reidentification_event,
                    "alert_type": "reidentification"
                }
        
        return {"is_match": False}
    
    async def get_flagged_interests(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all flagged interests with optional filters"""
        results = []
        
        for flagged in self.flagged_interests.values():
            if status and flagged.status.value != status:
                continue
            if priority and flagged.priority.value != priority:
                continue
                
            results.append({
                "id": flagged.id,
                "plate_number": flagged.plate_number,
                "vehicle": {
                    "make": flagged.vehicle_make,
                    "model": flagged.vehicle_model,
                    "color": flagged.vehicle_color,
                    "type": flagged.vehicle_type
                },
                "priority": flagged.priority.value,
                "status": flagged.status.value,
                "notes": flagged.notes,
                "incident_id": flagged.incident_id,
                "detection_count": flagged.detection_count,
                "last_seen": {
                    "camera": flagged.last_seen_camera,
                    "location": flagged.last_seen_location,
                    "latitude": flagged.last_seen_latitude,
                    "longitude": flagged.last_seen_longitude,
                    "timestamp": flagged.last_seen_timestamp.isoformat() if flagged.last_seen_timestamp else None
                },
                "created_at": flagged.created_at.isoformat(),
                "image_url": flagged.image_url
            })
        
        results.sort(key=lambda x: (
            0 if x["priority"] == "HIGH" else 1 if x["priority"] == "MEDIUM" else 2,
            -x["detection_count"]
        ))
        
        return results
    
    async def update_status(self, flagged_id: str, new_status: str) -> bool:
        """Update status of flagged interest"""
        if flagged_id in self.flagged_interests:
            self.flagged_interests[flagged_id].status = FlaggedStatus(new_status)
            return True
        return False
    
    async def remove_flagged(self, flagged_id: str) -> bool:
        """Remove flagged interest"""
        if flagged_id in self.flagged_interests:
            del self.flagged_interests[flagged_id]
            return True
        return False
    
    async def get_reidentification_history(
        self,
        flagged_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Get re-identification events"""
        history = self.reidentification_history
        
        if flagged_id:
            history = [h for h in history if h.get("flagged_interest_id") == flagged_id]
        
        return history[-limit:]
    
    async def get_nearest_available_team(
        self,
        latitude: float,
        longitude: float,
        teams: List[Dict]
    ) -> Optional[Dict]:
        """Find nearest available team for dispatch"""
        import math
        
        def distance(lat1, lon1, lat2, lon2):
            return math.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2)
        
        available_teams = [t for t in teams if t.get("status") == "available"]
        
        if not available_teams:
            return None
        
        nearest = min(
            available_teams,
            key=lambda t: distance(
                latitude, longitude,
                t.get("latitude", 0), t.get("longitude", 0)
            )
        )
        
        return nearest
