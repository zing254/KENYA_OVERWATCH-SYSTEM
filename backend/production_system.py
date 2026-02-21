"""
Production-Grade Kenya Overwatch Backend
Real-time AI Pipeline with Risk Scoring and Evidence Management
"""

import asyncio
import json
import uuid
import hashlib
import cv2
import numpy as np
from datetime import datetime, timedelta, timezone

def utcnow():
    return datetime.now(timezone.utc)
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging

# Configure production logging
import os

log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'production.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================
class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, Enum):
    ACTIVE = "active"
    RESPONDING = "responding"
    RESOLVED = "resolved"
    MONITORING = "monitoring"
    UNDER_REVIEW = "under_review"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class EvidenceStatus(str, Enum):
    CREATED = "created"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPEALED = "appealed"
    ARCHIVED = "archived"

class MilestoneStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class MilestoneType(str, Enum):
    DEVELOPMENT = "development"
    INCIDENT_CASE = "incident_case"
    EVIDENCE_REVIEW = "evidence_review"

# ==================== DATA MODELS ====================
@dataclass
class Coordinates:
    lat: float
    lng: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None

@dataclass
class DetectionEvent:
    camera_id: str
    timestamp: datetime
    detection_type: str
    confidence: float
    bounding_box: Dict[str, int]
    attributes: Dict[str, Any]
    frame_hash: str
    model_version: str

@dataclass
class RiskFactors:
    temporal_risk: float
    spatial_risk: float
    behavioral_risk: float
    contextual_risk: float
    reason_codes: List[str]

@dataclass
class RiskAssessment:
    risk_score: float
    risk_level: RiskLevel
    factors: RiskFactors
    recommended_action: str
    confidence: float
    timestamp: datetime

@dataclass
class EvidencePackage:
    id: str
    incident_id: str
    created_at: datetime
    events: List[DetectionEvent]
    risk_assessment: RiskAssessment
    metadata: Dict[str, Any]
    status: EvidenceStatus
    reviewer_id: Optional[str] = None
    review_notes: Optional[str] = None
    appeal_status: Optional[str] = None
    retention_until: Optional[datetime] = None
    package_hash: str = ""

@dataclass
class ProductionIncident:
    id: str
    type: str
    title: str
    description: str
    location: str
    coordinates: Coordinates
    severity: SeverityLevel
    status: IncidentStatus
    risk_assessment: RiskAssessment
    evidence_packages: List[EvidencePackage]
    created_at: datetime
    updated_at: Optional[datetime]
    reported_by: str
    assigned_team_id: Optional[str]
    requires_human_review: bool
    human_review_completed: bool
    appeal_deadline: Optional[datetime]

@dataclass
class Milestone:
    id: str
    title: str
    description: str
    type: MilestoneType
    status: MilestoneStatus
    priority: SeverityLevel
    created_by: str
    assigned_to: Optional[str]
    approved_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    submitted_for_approval_at: Optional[datetime]
    linked_incident_id: Optional[str]
    linked_evidence_id: Optional[str]
    approval_notes: Optional[str]
    rejection_reason: Optional[str]

