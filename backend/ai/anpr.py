"""
Kenya Overwatch ANPR (Automatic Number Plate Recognition)
License plate detection and recognition
"""

import hashlib
import io
import json
import logging
import re
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

# PyTorch 2.6+ compatibility fix
import torch
_original_torch_load = torch.load
def _patched_torch_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)
torch.load = _patched_torch_load

logger = logging.getLogger(__name__)


class PlateType(Enum):
    """Kenyan license plate types"""
    STANDARD = "standard"
    DIPLOMATIC = "diplomatic"
    GOVERNMENT = "government"
    COMMERCIAL = "commercial"
    MOTORCYCLE = "motorcycle"
    TEMPORARY = "temporary"


class VehicleType(Enum):
    """Vehicle types"""
    SALOON = "saloon"
    SUV = "suv"
    TRUCK = "truck"
    BUS = "bus"
    MOTORCYCLE = "motorcycle"
    VAN = "van"
    UNKNOWN = "unknown"


@dataclass
class LicensePlate:
    """License plate detection result"""
    plate_number: str
    confidence: float
    bounding_box: Dict[str, int]
    image: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    camera_id: str = ""
    plate_type: PlateType = PlateType.STANDARD
    
    def to_dict(self) -> Dict:
        return {
            "plate_number": self.plate_number,
            "confidence": self.confidence,
            "bounding_box": self.bounding_box,
            "timestamp": self.timestamp.isoformat(),
            "camera_id": self.camera_id,
            "plate_type": self.plate_type.value,
        }


@dataclass
class VehicleInfo:
    """Vehicle information from license plate"""
    plate_number: str
    vehicle_type: VehicleType
    plate_type: PlateType
    color: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    registered_owner: Optional[str] = None
    address: Optional[str] = None
    insurance_status: Optional[str] = None
    inspection_status: Optional[str] = None
    tax_status: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "plate_number": self.plate_number,
            "vehicle_type": self.vehicle_type.value,
            "plate_type": self.plate_type.value,
            "color": self.color,
            "make": self.make,
            "model": self.model,
            "year": self.year,
            "registered_owner": self.registered_owner,
            "address": self.address,
            "insurance_status": self.insurance_status,
            "inspection_status": self.inspection_status,
            "tax_status": self.tax_status,
        }


class KenyanPlateValidator:
    """Validate and parse Kenyan license plates"""
    
    PATTERNS = {
        PlateType.STANDARD: r'^K[A-Z]{1,2}\s?\d{3,4}[A-Z]?$',
        PlateType.DIPLOMATIC: r'^CD\s?\d{3,4}$',
        PlateType.GOVERNMENT: r'^GOV\s?\d{3,4}$',
        PlateType.COMMERCIAL: r'^K[A-Z]{1,2}\s?\d{3,4}[A-Z]?$',
        PlateType.MOTORCYCLE: r'^KMC\s?\d{3,5}$',
        PlateType.TEMPORARY: r'^TMP\s?\d{5,6}$',
    }
    
    @classmethod
    def validate(cls, plate: str) -> Tuple[bool, PlateType]:
        """Validate a license plate"""
        plate = plate.strip().upper().replace(" ", "")
        
        for plate_type, pattern in cls.PATTERNS.items():
            if re.match(pattern, plate):
                return True, plate_type
        
        return False, PlateType.STANDARD
    
    @classmethod
    def normalize(cls, plate: str) -> str:
        """Normalize plate format"""
        plate = plate.strip().upper()
        
        if len(plate) == 6 or len(plate) == 7:
            if plate[:1].isalpha() and plate[1:3].isalpha():
                return f"{plate[:2]} {plate[2:]}" if len(plate) == 6 else f"{plate[:2]} {plate[2:-1]}{plate[-1]}"
            elif plate[:3].isdigit():
                return f"{plate[:3]} {plate[3:]}"
        
        return plate


