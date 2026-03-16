from enum import Enum
from dataclasses import dataclass


class IncidentType(Enum):
    ACCIDENT = "accident"
    INCIDENT = "incident"


class SeverityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Coordinates:
    lat: float
    lng: float


class IncidentService:
    def __init__(self):
        self._incidents = []

    def get_incidents(self, status=None, severity=None, limit=100):
        return list(self._incidents)[:limit]

    def get_active_incidents(self):
        return [
            i
            for i in self._incidents
            if getattr(i, "status", None)
            in ["reported", "dispatched", "enroute", "on_scene"]
        ]

    def get_incident(self, incident_id):
        for i in self._incidents:
            if getattr(i, "id", None) == incident_id:
                return i
        return None

    def update_status(self, incident_id, status):
        inc = self.get_incident(incident_id)
        if inc:
            setattr(inc, "status", status.value if hasattr(status, "value") else status)
            return inc
        return None


class IncidentStatus(Enum):
    REPORTED = "reported"
    DISPATCHED = "dispatched"
    ENROUTE = "enroute"
    ON_SCENE = "on_scene"
    RESOLVED = "resolved"


incident_service = IncidentService()
