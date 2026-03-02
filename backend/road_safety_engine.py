"""
Kenya National Road Safety Authority (NTSA) Overwatch System
Real-time Road Safety Monitoring, Accident Detection, and Traffic Violation Management
Aligned with Kenya's National Transport and Safety Authority Act
"""

import asyncio
import json
import uuid
import hashlib
import cv2
import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import random
import math

def utcnow():
    return datetime.now(timezone.utc)

log_dir = 'logs'
import os
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'road_safety.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==================== ROAD SAFETY ENUMS ====================
class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, Enum):
    REPORTED = "reported"
    DISPATCHED = "dispatched"
    ON_SCENE = "on_scene"
    TREATMENT = "treatment"
    CLEARED = "cleared"
    INVESTIGATION = "investigation"
    CLOSED = "closed"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"

class ViolationStatus(str, Enum):
    DETECTED = "detected"
    CAPTURED = "captured"
    REVIEWED = "reviewed"
    ISSUED = "issued"
    PAID = "paid"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"

class VehicleType(str, Enum):
    MOTORCYCLE = "motorcycle"
    SALOON = "saloon"
    STATION_WAGON = "station_wagon"
    PICKUP = "pickup"
    LORRY = "lorry"
    BUS = "bus"
    MATATU = "matatu"
    TAXI = "taxi"
    OTHER = "other"

class RoadUserType(str, Enum):
    DRIVER = "driver"
    PASSENGER = "passenger"
    PEDESTRIAN = "pedestrian"
    CYCLIST = "cyclist"
    MOTORCYCLIST = "motorcyclist"

class AccidentType(str, Enum):
    HEAD_ON = "head_on"
    REAR_END = "rear_end"
    SIDE_IMPACT = "side_impact"
    ROLLOVER = "rollover"
    HIT_PEDESTRIAN = "hit_pedestrian"
    HIT_ANIMAL = "hit_animal"
    OBJECT_STRIKE = "object_strike"
    SINGLE_VEHICLE = "single_vehicle"
    MULTI_VEHICLE = "multi_vehicle"
    PARKED_VEHICLE = "parked_vehicle"

class CauseType(str, Enum):
    SPEEDING = "speeding"
    DRUNK_DRIVING = "drunk_driving"
    RECKLESS_DRIVING = "reckless_driving"
    FATIGUE = "fatigue"
    DISTRACTION = "distraction"
    OVERTAKING = "overtaking"
    RED_LIGHT_JUMPING = "red_light_jumping"
    WRONG_WAY = "wrong_way"
    ILLEGAL_PARKING = "illegal_parking"
    OVERLOADING = "overloading"
    POOR_ROAD_CONDITIONS = "poor_road_conditions"
    MECHANICAL_FAILURE = "mechanical_failure"
    WEATHER = "weather"
    USING_PHONE = "using_phone"
    OTHER = "other"

# ==================== KENYA ROAD SAFETY DATA ====================
KENYA_ROADS = [
    {"name": "Mombasa Road (A109)", "category": "highway", "limit": 100, "coordinates": {"start": (-1.3300, 36.9800), "end": (-1.4500, 37.0500)}},
    {"name": "Nairobi Expressway", "category": "highway", "limit": 80, "coordinates": {"start": (-1.3200, 36.8300), "end": (-1.2700, 36.9200)}},
    {"name": "Nakuru-Eldoret Road", "category": "highway", "limit": 100, "coordinates": {"start": (-0.3031, 36.0800), "end": (0.5143, 35.2698)}},
    {"name": "Kenyatta Avenue", "category": "urban", "limit": 50, "coordinates": {"start": (-1.2921, 36.8219), "end": (-1.2864, 36.8232)}},
    {"name": "University Way", "category": "urban", "limit": 50, "coordinates": {"start": (-1.2864, 36.8232), "end": (-1.2831, 36.8195)}},
    {"name": "Ngong Road", "category": "arterial", "limit": 60, "coordinates": {"start": (-1.2931, 36.8219), "end": (-1.3267, 36.7850)}},
    {"name": "Mombasa Road Industrial", "category": "arterial", "limit": 60, "coordinates": {"start": (-1.3200, 36.8500), "end": (-1.3500, 36.9100)}},
    {"name": "Thika Superhighway", "category": "highway", "limit": 80, "coordinates": {"start": (-1.0334, 37.0692), "end": (-1.1500, 37.2000)}},
    {"name": "Kisumu Road", "category": "arterial", "limit": 80, "coordinates": {"start": (-0.1022, 34.7617), "end": (-0.1500, 34.8000)}},
    {"name": "Nairobi-Garissa Road", "category": "arterial", "limit": 80, "coordinates": {"start": (-1.4500, 36.9500), "end": (-0.4536, 39.6401)}},
]

