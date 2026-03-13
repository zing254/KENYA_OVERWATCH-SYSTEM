"""
Kenya Overwatch Real-Time Event System
Handles broadcasting events from all modules to connected clients
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Callable, Optional
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class EventType(Enum):
    """Event types for broadcasting"""
    INCIDENT_CREATED = "incident_created"
    INCIDENT_UPDATED = "incident_updated"
    INCIDENT_RESOLVED = "incident_resolved"
    ALERT_NEW = "alert_new"
    ALERT_ACKNOWLEDGED = "alert_acknowledged"
    DETECTION_NEW = "detection_new"
    CAMERA_STATUS_CHANGE = "camera_status_change"
    RISK_HIGH = "risk_high"
    ANPR_DETECTION = "anpr_detection"
    OFFENCE_DETECTED = "offence_detected"
    TEAM_DISPATCHED = "team_dispatched"
    TEAM_LOCATION_UPDATE = "team_location_update"
    SYSTEM_STATUS = "system_status"
    CITIZEN_REPORT = "citizen_report"
    HAZARD_DETECTED = "hazard_detected"
    WEATHER_ALERT = "weather_alert"
    TRAFFIC_INCIDENT = "traffic_incident"


@dataclass
class SystemEvent:
    """System event"""
    event_type: EventType
    timestamp: datetime = field(default_factory=datetime.now)
    data: Dict[str, Any] = field(default_factory=dict)
    source: str = "system"


class EventBroadcaster:
    """Broadcasts events to all connected WebSocket clients"""
    
    def __init__(self):
        self.subscribers: Dict[str, List[Any]] = {
            "all": [],
            EventType.INCIDENT_CREATED.value: [],
            EventType.INCIDENT_UPDATED.value: [],
            EventType.INCIDENT_RESOLVED.value: [],
            EventType.ALERT_NEW.value: [],
            EventType.DETECTION_NEW.value: [],
            EventType.RISK_HIGH.value: [],
            EventType.ANPR_DETECTION.value: [],
            EventType.OFFENCE_DETECTED.value: [],
            EventType.TEAM_DISPATCHED.value: [],
            EventType.CAMERA_STATUS_CHANGE.value: [],
            EventType.CITIZEN_REPORT.value: [],
            EventType.HAZARD_DETECTED.value: [],
            EventType.WEATHER_ALERT.value: [],
            EventType.TRAFFIC_INCIDENT.value: [],
        }
        self.event_history: List[SystemEvent] = []
        self.max_history = 1000
        
    def subscribe(self, websocket: Any, event_types: Optional[List[str]] = None):
        """Subscribe to events"""
        if event_types is None or "all" in event_types:
            self.subscribers["all"].append(websocket)
        else:
            for event_type in event_types:
                if event_type in self.subscribers:
                    self.subscribers[event_type].append(websocket)
        logger.info(f"Client subscribed to events: {event_types or ['all']}")
    
    def unsubscribe(self, websocket: Any):
        """Unsubscribe from events"""
        for key in self.subscribers:
            if websocket in self.subscribers[key]:
                self.subscribers[key].remove(websocket)
    
    async def broadcast(self, event: SystemEvent):
        """Broadcast event to all subscribers"""
        self.event_history.append(event)
        if len(self.event_history) > self.max_history:
            self.event_history.pop(0)
        
        message = json.dumps({
            "event_type": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
            "data": event.data,
        })
        
        # Send to all subscribers
        dead_connections = []
        
        for key in ["all", event.event_type.value]:
            for subscriber in self.subscribers[key]:
                try:
                    await subscriber.send_text(message)
                except Exception as e:
                    logger.warning(f"Failed to send to subscriber: {e}")
                    dead_connections.append(subscriber)
        
        # Clean up dead connections
        for conn in dead_connections:
            self.unsubscribe(conn)
    
    async def broadcast_incident(self, incident: Dict):
        """Broadcast incident event"""
        await self.broadcast(SystemEvent(
            event_type=EventType.INCIDENT_CREATED,
            data=incident,
            source="incidents",
        ))
    
    async def broadcast_alert(self, alert: Dict):
        """Broadcast alert event"""
        severity = alert.get("severity", "medium")
        if severity in ["high", "critical"]:
            await self.broadcast(SystemEvent(
                event_type=EventType.ALERT_NEW,
                data=alert,
                source="alerts",
            ))
    
    async def broadcast_detection(self, detection: Dict):
        """Broadcast detection event"""
        await self.broadcast(SystemEvent(
            event_type=EventType.DETECTION_NEW,
            data=detection,
            source="ai_pipeline",
        ))
    
    async def broadcast_risk_alert(self, assessment: Dict):
        """Broadcast high risk event"""
        if assessment.get("risk_score", 0) > 0.7:
            await self.broadcast(SystemEvent(
                event_type=EventType.RISK_HIGH,
                data=assessment,
                source="risk_engine",
            ))
    
    async def broadcast_anpr(self, plate_data: Dict):
        """Broadcast ANPR detection"""
        await self.broadcast(SystemEvent(
            event_type=EventType.ANPR_DETECTION,
            data=plate_data,
            source="anpr",
        ))
    
    async def broadcast_offence(self, offence: Dict):
        """Broadcast traffic offence"""
        await self.broadcast(SystemEvent(
            event_type=EventType.OFFENCE_DETECTED,
            data=offence,
            source="offence_engine",
        ))
    
    async def broadcast_citizen_report(self, report: Dict):
        """Broadcast citizen report"""
        await self.broadcast(SystemEvent(
            event_type=EventType.CITIZEN_REPORT,
            data=report,
            source="citizen_portal",
        ))
    
    def get_recent_events(self, limit: int = 50) -> List[Dict]:
        """Get recent events"""
        return [
            {
                "event_type": e.event_type.value,
                "timestamp": e.timestamp.isoformat(),
                "data": e.data,
                "source": e.source,
            }
            for e in self.event_history[-limit:]
        ]
    
    def get_event_stats(self) -> Dict:
        """Get event statistics"""
        stats = {et.value: 0 for et in EventType}
        for event in self.event_history:
            stats[event.event_type.value] = stats.get(event.event_type.value, 0) + 1
        
        return {
            "total_events": len(self.event_history),
            "by_type": stats,
            "active_subscribers": len(self.subscribers["all"]),
        }


# Global event broadcaster
event_broadcaster = EventBroadcaster()


# Event handler that connects modules to broadcaster
class EventHandler:
    """Handles events from various modules"""
    
    def __init__(self, broadcaster: EventBroadcaster):
        self.broadcaster = broadcaster
        
    async def handle_incident(self, incident: Dict):
        """Handle new incident"""
        await self.broadcaster.broadcast_incident(incident)
        
    async def handle_alert(self, alert: Dict):
        """Handle new alert"""
        await self.broadcaster.broadcast_alert(alert)
        
    async def handle_detection(self, detection: Dict):
        """Handle new detection"""
        await self.broadcaster.broadcast_detection(detection)
        
    async def handle_risk_assessment(self, assessment: Dict):
        """Handle risk assessment"""
        await self.broadcaster.broadcast_risk_alert(assessment)
        
    async def handle_anpr(self, plate_data: Dict):
        """Handle ANPR detection"""
        await self.broadcaster.broadcast_anpr(plate_data)
        
    async def handle_offence(self, offence: Dict):
        """Handle traffic offence"""
        await self.broadcaster.broadcast_offence(offence)


event_handler = EventHandler(event_broadcaster)
