from enum import Enum


class UserRole(Enum):
    ADMIN = "admin"
    OFFICER = "officer"
    CITIZEN = "citizen"


class AlertSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertType(Enum):
    SYSTEM = "system"
    INCIDENT = "incident"
    WARNING = "warning"
    RISK = "risk"
    CAMERA = "camera"
    ANPR = "anpr"
    EMERGENCY = "emergency"
    TRAFFIC = "traffic"
    WEATHER = "weather"


class IncidentStatus(Enum):
    REPORTED = "reported"
    DISPATCHED = "dispatched"
    ENROUTE = "enroute"
    ON_SCENE = "on_scene"
    RESOLVED = "resolved"


class SeverityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ViolationStatus(Enum):
    DETECTED = "detected"
    ISSUED = "issued"
    PAID = "paid"
    CANCELLED = "cancelled"


class UserStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class TeamType(Enum):
    DISPATCH = "dispatch"
    RESPONSE = "response"
    SUPPORT = "support"


class VehicleType(Enum):
    CAR = "car"
    SALOON = "saloon"
    STATION_WAGON = "station_wagon"
    PICKUP = "pickup"
    LORRY = "lorry"
    BUS = "bus"
    MATATU = "matatu"
    TAXI = "taxi"
    OTHER = "other"


class CameraType(Enum):
    FIXED = "fixed"
    PTZ = "ptz"
    DOME = "dome"
    BULK = "bulk"


class ReportType(Enum):
    INCIDENT = "incident"
    ACCIDENT = "accident"
    VIOLATION = "violation"
    OTHER = "other"


class IncidentType(Enum):
    INCIDENT = "incident"
    ACCIDENT = "accident"
    COLLISION = "collision"
    OTHER = "other"


class ResponderType(Enum):
    POLICE = "police"
    MEDICAL = "medical"
    FIRE = "fire"
    OTHER = "other"


class ResponderStatus(Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"


class DispatchStatus(Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    EN_ROUTE = "enroute"
    ON_SCENE = "on_scene"
    COMPLETED = "completed"


class AlertStatus(Enum):
    NEW = "new"
    PENDING = "pending"
    ACTIVE = "active"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"
    ACKNOWLEDGED = "acknowledged"


class AppealStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class NotificationChannel(Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBHOOK = "webhook"


class DetectionType(Enum):
    VEHICLE = "vehicle"
    PERSON = "person"
    OBJECT = "object"
    LICENSE_PLATE = "license_plate"
    SPEED = "speed"
    FIRE = "fire"
    SMOKE = "smoke"
    SPEEDING = "speeding"
    STOPPED_VEHICLE = "stopped_vehicle"
    SUSPICIOUS_OBJECT = "suspicious_object"
    ANIMAL = "animal"
    ACCIDENT = "accident"
    HAZARD = "hazard"