SPEED_LIMITS = {
    "highway": 100,
    "arterial": 80,
    "urban": 50,
    "residential": 30,
    "school_zone": 20,
    "construction": 40,
}

ACCIDENT_HOTSPOTS = [
    {"name": "Mombasa Road Junction", "lat": -1.3300, "lng": 36.9800, "risk_score": 0.85, "incidents_2024": 156},
    {"name": "Nairobi CBD Roundabout", "lat": -1.2864, "lng": 36.8232, "risk_score": 0.78, "incidents_2024": 203},
    {"name": "Thika Road", "lat": -1.0800, "lng": 37.1000, "risk_score": 0.82, "incidents_2024": 178},
    {"name": "Nakuru Town", "lat": -0.3031, "lng": 36.0800, "risk_score": 0.65, "incidents_2024": 98},
    {"name": "Kisumu Roundabout", "lat": -0.1022, "lng": 34.7617, "risk_score": 0.58, "incidents_2024": 67},
    {"name": "Mombasa-Malindi Road", "lat": -3.2000, "lng": 40.1000, "risk_score": 0.72, "incidents_2024": 89},
    {"name": "Eldoret Town", "lat": 0.5143, "lng": 35.2698, "risk_score": 0.55, "incidents_2024": 45},
]

# ==================== DATA MODELS ====================
@dataclass
class Coordinates:
    lat: float
    lng: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None

@dataclass
class Vehicle:
    id: str
    plate_number: str
    vehicle_type: VehicleType
    make: str
    model: str
    year: int
    color: str
    owner_name: str
    owner_id: str
    insurance_status: str
    inspection_status: str
    license_expiry: datetime
    license_category: str
    points: int = 12
    violations_count: int = 0

@dataclass
class Driver:
    id: str
    name: str
    license_number: str
    license_expiry: datetime
    license_category: str
    date_of_birth: datetime
    address: str
    phone: str
    points: int = 12
    violations_count: int = 0
    endorsements: List[str] = field(default_factory=list)

@dataclass
class RoadAccident:
    id: str
    accident_type: AccidentType
    cause: CauseType
    location: str
    road_name: str
    coordinates: Coordinates
    severity: SeverityLevel
    vehicles_involved: List[str]
    casualties: int
    injuries: int
    status: IncidentStatus
    reported_at: datetime
    response_time_minutes: Optional[float] = None
    cleared_at: Optional[datetime] = None
    description: str = ""
    weather_conditions: str = "clear"
    road_conditions: str = "good"
    traffic_flow: str = "normal"
    evidence_images: List[str] = field(default_factory=list)
    responding_units: List[str] = field(default_factory=list)

@dataclass
class TrafficViolation:
    id: str
    violation_type: CauseType
    plate_number: str
    vehicle_type: VehicleType
    location: str
    road_name: str
    coordinates: Coordinates
    evidence_image: str
    camera_id: str
    status: ViolationStatus
    detected_at: datetime
    speed_detected: Optional[float] = None
    speed_limit: Optional[float] = None
    speed_excess: Optional[float] = None
    video_clip: Optional[str] = None
    fine_amount: float = 0.0
    penalty_points: int = 0
    issued_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    officer_id: Optional[str] = None
    notes: str = ""