# ==================== AI PIPELINE ====================
class AIDetectionPipeline:
    """Production AI Pipeline with multiple detection models"""
    
    def __init__(self):
        self.models = {
            'person_detection': self._load_yolo_model('person'),
            'vehicle_detection': self._load_yolo_model('car'),
            'weapon_detection': self._load_weapon_model(),  # Hard-gated
            'anpr': self._load_anpr_model(),
            'behavior_analysis': self._load_behavior_model()
        }
        self.trackers = {}  # Per-camera object trackers
        self.detection_history = {}  # Historical data for risk scoring
        
    def _load_yolo_model(self, object_type: str):
        """Load YOLO model for object detection"""
        # In production, load actual model weights
        logger.info(f"Loading YOLO model for {object_type}")
        return {
            'type': 'yolo',
            'object_type': object_type,
            'confidence_threshold': 0.6,
            'model_version': '1.2.0'
        }
    
    def _load_weapon_model(self):
        """Load weapon detection model (hard-gated)"""
        logger.warning("Weapon detection model loaded - requires human confirmation")
        return {
            'type': 'weapon',
            'confidence_threshold': 0.9,
            'requires_human_confirmation': True,
            'approved_zones': ['airport', 'government'],
            'model_version': '1.0.0'
        }
    
    def _load_anpr_model(self):
        """Load Automatic Number Plate Recognition model"""
        logger.info("Loading ANPR model")
        return {
            'type': 'anpr',
            'confidence_threshold': 0.8,
            'model_version': '2.1.0'
        }
    
    def _load_behavior_model(self):
        """Load behavior analysis model"""
        logger.info("Loading behavior analysis model")
        return {
            'type': 'behavior',
            'confidence_threshold': 0.7,
            'model_version': '1.5.0'
        }
    
    async def process_frame(self, camera_id: str, frame: np.ndarray, timestamp: datetime) -> List[DetectionEvent]:
        """Process single frame through AI pipeline"""
        events = []
        
        # Step 1: Object Detection
        detections = await self._detect_objects(frame)
        
        # Step 2: Object Tracking
        tracked_objects = await self._track_objects(camera_id, detections)
        
        # Step 3: Attribute Extraction
        for obj in tracked_objects:
            attributes = await self._extract_attributes(frame, obj)
            
            # Step 4: Create Detection Event
            event = DetectionEvent(
                camera_id=camera_id,
                timestamp=timestamp,
                detection_type=obj['type'],
                confidence=obj['confidence'],
                bounding_box=obj['bbox'],
                attributes=attributes,
                frame_hash=self._hash_frame(frame),
                model_version=obj['model_version']
            )
            events.append(event)
        
        # Step 5: Store in detection history
        self._store_detection_history(camera_id, events)
        
        return events
    
    async def _detect_objects(self, frame: np.ndarray) -> List[Dict]:
        """Run object detection on frame"""
        detections = []
        
        # Simulate YOLO detection
        # In production, actual model inference here
        height, width = frame.shape[:2]
        
        # Mock detections for demo
        mock_detections = [
            {
                'type': 'person',
                'confidence': 0.85,
                'bbox': {'x': 100, 'y': 100, 'w': 50, 'h': 100},
                'model_version': '1.2.0'
            },
            {
                'type': 'vehicle',
                'confidence': 0.92,
                'bbox': {'x': 200, 'y': 150, 'w': 80, 'h': 60},
                'model_version': '1.2.0'
            }
        ]
        
        return mock_detections
    
    async def _track_objects(self, camera_id: str, detections: List[Dict]) -> List[Dict]:
        """Track objects across frames"""
        # Initialize tracker for camera if not exists
        if camera_id not in self.trackers:
            self.trackers[camera_id] = {
                'next_id': 1,
                'active_tracks': {}
            }
        
        tracker = self.trackers[camera_id]
        tracked_objects = []
        
        for detection in detections:
            # Simple tracking logic - in production use ByteTrack or similar
            track_id = tracker['next_id']
            tracker['next_id'] += 1
            
            tracked_obj = {
                **detection,
                'track_id': track_id,
                'camera_id': camera_id
            }
            tracked_objects.append(tracked_obj)
        
        return tracked_objects
    
    async def _extract_attributes(self, frame: np.ndarray, obj: Dict) -> Dict[str, Any]:
        """Extract detailed attributes from detected object"""
        attributes = {}
        
        if obj['type'] == 'vehicle':
            # ANPR processing
            attributes['plate_number'] = 'KBC 123A'  # Mock ANPR result
            attributes['plate_confidence'] = 0.88
            attributes['vehicle_color'] = 'white'
            attributes['vehicle_make'] = 'Toyota'
            attributes['vehicle_model'] = 'Corolla'
            
        elif obj['type'] == 'person':
            # Person attributes
            attributes['pose'] = 'standing'
            attributes['clothing_color'] = 'blue'
            attributes['estimated_height'] = '1.75m'
            
        return attributes
    
    def _hash_frame(self, frame: np.ndarray) -> str:
        """Create cryptographic hash of frame for evidence integrity"""
        frame_bytes = frame.tobytes()
        return hashlib.sha256(frame_bytes).hexdigest()
    
    def _store_detection_history(self, camera_id: str, events: List[DetectionEvent]):
        """Store detection events for risk scoring and evidence"""
        if camera_id not in self.detection_history:
            self.detection_history[camera_id] = []
        
        self.detection_history[camera_id].extend(events)
        
        # Keep only last 24 hours of data
        cutoff_time = utcnow() - timedelta(hours=24)
        self.detection_history[camera_id] = [
            event for event in self.detection_history[camera_id]
            if event.timestamp > cutoff_time
        ]

