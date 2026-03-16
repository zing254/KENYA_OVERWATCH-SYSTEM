"""
AI Autonomous Dispatch System
Handles delayed incidents by automatically dispatching nearest available responders
"""

import logging
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum

logger = logging.getLogger(__name__)


class DispatchPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentDelayLevel(Enum):
    NONE = "none"
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"


@dataclass
class AutoDispatchDecision:
    incident_id: str
    team_id: str
    reason: str
    priority: str
    estimated_eta: int
    confidence: float
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


SEVERITY_RESPONSE_TIMES = {
    "critical": 5,
    "high": 10,
    "medium": 20,
    "low": 30,
}


def calculate_delay(incident_created: datetime, severity: str) -> float:
    """Calculate delay in minutes based on incident creation time and severity"""
    expected_response = SEVERITY_RESPONSE_TIMES.get(severity, 30)
    elapsed = (datetime.now(timezone.utc) - incident_created).total_seconds() / 60
    return max(0, elapsed - expected_response)


def get_delay_level(delay_minutes: float) -> str:
    """Classify delay into levels"""
    if delay_minutes <= 0:
        return IncidentDelayLevel.NONE.value
    elif delay_minutes <= 15:
        return IncidentDelayLevel.MINOR.value
    elif delay_minutes <= 30:
        return IncidentDelayLevel.MODERATE.value
    else:
        return IncidentDelayLevel.SEVERE.value


def find_nearest_team(
    incident_lat: float,
    incident_lng: float,
    available_teams: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """Find the nearest available team based on coordinates"""
    if not available_teams:
        return None
    
    best_team = None
    best_distance = float('inf')
    
    for team in available_teams:
        if team.get("status") != "available":
            continue
        
        team_lat = team.get("latitude")
        team_lng = team.get("longitude")
        
        if team_lat and team_lng:
            dist = ((team_lat - incident_lat) ** 2 + 
                   (team_lng - incident_lng) ** 2) ** 0.5
            if dist < best_distance:
                best_distance = dist
                best_team = team
    
    return best_team


def should_auto_dispatch(
    delay_minutes: float,
    severity: str,
    incident_status: str
) -> bool:
    """Determine if automatic dispatch should occur"""
    if incident_status in ["resolved", "closed", "cancelled"]:
        return False
    
    if severity == "critical" and delay_minutes > 2:
        return True
    if severity == "high" and delay_minutes > 5:
        return True
    if severity == "medium" and delay_minutes > 10:
        return True
    if severity == "low" and delay_minutes > 20:
        return True
    
    return False


def get_dispatch_priority(severity: str, delay_minutes: float) -> str:
    """Calculate dispatch priority based on severity and delay"""
    if severity == "critical" or delay_minutes > 30:
        return DispatchPriority.CRITICAL.value
    elif severity == "high" or delay_minutes > 15:
        return DispatchPriority.HIGH.value
    elif severity == "medium" or delay_minutes > 5:
        return DispatchPriority.MEDIUM.value
    else:
        return DispatchPriority.LOW.value