@dataclass
class RoadSafetyIncident:
    id: str
    incident_type: str
    title: str
    description: str
    location: str
    road_name: str
    coordinates: Coordinates
    severity: SeverityLevel
    status: IncidentStatus
    risk_score: float
    vehicles: List[str] = field(default_factory=list)
    casualties: int = 0
    injuries: int = 0
    created_at: datetime = field(default_factory=utcnow)
    updated_at: Optional[datetime] = None
    reported_by: str = ""
    assigned_to: Optional[str] = None
    evidence: List[str] = field(default_factory=list)

@dataclass
class SpeedDetection:
    id: str
    camera_id: str
    plate_number: str
    vehicle_type: VehicleType
    speed_detected: float
    speed_limit: float
    location: str
    coordinates: Coordinates
    image_front: str
    image_rear: str
    timestamp: datetime
    confirmed: bool = False

@dataclass
class RoadSegment:
    id: str
    name: str
    category: str
    speed_limit: float
    start_coordinates: Coordinates
    end_coordinates: Coordinates
    average_daily_traffic: int
    accident_count_30_days: int
    current_risk_level: RiskLevel

@dataclass
class TrafficFlow:
    id: str
    camera_id: str
    location: str
    vehicle_count: int
    average_speed: float
    congestion_level: str
    timestamp: datetime

@dataclass
class EmergencyDispatch:
    id: str
    incident_id: str
    unit_type: str
    unit_id: str
    dispatched_at: datetime
    arrived_at: Optional[datetime] = None
    status: str = "dispatched"

