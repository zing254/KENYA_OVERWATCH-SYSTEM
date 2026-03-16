"""
Dispatch Coordinator Service
Handles responder selection, dispatch creation, and notification
"""

import logging
import uuid
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict

from ...enums import ResponderType, ResponderStatus, DispatchStatus

logger = logging.getLogger(__name__)


@dataclass
class Responder:
    id: str
    name: str
    type: ResponderType
    badge_number: str
    phone: str
    status: ResponderStatus = ResponderStatus.AVAILABLE

    # Location
    latitude: float = 0.0
    longitude: float = 0.0
    last_location_update: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Firebase token for push notifications
    fcm_token: Optional[str] = None

    # Current assignment
    current_incident_id: Optional[str] = None

    # Metadata
    station: str = ""
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict:
        data = asdict(self)
        data["type"] = self.type.value
        data["status"] = self.status.value
        data["last_location_update"] = self.last_location_update.isoformat()
        data["created_at"] = self.created_at.isoformat()
        return data


@dataclass
class Dispatch:
    id: str
    incident_id: str
    responder_id: str
    responder_type: ResponderType

    status: DispatchStatus

    dispatched_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    acknowledged_at: Optional[datetime] = None
    enroute_at: Optional[datetime] = None
    onscene_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None

    eta_minutes: Optional[int] = None
    notes: str = ""

    def to_dict(self) -> Dict:
        data = asdict(self)
        data["responder_type"] = self.responder_type.value
        data["status"] = self.status.value
        data["dispatched_at"] = self.dispatched_at.isoformat()
        if self.acknowledged_at:
            data["acknowledged_at"] = self.acknowledged_at.isoformat()
        if self.enroute_at:
            data["enroute_at"] = self.enroute_at.isoformat()
        if self.onscene_at:
            data["onscene_at"] = self.onscene_at.isoformat()
        if self.resolved_at:
            data["resolved_at"] = self.resolved_at.isoformat()
        if self.rejected_at:
            data["rejected_at"] = self.rejected_at.isoformat()
        return data