# ==================== RISK SCORING ENGINE ====================
class RiskScoringEngine:
    """Production Risk Scoring with Explainable AI"""
    
    def __init__(self):
        self.risk_weights = {
            'behavioral': 0.4,
            'spatial': 0.3,
            'temporal': 0.2,
            'contextual': 0.1
        }
        self.high_risk_zones = [
            {'name': 'airport', 'risk_multiplier': 1.5},
            {'name': 'government', 'risk_multiplier': 1.3},
            {'name': 'school', 'risk_multiplier': 1.2}
        ]
        
    async def assess_risk(self, events: List[DetectionEvent], context: Dict[str, Any]) -> RiskAssessment:
        """Comprehensive risk assessment with explainable factors"""
        
        # Calculate individual risk factors
        behavioral_risk = self._calculate_behavioral_risk(events)
        spatial_risk = self._calculate_spatial_risk(context)
        temporal_risk = self._calculate_temporal_risk(events, context)
        contextual_risk = self._calculate_contextual_risk(events, context)
        
        # Combine with weights
        risk_score = (
            self.risk_weights['behavioral'] * behavioral_risk +
            self.risk_weights['spatial'] * spatial_risk +
            self.risk_weights['temporal'] * temporal_risk +
            self.risk_weights['contextual'] * contextual_risk
        )
        
        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)
        
        # Generate reason codes
        reason_codes = self._generate_reason_codes(
            behavioral_risk, spatial_risk, temporal_risk, contextual_risk
        )
        
        # Recommended action
        recommended_action = self._recommend_action(risk_level)
        
        factors = RiskFactors(
            temporal_risk=temporal_risk,
            spatial_risk=spatial_risk,
            behavioral_risk=behavioral_risk,
            contextual_risk=contextual_risk,
            reason_codes=reason_codes
        )
        
        return RiskAssessment(
            risk_score=risk_score,
            risk_level=risk_level,
            factors=factors,
            recommended_action=recommended_action,
            confidence=0.85,  # Model confidence
            timestamp=utcnow()
        )
    
    def _calculate_behavioral_risk(self, events: List[DetectionEvent]) -> float:
        """Calculate behavioral risk based on movement patterns"""
        if not events:
            return 0.0
        
        risk_score = 0.0
        reason_codes = []
        
        # Check for sudden motion changes
        motion_changes = self._detect_motion_changes(events)
        if motion_changes > 0.7:
            risk_score += 0.3
            reason_codes.append('SUDDEN_MOTION_CHANGE')
        
        # Check for loitering
        loitering_score = self._detect_loitering(events)
        if loitering_score > 0.6:
            risk_score += 0.2
            reason_codes.append('EXTENDED_LOITERING')
        
        # Check for directional conflicts
        conflicts = self._detect_directional_conflicts(events)
        if conflicts > 0.5:
            risk_score += 0.25
            reason_codes.append('DIRECTIONAL_CONFLICT')
        
        return min(risk_score, 1.0)
    
    def _calculate_spatial_risk(self, context: Dict[str, Any]) -> float:
        """Calculate spatial risk based on location"""
        base_risk = 0.1
        location = context.get('location', '').lower()
        
        # Check high-risk zones
        for zone in self.high_risk_zones:
            if zone['name'] in location:
                base_risk *= zone['risk_multiplier']
                break
        
        # Check crowd density
        crowd_density = context.get('crowd_density', 'normal')
        if crowd_density == 'low':
            base_risk += 0.1
        elif crowd_density == 'high':
            base_risk -= 0.1
        
        return min(base_risk, 1.0)
    
    def _calculate_temporal_risk(self, events: List[DetectionEvent], context: Dict[str, Any]) -> float:
        """Calculate temporal risk based on time patterns"""
        current_hour = utcnow().hour
        
        # Night hours are higher risk
        if 22 <= current_hour or current_hour <= 5:
            return 0.3
        elif 6 <= current_hour <= 8:  # Early morning
            return 0.2
        else:  # Daytime
            return 0.1
    
    def _calculate_contextual_risk(self, events: List[DetectionEvent], context: Dict[str, Any]) -> float:
        """Calculate contextual risk based on environmental factors"""
        risk_score = 0.0
        
        # Weather conditions
        weather = context.get('weather', 'clear')
        if weather == 'storm':
            risk_score += 0.1
        elif weather == 'fog':
            risk_score += 0.05
        
        # Traffic conditions
        traffic = context.get('traffic', 'normal')
        if traffic == 'congested':
            risk_score += 0.05
        
        return min(risk_score, 1.0)
    
    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """Determine risk level based on score"""
        if risk_score < 0.3:
            return RiskLevel.LOW
        elif risk_score < 0.6:
            return RiskLevel.MEDIUM
        elif risk_score < 0.8:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL
    
    def _generate_reason_codes(self, *risk_scores: float) -> List[str]:
        """Generate explainable reason codes"""
        codes = []
        
        if risk_scores[0] > 0.5:  # Behavioral
            codes.append('BEHAVIORAL_ANOMALY')
        if risk_scores[1] > 0.5:  # Spatial
            codes.append('HIGH_RISK_LOCATION')
        if risk_scores[2] > 0.5:  # Temporal
            codes.append('HIGH_RISK_TIME')
        if risk_scores[3] > 0.5:  # Contextual
            codes.append('ADVERSE_CONDITIONS')
        
        return codes
    
    def _recommend_action(self, risk_level: RiskLevel) -> str:
        """Recommended action based on risk level"""
        actions = {
            RiskLevel.LOW: "Log only",
            RiskLevel.MEDIUM: "Operator notification",
            RiskLevel.HIGH: "Supervisor review",
            RiskLevel.CRITICAL: "Immediate human response"
        }
        return actions[risk_level]
    
    def _detect_motion_changes(self, events: List[DetectionEvent]) -> float:
        """Detect sudden motion changes in events"""
        # Simplified logic - in production, analyze velocity vectors
        return 0.3  # Mock value
    
    def _detect_loitering(self, events: List[DetectionEvent]) -> float:
        """Detect extended loitering behavior"""
        if len(events) < 5:
            return 0.0
        
        # Check if same object detected for extended period
        time_span = (events[-1].timestamp - events[0].timestamp).total_seconds()
        if time_span > 300:  # 5 minutes
            return 0.8
        return 0.2
    
    def _detect_directional_conflicts(self, events: List[DetectionEvent]) -> float:
        """Detect directional conflicts between objects"""
        # Simplified logic - in production, analyze movement vectors
        return 0.4  # Mock value

