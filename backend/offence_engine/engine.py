"""
Kenya Overwatch Offence Engine
Traffic violation and offence management
"""

import hashlib
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class OffenceType(Enum):
    """Traffic offence types"""
    SPEEDING = "speeding"
    RED_LIGHT = "red_light"
    STOP_SIGN = "stop_sign"
    illegal_PARKING = "illegal_parking"
    WRONG_WAY = "wrong_way"
    NO_INSURANCE = "no_insurance"
    EXPIRED_LICENSE = "expired_license"
    DANGEROUS_DRIVING = "dangerous_driving"
    DRUNK_DRIVING = "drunk_driving"
    USING_PHONE = "using_phone"
    NOT_WEARING_SEATBELT = "not_wearing_seatbelt"
    OVERLOADING = "overloading"
    NO_HELMET = "no_helmet"


class OffenceStatus(Enum):
    """Offence status"""
    DETECTED = "detected"
    REVIEWED = "reviewed"
    ISSUED = "issued"
    PAID = "paid"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


@dataclass
class Offence:
    """Offence record"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:12])
    offence_type: OffenceType = OffenceType.SPEEDING
    status: OffenceStatus = OffenceStatus.DETECTED
    plate_number: str = ""
    camera_id: str = ""
    location: str = ""
    coordinates: Optional[Dict[str, float]] = None
    speed: Optional[float] = None
    limit: Optional[float] = None
    evidence_image: Optional[str] = None
    fine_amount: float = 0.0
    points: int = 0
    detected_at: datetime = field(default_factory=datetime.now)
    issued_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    officer_id: Optional[str] = None
    notes: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "offence_type": self.offence_type.value,
            "status": self.status.value,
            "plate_number": self.plate_number,
            "camera_id": self.camera_id,
            "location": self.location,
            "coordinates": self.coordinates,
            "speed": self.speed,
            "limit": self.limit,
            "evidence_image": self.evidence_image,
            "fine_amount": self.fine_amount,
            "points": self.points,
            "detected_at": self.detected_at.isoformat(),
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "officer_id": self.officer_id,
            "notes": self.notes,
        }


class OffenceEngine:
    """Traffic offence management engine"""
    
    def __init__(self):
        self.offences: Dict[str, Offence] = {}
        self.fine_schedule = self._initialize_fine_schedule()
        self.stats = {
            "total_detected": 0,
            "total_issued": 0,
            "total_paid": 0,
            "total_disputed": 0,
        }
    
    def _initialize_fine_schedule(self) -> Dict[OffenceType, Dict]:
        """Initialize fine schedule"""
        return {
            OffenceType.SPEEDING: {"base": 3000, "per_km": 500, "max": 20000},
            OffenceType.RED_LIGHT: {"base": 5000, "max": 10000},
            OffenceType.STOP_SIGN: {"base": 3000, "max": 5000},
            OffenceType.illegal_PARKING: {"base": 1000, "max": 5000},
            OffenceType.WRONG_WAY: {"base": 3000, "max": 8000},
            OffenceType.NO_INSURANCE: {"base": 10000, "max": 50000},
            OffenceType.EXPIRED_LICENSE: {"base": 5000, "max": 15000},
            OffenceType.DANGEROUS_DRIVING: {"base": 15000, "max": 100000},
            OffenceType.DRUNK_DRIVING: {"base": 50000, "max": 200000},
            OffenceType.USING_PHONE: {"base": 3000, "max": 10000},
            OffenceType.NOT_WEARING_SEATBELT: {"base": 1000, "max": 3000},
            OffenceType.OVERLOADING: {"base": 5000, "max": 50000},
            OffenceType.NO_HELMET: {"base": 1000, "max": 3000},
        }
    
    def detect_offence(
        self,
        offence_type: OffenceType,
        plate_number: str,
        camera_id: str,
        location: str,
        coordinates: Optional[Dict[str, float]] = None,
        speed: Optional[float] = None,
        limit: Optional[float] = None,
        evidence_image: Optional[str] = None,
    ) -> Offence:
        """Detect a new offence"""
        offence = Offence(
            offence_type=offence_type,
            plate_number=plate_number,
            camera_id=camera_id,
            location=location,
            coordinates=coordinates,
            speed=speed,
            limit=limit,
            evidence_image=evidence_image,
        )
        
        fine_info = self.fine_schedule.get(offence_type, {"base": 3000, "max": 10000})
        
        if offence_type == OffenceType.SPEEDING and speed and limit:
            excess = speed - limit
            offence.fine_amount = min(fine_info["base"] + excess * fine_info.get("per_km", 0), fine_info["max"])
        else:
            offence.fine_amount = fine_info["base"]
        
        offence.points = self._get_point_value(offence_type)
        
        self.offences[offence.id] = offence
        self.stats["total_detected"] += 1
        
        logger.info(f"Offence detected: {offence.id} - {offence_type.value} for {plate_number}")
        
        return offence
    
    def _get_point_value(self, offence_type: OffenceType) -> int:
        """Get point value for offence"""
        points = {
            OffenceType.SPEEDING: 3,
            OffenceType.RED_LIGHT: 6,
            OffenceType.STOP_SIGN: 3,
            OffenceType.illegal_PARKING: 2,
            OffenceType.WRONG_WAY: 4,
            OffenceType.NO_INSURANCE: 8,
            OffenceType.EXPIRED_LICENSE: 6,
            OffenceType.DANGEROUS_DRIVING: 12,
            OffenceType.DRUNK_DRIVING: 14,
            OffenceType.USING_PHONE: 4,
            OffenceType.NOT_WEARING_SEATBELT: 2,
            OffenceType.OVERLOADING: 6,
            OffenceType.NO_HELMET: 2,
        }
        return points.get(offence_type, 3)
    
    def review_offence(self, offence_id: str, officer_id: str, approved: bool, notes: str = "") -> Optional[Offence]:
        """Review an offence"""
        offence = self.offences.get(offence_id)
        if not offence:
            return None
        
        if approved:
            offence.status = OffenceStatus.ISSUED
            offence.issued_at = datetime.now()
            offence.officer_id = officer_id
            self.stats["total_issued"] += 1
        else:
            offence.status = OffenceStatus.CANCELLED
        
        offence.notes = notes
        
        return offence
    
    def record_payment(self, offence_id: str) -> Optional[Offence]:
        """Record payment for offence"""
        offence = self.offences.get(offence_id)
        if not offence:
            return None
        
        offence.status = OffenceStatus.PAID
        offence.paid_at = datetime.now()
        self.stats["total_paid"] += 1
        
        return offence
    
    def dispute_offence(self, offence_id: str, reason: str) -> Optional[Offence]:
        """Dispute an offence"""
        offence = self.offences.get(offence_id)
        if not offence:
            return None
        
        offence.status = OffenceStatus.DISPUTED
        offence.notes += f"\\nDispute: {reason}"
        self.stats["total_disputed"] += 1
        
        return offence
    
    def get_offence(self, offence_id: str) -> Optional[Offence]:
        """Get offence by ID"""
        return self.offences.get(offence_id)
    
    def get_offences(
        self,
        status: Optional[OffenceStatus] = None,
        plate_number: Optional[str] = None,
        limit: int = 100,
    ) -> List[Offence]:
        """Get offences with filters"""
        results = list(self.offences.values())
        
        if status:
            results = [o for o in results if o.status == status]
        if plate_number:
            results = [o for o in results if o.plate_number == plate_number]
        
        results.sort(key=lambda o: o.detected_at, reverse=True)
        
        return results[:limit]
    
    def get_stats(self) -> Dict:
        """Get offence statistics"""
        return {
            **self.stats,
            "total_offences": len(self.offences),
            "pending_review": len([o for o in self.offences.values() if o.status == OffenceStatus.DETECTED]),
            "by_type": self._get_by_type(),
            "by_status": self._get_by_status(),
        }
    
    def _get_by_type(self) -> Dict:
        by_type = {}
        for offence in self.offences.values():
            ot = offence.offence_type.value
            by_type[ot] = by_type.get(ot, 0) + 1
        return by_type
    
    def _get_by_status(self) -> Dict:
        by_status = {}
        for offence in self.offences.values():
            st = offence.status.value
            by_status[st] = by_status.get(st, 0) + 1
        return by_status


offence_engine = OffenceEngine()