# ==================== ROAD SAFETY ENGINE ====================
class RoadSafetyEngine:
    def __init__(self):
        self.accidents: Dict[str, RoadAccident] = {}
        self.violations: Dict[str, TrafficViolation] = {}
        self.incidents: Dict[str, RoadSafetyIncident] = {}
        self.vehicles: Dict[str, Vehicle] = {}
        self.drivers: Dict[str, Driver] = {}
        self.speed_detections: Dict[str, SpeedDetection] = {}
        self.road_segments: Dict[str, RoadSegment] = {}
        self.dispatches: Dict[str, EmergencyDispatch] = {}
        
        self._initialize_road_segments()
        self._initialize_sample_data()
        
        self.stats = {
            "total_accidents_today": 0,
            "total_violations_today": 0,
            "total_casualties_today": 0,
            "total_injuries_today": 0,
            "avg_response_time": 0.0,
            "fatal_accidents_today": 0,
            "speed_violations_today": 0,
            "dui_arrests_today": 0,
        }
        
    def _initialize_road_segments(self):
        for road in KENYA_ROADS:
            segment = RoadSegment(
                id=f"seg_{road['name'].replace(' ', '_').lower()[:20]}",
                name=road["name"],
                category=road["category"],
                speed_limit=road["limit"],
                start_coordinates=Coordinates(*road["coordinates"]["start"]),
                end_coordinates=Coordinates(*road["coordinates"]["end"]),
                average_daily_traffic=random.randint(5000, 50000),
                accident_count_30_days=random.randint(5, 50),
                current_risk_level=RiskLevel.MEDIUM
            )
            self.road_segments[segment.id] = segment
            
    def _initialize_sample_data(self):
        """Initialize comprehensive sample data for Kenya roads"""
        # Kenyan vehicle registration prefixes
        prefixes = ["KAA", "KAB", "KAC", "KAD", "KAE", "KAJ", "KAK", "KAL", "KAM", "KAN", 
                   "KBA", "KBB", "KBC", "KBD", "KCA", "KCB", "KDA", "KDB", "KEA", "KFA"]
        
        makes_models = [
            ("Toyota", "Corolla"), ("Toyota", "Camry"), ("Toyota", "Hiace"), ("Toyota", "Prado"),
            ("Nissan", "Sentra"), ("Nissan", "X-Trail"), ("Nissan", "Navara"),
            ("Honda", "Civic"), ("Honda", "Accord"), ("Honda", "Pilot"),
            ("Mazda", "3"), ("Mazda", "6"), ("Mazda", "CX-5"),
            ("Volkswagen", "Polo"), ("Volkswagen", "Golf"), ("Volkswagen", "Transporter"),
            ("Mercedes", "C-Class"), ("Mercedes", "E-Class"), ("Mercedes", "Sprinter"),
            ("BMW", "3 Series"), ("BMW", "5 Series"), ("BMW", "X5"),
            ("Isuzu", "D-Max"), ("Isuzu", "Mux"), ("Isuzu", "N-Series"),
            ("Mitsubishi", "Lancer"), ("Mitsubishi", "Pajero"), ("Mitsubishi", "Fuso"),
            ("Hyundai", "Elantra"), ("Hyundai", "Tucson"), ("Hyundai", "Starex"),
        ]
        
        colors = ["White", "Black", "Silver", "Blue", "Red", "Green", "Brown", "Grey", "Gold", "Orange"]
        vehicle_types_list = list(VehicleType)
        
        # Generate 100 realistic vehicles
        for i in range(100):
            prefix = random.choice(prefixes)
            number = f"{random.randint(100, 999)}{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}"
            plate = f"{prefix}{number}"
            
            make, model = random.choice(makes_models)
            year = random.randint(2015, 2024)
            vtype = random.choice(vehicle_types_list)
            
            first_names = ["John", "Mary", "James", "Grace", "David", "Faith", "Michael", "Joy", 
                          "Daniel", "Esther", "Joseph", "Ruth", "Peter", "Susan", "Thomas", "Catherine"]
            last_names = ["Ochieng", "Omondi", "Kimani", "Wanjiku", "Nyong'o", "Kenyatta", 
                         "Muthoni", "Otieno", "Njoroge", "Kariuki", "Kiplagat", "Chebet"]
            
            owner_first = random.choice(first_names)
            owner_last = random.choice(last_names)
            
            self.vehicles[plate] = Vehicle(
                id=f"v{i+1:03d}",
                plate_number=plate,
                vehicle_type=vtype,
                make=make,
                model=model,
                year=year,
                color=random.choice(colors),
                owner_name=f"{owner_first} {owner_last}",
                owner_id=f"{random.randint(10000000, 99999999)}",
                insurance_status=random.choice(["valid", "valid", "valid", "expired"]),
                inspection_status=random.choice(["valid", "valid", "expired"]),
                license_expiry=datetime(2025, random.randint(1, 12), random.randint(1, 28)),
                license_category=random.choice(["A", "B", "C", "D", "E", "F", "G", "W"])
            )
        
        # Generate 50 realistic drivers
        first_names = ["John", "Mary", "James", "Grace", "David", "Faith", "Michael", "Joy", 
                      "Daniel", "Esther", "Joseph", "Ruth", "Peter", "Susan", "Thomas", "Catherine",
                      "Samuel", "Rebecca", "Paul", "Sarah", "George", "Jane", "Stephen", "Anne"]
        last_names = ["Ochieng", "Omondi", "Kimani", "Wanjiku", "Nyong'o", "Kenyatta", 
                     "Muthoni", "Otieno", "Njoroge", "Kariuki", "Kiplagat", "Chebet", 
                     "Maina", "Kamau", "Mutua", "Wasike"]
        
        counties = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi",
                   "Kitale", "Garissa", "Nyeri", "Meru", "Migori", "Makueni", "Kakamega"]
        
        for i in range(50):
            dl_number = f"DL{random.randint(100000, 999999)}"
            first = random.choice(first_names)
            last = random.choice(last_names)
            
            self.drivers[dl_number] = Driver(
                id=f"d{i+1:03d}",
                name=f"{first} {last}",
                license_number=dl_number,
                license_expiry=datetime(2025, random.randint(1, 12), random.randint(1, 28)),
                license_category=random.choice(["A", "B", "C", "D", "E", "F", "G", "W"]),
                date_of_birth=datetime(random.randint(1965, 2000), random.randint(1, 12), random.randint(1, 28)),
                address=random.choice(counties),
                phone=f"+2547{random.randint(0, 9)}{random.randint(100000, 999999)}",
                points=random.randint(0, 14),
                violations_count=random.randint(0, 10)
            )
        
    def create_accident_report(
        self,
        accident_type: AccidentType,
        cause: CauseType,
        location: str,
        road_name: str,
        coordinates: Coordinates,
        severity: SeverityLevel,
        vehicles_involved: List[str],
        description: str = "",
        weather: str = "clear",
        road_conditions: str = "good"
    ) -> RoadAccident:
        accident = RoadAccident(
            id=f"acc_{uuid.uuid4().hex[:8]}",
            accident_type=accident_type,
            cause=cause,
            location=location,
            road_name=road_name,
            coordinates=coordinates,
            severity=severity,
            vehicles_involved=vehicles_involved,
            casualties=random.randint(0, 5) if severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL] else 0,
            injuries=random.randint(0, 10),
            status=IncidentStatus.REPORTED,
            reported_at=utcnow(),
            description=description,
            weather_conditions=weather,
            road_conditions=road_conditions
        )
        
        self.accidents[accident.id] = accident
        self._update_stats()
        
        logger.info(f"Accident reported: {accident.id} - {accident_type.value} at {location}")
        return accident
    
    def record_violation(
        self,
        violation_type: CauseType,
        plate_number: str,
        vehicle_type: VehicleType,
        location: str,
        road_name: str,
        coordinates: Coordinates,
        camera_id: str,
        speed_detected: Optional[float] = None,
        speed_limit: Optional[float] = None,
        evidence_image: str = ""
    ) -> TrafficViolation:
        violation = TrafficViolation(
            id=f"viol_{uuid.uuid4().hex[:8]}",
            violation_type=violation_type,
            plate_number=plate_number,
            vehicle_type=vehicle_type,
            location=location,
            road_name=road_name,
            coordinates=coordinates,
            speed_detected=speed_detected,
            speed_limit=speed_limit,
            speed_excess=(speed_detected - speed_limit) if speed_detected and speed_limit else None,
            evidence_image=evidence_image,
            camera_id=camera_id,
            status=ViolationStatus.DETECTED,
            detected_at=utcnow(),
        )
        
        fine_info = self._calculate_fine(violation_type, speed_excess=violation.speed_excess)
        violation.fine_amount = fine_info["amount"]
        violation.penalty_points = fine_info["points"]
        
        self.violations[violation.id] = violation
        self._update_stats()
        
        logger.info(f"Violation detected: {violation.id} - {violation_type.value} for {plate_number}")
        return violation
    
    def _calculate_fine(self, violation_type: CauseType, speed_excess: Optional[float] = None) -> Dict:
        fines = {
            CauseType.SPEEDING: {"base": 3000, "per_km": 500, "max": 20000},
            CauseType.DRUNK_DRIVING: {"base": 50000, "max": 200000},
            CauseType.RED_LIGHT_JUMPING: {"base": 5000, "max": 10000},
            CauseType.WRONG_WAY: {"base": 3000, "max": 8000},
            CauseType.RECKLESS_DRIVING: {"base": 15000, "max": 100000},
            CauseType.ILLEGAL_PARKING: {"base": 1000, "max": 5000},
            CauseType.USING_PHONE: {"base": 3000, "max": 10000},
            CauseType.OVERLOADING: {"base": 5000, "max": 50000},
            CauseType.OVERTAKING: {"base": 3000, "max": 8000},
            CauseType.FATIGUE: {"base": 2000, "max": 5000},
        }
        
        points = {
            CauseType.SPEEDING: 3,
            CauseType.DRUNK_DRIVING: 14,
            CauseType.RED_LIGHT_JUMPING: 6,
            CauseType.WRONG_WAY: 4,
            CauseType.RECKLESS_DRIVING: 12,
            CauseType.ILLEGAL_PARKING: 2,
            CauseType.USING_PHONE: 4,
            CauseType.OVERLOADING: 6,
            CauseType.OVERTAKING: 4,
            CauseType.FATIGUE: 2,
        }
        
        fine_config = fines.get(violation_type, {"base": 3000, "max": 10000})
        
        if violation_type == CauseType.SPEEDING and speed_excess:
            amount = min(fine_config["base"] + speed_excess * fine_config["per_km"], fine_config["max"])
        else:
            amount = fine_config["base"]
            
        return {"amount": amount, "points": points.get(violation_type, 3)}
    
    def detect_speed(
        self,
        camera_id: str,
        plate_number: str,
        vehicle_type: VehicleType,
        speed_detected: float,
        location: str,
        coordinates: Coordinates,
        image_front: str = "",
        image_rear: str = ""
    ) -> Tuple[SpeedDetection, Optional[TrafficViolation]]:
        detection = SpeedDetection(
            id=f"spd_{uuid.uuid4().hex[:8]}",
            camera_id=camera_id,
            plate_number=plate_number,
            vehicle_type=vehicle_type,
            speed_detected=speed_detected,
            speed_limit=self._get_speed_limit(location),
            location=location,
            coordinates=coordinates,
            image_front=image_front,
            image_rear=image_rear,
            timestamp=utcnow()
        )
        
        self.speed_detections[detection.id] = detection
        
        if speed_detected > detection.speed_limit:
            violation = self.record_violation(
                violation_type=CauseType.SPEEDING,
                plate_number=plate_number,
                vehicle_type=vehicle_type,
                location=location,
                road_name=location,
                coordinates=coordinates,
                camera_id=camera_id,
                speed_detected=speed_detected,
                speed_limit=detection.speed_limit,
                evidence_image=image_front
            )
            detection.confirmed = True
            return detection, violation
            
        return detection, None
    
    def _get_speed_limit(self, location: str) -> float:
        for segment in self.road_segments.values():
            if segment.name.lower() in location.lower():
                return segment.speed_limit
        return 50.0
    
    def dispatch_emergency(self, incident_id: str, unit_type: str, unit_id: str) -> EmergencyDispatch:
        dispatch = EmergencyDispatch(
            id=f"disp_{uuid.uuid4().hex[:8]}",
            incident_id=incident_id,
            unit_type=unit_type,
            unit_id=unit_id,
            dispatched_at=utcnow()
        )
        self.dispatches[dispatch.id] = dispatch
        return dispatch
    
    def get_incident(self, incident_id: str) -> Optional[RoadSafetyIncident]:
        return self.incidents.get(incident_id)
    
    def get_accident(self, accident_id: str) -> Optional[RoadAccident]:
        return self.accidents.get(accident_id)
    
    def get_violation(self, violation_id: str) -> Optional[TrafficViolation]:
        return self.violations.get(violation_id)
    
    def get_vehicle(self, plate_number: str) -> Optional[Vehicle]:
        return self.vehicles.get(plate_number)
    
    def get_driver(self, license_number: str) -> Optional[Driver]:
        return self.drivers.get(license_number)
    
    def get_all_accidents(self, status: Optional[IncidentStatus] = None, limit: int = 100) -> List[RoadAccident]:
        results = list(self.accidents.values())
        if status:
            results = [a for a in results if a.status == status]
        results.sort(key=lambda a: a.reported_at, reverse=True)
        return results[:limit]
    
    def get_all_violations(self, status: Optional[ViolationStatus] = None, plate_number: Optional[str] = None, limit: int = 100) -> List[TrafficViolation]:
        results = list(self.violations.values())
        if status:
            results = [v for v in results if v.status == status]
        if plate_number:
            results = [v for v in results if v.plate_number == plate_number]
        results.sort(key=lambda v: v.detected_at, reverse=True)
        return results[:limit]
    
    def get_dashboard_stats(self) -> Dict:
        return {
            "accidents": {
                "today": self.stats["total_accidents_today"],
                "fatal": self.stats["fatal_accidents_today"],
                "injuries": self.stats["total_injuries_today"],
                "by_type": self._get_accidents_by_type(),
                "by_cause": self._get_accidents_by_cause(),
                "by_severity": self._get_accidents_by_severity(),
            },
            "violations": {
                "today": self.stats["total_violations_today"],
                "speed": self.stats["speed_violations_today"],
                "dui": self.stats["dui_arrests_today"],
                "by_type": self._get_violations_by_type(),
                "pending": len([v for v in self.violations.values() if v.status == ViolationStatus.DETECTED]),
                "revenue": sum(v.fine_amount for v in self.violations.values() if v.status in [ViolationStatus.ISSUED, ViolationStatus.PAID]),
            },
            "response": {
                "avg_time": self.stats["avg_response_time"],
                "active_dispatches": len([d for d in self.dispatches.values() if d.status == "dispatched"]),
            },
            "roads": self._get_road_stats(),
            "trend": self._get_hourly_trend(),
        }
    
    def _update_stats(self):
        today = utcnow().date()
        today_accidents = [a for a in self.accidents.values() if a.reported_at.date() == today]
        
        self.stats["total_accidents_today"] = len(today_accidents)
        self.stats["fatal_accidents_today"] = len([a for a in today_accidents if a.severity == SeverityLevel.CRITICAL])
        self.stats["total_casualties_today"] = sum(a.casualties for a in today_accidents)
        self.stats["total_injuries_today"] = sum(a.injuries for a in today_accidents)
        
        today_violations = [v for v in self.violations.values() if v.detected_at.date() == today]
        self.stats["total_violations_today"] = len(today_violations)
        self.stats["speed_violations_today"] = len([v for v in today_violations if v.violation_type == CauseType.SPEEDING])
        
    def _get_accidents_by_type(self) -> Dict:
        counts = {}
        for acc in self.accidents.values():
            t = acc.accident_type.value
            counts[t] = counts.get(t, 0) + 1
        return counts
    
    def _get_accidents_by_cause(self) -> Dict:
        counts = {}
        for acc in self.accidents.values():
            c = acc.cause.value
            counts[c] = counts.get(c, 0) + 1
        return counts
    
    def _get_accidents_by_severity(self) -> Dict:
        return {
            s.value: len([a for a in self.accidents.values() if a.severity == s])
            for s in SeverityLevel
        }
    
    def _get_violations_by_type(self) -> Dict:
        counts = {}
        for v in self.violations.values():
            t = v.violation_type.value
            counts[t] = counts.get(t, 0) + 1
        return counts
    
    def _get_road_stats(self) -> List[Dict]:
        return [
            {
                "name": seg.name,
                "category": seg.category,
                "limit": seg.speed_limit,
                "accidents_30d": seg.accident_count_30_days,
                "risk_level": seg.current_risk_level.value,
                "adt": seg.average_daily_traffic,
            }
            for seg in self.road_segments.values()
        ]
    
    def _get_hourly_trend(self) -> List[Dict]:
        now = utcnow()
        trend = []
        for i in range(24):
            hour = (now.hour - 23 + i) % 24
            count = random.randint(0, 15)
            trend.append({"hour": f"{hour:02d}:00", "accidents": count, "violations": count * 3})
        return trend
    
    def generate_mock_data(self):
        """Generate comprehensive realistic mock data for the system"""
        accident_types = list(AccidentType)
        causes = list(CauseType)
        severities = list(SeverityLevel)
        vehicle_types = list(VehicleType)
        
        # Generate realistic historical accidents (last 30 days)
        now = utcnow()
        for days_ago in range(30):
            # Generate 0-5 accidents per day
            num_accidents = random.randint(0, 5)
            for _ in range(num_accidents):
                hours_ago = random.randint(0, 23)
                reported_time = now - timedelta(days=days_ago, hours=hours_ago)
                
                accident = self.create_accident_report(
                    accident_type=random.choice(accident_types),
                    cause=random.choice(causes),
                    location=random.choice(ACCIDENT_HOTSPOTS)["name"],
                    road_name=random.choice(KENYA_ROADS)["name"],
                    coordinates=Coordinates(
                        lat=random.uniform(-1.5, 0.5),
                        lng=random.uniform(34.5, 40.0)
                    ),
                    severity=random.choice(severities),
                    vehicles_involved=[random.choice(list(self.vehicles.keys()))],
                    description=f"Auto-generated accident - {random.choice(['Minor collision', 'Traffic incident', 'Road hazard', 'Single vehicle accident'])}"
                )
                # Backdate the accident
                accident.reported_at = reported_time
                if accident.status in [IncidentStatus.CLEARED, IncidentStatus.CLOSED]:
                    accident.cleared_at = reported_time + timedelta(minutes=random.randint(15, 120))
        
        # Generate realistic violations (last 30 days)
        for days_ago in range(30):
            # Generate 10-30 violations per day
            num_violations = random.randint(10, 30)
            for _ in range(num_violations):
                hours_ago = random.randint(0, 23)
                detected_time = now - timedelta(days=days_ago, hours=hours_ago)
                
                violation = self.record_violation(
                    violation_type=random.choice(causes[:8]),
                    plate_number=random.choice(list(self.vehicles.keys())),
                    vehicle_type=random.choice(vehicle_types),
                    location=random.choice(KENYA_ROADS)["name"],
                    road_name=random.choice(KENYA_ROADS)["name"],
                    coordinates=Coordinates(
                        lat=random.uniform(-1.5, 0.5),
                        lng=random.uniform(34.5, 40.0)
                    ),
                    camera_id=f"cam_{random.randint(1, 8):03d}",
                    speed_detected=random.uniform(60, 160) if random.random() > 0.3 else None,
                    speed_limit=random.choice([50, 60, 80, 100]),
                    evidence_image=f"evidence_{uuid.uuid4().hex[:8]}.jpg"
                )
                # Backdate and set random status
                violation.detected_at = detected_time
                status_choice = random.random()
                if status_choice < 0.3:
                    violation.status = ViolationStatus.PAID
                    violation.paid_at = detected_time + timedelta(days=random.randint(1, 15))
                elif status_choice < 0.6:
                    violation.status = ViolationStatus.ISSUED
                    violation.issued_at = detected_time + timedelta(hours=random.randint(1, 12))
                    violation.due_date = detected_time + timedelta(days=30)
                elif status_choice < 0.8:
                    violation.status = ViolationStatus.DETECTED
                else:
                    violation.status = ViolationStatus.REVIEWED
        
        # Generate speed detections
        for _ in range(200):
            self.detect_speed(
                camera_id=f"cam_{random.randint(1, 8):03d}",
                plate_number=random.choice(list(self.vehicles.keys())),
                vehicle_type=random.choice(vehicle_types),
                speed_detected=random.uniform(50, 150),
                location=random.choice(KENYA_ROADS)["name"],
                coordinates=Coordinates(
                    lat=random.uniform(-1.5, 0.5),
                    lng=random.uniform(34.5, 40.0)
                )
            )
        
        self._update_stats()
        logger.info(f"Generated {len(self.accidents)} accidents and {len(self.violations)} violations")
        logger.info(f"Total speed detections: {len(self.speed_detections)}")


road_safety_engine = RoadSafetyEngine()
