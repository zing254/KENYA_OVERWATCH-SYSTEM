"""
Pydantic Models for Request Validation
Kenya NTSA Road Safety API
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================
class AccidentTypeEnum(str, Enum):
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


class CauseTypeEnum(str, Enum):
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


class SeverityLevelEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class VehicleTypeEnum(str, Enum):
    MOTORCYCLE = "motorcycle"
    SALOON = "saloon"
    STATION_WAGON = "station_wagon"
    PICKUP = "pickup"
    LORRY = "lorry"
    BUS = "bus"
    MATATU = "matatu"
    TAXI = "taxi"
    OTHER = "other"


# ==================== COORDINATES ====================
class CoordinatesInput(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")


# ==================== ACCIDENT MODELS ====================
class AccidentCreate(BaseModel):
    accident_type: AccidentTypeEnum = Field(..., description="Type of accident")
    cause: CauseTypeEnum = Field(..., description="Cause of accident")
    location: str = Field(..., min_length=3, max_length=200, description="Location description")
    road_name: str = Field(..., min_length=3, max_length=100, description="Road name")
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    severity: SeverityLevelEnum = Field(default=SeverityLevelEnum.MEDIUM, description="Severity level")
    vehicles: List[str] = Field(default_factory=list, description="Vehicle plate numbers involved")
    description: str = Field(default="", max_length=1000, description="Description")
    weather: str = Field(default="clear", description="Weather conditions")
    road_conditions: str = Field(default="good", description="Road conditions")
    
    @validator('location', 'road_name')
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()


# ==================== VIOLATION MODELS ====================
class ViolationCreate(BaseModel):
    violation_type: CauseTypeEnum = Field(..., description="Type of violation")
    plate_number: str = Field(..., min_length=5, max_length=20, description="Vehicle plate number")
    vehicle_type: VehicleTypeEnum = Field(default=VehicleTypeEnum.SALOON, description="Vehicle type")
    location: str = Field(..., min_length=3, max_length=200, description="Location")
    road_name: str = Field(..., min_length=3, max_length=100, description="Road name")
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    camera_id: str = Field(default="", description="Camera ID")
    speed_detected: Optional[float] = Field(None, ge=0, le=300, description="Detected speed")
    speed_limit: Optional[float] = Field(None, ge=0, le=200, description="Speed limit")
    evidence_image: str = Field(default="", description="Evidence image URL")
    
    @validator('plate_number')
    def validate_plate(cls, v):
        if not v or not v.strip():
            raise ValueError('Plate number is required')
        # Kenyan plate format
        v = v.strip().upper()
        if len(v) < 5:
            raise ValueError('Invalid plate number format')
        return v


class ViolationReview(BaseModel):
    decision: str = Field(..., description="Decision: approve or reject")
    officer_id: str = Field(..., description="Officer ID")
    notes: str = Field(default="", max_length=500, description="Review notes")
    
    @validator('decision')
    def validate_decision(cls, v):
        if v.lower() not in ['approve', 'reject']:
            raise ValueError('Decision must be approve or reject')
        return v.lower()


# ==================== ALERT MODELS ====================
class AlertCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100, description="Alert title")
    message: str = Field(..., min_length=10, max_length=500, description="Alert message")
    severity: str = Field(..., description="Severity: low, medium, high, critical")
    alert_type: str = Field(..., description="Alert type: road, weather, system, emergency")
    location: Optional[str] = Field(None, max_length=200, description="Location")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude")
    
    @validator('severity')
    def validate_severity(cls, v):
        if v.lower() not in ['low', 'medium', 'high', 'critical']:
            raise ValueError('Severity must be: low, medium, high, or critical')
        return v.lower()
    
    @validator('alert_type')
    def validate_type(cls, v):
        valid_types = ['road', 'weather', 'system', 'emergency', 'traffic', 'crime']
        if v.lower() not in valid_types:
            raise ValueError(f'Alert type must be one of: {", ".join(valid_types)}')
        return v.lower()


# ==================== CITIZEN REPORT MODELS ====================
class CitizenReportCreate(BaseModel):
    report_type: str = Field(..., description="Report type: accident, crime, emergency, etc.")
    description: str = Field(..., min_length=20, max_length=2000, description="Description")
    location: str = Field(..., min_length=5, max_length=200, description="Location")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude")
    first_name: Optional[str] = Field(None, max_length=50, description="First name")
    last_name: Optional[str] = Field(None, max_length=50, description="Last name")
    phone_number: Optional[str] = Field(None, max_length=20, description="Phone number")
    anonymous: bool = Field(default=False, description="Submit anonymously")
    attachments: List[str] = Field(default_factory=list, description="Attachment URLs")
    
    @validator('report_type')
    def validate_type(cls, v):
        valid_types = ['accident', 'crime', 'emergency', 'traffic', 'suspicious', 'other']
        if v.lower() not in valid_types:
            raise ValueError(f'Report type must be one of: {", ".join(valid_types)}')
        return v.lower()
    
    @validator('phone_number')
    def validate_phone(cls, v):
        if v:
            # Remove spaces and dashes
            v = v.replace(' ', '').replace('-', '')
            # Basic validation for Kenyan numbers
            if not (v.startswith('+254') or v.startswith('254') or v.startswith('07') or v.startswith('01')):
                raise ValueError('Invalid phone number format')
        return v


# ==================== SPEED DETECTION MODELS ====================
class SpeedDetectionInput(BaseModel):
    camera_id: str = Field(..., min_length=1, description="Camera ID")
    plate_number: str = Field(..., min_length=5, max_length=20, description="Vehicle plate")
    vehicle_type: VehicleTypeEnum = Field(default=VehicleTypeEnum.SALOON, description="Vehicle type")
    speed_detected: float = Field(..., ge=0, le=300, description="Detected speed in km/h")
    location: str = Field(..., min_length=3, max_length=200, description="Location")
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    image_front: str = Field(default="", description="Front image URL")
    image_rear: str = Field(default="", description="Rear image URL")


# ==================== TEAM DISPATCH MODELS ====================
class TeamDispatch(BaseModel):
    incident_id: str = Field(..., description="Incident ID to respond to")
    eta: str = Field(default="10 min", description="Estimated time of arrival")


# ==================== FILTER MODELS ====================
class PaginationParams(BaseModel):
    limit: int = Field(default=100, ge=1, le=500, description="Limit results")
    offset: int = Field(default=0, ge=0, description="Offset for pagination")


class AccidentFilter(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class ViolationFilter(BaseModel):
    status: Optional[str] = None
    plate_number: Optional[str] = None
    violation_type: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=500)
    offset: int = Field(default=0, ge=0)
