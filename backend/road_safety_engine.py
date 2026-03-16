from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import List, Optional, Dict, Tuple
import random
import uuid


class AccidentType(Enum):
    REAR_END = "rear_end"
    HEAD_ON = "head_on"
    SIDE_IMPACT = "side_impact"
    HIT_PEDESTRIAN = "hit_pedestrian"
    ROLLOVER = "rollover"
    HIT_ANIMAL = "hit_animal"
    OBJECT_STRIKE = "object_strike"
    SINGLE_VEHICLE = "single_vehicle"
    MULTI_VEHICLE = "multi_vehicle"
    PARKED_VEHICLE = "parked_vehicle"


class CauseType(Enum):
    SPEEDING = "speeding"
    RED_LIGHT = "red_light"
    RECKLESS = "reckless_driving"
    OVERTAKING = "overtaking"
    DRUNK_DRIVING = "drunk_driving"
    WRONG_WAY = "wrong_way"
    ILLEGAL_PARKING = "illegal_parking"
    USING_PHONE = "using_phone"
    OVERLOADING = "overloading"
    FATIGUED = "fatigued"
    OTHER = "other"


class SeverityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(Enum):
    REPORTED = "reported"
    DISPATCHED = "dispatched"
    ENROUTE = "enroute"
    ON_SCENE = "on_scene"
    RESOLVED = "resolved"


class VehicleType(Enum):
    CAR = "car"
    TRUCK = "truck"
    BUS = "bus"
    MOTORCYCLE = "motorcycle"
    MATATU = "matatu"
    BODA_BODA = "boda_boda"
    PSV = "psv"


class ViolationStatus(Enum):
    DETECTED = "detected"
    ISSUED = "issued"
    PAID = "paid"
    CANCELLED = "cancelled"


@dataclass
class Coordinates:
    lat: float
    lng: float

    def to_dict(self) -> dict:
        return {"lat": self.lat, "lng": self.lng}


@dataclass
class RoadAccident:
    id: str
    accident_type: AccidentType
    cause: CauseType
    location: str
    road_name: str
    severity: SeverityLevel
    status: str
    casualties: int
    injuries: int
    reported_at: datetime
    coordinates: Optional[Coordinates] = None
    description: Optional[str] = None
    weather: Optional[str] = None
    road_conditions: Optional[str] = None
    vehicles_involved: int = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "accident_type": self.accident_type.value,
            "cause": self.cause.value,
            "location": self.location,
            "road_name": self.road_name,
            "severity": self.severity.value,
            "status": self.status,
            "casualties": self.casualties,
            "injuries": self.injuries,
            "reported_at": self.reported_at.isoformat(),
            "coordinates": self.coordinates.to_dict() if self.coordinates else None,
            "description": self.description,
            "weather": self.weather,
            "road_conditions": self.road_conditions,
            "vehicles_involved": self.vehicles_involved,
        }


@dataclass
class TrafficViolation:
    id: str
    violation_type: str
    plate_number: str
    location: str
    speed_detected: Optional[float]
    speed_limit: Optional[float]
    fine_amount: float
    status: ViolationStatus
    detected_at: datetime
    road_name: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    camera_id: Optional[str] = None
    evidence_image: Optional[str] = None
    vehicle_type: Optional[str] = None
    issued_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    officer_id: Optional[str] = None
    notes: Optional[str] = None
    penalty_points: int = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "violation_type": self.violation_type,
            "plate_number": self.plate_number,
            "location": self.location,
            "speed_detected": self.speed_detected,
            "speed_limit": self.speed_limit,
            "fine_amount": self.fine_amount,
            "status": self.status.value,
            "detected_at": self.detected_at.isoformat(),
            "road_name": self.road_name,
            "coordinates": self.coordinates.to_dict() if self.coordinates else None,
            "camera_id": self.camera_id,
            "evidence_image": self.evidence_image,
            "vehicle_type": self.vehicle_type,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "officer_id": self.officer_id,
            "notes": self.notes,
            "penalty_points": self.penalty_points,
        }


