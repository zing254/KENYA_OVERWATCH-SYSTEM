from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    OFFICER = "officer"
    DISPATCHER = "dispatcher"
    VIEWER = "viewer"
    CITIZEN = "citizen"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"
    LOCKED = "locked"


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


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, Enum):
    DETECTED = "detected"
    VERIFIED = "verified"
    ASSIGNED = "assigned"
    ENROUTE = "enroute"
    ONSCENE = "onscene"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    REPORTED = "reported"
    DISPATCHED = "dispatched"
    ON_SCENE = "on_scene"
    TREATMENT = "treatment"
    CLEARED = "cleared"
    INVESTIGATION = "investigation"
    CLOSED = "closed"


class ViolationStatus(str, Enum):
    DETECTED = "detected"
    CAPTURED = "captured"
    REVIEWED = "reviewed"
    ISSUED = "issued"
    PAID = "paid"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


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


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"


class RoadUserType(str, Enum):
    DRIVER = "driver"
    PASSENGER = "passenger"
    PEDESTRIAN = "pedestrian"
    CYCLIST = "cyclist"
    MOTORCYCLIST = "motorcyclist"


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


class AlertSeverity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    WARNING = "warning"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class AlertType(str, Enum):
    SPEEDING = "speeding"
    RED_LIGHT = "red_light"
    NO_INSURANCE = "no_inspection"
    STOLEN_VEHICLE = "stolen_vehicle"
    OVERLOADING = "overloading"
    DANGEROUS_DRIVING = "dangerous_driving"
    ACCIDENT = "accident"
    INCIDENT = "incident"
    RISK = "risk"
    SYSTEM = "system"
    SECURITY = "security"
    CAMERA = "camera"
    EVIDENCE = "evidence"
    DISPATCH = "dispatch"
    ANPR = "anpr"


class AlertStatus(str, Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    DISPATCHED = "dispatched"
    RESOLVED = "resolved"
    CLOSED = "closed"


class NotificationChannel(str, Enum):
    PUSH = "push"
    SMS = "sms"
    EMAIL = "email"
    WEBHOOK = "webhook"
    BROADCAST = "broadcast"


class TeamType(str, Enum):
    PATROL = "patrol"
    RESPONSE = "response"
    INVESTIGATION = "investigation"
    TRAFFIC = "traffic"


class CameraType(str, Enum):
    FIXED = "fixed"
    MOBILE = "mobile"
    SPEED_CAMERA = "speed_camera"
    RED_LIGHT_CAMERA = "red_light_camera"
    ANPR = "anpr"


class ReportType(str, Enum):
    INCIDENT = "incident"
    VIOLATION = "violation"
    ACCIDENT = "accident"
    APPEAL = "appeal"


class AppealStatus(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    APPROVED = "approved"
    REJECTED = "rejected"


class IncidentType(str, Enum):
    ACCIDENT = "accident"
    OVERSPEEDING = "overspeeding"
    LANE_VIOLATION = "lane_violation"
    DANGEROUS_OVERTAKING = "dangerous_overtaking"
    BREAKDOWN = "breakdown"
    HAZARD = "hazard"
    RED_LIGHT_VIOLATION = "red_light_violation"
    USING_PHONE = "using_phone"
    NO_SEATBELT = "no_seatbelt"


class DetectionType(str, Enum):
    PERSON = "person"
    VEHICLE = "vehicle"
    WEAPON = "weapon"
    ANIMAL = "animal"
    SUSPICIOUS_OBJECT = "suspicious_object"
    FIRE = "fire"
    SMOKE = "smoke"
    LICENSE_PLATE = "license_plate"
    FACE = "face"
    ABANDONED_OBJECT = "abandoned_object"
    INTRUSION = "intrusion"
    CROWD = "crowd"
    FIGHT = "fight"
    THEFT = "theft"
    TRAFFIC_VIOLATION = "traffic_violation"
    SPEEDING = "speeding"
    LANE_VIOLATION = "lane_violation"
    RED_LIGHT_VIOLATION = "red_light_violation"
    DANGEROUS_OVERTAKING = "dangerous_overtaking"
    STOPPED_VEHICLE = "stopped_vehicle"
    PEDESTRIAN_CROSSING = "pedestrian_crossing"
    ACCIDENT = "accident"
    HAZARD = "hazard"
    POTHOLE = "pothole"
    DEBRIS = "debris"


class ResponderType(str, Enum):
    POLICE = "police"
    AMBULANCE = "ambulance"
    FIRE = "fire"
    TOW_TRUCK = "tow_truck"
    MAINTENANCE = "maintenance"


class DispatchStatus(str, Enum):
    PENDING = "pending"
    DISPATCHED = "dispatched"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ResponderStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    OFF_DUTY = "off_duty"
