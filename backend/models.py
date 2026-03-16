from typing import Optional
from pydantic import BaseModel


class AccidentCreate(BaseModel):
    accident_type: str
    cause: str
    location: str
    road_name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    severity: str
    vehicles: int = 0
    description: Optional[str] = None
    weather: Optional[str] = None
    road_conditions: Optional[str] = None


class ViolationCreate(BaseModel):
    violation_type: str
    plate_number: str
    location: str
    road_name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    speed_detected: Optional[float] = None
    speed_limit: Optional[float] = None
    camera_id: Optional[str] = None
    evidence_image: Optional[str] = None
    vehicle_type: Optional[str] = None


class ViolationReview(BaseModel):
    decision: str
    officer_id: Optional[str] = None
    notes: Optional[str] = None


class AlertCreate(BaseModel):
    title: str
    message: str
    severity: str
    alert_type: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CitizenReportCreate(BaseModel):
    type: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    anonymous: Optional[bool] = False
    status: Optional[str] = "pending"


class SpeedDetectionInput(BaseModel):
    camera_id: str
    plate_number: str
    vehicle_type: str
    speed_detected: float
    location: str
    lat: float
    lng: float
    image_front: Optional[str] = None
    image_rear: Optional[str] = None


class TeamDispatch(BaseModel):
    team_id: str
    incident_id: str