@dataclass
class Vehicle:
    plate_number: str
    vehicle_type: VehicleType
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    owner_name: Optional[str] = None
    status: str = "active"

    def to_dict(self) -> dict:
        return {
            "plate_number": self.plate_number,
            "vehicle_type": (
                self.vehicle_type.value
                if isinstance(self.vehicle_type, VehicleType)
                else self.vehicle_type
            ),
            "make": self.make,
            "model": self.model,
            "year": self.year,
            "color": self.color,
            "owner_name": self.owner_name,
            "status": self.status,
        }


@dataclass
class Driver:
    license_number: str
    name: str
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: str = "active"
    total_violations: int = 0
    license_class: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "license_number": self.license_number,
            "name": self.name,
            "date_of_birth": self.date_of_birth,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "status": self.status,
            "total_violations": self.total_violations,
            "license_class": self.license_class,
        }


@dataclass
class SpeedDetection:
    id: str
    camera_id: str
    plate_number: str
    speed: float
    location: str
    coordinates: Coordinates
    detected_at: datetime
    speed_limit: Optional[float] = None
    violation_created: bool = False
    violation_id: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "camera_id": self.camera_id,
            "plate_number": self.plate_number,
            "speed": self.speed,
            "location": self.location,
            "coordinates": self.coordinates.to_dict(),
            "detected_at": self.detected_at.isoformat(),
            "speed_limit": self.speed_limit,
            "violation_created": self.violation_created,
            "violation_id": self.violation_id,
        }


@dataclass
class RoadSegment:
    id: str
    name: str
    category: str
    average_daily_traffic: int
    current_risk_level: str
    speed_limit: int = 80
    accidents_30d: int = 0


ACCIDENT_HOTSPOTS = [
    {"name": "Mombasa Road Junction", "lat": -1.33, "lng": 36.98, "risk_score": 0.85},
    {
        "name": "Nairobi CBD Roundabout",
        "lat": -1.2864,
        "lng": 36.8232,
        "risk_score": 0.78,
    },
    {
        "name": "Thika Road Superhighway",
        "lat": -1.2107,
        "lng": 36.8865,
        "risk_score": 0.72,
    },
    {
        "name": "Uhuru Highway Junction",
        "lat": -1.2921,
        "lng": 36.8155,
        "risk_score": 0.68,
    },
    {"name": "Waiyaki Way", "lat": -1.2634, "lng": 36.7589, "risk_score": 0.65},
]

KENYA_ROADS = {
    "region": "Kenya",
    "roads": [
        {"name": "Mombasa Road (A109)", "category": "highway", "limit": 100},
        {"name": "Nairobi Expressway", "category": "highway", "limit": 80},
        {"name": "Thika Road", "category": "highway", "limit": 100},
        {"name": "Uhuru Highway", "category": "urban", "limit": 50},
        {"name": "Waiyaki Way", "category": "highway", "limit": 80},
    ],
}

# Fine amounts by violation type (in KES)
FINES = {
    "speeding": {"base": 10000, "per_km_over": 500},
    "red_light": {"base": 15000},
    "reckless_driving": {"base": 20000},
    "overtaking": {"base": 10000},
    "drunk_driving": {"base": 100000},
    "wrong_way": {"base": 15000},
    "illegal_parking": {"base": 5000},
    "using_phone": {"base": 10000},
    "overloading": {"base": 20000},
    "fatigued": {"base": 15000},
}

PENALTY_POINTS = {
    "speeding": 3,
    "red_light": 5,
    "reckless_driving": 6,
    "overtaking": 4,
    "drunk_driving": 10,
    "wrong_way": 5,
    "illegal_parking": 2,
    "using_phone": 3,
    "overloading": 4,
    "fatigued": 5,
}