class DispatchCoordinator:
    """Coordinates dispatch of responders to incidents"""

    def __init__(self, incident_service=None):
        self.responders: Dict[str, Responder] = {}
        self.dispatches: Dict[str, Dispatch] = {}
        self.incident_service = incident_service
        self.notification_callback: Optional[Callable[..., Any]] = None

    def register_responder(self, responder: Responder) -> str:
        """Register a new responder"""
        self.responders[responder.id] = responder
        logger.info(f"Registered responder: {responder.id} - {responder.name}")
        return responder.id

    def update_responder_location(
        self, responder_id: str, latitude: float, longitude: float
    ) -> bool:
        """Update responder's current location"""
        if responder_id not in self.responders:
            return False

        responder = self.responders[responder_id]
        responder.latitude = latitude
        responder.longitude = longitude
        responder.last_location_update = datetime.now(timezone.utc)

        return True

    def update_responder_status(
        self, responder_id: str, status: ResponderStatus
    ) -> bool:
        """Update responder status"""
        if responder_id not in self.responders:
            return False

        self.responders[responder_id].status = status

        if status == ResponderStatus.AVAILABLE:
            self.responders[responder_id].current_incident_id = None

        return True

    def get_available_responders(
        self, responder_type: Optional[ResponderType] = None
    ) -> List[Responder]:
        """Get available responders"""
        available = [
            r for r in self.responders.values() if r.status == ResponderStatus.AVAILABLE
        ]

        if responder_type:
            available = [r for r in available if r.type == responder_type]

        return available

    def find_nearest_responder(
        self, latitude: float, longitude: float, responder_type: ResponderType
    ) -> Optional[Responder]:
        """Find nearest available responder of given type"""

        available = self.get_available_responders(responder_type)

        if not available:
            return None

        # Calculate distance and find nearest
        def distance(responder: Responder) -> float:
            return self._haversine_distance(
                latitude, longitude, responder.latitude, responder.longitude
            )

        return min(available, key=distance)

    def _haversine_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calculate distance in km"""
        from math import radians, sin, cos, sqrt, atan2

        R = 6371  # Earth radius in km

        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return R * c

    def dispatch_responders(
        self,
        incident_id: str,
        required_types: List[ResponderType],
        optional_types: Optional[List[ResponderType]] = None,
    ) -> Dict[str, Dispatch]:
        """Dispatch responders to an incident"""

        dispatches = {}
        missing_types = []

        # Dispatch required types
        from services.incident_service import incident_service

        incident = incident_service.get_incident(incident_id)

        if not incident:
            logger.error(f"Incident {incident_id} not found")
            return {}

        lat = incident.location.lat
        lng = incident.location.lng

        for rtype in required_types:
            responder = self.find_nearest_responder(lat, lng, rtype)

            if responder:
                dispatch = self._create_dispatch(incident_id, responder, rtype)
                dispatches[rtype.value] = dispatch
            else:
                missing_types.append(rtype.value)

        # Try optional types if required are fulfilled
        if optional_types and not missing_types:
            for rtype in optional_types:
                responder = self.find_nearest_responder(lat, lng, rtype)

                if responder:
                    dispatch = self._create_dispatch(incident_id, responder, rtype)
                    dispatches[f"{rtype.value}_optional"] = dispatch

        # Update incident status
        if missing_types:
            # Need manual dispatch
            if self.incident_service:
                self.incident_service.update_status(
                    incident_id,
                    "needs_manual_dispatch",
                    f"Missing responders: {', '.join(missing_types)}",
                )
        else:
            # All responders dispatched
            if self.incident_service:
                self.incident_service.update_status(incident_id, "assigned")

        # Send notifications
        for dispatch in dispatches.values():
            self._send_notification(dispatch)

        logger.info(
            f"Dispatched {len(dispatches)} responders to incident {incident_id}"
        )

        return dispatches

    def _create_dispatch(
        self, incident_id: str, responder: Responder, responder_type: ResponderType
    ) -> Dispatch:
        """Create a dispatch record"""

        dispatch = Dispatch(
            id=f"DISP-{uuid.uuid4().hex[:8].upper()}",
            incident_id=incident_id,
            responder_id=responder.id,
            responder_type=responder_type,
            status=DispatchStatus.DISPATCHED,
        )

        self.dispatches[dispatch.id] = dispatch

        # Update responder status
        responder.status = ResponderStatus.BUSY
        responder.current_incident_id = incident_id

        return dispatch

    def acknowledge_dispatch(self, dispatch_id: str) -> bool:
        """Mark dispatch as acknowledged"""

        if dispatch_id not in self.dispatches:
            return False

        dispatch = self.dispatches[dispatch_id]
        dispatch.status = DispatchStatus.ACKNOWLEDGED
        dispatch.acknowledged_at = datetime.now(timezone.utc)

        # Update incident
        if self.incident_service:
            self.incident_service.update_status(dispatch.incident_id, "assigned")

        logger.info(f"Dispatch {dispatch_id} acknowledged")
        return True

    def mark_enroute(self, dispatch_id: str) -> bool:
        """Mark responder as en route"""

        if dispatch_id not in self.dispatches:
            return False

        dispatch = self.dispatches[dispatch_id]
        dispatch.status = DispatchStatus.ENROUTE
        dispatch.enroute_at = datetime.now(timezone.utc)

        # Update responder
        responder = self.responders.get(dispatch.responder_id)
        if responder:
            responder.status = ResponderStatus.ENROUTE

        # Update incident
        if self.incident_service:
            self.incident_service.update_status(dispatch.incident_id, "enroute")

        logger.info(
            f"Responder {dispatch.responder_id} en route to incident {dispatch.incident_id}"
        )
        return True

    def mark_onscene(self, dispatch_id: str) -> bool:
        """Mark responder as on scene"""

        if dispatch_id not in self.dispatches:
            return False

        dispatch = self.dispatches[dispatch_id]
        dispatch.status = DispatchStatus.ONSCENE
        dispatch.onscene_at = datetime.now(timezone.utc)

        # Update incident
        if self.incident_service:
            self.incident_service.update_status(dispatch.incident_id, "onscene")

        logger.info(
            f"Responder {dispatch.responder_id} on scene at incident {dispatch.incident_id}"
        )
        return True

    def resolve_dispatch(self, dispatch_id: str) -> bool:
        """Mark dispatch as resolved"""

        if dispatch_id not in self.dispatches:
            return False

        dispatch = self.dispatches[dispatch_id]
        dispatch.status = DispatchStatus.RESOLVED
        dispatch.resolved_at = datetime.now(timezone.utc)

        # Free up responder
        responder = self.responders.get(dispatch.responder_id)
        if responder:
            responder.status = ResponderStatus.AVAILABLE
            responder.current_incident_id = None

        # Check if all dispatches for incident are resolved
        incident_dispatches = [
            d for d in self.dispatches.values() if d.incident_id == dispatch.incident_id
        ]

        all_resolved = all(
            d.status == DispatchStatus.RESOLVED for d in incident_dispatches
        )

        if all_resolved and self.incident_service:
            self.incident_service.update_status(dispatch.incident_id, "resolved")

        logger.info(f"Dispatch {dispatch_id} resolved")
        return True

    def reject_dispatch(self, dispatch_id: str, reason: str = "") -> bool:
        """Reject dispatch and find alternative"""

        if dispatch_id not in self.dispatches:
            return False

        dispatch = self.dispatches[dispatch_id]
        dispatch.status = DispatchStatus.REJECTED
        dispatch.rejected_at = datetime.now(timezone.utc)
        dispatch.notes = reason

        # Free up responder
        responder = self.responders.get(dispatch.responder_id)
        if responder:
            responder.status = ResponderStatus.AVAILABLE
            responder.current_incident_id = None

        # Try to find alternative
        incident = None
        if self.incident_service:
            incident = self.incident_service.get_incident(dispatch.incident_id)

        if incident:
            alternative = self.find_nearest_responder(
                incident.location.lat, incident.location.lng, dispatch.responder_type
            )

            if alternative:
                new_dispatch = self._create_dispatch(
                    dispatch.incident_id, alternative, dispatch.responder_type
                )
                self._send_notification(new_dispatch)
                logger.info(
                    f"Reassigned {dispatch.responder_type.value} to incident {dispatch.incident_id}"
                )

        logger.info(f"Dispatch {dispatch_id} rejected: {reason}")
        return True

    def _send_notification(self, dispatch: Dispatch):
        """Send notification to responder"""

        if self.notification_callback:
            try:
                responder = self.responders.get(dispatch.responder_id)
                if responder:
                    self.notification_callback(dispatch, responder)
            except Exception as e:
                logger.error(f"Failed to send notification: {e}")

    def set_notification_callback(self, callback: Callable[..., Any]):
        """Set callback for sending notifications"""
        self.notification_callback = callback

    def get_dispatches_for_incident(self, incident_id: str) -> List[Dispatch]:
        """Get all dispatches for an incident"""
        return [d for d in self.dispatches.values() if d.incident_id == incident_id]

    def get_responder(self, responder_id: str) -> Optional[Responder]:
        """Get responder by ID"""
        return self.responders.get(responder_id)


# Global instance
dispatch_coordinator = DispatchCoordinator()