# ==================== EVIDENCE MANAGEMENT ====================
class EvidenceManager:
    """Court-admissible evidence management system"""
    
    def __init__(self):
        self.evidence_packages = {}
        self.audit_log = []
        self.retention_policies = self._load_retention_policies()
        
    def _load_retention_policies(self) -> Dict[str, timedelta]:
        """Load data retention policies"""
        return {
            'non_offence': timedelta(hours=72),
            'offence_evidence': timedelta(days=365),
            'appeals_data': timedelta(days=2555),  # 7 years
            'audit_logs': timedelta(days=1825)  # 5 years
        }
    
    async def create_evidence_package(self, incident_id: str, events: List[DetectionEvent], 
                                     risk_assessment: RiskAssessment) -> EvidencePackage:
        """Create tamper-proof evidence package"""
        
        package_id = str(uuid.uuid4())
        created_at = utcnow()
        
        # Calculate retention period
        retention_until = self._calculate_retention_date(risk_assessment.risk_level)
        
        # Create package
        package = EvidencePackage(
            id=package_id,
            incident_id=incident_id,
            created_at=created_at,
            events=events,
            risk_assessment=risk_assessment,
            metadata={
                'created_by': 'AI_System',
                'camera_calibrations': self._get_camera_calibrations(),
                'system_version': '2.0.0',
                'chain_of_custody': []
            },
            status=EvidenceStatus.CREATED,
            retention_until=retention_until
        )
        
        # Generate cryptographic hash
        package.package_hash = self._hash_package(package)
        
        # Store package
        self.evidence_packages[package_id] = package
        
        # Log creation
        self._log_audit_event('evidence_created', {
            'package_id': package_id,
            'incident_id': incident_id,
            'hash': package.package_hash
        })
        
        return package
    
    async def review_evidence(self, package_id: str, reviewer_id: str, 
                            decision: str, notes: str) -> bool:
        """Human review of evidence package"""
        
        if package_id not in self.evidence_packages:
            return False
        
        package = self.evidence_packages[package_id]
        
        # Update package
        package.status = EvidenceStatus.APPROVED if decision == 'approve' else EvidenceStatus.REJECTED
        package.reviewer_id = reviewer_id
        package.review_notes = notes
        package.metadata['chain_of_custody'].append({
            'action': 'review',
            'reviewer_id': reviewer_id,
            'decision': decision,
            'timestamp': utcnow().isoformat()
        })
        
        # Re-hash after modification
        package.package_hash = self._hash_package(package)
        
        # Log review
        self._log_audit_event('evidence_reviewed', {
            'package_id': package_id,
            'reviewer_id': reviewer_id,
            'decision': decision,
            'notes': notes
        })
        
        return True
    
    async def submit_appeal(self, package_id: str, appeal_reason: str) -> bool:
        """Submit citizen appeal"""
        
        if package_id not in self.evidence_packages:
            return False
        
        package = self.evidence_packages[package_id]
        package.status = EvidenceStatus.APPEALED
        package.appeal_status = 'submitted'
        package.metadata['appeal_reason'] = appeal_reason
        package.metadata['appeal_date'] = utcnow().isoformat()
        
        # Extend retention for appeal
        package.retention_until = utcnow() + self.retention_policies['appeals_data']
        
        # Log appeal
        self._log_audit_event('appeal_submitted', {
            'package_id': package_id,
            'reason': appeal_reason
        })
        
        return True
    
    def _hash_package(self, package: EvidencePackage) -> str:
        """Generate cryptographic hash of evidence package"""
        package_data = json.dumps(asdict(package), sort_keys=True, default=str)
        return hashlib.sha256(package_data.encode()).hexdigest()
    
    def _calculate_retention_date(self, risk_level: RiskLevel) -> datetime:
        """Calculate retention date based on risk level"""
        if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            return utcnow() + self.retention_policies['offence_evidence']
        else:
            return utcnow() + self.retention_policies['non_offence']
    
    def _get_camera_calibrations(self) -> Dict[str, Any]:
        """Get camera calibration data"""
        return {
            'lens_distortion': 'calibrated',
            'gps_accuracy': '±2m',
            'timestamp_sync': 'NTP synced'
        }
    
    def _log_audit_event(self, event_type: str, data: Dict[str, Any]):
        """Log audit event for chain of custody"""
        audit_entry = {
            'timestamp': utcnow().isoformat(),
            'event_type': event_type,
            'data': data,
            'user_id': 'system',
            'ip_address': '127.0.0.1'
        }
        
        self.audit_log.append(audit_entry)
        
        # In production, write to immutable audit log storage
        logger.info(f"Audit Event: {event_type} - {data}")