class RoadSafetyEngine:
    def __init__(self):
        self.vehicles: Dict[str, Vehicle] = {}
        self.drivers: Dict[str, Driver] = {}
        self.accidents: List[RoadAccident] = []
        self.violations: List[TrafficViolation] = []
        self.speed_detections: List[SpeedDetection] = []
        self.road_segments: Dict[str, RoadSegment] = {}
        self.citizen_reports: List[dict] = []
        self.stats = {
            "total_accidents_today": 0,
            "total_violations_today": 0,
            "total_casualties_today": 0,
            "avg_response_time": 8.0,
        }
        self._init_road_segments()

    def _init_road_segments(self):
        segments = [
            RoadSegment(
                id="seg_001",
                name="Mombasa Road (A109)",
                category="highway",
                average_daily_traffic=45000,
                current_risk_level="high",
                speed_limit=100,
                accidents_30d=45,
            ),
            RoadSegment(
                id="seg_002",
                name="Nairobi Expressway",
                category="highway",
                average_daily_traffic=38000,
                current_risk_level="medium",
                speed_limit=80,
                accidents_30d=28,
            ),
            RoadSegment(
                id="seg_003",
                name="Thika Road",
                category="highway",
                average_daily_traffic=52000,
                current_risk_level="medium",
                speed_limit=100,
                accidents_30d=32,
            ),
            RoadSegment(
                id="seg_004",
                name="Uhuru Highway",
                category="urban",
                average_daily_traffic=30000,
                current_risk_level="high",
                speed_limit=50,
                accidents_30d=22,
            ),
            RoadSegment(
                id="seg_005",
                name="Waiyaki Way",
                category="highway",
                average_daily_traffic=35000,
                current_risk_level="medium",
                speed_limit=80,
                accidents_30d=18,
            ),
        ]
        for s in segments:
            self.road_segments[s.id] = s

    def _generate_id(self, prefix: str) -> str:
        return f"{prefix}_{uuid.uuid4().hex[:8]}"

    def get_dashboard_stats(self) -> dict:
        roads = [
            {
                "name": s.name,
                "category": s.category,
                "limit": s.speed_limit,
                "accidents_30d": s.accidents_30d,
                "risk_level": s.current_risk_level,
            }
            for s in self.road_segments.values()
        ]
        trend = [
            {
                "hour": f"{h:02d}:00",
                "accidents": random.randint(0, 15),
                "violations": random.randint(5, 50),
            }
            for h in range(24)
        ]
        by_type = {}
        for a in self.accidents:
            t = a.accident_type.value
            by_type[t] = by_type.get(t, 0) + 1
        if not by_type:
            by_type = {"rear_end": 12, "head_on": 8, "side_impact": 15, "rollover": 6}

        by_cause = {}
        for a in self.accidents:
            c = a.cause.value
            by_cause[c] = by_cause.get(c, 0) + 1
        if not by_cause:
            by_cause = {
                "speeding": 25,
                "red_light": 10,
                "reckless_driving": 8,
                "drunk_driving": 5,
            }

        by_violation_type = {}
        for v in self.violations:
            t = v.violation_type
            by_violation_type[t] = by_violation_type.get(t, 0) + 1
        if not by_violation_type:
            by_violation_type = {
                "speeding": 45,
                "red_light": 20,
                "illegal_parking": 15,
                "using_phone": 10,
            }

        return {
            "roads": roads,
            "trend": trend,
            "accidents": {
                "by_type": by_type,
                "by_cause": by_cause,
            },
            "violations": {
                "by_type": by_violation_type,
            },
            "hotspots": ACCIDENT_HOTSPOTS,
            "total_accidents": len(self.accidents),
            "total_violations": len(self.violations),
            "total_vehicles": len(self.vehicles),
            "total_drivers": len(self.drivers),
        }

    def get_all_accidents(
        self, limit: Optional[int] = None, status=None, severity=None
    ) -> List[RoadAccident]:
        results = list(self.accidents)
        if status:
            results = [a for a in results if a.status == status]
        if severity:
            results = [a for a in results if a.severity.value == severity]
        if limit:
            results = results[:limit]
        return results

    def get_all_violations(
        self, limit: Optional[int] = None, status=None, plate_number=None
    ) -> List[TrafficViolation]:
        results = list(self.violations)
        if status:
            results = [v for v in results if v.status == status]
        if plate_number:
            results = [v for v in results if v.plate_number == plate_number]
        if limit:
            results = results[:limit]
        return results

    def get_all_vehicles(self) -> List[Vehicle]:
        return list(self.vehicles.values())

    def get_all_drivers(self) -> List[Driver]:
        return list(self.drivers.values())

    def get_incident(self, incident_id: str) -> Optional[RoadAccident]:
        for a in self.accidents:
            if a.id == incident_id:
                return a
        return None

    def get_accident(self, accident_id: str) -> Optional[RoadAccident]:
        return self.get_incident(accident_id)

    def get_vehicle(self, plate_number: str) -> Optional[Vehicle]:
        return self.vehicles.get(plate_number.upper())

    def get_driver(self, license_number: str) -> Optional[Driver]:
        return self.drivers.get(license_number.upper())

    def get_violation(self, violation_id: str) -> Optional[TrafficViolation]:
        for v in self.violations:
            if v.id == violation_id:
                return v
        return None

    def get_speed_detection(self, detection_id: str) -> Optional[SpeedDetection]:
        for d in self.speed_detections:
            if d.id == detection_id:
                return d
        return None

    def create_accident_report(
        self,
        accident_type: AccidentType,
        cause: CauseType,
        location: str,
        road_name: str,
        coordinates: Coordinates,
        severity: SeverityLevel,
        vehicles_involved: int = 0,
        description: Optional[str] = None,
        weather: Optional[str] = None,
        road_conditions: Optional[str] = None,
    ) -> RoadAccident:
        new_id = self._generate_id("acc")
        a = RoadAccident(
            id=new_id,
            accident_type=accident_type,
            cause=cause,
            location=location,
            road_name=road_name,
            severity=severity,
            status="reported",
            casualties=0,
            injuries=0,
            reported_at=datetime.now(timezone.utc),
            coordinates=coordinates,
            description=description,
            weather=weather,
            road_conditions=road_conditions,
            vehicles_involved=vehicles_involved,
        )
        self.accidents.append(a)
        self.stats["total_accidents_today"] += 1
        return a

    def record_violation(
        self,
        violation_type: CauseType,
        plate_number: str,
        vehicle_type: VehicleType,
        location: str,
        road_name: str,
        coordinates: Coordinates,
        camera_id: Optional[str] = None,
        speed_detected: Optional[float] = None,
        speed_limit: Optional[float] = None,
        evidence_image: Optional[str] = None,
    ) -> TrafficViolation:
        vtype = (
            violation_type.value
            if isinstance(violation_type, CauseType)
            else str(violation_type)
        )

        fine_info = FINES.get(vtype, {"base": 5000})
        fine_amount = fine_info["base"]
        if vtype == "speeding" and speed_detected and speed_limit:
            over = max(0, speed_detected - speed_limit)
            fine_amount += int(over * fine_info.get("per_km_over", 0))

        penalty_pts = PENALTY_POINTS.get(vtype, 2)

        new_id = self._generate_id("vio")
        v = TrafficViolation(
            id=new_id,
            violation_type=vtype,
            plate_number=plate_number.upper(),
            location=location,
            road_name=road_name,
            speed_detected=speed_detected,
            speed_limit=speed_limit,
            fine_amount=fine_amount,
            status=ViolationStatus.DETECTED,
            detected_at=datetime.now(timezone.utc),
            coordinates=coordinates,
            camera_id=camera_id,
            evidence_image=evidence_image,
            vehicle_type=(
                vehicle_type.value
                if isinstance(vehicle_type, VehicleType)
                else str(vehicle_type)
            ),
            penalty_points=penalty_pts,
        )
        self.violations.append(v)
        self.stats["total_violations_today"] += 1

        if plate_number.upper() not in self.vehicles:
            self.vehicles[plate_number.upper()] = Vehicle(
                plate_number=plate_number.upper(),
                vehicle_type=vehicle_type,
            )

        return v

    def detect_speed(
        self,
        camera_id: str,
        plate_number: str,
        vehicle_type: VehicleType,
        speed_detected: float,
        location: str,
        coordinates: Coordinates,
        image_front: Optional[str] = None,
        image_rear: Optional[str] = None,
        speed_limit: float = 80.0,
    ) -> Tuple[SpeedDetection, Optional[TrafficViolation]]:
        det_id = self._generate_id("spd")
        detection = SpeedDetection(
            id=det_id,
            camera_id=camera_id,
            plate_number=plate_number.upper(),
            speed=speed_detected,
            location=location,
            coordinates=coordinates,
            detected_at=datetime.now(timezone.utc),
            speed_limit=speed_limit,
        )

        violation = None
        if speed_detected > speed_limit:
            violation = self.record_violation(
                violation_type=CauseType.SPEEDING,
                plate_number=plate_number,
                vehicle_type=vehicle_type,
                location=location,
                road_name=location,
                coordinates=coordinates,
                camera_id=camera_id,
                speed_detected=speed_detected,
                speed_limit=speed_limit,
                evidence_image=image_front,
            )
            detection.violation_created = True
            detection.violation_id = violation.id

        self.speed_detections.append(detection)
        return detection, violation

    def generate_mock_data(self) -> dict:
        now = datetime.now(timezone.utc)

        vehicles_data = [
            (
                "KAA 123A",
                VehicleType.CAR,
                "Toyota",
                "Corolla",
                2020,
                "White",
                "John Kamau",
            ),
            (
                "KBB 456B",
                VehicleType.TRUCK,
                "Isuzu",
                "NPR",
                2019,
                "Blue",
                "Peter Ochieng",
            ),
            (
                "KCC 789C",
                VehicleType.MATATU,
                "Toyota",
                "Hiace",
                2018,
                "Yellow",
                "Mary Wanjiku",
            ),
            (
                "KDD 012D",
                VehicleType.BUS,
                "Scania",
                "K360",
                2021,
                "Green",
                "Kenya Bus Services",
            ),
            (
                "KEE 345E",
                VehicleType.MOTORCYCLE,
                "Honda",
                "CB125",
                2022,
                "Red",
                "James Mwangi",
            ),
            (
                "KFF 678F",
                VehicleType.CAR,
                "Nissan",
                "Note",
                2020,
                "Silver",
                "Grace Akinyi",
            ),
            (
                "KGG 901G",
                VehicleType.BODA_BODA,
                "TVS",
                "HLX",
                2021,
                "Black",
                "Daniel Odhiambo",
            ),
            (
                "KHH 234H",
                VehicleType.PSV,
                "Isuzu",
                "NQR",
                2019,
                "White",
                "Super Metro Sacco",
            ),
        ]
        for plate, vtype, make, model, year, color, owner in vehicles_data:
            self.vehicles[plate] = Vehicle(
                plate_number=plate,
                vehicle_type=vtype,
                make=make,
                model=model,
                year=year,
                color=color,
                owner_name=owner,
            )

        drivers_data = [
            (
                "DL001234",
                "John Kamau Mwangi",
                "1985-03-15",
                "+254712345678",
                "john.kamau@email.com",
                "Nairobi",
                "B",
            ),
            (
                "DL002345",
                "Peter Ochieng Okello",
                "1990-07-22",
                "+254723456789",
                "peter.ochieng@email.com",
                "Kisumu",
                "C",
            ),
            (
                "DL003456",
                "Mary Wanjiku Njoroge",
                "1988-11-10",
                "+254734567890",
                "mary.wanjiku@email.com",
                "Nakuru",
                "B",
            ),
            (
                "DL004567",
                "James Mwangi Kamau",
                "1995-01-30",
                "+254745678901",
                "james.mwangi@email.com",
                "Mombasa",
                "A",
            ),
            (
                "DL005678",
                "Grace Akinyi Omondi",
                "1992-09-05",
                "+254756789012",
                "grace.akinyi@email.com",
                "Eldoret",
                "B",
            ),
            (
                "DL006789",
                "Daniel Odhiambo Achieng",
                "1987-04-18",
                "+254767890123",
                "daniel.odhiambo@email.com",
                "Thika",
                "A",
            ),
        ]
        for lic, name, dob, phone, email, addr, lclass in drivers_data:
            self.drivers[lic] = Driver(
                license_number=lic,
                name=name,
                date_of_birth=dob,
                phone=phone,
                email=email,
                address=addr,
                license_class=lclass,
            )

        accident_types = list(AccidentType)
        causes = list(CauseType)
        severities = list(SeverityLevel)
        locations = [
            ("Mombasa Road Junction", "Mombasa Road (A109)"),
            ("Nairobi CBD Roundabout", "Uhuru Highway"),
            ("Thika Road Stage", "Thika Road"),
            ("Waiyaki Way Underpass", "Waiyaki Way"),
            ("Langata Road Near Wilson", "Langata Road"),
        ]

        for i in range(10):
            loc, road = random.choice(locations)
            acc = RoadAccident(
                id=f"acc_{i+1:03d}",
                accident_type=random.choice(accident_types),
                cause=random.choice(causes),
                location=loc,
                road_name=road,
                severity=random.choice(severities),
                status=random.choice(
                    ["reported", "dispatched", "on_scene", "resolved"]
                ),
                casualties=random.randint(0, 3),
                injuries=random.randint(0, 8),
                reported_at=now - timedelta(hours=random.randint(1, 720)),
                coordinates=Coordinates(
                    lat=-1.29 + random.uniform(-0.1, 0.1),
                    lng=36.82 + random.uniform(-0.1, 0.1),
                ),
                vehicles_involved=random.randint(1, 4),
            )
            self.accidents.append(acc)

        vtypes = list(FINES.keys())
        plates = [v[0] for v in vehicles_data]
        for i in range(25):
            vtype = random.choice(vtypes)
            fine = FINES.get(vtype, {"base": 5000})["base"]
            loc, road = random.choice(locations)
            spd = random.uniform(60, 160) if vtype == "speeding" else None
            lim = 80 if vtype == "speeding" else None

            v = TrafficViolation(
                id=f"vio_{i+1:03d}",
                violation_type=vtype,
                plate_number=random.choice(plates),
                location=loc,
                road_name=road,
                speed_detected=round(spd, 1) if spd else None,
                speed_limit=lim,
                fine_amount=fine
                + (int((spd - lim) * 500) if spd and lim and spd > lim else 0),
                status=random.choice(
                    [
                        ViolationStatus.DETECTED,
                        ViolationStatus.ISSUED,
                        ViolationStatus.PAID,
                    ]
                ),
                detected_at=now - timedelta(hours=random.randint(1, 720)),
                coordinates=Coordinates(
                    lat=-1.29 + random.uniform(-0.1, 0.1),
                    lng=36.82 + random.uniform(-0.1, 0.1),
                ),
                camera_id=f"cam_{random.randint(1, 20):03d}",
                vehicle_type="car",
                penalty_points=PENALTY_POINTS.get(vtype, 2),
            )
            self.violations.append(v)

        return {
            "vehicles": len(self.vehicles),
            "drivers": len(self.drivers),
            "accidents": len(self.accidents),
            "violations": len(self.violations),
        }

    def create_vehicle(
        self,
        plate_number: str,
        vehicle_type: str,
        make: Optional[str] = None,
        model: Optional[str] = None,
        year: Optional[int] = None,
        color: Optional[str] = None,
        owner_name: Optional[str] = None,
    ) -> Vehicle:
        vtype = (
            VehicleType(vehicle_type)
            if vehicle_type not in [e.value for e in VehicleType]
            else VehicleType(vehicle_type)
        )
        vehicle = Vehicle(
            plate_number=plate_number.upper(),
            vehicle_type=vtype,
            make=make,
            model=model,
            year=year,
            color=color,
            owner_name=owner_name,
        )
        self.vehicles[plate_number.upper()] = vehicle
        return vehicle

    def update_vehicle(self, plate_number: str, **kwargs) -> Optional[Vehicle]:
        vehicle = self.vehicles.get(plate_number.upper())
        if not vehicle:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(vehicle, key):
                setattr(vehicle, key, value)
        return vehicle

    def delete_vehicle(self, plate_number: str) -> bool:
        plate = plate_number.upper()
        if plate in self.vehicles:
            del self.vehicles[plate]
            return True
        return False

    def create_driver(self, license_number: str, name: str, **kwargs) -> Driver:
        driver = Driver(license_number=license_number.upper(), name=name, **kwargs)
        self.drivers[license_number.upper()] = driver
        return driver

    def update_driver(self, license_number: str, **kwargs) -> Optional[Driver]:
        driver = self.drivers.get(license_number.upper())
        if not driver:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(driver, key):
                setattr(driver, key, value)
        return driver

    def delete_driver(self, license_number: str) -> bool:
        lic = license_number.upper()
        if lic in self.drivers:
            del self.drivers[lic]
            return True
        return False


road_safety_engine = RoadSafetyEngine()

CITIZEN_REPORTS = []
