"""
Citizen Reports API
Handles citizen-submitted incident reports with AI validation
"""

import logging
import uuid
from typing import Dict, List, Optional
from datetime import datetime, timezone
from enum import Enum
from dataclasses import dataclass, field, asdict

logger = logging.getLogger(__name__)


class CitizenReportType(str, Enum):
    ACCIDENT = "accident"
    HAZARD = "hazard"
    BROKEN_TRAFFIC_LIGHT = "broken_traffic_light"
    ROAD_BLOCK = "road_block"
    STOLEN_VEHICLE = "stolen_vehicle"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"


class CitizenReportStatus(str, Enum):
    SUBMITTED = "submitted"
    VALIDATING = "validating"
    AI_VALIDATED = "ai_validated"
    AI_REJECTED = "ai_rejected"
    INCIDENT_CREATED = "incident_created"
    REJECTED = "rejected"


@dataclass
class CitizenReport:
    id: str
    user_id: Optional[str]  # None for anonymous

    type: CitizenReportType
    description: str

    latitude: float
    longitude: float
    address: str

    photo_url: Optional[str] = None

    status: CitizenReportStatus = CitizenReportStatus.SUBMITTED

    ai_confidence: float = 0.0
    ai_validation_notes: str = ""

    incident_id: Optional[str] = None

    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict:
        data = asdict(self)
        data["type"] = self.type.value
        data["status"] = self.status.value
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data


class CitizenReportService:
    """Service for handling citizen reports"""

    def __init__(self, incident_service=None, ai_pipeline=None):
        self.reports: Dict[str, CitizenReport] = {}
        self.incident_service = incident_service
        self.ai_pipeline = ai_pipeline

        # Report type to incident type mapping
        self.type_mapping = {
            CitizenReportType.ACCIDENT: "accident",
            CitizenReportType.HAZARD: "hazard",
            CitizenReportType.BROKEN_TRAFFIC_LIGHT: "hazard",
            CitizenReportType.ROAD_BLOCK: "hazard",
            CitizenReportType.STOLEN_VEHICLE: "incident",
            CitizenReportType.SUSPICIOUS_ACTIVITY: "incident",
        }

    async def submit_report(
        self,
        report_type: CitizenReportType,
        description: str,
        latitude: float,
        longitude: float,
        address: str,
        user_id: Optional[str] = None,
        photo_url: Optional[str] = None,
    ) -> CitizenReport:
        """Submit a new citizen report"""

        report = CitizenReport(
            id=f"REPORT-{uuid.uuid4().hex[:8].upper()}",
            user_id=user_id,
            type=report_type,
            description=description,
            latitude=latitude,
            longitude=longitude,
            address=address,
            photo_url=photo_url,
            status=CitizenReportStatus.SUBMITTED,
        )

        self.reports[report.id] = report
        logger.info(f"Citizen report submitted: {report.id}")

        # Start AI validation if photo provided
        if photo_url:
            await self._validate_with_ai(report)
        else:
            # No photo - validate manually
            report.status = CitizenReportStatus.AI_VALIDATED
            await self._create_incident_from_report(report)

        return report

    async def _validate_with_ai(self, report: CitizenReport):
        """Validate report using AI"""

        report.status = CitizenReportStatus.VALIDATING

        if not self.ai_pipeline:
            # No AI pipeline - accept by default
            report.ai_confidence = 0.8
            report.ai_validation_notes = "Auto-validated (no AI pipeline)"
            report.status = CitizenReportStatus.AI_VALIDATED
            await self._create_incident_from_report(report)
            return

        # In production, would run image through YOLO
        # For now, simulate validation
        import random

        report.ai_confidence = random.uniform(0.6, 0.95)

        if report.ai_confidence >= 0.5:
            report.status = CitizenReportStatus.AI_VALIDATED
            report.ai_validation_notes = (
                f"AI validated with confidence {report.ai_confidence:.2f}"
            )
            await self._create_incident_from_report(report)
        else:
            report.status = CitizenReportStatus.AI_REJECTED
            report.ai_validation_notes = (
                f"AI rejected with confidence {report.ai_confidence:.2f}"
            )

        logger.info(f"Report {report.id} AI validation: {report.ai_validation_notes}")

    async def _create_incident_from_report(self, report: CitizenReport):
        """Create incident from validated report"""

        if not self.incident_service:
            logger.error("Incident service not available")
            return

        from services.incident_service import IncidentType, SeverityLevel, Coordinates

        # Map report type to incident type
        incident_type_map = {
            CitizenReportType.ACCIDENT: IncidentType.ACCIDENT,
            CitizenReportType.HAZARD: IncidentType.HAZARD,
            CitizenReportType.BROKEN_TRAFFIC_LIGHT: IncidentType.HAZARD,
            CitizenReportType.ROAD_BLOCK: IncidentType.HAZARD,
            CitizenReportType.STOLEN_VEHICLE: IncidentType.HAZARD,
            CitizenReportType.SUSPICIOUS_ACTIVITY: IncidentType.HAZARD,
        }

        incident_type = incident_type_map.get(report.type, IncidentType.HAZARD)

        # Determine severity
        severity = SeverityLevel.MEDIUM
        if incident_type == IncidentType.ACCIDENT:
            severity = SeverityLevel.HIGH

        # Create incident
        location = Coordinates(lat=report.latitude, lng=report.longitude)

        incident = self.incident_service.create_incident(
            incident_type=incident_type,
            location=location,
            address=report.address,
            road_name="",  # Would need reverse geocoding
            description=report.description,
            severity_modifier=severity,
            detected_by="citizen",
            ai_confidence=report.ai_confidence,
            metadata={"citizen_report_id": report.id},
        )

        report.incident_id = incident.id
        report.status = CitizenReportStatus.INCIDENT_CREATED
        report.updated_at = datetime.now(timezone.utc)

        logger.info(f"Created incident {incident.id} from report {report.id}")

    def get_report(self, report_id: str) -> Optional[CitizenReport]:
        """Get report by ID"""
        return self.reports.get(report_id)

    def get_reports(
        self, status: Optional[CitizenReportStatus] = None, limit: int = 100
    ) -> List[CitizenReport]:
        """Get reports with optional filters"""

        results = list(self.reports.values())

        if status:
            results = [r for r in results if r.status == status]

        results.sort(key=lambda x: x.created_at, reverse=True)
        return results[:limit]

    def get_reports_by_incident(self, incident_id: str) -> List[CitizenReport]:
        """Get reports for an incident"""
        return [r for r in self.reports.values() if r.incident_id == incident_id]


# Global instance
citizen_report_service = CitizenReportService()