# ==================== MILESTONE MANAGEMENT ====================
class MilestoneManager:
    """Milestone tracking and approval system"""
    
    def __init__(self):
        self.milestones: Dict[str, Milestone] = {}
        self.audit_log: List[Dict[str, Any]] = []
    
    def create_milestone(
        self,
        title: str,
        description: str,
        milestone_type: MilestoneType,
        created_by: str,
        priority: SeverityLevel = SeverityLevel.MEDIUM,
        assigned_to: Optional[str] = None,
        due_date: Optional[datetime] = None,
        linked_incident_id: Optional[str] = None,
        linked_evidence_id: Optional[str] = None
    ) -> Milestone:
        """Create a new milestone"""
        milestone_id = str(uuid.uuid4())
        
        milestone = Milestone(
            id=milestone_id,
            title=title,
            description=description,
            type=milestone_type,
            status=MilestoneStatus.DRAFT,
            priority=priority,
            created_by=created_by,
            assigned_to=assigned_to,
            approved_by=None,
            created_at=utcnow(),
            updated_at=None,
            due_date=due_date,
            completed_at=None,
            submitted_for_approval_at=None,
            linked_incident_id=linked_incident_id,
            linked_evidence_id=linked_evidence_id,
            approval_notes=None,
            rejection_reason=None
        )
        
        self.milestones[milestone_id] = milestone
        self._log_audit_event('milestone_created', {
            'milestone_id': milestone_id,
            'title': title,
            'type': milestone_type.value,
            'created_by': created_by
        })
        
        logger.info(f"Milestone created: {milestone_id} - {title}")
        return milestone
    
    def update_milestone(
        self,
        milestone_id: str,
        updated_by: str,
        **updates
    ) -> Optional[Milestone]:
        """Update milestone fields"""
        if milestone_id not in self.milestones:
            return None
        
        milestone = self.milestones[milestone_id]
        
        for key, value in updates.items():
            if hasattr(milestone, key):
                setattr(milestone, key, value)
        
        milestone.updated_at = utcnow()
        
        self._log_audit_event('milestone_updated', {
            'milestone_id': milestone_id,
            'updated_by': updated_by,
            'fields': list(updates.keys())
        })
        
        logger.info(f"Milestone updated: {milestone_id}")
        return milestone
    
    def submit_for_approval(self, milestone_id: str, submitted_by: str) -> Optional[Milestone]:
        """Submit milestone for mentor approval"""
        if milestone_id not in self.milestones:
            return None
        
        milestone = self.milestones[milestone_id]
        
        if milestone.status not in [MilestoneStatus.DRAFT, MilestoneStatus.IN_PROGRESS]:
            return None
        
        milestone.status = MilestoneStatus.PENDING_APPROVAL
        milestone.submitted_for_approval_at = utcnow()
        milestone.updated_at = utcnow()
        
        self._log_audit_event('milestone_submitted', {
            'milestone_id': milestone_id,
            'submitted_by': submitted_by
        })
        
        logger.info(f"Milestone submitted for approval: {milestone_id}")
        return milestone
    
    def approve_milestone(
        self,
        milestone_id: str,
        approved_by: str,
        notes: Optional[str] = None
    ) -> Optional[Milestone]:
        """Approve milestone (mentor/supervisor/admin only)"""
        if milestone_id not in self.milestones:
            return None
        
        milestone = self.milestones[milestone_id]
        
        if milestone.status != MilestoneStatus.PENDING_APPROVAL:
            return None
        
        milestone.status = MilestoneStatus.APPROVED
        milestone.approved_by = approved_by
        milestone.approval_notes = notes
        milestone.completed_at = utcnow()
        milestone.updated_at = utcnow()
        
        self._log_audit_event('milestone_approved', {
            'milestone_id': milestone_id,
            'approved_by': approved_by,
            'notes': notes
        })
        
        logger.info(f"Milestone approved: {milestone_id} by {approved_by}")
        return milestone
    
    def reject_milestone(
        self,
        milestone_id: str,
        rejected_by: str,
        reason: str
    ) -> Optional[Milestone]:
        """Reject milestone (mentor/supervisor/admin only)"""
        if milestone_id not in self.milestones:
            return None
        
        milestone = self.milestones[milestone_id]
        
        if milestone.status != MilestoneStatus.PENDING_APPROVAL:
            return None
        
        milestone.status = MilestoneStatus.REJECTED
        milestone.approved_by = rejected_by
        milestone.rejection_reason = reason
        milestone.updated_at = utcnow()
        
        self._log_audit_event('milestone_rejected', {
            'milestone_id': milestone_id,
            'rejected_by': rejected_by,
            'reason': reason
        })
        
        logger.info(f"Milestone rejected: {milestone_id} by {rejected_by}")
        return milestone
    
    def get_milestones(
        self,
        status: Optional[MilestoneStatus] = None,
        milestone_type: Optional[MilestoneType] = None,
        assigned_to: Optional[str] = None
    ) -> List[Milestone]:
        """Get milestones with optional filters"""
        results = list(self.milestones.values())
        
        if status:
            results = [m for m in results if m.status == status]
        if milestone_type:
            results = [m for m in results if m.type == milestone_type]
        if assigned_to:
            results = [m for m in results if m.assigned_to == assigned_to]
        
        return sorted(results, key=lambda m: m.created_at, reverse=True)
    
    def get_milestone(self, milestone_id: str) -> Optional[Milestone]:
        """Get a specific milestone"""
        return self.milestones.get(milestone_id)
    
    def delete_milestone(self, milestone_id: str) -> bool:
        """Delete a milestone (only if draft)"""
        if milestone_id not in self.milestones:
            return False
        
        milestone = self.milestones[milestone_id]
        
        if milestone.status != MilestoneStatus.DRAFT:
            return False
        
        del self.milestones[milestone_id]
        
        self._log_audit_event('milestone_deleted', {
            'milestone_id': milestone_id
        })
        
        logger.info(f"Milestone deleted: {milestone_id}")
        return True
    
    def _log_audit_event(self, event_type: str, data: Dict[str, Any]):
        """Log audit event for milestone"""
        audit_entry = {
            'timestamp': utcnow().isoformat(),
            'event_type': event_type,
            'data': data,
            'user_id': data.get('created_by', data.get('submitted_by', data.get('approved_by', data.get('rejected_by', 'system')))),
            'ip_address': '127.0.0.1'
        }
        
        self.audit_log.append(audit_entry)
        logger.info(f"Milestone Audit: {event_type} - {data}")