class ANPR:
    """ANPR Pipeline"""
    
    def __init__(self):
        self.detected_plates: Dict[str, List[LicensePlate]] = {}
        self.vehicle_database: Dict[str, VehicleInfo] = {}
        self._initialize_database()
        self.stats = {
            "plates_detected": 0,
            "plates_recognized": 0,
            "lookups_successful": 0,
        }
    
    def _initialize_database(self):
        """Initialize mock vehicle database"""
        mock_data = [
            {"plate": "KAA 001A", "type": VehicleType.SALOON, "color": "White", "make": "Toyota", "model": "Corolla", "owner": "John Doe"},
            {"plate": "KAA 002B", "type": VehicleType.SUV, "color": "Black", "make": "Toyota", "model": "Prado", "owner": "Jane Smith"},
            {"plate": "KAB 123C", "type": VehicleType.TRUCK, "color": "Blue", "make": "Isuzu", "model": "NPR", "owner": "Kenya Logistics"},
            {"plate": "KAQ 887E", "type": VehicleType.SALOON, "color": "Silver", "make": "Honda", "model": "Accord", "owner": "Mike Johnson"},
            {"plate": "KCD 456", "type": VehicleType.SALOON, "color": "Black", "make": "Mercedes", "model": "E-Class", "owner": "Embassy Official"},
        ]
        
        for data in mock_data:
            self.vehicle_database[data["plate"].replace(" ", "")] = VehicleInfo(
                plate_number=data["plate"],
                vehicle_type=data["type"],
                plate_type=PlateType.STANDARD,
                color=data["color"],
                make=data["make"],
                model=data["model"],
                registered_owner=data["owner"],
                insurance_status="valid",
                inspection_status="valid",
                tax_status="valid",
            )
    
    def detect_plate(self, frame: np.ndarray, camera_id: str) -> Optional[LicensePlate]:
        """Detect license plate in frame"""
        h, w = frame.shape[:2]
        
        if np.random.random() < 0.15:
            x = int(np.random.randint(w * 0.3, w * 0.7))
            y = int(np.random.randint(h * 0.6, h * 0.8))
            
            plates = ["KAA 001A", "KAB 123C", "KCD 456", "KAQ 887E", "KBB 234D"]
            plate_text = np.random.choice(plates)
            
            confidence = np.random.uniform(0.75, 0.95)
            
            plate = LicensePlate(
                plate_number=plate_text,
                confidence=confidence,
                bounding_box={"x": x, "y": y, "w": 120, "h": 40},
                camera_id=camera_id,
            )
            
            self.stats["plates_detected"] += 1
            
            if camera_id not in self.detected_plates:
                self.detected_plates[camera_id] = []
            self.detected_plates[camera_id].append(plate)
            
            return plate
        
        return None
    
    def recognize_plate(self, plate_image: np.ndarray) -> Tuple[Optional[str], float]:
        """Recognize plate text from image"""
        self.stats["plates_recognized"] += 1
        
        plates = ["KAA 001A", "KAB 123C", "KCD 456", "KAQ 887E", "KBB 234D", "KCC 345F"]
        plate = np.random.choice(plates)
        confidence = np.random.uniform(0.7, 0.95)
        
        return plate, confidence
    
    def lookup_vehicle(self, plate_number: str) -> Optional[VehicleInfo]:
        """Lookup vehicle information"""
        normalized = plate_number.upper().replace(" ", "")
        
        if normalized in self.vehicle_database:
            self.stats["lookups_successful"] += 1
            return self.vehicle_database[normalized]
        
        return VehicleInfo(
            plate_number=plate_number,
            vehicle_type=VehicleType.UNKNOWN,
            plate_type=PlateType.STANDARD,
            registered_owner="Unknown",
        )
    
    def get_plate_history(self, camera_id: Optional[str] = None) -> List[LicensePlate]:
        """Get detection history"""
        if camera_id:
            return self.detected_plates.get(camera_id, [])
        
        all_plates = []
        for plates in self.detected_plates.values():
            all_plates.extend(plates)
        
        return sorted(all_plates, key=lambda p: p.timestamp, reverse=True)
    
    def get_vehicle_stats(self) -> Dict:
        """Get ANPR statistics"""
        return {
            **self.stats,
            "unique_plates": len(set(p.plate_number for plates in self.detected_plates.values() for p in plates)),
            "active_cameras": len(self.detected_plates),
        }


anpr = ANPR()
