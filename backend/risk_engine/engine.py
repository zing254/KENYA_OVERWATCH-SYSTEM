"""
Kenya Overwatch Risk Engine
Real-time risk assessment and scoring
"""

import hashlib
import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """Risk levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskCategory(Enum):
    """Risk categories"""

    TEMPORAL = "temporal"
    SPATIAL = "spatial"
    BEHAVIORAL = "behavioral"
    CONTEXTUAL = "contextual"
    HISTORICAL = "historical"


@dataclass
class RiskFactors:
    """Individual risk factors"""

    temporal_risk: float = 0.0
    spatial_risk: float = 0.0
    behavioral_risk: float = 0.0
    contextual_risk: float = 0.0
    historical_risk: float = 0.0

    def to_dict(self) -> Dict:
        return {
            "temporal_risk": self.temporal_risk,
            "spatial_risk": self.spatial_risk,
            "behavioral_risk": self.behavioral_risk,
            "contextual_risk": self.contextual_risk,
            "historical_risk": self.historical_risk,
        }


@dataclass
class RiskAssessment:
    """Complete risk assessment result"""

    id: str = field(default_factory=lambda: str(uuid.uuid4())[:12])
    risk_score: float = 0.0
    risk_level: RiskLevel = RiskLevel.LOW
    factors: RiskFactors = field(default_factory=RiskFactors)
    confidence: float = 0.0
    recommended_action: str = ""
    reason_codes: List[str] = field(default_factory=list)
    location: Optional[Dict[str, float]] = None
    camera_id: Optional[str] = None
    incident_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level.value,
            "factors": self.factors.to_dict(),
            "confidence": self.confidence,
            "recommended_action": self.recommended_action,
            "reason_codes": self.reason_codes,
            "location": self.location,
            "camera_id": self.camera_id,
            "incident_id": self.incident_id,
            "timestamp": self.timestamp.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


class RiskEngine:
    """Main risk assessment engine with performance optimizations"""

    def __init__(self):
        self.high_threshold = 0.7
        self.critical_threshold = 0.85

        self.temporal_weights = {
            "hour_23_5": 0.9,
            "hour_0_5": 0.9,
            "hour_5_7": 0.7,
            "hour_7_9": 0.3,
            "hour_9_17": 0.2,
            "hour_17_20": 0.4,
            "hour_20_23": 0.6,
        }

        self.spatial_weights = {
            "bank": 0.8,
            "atm": 0.7,
            "jewelry_store": 0.8,
            "government": 0.7,
            "school": 0.5,
            "hospital": 0.5,
            "residential": 0.3,
            "commercial": 0.4,
            "street": 0.3,
            "park": 0.4,
        }

        self.incident_type_weights = {
            "theft": 0.7,
            "robbery": 0.9,
            "assault": 0.8,
            "burglary": 0.7,
            "vandalism": 0.4,
            "suspicious_activity": 0.5,
            "fire": 0.8,
            "accident": 0.6,
            "traffic_violation": 0.3,
            "weapon_detected": 0.95,
            "intrusion": 0.8,
        }

        self.crime_hotspots: Dict[str, Dict] = {
            "nairobi_cbd": {"lat": -1.2864, "lng": 36.8232, "risk": 0.75},
            "westlands": {"lat": -1.2644, "lng": 36.8019, "risk": 0.65},
            "eastleigh": {"lat": -1.2789, "lng": 36.8512, "risk": 0.60},
            "kasarani": {"lat": -1.2206, "lng": 36.8967, "risk": 0.55},
            "mathare": {"lat": -1.2267, "lng": 36.8789, "risk": 0.50},
        }

        # Assessment history with size limits to prevent memory growth
        self.assessment_history: Dict[str, List[RiskAssessment]] = {}
        self.max_history_per_camera = 1000  # Keep last 1000 assessments per camera

        # Assessment cache to avoid recomputing identical assessments
        self.assessment_cache: Dict[str, RiskAssessment] = {}
        self.assessment_cache_ttl = 60  # Cache for 60 seconds

        # Pre-calculate squared thresholds for faster distance checks
        self.hotspot_threshold_sq = 0.02**2

    def assess_risk(
        self,
        incident_type: str,
        location: str,
        coordinates: Optional[Dict[str, float]] = None,
        camera_id: Optional[str] = None,
        detections: Optional[List[Dict]] = None,
        time_of_day: Optional[datetime] = None,
    ) -> RiskAssessment:
        """Perform comprehensive risk assessment with caching"""

        if time_of_day is None:
            time_of_day = datetime.now()

        # Generate cache key for identical assessments
        cache_key = self._generate_assessment_cache_key(
            incident_type, location, coordinates, camera_id, detections, time_of_day
        )

        # Check cache first
        if cache_key in self.assessment_cache:
            cached = self.assessment_cache[cache_key]
            # Check if cache entry is recent enough (within TTL)
            if datetime.now(timezone.utc) < cached.timestamp + timedelta(
                seconds=self.assessment_cache_ttl
            ):
                return cached

        # Perform assessment
        factors = RiskFactors()
        reason_codes = []

        factors.temporal_risk = self._calculate_temporal_risk(time_of_day)
        if factors.temporal_risk > 0.5:
            reason_codes.append("high_risk_time")

        factors.spatial_risk = self._calculate_spatial_risk(location, coordinates)
        if factors.spatial_risk > 0.5:
            reason_codes.append("high_risk_location")

        factors.behavioral_risk = self._calculate_behavioral_risk(detections or [])
        if factors.behavioral_risk > 0.5:
            reason_codes.append("suspicious_behavior")

        factors.contextual_risk = self._calculate_contextual_risk(incident_type)
        if factors.contextual_risk > 0.5:
            reason_codes.append(f"incident_type_{incident_type}")

        factors.historical_risk = self._calculate_historical_risk(location, coordinates)
        if factors.historical_risk > 0.5:
            reason_codes.append("high_crime_area")

        weights = {
            "temporal": 0.15,
            "spatial": 0.25,
            "behavioral": 0.30,
            "contextual": 0.20,
            "historical": 0.10,
        }

        risk_score = (
            factors.temporal_risk * weights["temporal"]
            + factors.spatial_risk * weights["spatial"]
            + factors.behavioral_risk * weights["behavioral"]
            + factors.contextual_risk * weights["contextual"]
            + factors.historical_risk * weights["historical"]
        )

        risk_score = min(1.0, max(0.0, risk_score))

        confidence = self._calculate_confidence(factors)

        risk_level = self._get_risk_level(risk_score)

        recommended_action = self._get_recommended_action(risk_level)

        assessment = RiskAssessment(
            risk_score=risk_score,
            risk_level=risk_level,
            factors=factors,
            confidence=confidence,
            recommended_action=recommended_action,
            reason_codes=reason_codes,
            location=coordinates,
            camera_id=camera_id,
            timestamp=time_of_day,
            expires_at=time_of_day + timedelta(minutes=15),
        )

        # Store in cache
        self.assessment_cache[cache_key] = assessment

        # Cleanup cache if too large (simple LRU-like eviction)
        if len(self.assessment_cache) > 10000:
            # Remove oldest entries (simple approach)
            keys_to_remove = list(self.assessment_cache.keys())[:1000]
            for key in keys_to_remove:
                del self.assessment_cache[key]

        if camera_id:
            if camera_id not in self.assessment_history:
                self.assessment_history[camera_id] = []
            self.assessment_history[camera_id].append(assessment)

            # Limit history size per camera (keep most recent)
            if len(self.assessment_history[camera_id]) > self.max_history_per_camera:
                self.assessment_history[camera_id] = self.assessment_history[camera_id][
                    -self.max_history_per_camera :
                ]

        logger.debug(
            f"Risk assessment: {risk_score:.2f} ({risk_level.value}) for {incident_type} at {location}"
        )

        return assessment

    def _generate_assessment_cache_key(
        self,
        incident_type: str,
        location: str,
        coordinates: Optional[Dict],
        camera_id: Optional[str],
        detections: Optional[List[Dict]],
        time_of_day: datetime,
    ) -> str:
        """Generate cache key for assessment"""
        key_data = {
            "type": incident_type,
            "location": location,
            "coords": coordinates,
            "camera": camera_id,
            "detections": detections,
            "hour": time_of_day.hour,
            "weekday": time_of_day.weekday(),
        }
        return hashlib.md5(
            json.dumps(key_data, sort_keys=True, default=str).encode()
        ).hexdigest()

    def _calculate_temporal_risk(self, timestamp: datetime) -> float:
        """Calculate temporal risk factor"""
        hour = timestamp.hour

        if 23 <= hour or hour < 5:
            risk = 0.8
        elif 5 <= hour < 7:
            risk = 0.6
        elif 7 <= hour < 9:
            risk = 0.3
        elif 9 <= hour < 17:
            risk = 0.2
        elif 17 <= hour < 20:
            risk = 0.4
        else:
            risk = 0.6

        weekday = timestamp.weekday()
        if weekday >= 5:
            risk *= 1.2

        return min(1.0, risk)

    def _calculate_spatial_risk(
        self, location: str, coordinates: Optional[Dict[str, float]]
    ) -> float:
        """Calculate spatial risk factor"""
        location_lower = location.lower()

        for loc_type, weight in self.spatial_weights.items():
            if loc_type in location_lower:
                return weight

        if coordinates:
            lat, lng = coordinates.get("lat", 0), coordinates.get("lng", 0)

            for hotspot_name, hotspot_data in self.crime_hotspots.items():
                h_lat, h_lng = hotspot_data["lat"], hotspot_data["lng"]
                distance = ((lat - h_lat) ** 2 + (lng - h_lng) ** 2) ** 0.5

                if distance < 0.01:
                    return hotspot_data["risk"]

        return 0.3

    def _calculate_behavioral_risk(self, detections: List[Dict]) -> float:
        """Calculate behavioral risk from detections"""
        if not detections:
            return 0.0

        risk_scores = []

        for detection in detections:
            det_type = detection.get("type", "").lower()
            confidence = detection.get("confidence", 0.5)

            if "weapon" in det_type:
                risk_scores.append(0.95 * confidence)
            elif "person" in det_type:
                if detection.get("attributes", {}).get("running", False):
                    risk_scores.append(0.7 * confidence)
                else:
                    risk_scores.append(0.3 * confidence)
            elif "vehicle" in det_type:
                risk_scores.append(0.5 * confidence)
            else:
                risk_scores.append(0.3 * confidence)

        return max(risk_scores) if risk_scores else 0.0

    def _calculate_contextual_risk(self, incident_type: str) -> float:
        """Calculate contextual risk from incident type"""
        return self.incident_type_weights.get(incident_type, 0.5)

    def _calculate_historical_risk(
        self, location: str, coordinates: Optional[Dict[str, float]]
    ) -> float:
        """Calculate historical risk based on past incidents"""
        if not coordinates:
            return 0.3

        lat, lng = coordinates.get("lat", 0), coordinates.get("lng", 0)

        for hotspot_name, hotspot_data in self.crime_hotspots.items():
            h_lat, h_lng = hotspot_data["lat"], hotspot_data["lng"]
            distance = ((lat - h_lat) ** 2 + (lng - h_lng) ** 2) ** 0.5

            if distance < 0.02:
                return hotspot_data["risk"]

        return 0.3

    def _calculate_confidence(self, factors: RiskFactors) -> float:
        """Calculate confidence in the assessment (optimized without numpy)"""
        # Manual variance calculation for 5 elements is faster than numpy
        factor_values = [
            factors.temporal_risk,
            factors.spatial_risk,
            factors.behavioral_risk,
            factors.contextual_risk,
            factors.historical_risk,
        ]

        # Calculate mean
        mean = sum(factor_values) / 5.0

        # Calculate variance manually (faster for small fixed-size arrays)
        variance = sum((x - mean) ** 2 for x in factor_values) / 5.0

        confidence = 1.0 - (variance * 2)

        return float(max(0.5, min(0.95, confidence)))

    def _get_risk_level(self, score: float) -> RiskLevel:
        """Get risk level from score"""
        if score >= self.critical_threshold:
            return RiskLevel.CRITICAL
        elif score >= self.high_threshold:
            return RiskLevel.HIGH
        elif score >= 0.4:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def _get_recommended_action(self, level: RiskLevel) -> str:
        """Get recommended action based on risk level"""
        actions = {
            RiskLevel.CRITICAL: "Immediate response required. Dispatch emergency response team and notify senior command.",
            RiskLevel.HIGH: "Priority response. Deploy nearest available team and monitor closely.",
            RiskLevel.MEDIUM: "Standard response. Assign team and maintain surveillance.",
            RiskLevel.LOW: "Log for record. Continue monitoring.",
        }
        return actions.get(level, "No action required.")

    def get_camera_risk(self, camera_id: str) -> Optional[RiskAssessment]:
        """Get latest risk assessment for a camera"""
        history = self.assessment_history.get(camera_id, [])
        return history[-1] if history else None

    def get_risk_trends(self, camera_id: str, hours: int = 24) -> List[RiskAssessment]:
        """Get risk trends for a camera"""
        history = self.assessment_history.get(camera_id, [])
        cutoff = datetime.now() - timedelta(hours=hours)

        return [a for a in history if a.timestamp > cutoff]

    def get_stats(self) -> Dict:
        """Get risk engine statistics"""
        total = sum(len(h) for h in self.assessment_history.values())

        by_level = {level.value: 0 for level in RiskLevel}

        for history in self.assessment_history.values():
            for assessment in history:
                by_level[assessment.risk_level.value] += 1

        return {
            "total_assessments": total,
            "active_cameras": len(self.assessment_history),
            "by_risk_level": by_level,
            "thresholds": {
                "high": self.high_threshold,
                "critical": self.critical_threshold,
            },
        }


risk_engine = RiskEngine()
