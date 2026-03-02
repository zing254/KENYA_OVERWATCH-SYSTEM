"""
Incident Management Service
Handles incident creation, state management, and lifecycle
"""

import logging
import uuid
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timezone
from enum import Enum
from dataclasses import dataclass, field, asdict

logger = logging.getLogger(__name__)


class IncidentType(str, Enum):
    ACCIDENT = "accident"
    OVERSPEEDING = "overspeeding"
    LANE_VIOLATION = "lane_violation"
    DANGEROUS_OVERTAKING = "dangerous_overtaking"
    BREAKDOWN = "breakdown"
    HAZARD = "hazard"
    RED_LIGHT_VIOLATION = "red_light_violation"
    USING_PHONE = "using_phone"
    NO_SEATBELT = "no_seatbelt"


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, Enum):
    DETECTED = "detected"
    VERIFIED = "verified"
    ASSIGNED = "assigned"
    ENROUTE = "enroute"
    ONSCENE = "onscene"
    RESOLVED = "resolved"
    REJECTED = "rejected"


# Base severity by incident type
INCIDENT_BASE_SEVERITY = {
    IncidentType.ACCIDENT: SeverityLevel.HIGH,
    IncidentType.OVERSPEEDING: SeverityLevel.MEDIUM,
    IncidentType.LANE_VIOLATION: SeverityLevel.LOW,
    IncidentType.DANGEROUS_OVERTAKING: SeverityLevel.HIGH,
    IncidentType.BREAKDOWN: SeverityLevel.MEDIUM,
    IncidentType.HAZARD: SeverityLevel.MEDIUM,
    IncidentType.RED_LIGHT_VIOLATION: SeverityLevel.LOW,
    IncidentType.USING_PHONE: SeverityLevel.LOW,
    IncidentType.NO_SEATBELT: SeverityLevel.LOW,
}

# Required responders by incident type
DISPATCH_REQUIREMENTS = {
    IncidentType.ACCIDENT: {
        "required": ["ambulance", "police", "fire"],
        "timeout": 300,  # seconds
        "escalate_after": 120
    },
    IncidentType.OVERSPEEDING: {
        "required": ["police"],
        "timeout": 600
    },
    IncidentType.LANE_VIOLATION: {
        "required": ["police"],
        "timeout": 600
    },
    IncidentType.DANGEROUS_OVERTAKING: {
        "required": ["police"],
        "timeout": 600
    },
    IncidentType.BREAKDOWN: {
        "required": ["police"],
        "optional": ["tow_truck"]
    },
    IncidentType.HAZARD: {
        "required": ["police"],
        "optional": ["maintenance"]
    },
    IncidentType.RED_LIGHT_VIOLATION: {
        "required": ["police"],
        "timeout": 600
    },
    IncidentType.USING_PHONE: {
        "required": [],
        "timeout": 600
    },
    IncidentType.NO_SEATBELT: {
        "required": [],
        "timeout": 600
    },
}


@dataclass
class Coordinates:
    lat: float
    lng: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None


@dataclass
class Incident:
    id: str
    type: IncidentType
    severity: SeverityLevel
    status: IncidentStatus
    
    location: Coordinates
    address: str
    road_name: str
    county: str
    
    description: str
    evidence_urls: List[str] = field(default_factory=list)
    
    camera_id: Optional[str] = None
    detected_by: str = "ai"  # ai, citizen, responder
    
    ai_confidence: float = 0.0
    
    casualties: int = 0
    injuries: int = 0
    
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    
    assigned_team_id: Optional[str] = None
    dispatched_responders: List[str] = field(default_factory=list)
    
    # Additional data
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        data['type'] = self.type.value
        data['severity'] = self.severity.value
        data['status'] = self.status.value
        if isinstance(self.location, Coordinates):
            data['location'] = asdict(self.location)
        data['created_at'] = self.created_at.isoformat()
        data['updated_at'] = self.updated_at.isoformat()
        if self.resolved_at:
            data['resolved_at'] = self.resolved_at.isoformat()
        return data