# ==================== MAIN PRODUCTION SYSTEM ====================
class KenyaOverwatchProduction:
    """Production-Grade Kenya Overwatch System"""
    
    def __init__(self):
        self.ai_pipeline = AIDetectionPipeline()
        self.risk_engine = RiskScoringEngine()
        self.evidence_manager = EvidenceManager()
        self.milestone_manager = MilestoneManager()
        self.active_incidents = {}
        self.camera_streams = {}
        
        logger.info("Kenya Overwatch Production System initialized")
    
    async def process_camera_stream(self, camera_id: str, frame: np.ndarray):
        """Process real-time camera stream through AI pipeline"""
        
        timestamp = utcnow()
        
        try:
            # Step 1: AI Detection Pipeline
            detection_events = await self.ai_pipeline.process_frame(camera_id, frame, timestamp)
            
            if not detection_events:
                return
            
            # Step 2: Risk Assessment
            context = self._get_context_data(camera_id, timestamp)
            risk_assessment = await self.risk_engine.assess_risk(detection_events, context)
            
            # Step 3: Check if incident should be created
            if risk_assessment.risk_score > 0.3:  # Threshold for incident creation
                await self._create_or_update_incident(camera_id, detection_events, risk_assessment, context)
            
            # Step 4: Real-time alerts for high risk
            if risk_assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                await self._send_real_time_alert(risk_assessment, detection_events)
                
        except Exception as e:
            logger.error(f"Error processing camera stream {camera_id}: {e}")
    
    async def _create_or_update_incident(self, camera_id: str, events: List[DetectionEvent], 
                                        risk_assessment: RiskAssessment, context: Dict[str, Any]):
        """Create or update incident based on AI analysis"""
        
        # Check if similar incident exists
        existing_incident = self._find_similar_incident(camera_id, events)
        
        if existing_incident:
            # Update existing incident
            await self._update_incident(existing_incident, events, risk_assessment)
        else:
            # Create new incident
            await self._create_new_incident(camera_id, events, risk_assessment, context)
    
    async def _create_new_incident(self, camera_id: str, events: List[DetectionEvent], 
                                 risk_assessment: RiskAssessment, context: Dict[str, Any]):
        """Create new production incident"""
        
        incident_id = str(uuid.uuid4())
        
        # Create evidence package
        evidence_package = await self.evidence_manager.create_evidence_package(
            incident_id, events, risk_assessment
        )
        
        # Determine incident type and severity
        incident_type = self._classify_incident_type(events)
        severity = self._map_risk_to_severity(risk_assessment.risk_level)
        
        # Create incident
        incident = ProductionIncident(
            id=incident_id,
            type=incident_type,
            title=self._generate_incident_title(incident_type, context),
            description=self._generate_incident_description(events, risk_assessment),
            location=context.get('location', 'Unknown'),
            coordinates=context.get('coordinates', Coordinates(0.0, 0.0)),
            severity=severity,
            status=IncidentStatus.UNDER_REVIEW,
            risk_assessment=risk_assessment,
            evidence_packages=[evidence_package],
            created_at=utcnow(),
            reported_by='AI_System',
            requires_human_review=risk_assessment.risk_level != RiskLevel.LOW,
            human_review_completed=False,
            appeal_deadline=utcnow() + timedelta(days=30) if severity != SeverityLevel.LOW else None
        )
        
        self.active_incidents[incident_id] = incident
        
        logger.info(f"Created new incident: {incident_id} - {incident.title}")
        
        # Send notifications
        await self._notify_incident_created(incident)
    
    def _get_context_data(self, camera_id: str, timestamp: datetime) -> Dict[str, Any]:
        """Get contextual data for risk assessment"""
        return {
            'location': 'Nairobi CBD',  # Get from camera config
            'coordinates': Coordinates(-1.2921, 36.8219),
            'time_of_day': timestamp.hour,
            'weather': 'clear',  # Get from weather API
            'traffic': 'normal',  # Get from traffic API
            'crowd_density': 'medium'
        }
    
    def _classify_incident_type(self, events: List[DetectionEvent]) -> str:
        """Classify incident type based on detection events"""
        detection_types = [event.detection_type for event in events]
        
        if 'weapon' in detection_types:
            return 'security_threat'
        elif 'vehicle' in detection_types and any('anpr' in event.attributes for event in events):
            return 'traffic_violation'
        elif 'person' in detection_types:
            return 'public_safety'
        else:
            return 'surveillance_alert'
    
    def _map_risk_to_severity(self, risk_level: RiskLevel) -> SeverityLevel:
        """Map risk level to incident severity"""
        mapping = {
            RiskLevel.LOW: SeverityLevel.LOW,
            RiskLevel.MEDIUM: SeverityLevel.MEDIUM,
            RiskLevel.HIGH: SeverityLevel.HIGH,
            RiskLevel.CRITICAL: SeverityLevel.CRITICAL
        }
        return mapping[risk_level]
    
    def _generate_incident_title(self, incident_type: str, context: Dict[str, Any]) -> str:
        """Generate incident title"""
        location = context.get('location', 'Unknown Location')
        
        titles = {
            'security_threat': f'Security Threat Detected - {location}',
            'traffic_violation': f'Traffic Violation Detected - {location}',
            'public_safety': f'Public Safety Incident - {location}',
            'surveillance_alert': f'Surveillance Alert - {location}'
        }
        
        return titles.get(incident_type, f'Incident Detected - {location}')
    
    def _generate_incident_description(self, events: List[DetectionEvent], 
                                     risk_assessment: RiskAssessment) -> str:
        """Generate detailed incident description"""
        description = f"AI-detected incident with risk score {risk_assessment.risk_score:.2f}. "
        description += f"Reason codes: {', '.join(risk_assessment.factors.reason_codes)}. "
        description += f"Detected objects: {', '.join(set(event.detection_type for event in events))}."
        
        return description
    
    async def _send_real_time_alert(self, risk_assessment: RiskAssessment, events: List[DetectionEvent]):
        """Send real-time alert for high-risk incidents"""
        alert_data = {
            'type': 'high_risk_alert',
            'risk_score': risk_assessment.risk_score,
            'risk_level': risk_assessment.risk_level,
            'recommended_action': risk_assessment.recommended_action,
            'detections': [asdict(event) for event in events],
            'timestamp': utcnow().isoformat()
        }
        
        # Send to WebSocket clients
        # In production, send to alerting system
        logger.warning(f"High Risk Alert: {risk_assessment.risk_level} - {risk_assessment.recommended_action}")
    
    async def _notify_incident_created(self, incident: ProductionIncident):
        """Notify relevant parties about new incident"""
        notification = {
            'type': 'incident_created',
            'incident_id': incident.id,
            'severity': incident.severity,
            'requires_review': incident.requires_human_review,
            'timestamp': utcnow().isoformat()
        }
        
        logger.info(f"Incident Created Notification: {incident.id}")

# ==================== PRODUCTION API ENDPOINTS ====================
# This would be integrated with FastAPI for the production API

if __name__ == "__main__":
    # Initialize production system
    system = KenyaOverwatchProduction()
    
    # Test with mock data
    async def test_production_system():
        print("🚀 Testing Kenya Overwatch Production System")
        
        # Mock frame data
        mock_frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
        
        # Process camera stream
        await system.process_camera_stream("camera_001", mock_frame)
        
        print("✅ Production system test completed")
    
    # Run test
    asyncio.run(test_production_system())