class IncidentService:
    """Incident Management Service"""
    
    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.incident_callbacks: List[Callable[..., Any]] = []
    
    def create_incident(
        self,
        incident_type: IncidentType,
        location: Coordinates,
        address: str,
        road_name: str,
        county: str = "",
        description: str = "",
        severity_modifier: Optional[SeverityLevel] = None,
        camera_id: Optional[str] = None,
        detected_by: str = "ai",
        ai_confidence: float = 0.0,
        evidence_urls: Optional[List[str]] = None,
        metadata: Optional[Dict] = None
    ) -> Incident:
        """Create a new incident"""
        
        # Determine severity
        base_severity = INCIDENT_BASE_SEVERITY.get(incident_type, SeverityLevel.MEDIUM)
        severity = severity_modifier or base_severity
        
        incident = Incident(
            id=f"INC-{uuid.uuid4().hex[:8].upper()}",
            type=incident_type,
            severity=severity,
            status=IncidentStatus.DETECTED,
            location=location,
            address=address,
            road_name=road_name,
            county=county,
            description=description,
            camera_id=camera_id,
            detected_by=detected_by,
            ai_confidence=ai_confidence,
            evidence_urls=evidence_urls or [],
            metadata=metadata or {}
        )
        
        self.incidents[incident.id] = incident
        logger.info(f"Created incident: {incident.id} - {incident_type.value}")
        
        # Notify callbacks
        self._notify_callbacks(incident, "created")
        
        return incident
    
    def update_status(
        self,
        incident_id: str,
        new_status: IncidentStatus,
        notes: Optional[str] = None
    ) -> Optional[Incident]:
        """Update incident status"""
        
        if incident_id not in self.incidents:
            logger.error(f"Incident {incident_id} not found")
            return None
        
        incident = self.incidents[incident_id]
        old_status = incident.status
        
        # Validate status transition
        if not self._is_valid_transition(old_status, new_status):
            logger.warning(f"Invalid transition from {old_status} to {new_status}")
        
        incident.status = new_status
        incident.updated_at = datetime.now(timezone.utc)
        
        if new_status == IncidentStatus.RESOLVED:
            incident.resolved_at = datetime.now(timezone.utc)
        
        if notes:
            incident.metadata['status_notes'] = notes
        
        logger.info(f"Updated incident {incident_id}: {old_status.value} -> {new_status.value}")
        
        # Notify callbacks
        self._notify_callbacks(incident, "status_changed")
        
        return incident
    
    def _is_valid_transition(self, from_status: IncidentStatus, 
                           to_status: IncidentStatus) -> bool:
        """Check if status transition is valid"""
        
        valid_transitions = {
            IncidentStatus.DETECTED: [IncidentStatus.VERIFIED, IncidentStatus.ASSIGNED, IncidentStatus.REJECTED],
            IncidentStatus.VERIFIED: [IncidentStatus.ASSIGNED, IncidentStatus.REJECTED],
            IncidentStatus.ASSIGNED: [IncidentStatus.ENROUTE, IncidentStatus.REJECTED],
            IncidentStatus.ENROUTE: [IncidentStatus.ONSCENE, IncidentStatus.REJECTED],
            IncidentStatus.ONSCENE: [IncidentStatus.RESOLVED, IncidentStatus.REJECTED],
            IncidentStatus.RESOLVED: [],
            IncidentStatus.REJECTED: [IncidentStatus.ASSIGNED],
        }
        
        return to_status in valid_transitions.get(from_status, [])
    
    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Get incident by ID"""
        return self.incidents.get(incident_id)
    
    def get_incidents(
        self,
        status: Optional[IncidentStatus] = None,
        incident_type: Optional[IncidentType] = None,
        severity: Optional[SeverityLevel] = None,
        county: Optional[str] = None,
        limit: int = 100
    ) -> List[Incident]:
        """Get incidents with optional filters"""
        
        results = list(self.incidents.values())
        
        if status:
            results = [i for i in results if i.status == status]
        
        if incident_type:
            results = [i for i in results if i.type == incident_type]
        
        if severity:
            results = [i for i in results if i.severity == severity]
        
        if county:
            results = [i for i in results if i.county == county]
        
        # Sort by creation time (newest first)
        results.sort(key=lambda x: x.created_at, reverse=True)
        
        return results[:limit]
    
    def get_active_incidents(self) -> List[Incident]:
        """Get all active (non-resolved) incidents"""
        return [
            i for i in self.incidents.values()
            if i.status not in [IncidentStatus.RESOLVED, IncidentStatus.REJECTED]
        ]
    
    def get_incidents_by_location(
        self,
        lat: float,
        lng: float,
        radius_km: float = 5.0
    ) -> List[Incident]:
        """Get incidents within radius of a location"""
        import math
        
        results = []
        for incident in self.incidents.values():
            distance = self._haversine_distance(
                lat, lng,
                incident.location.lat, incident.location.lng
            )
            if distance <= radius_km:
                results.append(incident)
        
        return sorted(results, key=lambda x: x.created_at, reverse=True)
    
    def _haversine_distance(self, lat1: float, lon1: float, 
                          lat2: float, lon2: float) -> float:
        """Calculate distance between two points in km"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth radius in km
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    def get_dispatch_requirements(self, incident_type: IncidentType) -> Dict:
        """Get dispatch requirements for incident type"""
        return DISPATCH_REQUIREMENTS.get(incident_type, {"required": [], "optional": []})
    
    def register_callback(self, callback: Callable[..., Any]):
        """Register callback for incident changes"""
        self.incident_callbacks.append(callback)
    
    def _notify_callbacks(self, incident: Incident, event_type: str):
        """Notify registered callbacks"""
        for callback in self.incident_callbacks:
            try:
                callback(incident, event_type)
            except Exception as e:
                logger.error(f"Callback error: {e}")


# Global instance
incident_service = IncidentService()
