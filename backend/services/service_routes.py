"""
Service Integration Routes
Integrates new microservices with the main API
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel

from .incident_service import (
    incident_service,
    IncidentType,
    SeverityLevel,
    IncidentStatus,
    Coordinates as IncidentCoordinates,
)
from .dispatch.dispatch_coordinator import (
    dispatch_coordinator,
    ResponderType,
    ResponderStatus,
)
from .analytics.predictive_engine import predictive_analytics
from .location.location_service import location_service
from .ingestion.rtsp_client import camera_ingestion_service, CameraConfig
from .notification_service import notification_service
from .routing_service import routing_service
from .iot_sensors import mqtt_sensor_service
from .webrtc_gateway import webrtc_gateway
from .ai.behavior_analysis import get_or_create_calibration

router = APIRouter(prefix="/api/v1/services", tags=["services"])


# ==================== INCIDENT MODELS ====================


class CoordinatesInput(BaseModel):
    lat: float
    lng: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None


class IncidentCreateInput(BaseModel):
    incident_type: str
    location: CoordinatesInput
    address: str
    road_name: str
    county: str = ""
    description: str = ""
    severity_modifier: Optional[str] = None
    camera_id: Optional[str] = None
    detected_by: str = "ai"
    ai_confidence: float = 0.0
    evidence_urls: Optional[List[str]] = None


class IncidentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


# ==================== INCIDENT ENDPOINTS ====================


@router.get("/incidents")
async def list_incidents(
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    county: Optional[str] = None,
    limit: int = 100,
):
    """List all incidents with optional filters"""
    status_enum = IncidentStatus(status) if status else None
    type_enum = IncidentType(incident_type) if incident_type else None
    severity_enum = SeverityLevel(severity) if severity else None

    incidents = incident_service.get_incidents(
        status=status_enum,
        incident_type=type_enum,
        severity=severity_enum,
        county=county,
        limit=limit,
    )

    return {"total": len(incidents), "incidents": [i.to_dict() for i in incidents]}


@router.get("/incidents/active")
async def get_active_incidents():
    """Get all active (non-resolved) incidents"""
    incidents = incident_service.get_active_incidents()
    return {"total": len(incidents), "incidents": [i.to_dict() for i in incidents]}


@router.get("/incidents/nearby")
async def get_incidents_nearby(lat: float, lng: float, radius_km: float = 5.0):
    """Get incidents within radius of a location"""
    incidents = incident_service.get_incidents_by_location(lat, lng, radius_km)
    return {"total": len(incidents), "incidents": [i.to_dict() for i in incidents]}


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Get incident by ID"""
    incident = incident_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident.to_dict()


@router.post("/incidents", status_code=201)
async def create_incident(data: IncidentCreateInput):
    """Create a new incident"""
    try:
        incident = incident_service.create_incident(
            incident_type=IncidentType(data.incident_type),
            location=IncidentCoordinates(
                lat=data.location.lat,
                lng=data.location.lng,
                altitude=data.location.altitude,
                accuracy=data.location.accuracy,
            ),
            address=data.address,
            road_name=data.road_name,
            county=data.county,
            description=data.description,
            severity_modifier=(
                SeverityLevel(data.severity_modifier)
                if data.severity_modifier
                else None
            ),
            camera_id=data.camera_id,
            detected_by=data.detected_by,
            ai_confidence=data.ai_confidence,
            evidence_urls=data.evidence_urls,
        )
        return incident.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/incidents/{incident_id}/status")
async def update_incident_status(incident_id: str, data: IncidentStatusUpdate):
    """Update incident status"""
    try:
        incident = incident_service.update_status(
            incident_id=incident_id,
            new_status=IncidentStatus(data.status),
            notes=data.notes,
        )
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        return incident.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/incidents/{incident_id}/dispatch-requirements")
async def get_dispatch_requirements(incident_id: str):
    """Get dispatch requirements for an incident"""
    incident = incident_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    return incident_service.get_dispatch_requirements(incident.type)


# ==================== RESPONDER MODELS ====================


class ResponderCreateInput(BaseModel):
    id: str
    name: str
    type: str
    badge_number: str
    phone: str
    latitude: float = 0.0
    longitude: float = 0.0
    station: str = ""
    fcm_token: Optional[str] = None


class ResponderLocationUpdate(BaseModel):
    latitude: float
    longitude: float


class DispatchCreateInput(BaseModel):
    incident_id: str
    required_types: List[str]
    optional_types: Optional[List[str]] = None


# ==================== RESPONDER ENDPOINTS ====================


@router.get("/responders")
async def list_responders(
    responder_type: Optional[str] = None, status: Optional[str] = None
):
    """List all responders"""
    responders = list(dispatch_coordinator.responders.values())

    if responder_type:
        responders = [r for r in responders if r.type.value == responder_type]
    if status:
        responders = [r for r in responders if r.status.value == status]

    return {"total": len(responders), "responders": [r.to_dict() for r in responders]}


@router.get("/responders/available")
async def get_available_responders(responder_type: Optional[str] = None):
    """Get available responders"""
    type_enum = ResponderType(responder_type) if responder_type else None
    responders = dispatch_coordinator.get_available_responders(type_enum)

    return {"total": len(responders), "responders": [r.to_dict() for r in responders]}


@router.get("/responders/{responder_id}")
async def get_responder(responder_id: str):
    """Get responder by ID"""
    responder = dispatch_coordinator.get_responder(responder_id)
    if not responder:
        raise HTTPException(status_code=404, detail="Responder not found")
    return responder.to_dict()


@router.post("/responders", status_code=201)
async def register_responder(data: ResponderCreateInput):
    """Register a new responder"""
    from services.dispatch.dispatch_coordinator import Responder

    responder = Responder(
        id=data.id,
        name=data.name,
        type=ResponderType(data.type),
        badge_number=data.badge_number,
        phone=data.phone,
        latitude=data.latitude,
        longitude=data.longitude,
        station=data.station,
        fcm_token=data.fcm_token,
    )

    dispatch_coordinator.register_responder(responder)
    return responder.to_dict()


@router.patch("/responders/{responder_id}/base-location")
async def update_responder_base_location(
    responder_id: str, data: ResponderLocationUpdate
):
    """Update responder's base/home location"""
    success = dispatch_coordinator.update_responder_location(
        responder_id=responder_id, latitude=data.latitude, longitude=data.longitude
    )
    if not success:
        raise HTTPException(status_code=404, detail="Responder not found")
    return {"message": "Location updated"}


@router.patch("/responders/{responder_id}/status")
async def update_responder_status(responder_id: str, status: str):
    """Update responder status"""
    try:
        success = dispatch_coordinator.update_responder_status(
            responder_id=responder_id, status=ResponderStatus(status)
        )
        if not success:
            raise HTTPException(status_code=404, detail="Responder not found")
        return {"message": "Status updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== DISPATCH ENDPOINTS ====================


@router.post("/dispatch", status_code=201)
async def create_dispatch(data: DispatchCreateInput):
    """Dispatch responders to an incident"""
    required = [ResponderType(t) for t in data.required_types]
    optional = (
        [ResponderType(t) for t in data.optional_types] if data.optional_types else None
    )

    dispatches = dispatch_coordinator.dispatch_responders(
        incident_id=data.incident_id, required_types=required, optional_types=optional
    )

    return {
        "incident_id": data.incident_id,
        "dispatches": {k: v.to_dict() for k, v in dispatches.items()},
    }


@router.get("/dispatch/incident/{incident_id}")
async def get_incident_dispatches(incident_id: str):
    """Get all dispatches for an incident"""
    dispatches = dispatch_coordinator.get_dispatches_for_incident(incident_id)
    return {"total": len(dispatches), "dispatches": [d.to_dict() for d in dispatches]}


@router.patch("/dispatch/{dispatch_id}/acknowledge")
async def acknowledge_dispatch(dispatch_id: str):
    """Acknowledge a dispatch"""
    success = dispatch_coordinator.acknowledge_dispatch(dispatch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return {"message": "Dispatch acknowledged"}


@router.patch("/dispatch/{dispatch_id}/enroute")
async def mark_enroute(dispatch_id: str):
    """Mark responder as en route"""
    success = dispatch_coordinator.mark_enroute(dispatch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return {"message": "Responder en route"}


@router.patch("/dispatch/{dispatch_id}/onscene")
async def mark_onscene(dispatch_id: str):
    """Mark responder as on scene"""
    success = dispatch_coordinator.mark_onscene(dispatch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return {"message": "Responder on scene"}


@router.patch("/dispatch/{dispatch_id}/resolve")
async def resolve_dispatch(dispatch_id: str):
    """Resolve a dispatch"""
    success = dispatch_coordinator.resolve_dispatch(dispatch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return {"message": "Dispatch resolved"}


# ==================== PREDICTIVE ANALYTICS ENDPOINTS ====================


@router.get("/analytics/predictions")
async def get_hotspot_predictions(grid_size_km: float = 1.0):
    """Get predicted accident hotspots"""
    predictions = predictive_analytics.predict_hotspots(grid_size_km=grid_size_km)

    return {
        "total": len(predictions),
        "predictions": [
            {
                "grid_id": p.grid_id,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "risk_score": round(p.risk_score, 2),
                "predicted_accidents": p.predicted_accidents,
                "factors": {k: round(v, 2) for k, v in p.factors.items()},
                "prediction_date": p.prediction_date.isoformat(),
            }
            for p in predictions
        ],
    }


@router.get("/analytics/high-risk-roads")
async def get_high_risk_roads(min_risk: float = 0.5):
    """Get roads with high accident risk"""
    roads = predictive_analytics.get_high_risk_roads(min_risk)
    return {"roads": roads}


@router.get("/analytics/statistics")
async def get_analytics_statistics():
    """Get analytics statistics"""
    return predictive_analytics.get_statistics()


@router.post("/analytics/train")
async def train_model():
    """Train the prediction model"""
    success = predictive_analytics.train_model()
    if success:
        return {"message": "Model trained successfully"}
    return {"message": "Model training failed"}


# ==================== LOCATION SERVICE MODELS ====================


class LocationUpdateInput(BaseModel):
    latitude: float
    longitude: float
    accuracy: float = 0.0
    speed: float = 0.0
    heading: float = 0.0


# ==================== LOCATION SERVICE ENDPOINTS ====================


@router.get("/locations")
async def get_all_locations():
    """Get all responder locations"""
    locations = location_service.get_all_locations()
    return {
        "total": len(locations),
        "locations": [
            {
                "responder_id": loc.responder_id,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "accuracy": loc.accuracy,
                "speed": loc.speed,
                "heading": loc.heading,
                "timestamp": loc.timestamp.isoformat(),
            }
            for loc in locations
        ],
    }


@router.get("/locations/{responder_id}")
async def get_responder_location(responder_id: str):
    """Get specific responder location"""
    location = location_service.get_location(responder_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return {
        "responder_id": location.responder_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "accuracy": location.accuracy,
        "speed": location.speed,
        "heading": location.heading,
        "timestamp": location.timestamp.isoformat(),
    }


@router.put("/locations/{responder_id}/gps")
async def update_responder_gps_location(responder_id: str, data: LocationUpdateInput):
    """Update responder GPS location"""
    success = location_service.update_location(
        responder_id=responder_id,
        latitude=data.latitude,
        longitude=data.longitude,
        accuracy=data.accuracy,
        speed=data.speed,
        heading=data.heading,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update location")
    return {"message": "Location updated"}


@router.get("/locations/nearby")
async def get_nearby_responders(lat: float, lng: float, radius_km: float = 10.0):
    """Get responders within radius"""
    responders = location_service.get_responders_in_radius(lat, lng, radius_km)
    return {"total": len(responders), "responders": responders}


# ==================== CAMERA MANAGEMENT MODELS ====================


class CameraConfigInput(BaseModel):
    id: str
    name: str
    rtsp_url: str
    username: Optional[str] = None
    password: Optional[str] = None
    latitude: float = 0.0
    longitude: float = 0.0
    road_name: str = ""
    county: str = ""
    fps: int = 5
    enabled: bool = True


# ==================== CAMERA MANAGEMENT ENDPOINTS ====================


@router.get("/cameras")
async def list_cameras():
    """List all cameras with their status"""
    cameras = camera_ingestion_service.get_all_status()
    return {"total": len(cameras), "cameras": cameras}


@router.get("/cameras/{camera_id}")
async def get_camera_status(camera_id: str):
    """Get camera status"""
    status = camera_ingestion_service.get_camera_status(camera_id)
    if status.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="Camera not found")
    return status


@router.post("/cameras", status_code=201)
async def register_camera(data: CameraConfigInput):
    """Register a new camera"""
    config = CameraConfig(
        id=data.id,
        name=data.name,
        rtsp_url=data.rtsp_url,
        username=data.username,
        password=data.password,
        location={"lat": data.latitude, "lng": data.longitude},
        road_name=data.road_name,
        county=data.county,
        fps=data.fps,
        enabled=data.enabled,
    )
    camera_ingestion_service.register_camera(config)
    return {"message": "Camera registered", "camera_id": data.id}


@router.delete("/cameras/{camera_id}")
async def unregister_camera(camera_id: str):
    """Unregister a camera"""
    camera_ingestion_service.unregister_camera(camera_id)
    return {"message": "Camera unregistered"}


@router.post("/cameras/{camera_id}/start")
async def start_camera_stream(camera_id: str):
    """Start camera stream"""
    success = camera_ingestion_service.start_camera(camera_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to start camera stream")
    return {"message": "Camera stream started"}


@router.post("/cameras/{camera_id}/stop")
async def stop_camera_stream(camera_id: str):
    """Stop camera stream"""
    camera_ingestion_service.stop_camera(camera_id)
    return {"message": "Camera stream stopped"}


@router.post("/cameras/start-all")
async def start_all_cameras():
    """Start all enabled cameras"""
    camera_ingestion_service.start_all()
    return {"message": "All cameras started"}


@router.post("/cameras/stop-all")
async def stop_all_cameras():
    """Stop all cameras"""
    camera_ingestion_service.stop_all()
    return {"message": "All cameras stopped"}


# ==================== NOTIFICATION MODELS ====================


class NotificationInput(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    sms_message: Optional[str] = None
    email_subject: Optional[str] = None
    email_body: Optional[str] = None


class TemplateNotificationInput(BaseModel):
    template: str
    phone: Optional[str] = None
    email: Optional[str] = None
    extra: dict = {}


# ==================== NOTIFICATION ENDPOINTS ====================


@router.get("/notifications/templates")
async def get_notification_templates():
    """Get available notification templates"""
    return {"templates": list(notification_service.templates.keys())}


@router.get("/notifications/templates/{template_name}")
async def get_template_details(template_name: str):
    """Get template details"""
    template = notification_service.templates.get(template_name)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/notifications/send")
async def send_notification(data: NotificationInput):
    """Send a custom notification"""
    result = await notification_service.send(
        phone=data.phone,
        email=data.email,
        sms=data.sms_message,
        subject=data.email_subject,
        email_body=data.email_body,
    )
    return result


@router.post("/notifications/send-template")
async def send_template_notification(data: TemplateNotificationInput):
    """Send notification using a template"""
    template_name = data.template
    if template_name not in notification_service.templates:
        raise HTTPException(status_code=404, detail="Template not found")

    template_data = data.extra if hasattr(data, "extra") else {}

    formatted = notification_service.format_message(
        template_name, phone=data.phone, email=data.email, **template_data
    )

    result = await notification_service.send(
        phone=data.phone,
        email=data.email,
        sms=formatted.get("sms"),
        email_body=formatted.get("email"),
        subject=formatted.get("subject"),
    )
    return result


@router.get("/notifications/history")
async def get_notification_history(limit: int = 100):
    """Get notification history"""
    history = notification_service.get_history(limit)
    return {"total": len(history), "history": history}


@router.get("/notifications/stats")
async def get_notification_stats():
    """Get notification statistics"""
    return notification_service.get_stats()


# ==================== ROUTING & ETA MODELS ====================


class ETARequest(BaseModel):
    responder_lat: float
    responder_lng: float
    incident_lat: float
    incident_lng: float


class MultipleETARequest(BaseModel):
    responders: List[dict]
    incident_lat: float
    incident_lng: float


# ==================== ROUTING & ETA ENDPOINTS ====================


@router.get("/routing/eta")
async def calculate_eta(
    responder_lat: float, responder_lng: float, incident_lat: float, incident_lng: float
):
    """Calculate ETA from responder to incident"""
    return await routing_service.calculate_eta(
        responder_lat, responder_lng, incident_lat, incident_lng
    )


@router.post("/routing/etas")
async def calculate_multiple_etas(data: MultipleETARequest):
    """Calculate ETAs for multiple responders"""
    return await routing_service.get_multiple_etas(
        data.responders, data.incident_lat, data.incident_lng
    )


# ==================== IOT SENSORS MODELS ====================


class SensorConfigInput(BaseModel):
    sensor_id: str
    sensor_type: str
    latitude: float
    longitude: float
    road_name: str
    county: str
    alert_thresholds: Optional[dict] = {}


# ==================== IOT SENSORS ENDPOINTS ====================


@router.get("/sensors")
async def list_sensors(sensor_type: Optional[str] = None, enabled_only: bool = False):
    """List all registered sensors"""
    sensors = mqtt_sensor_service.get_sensors(sensor_type, enabled_only)
    return {"total": len(sensors), "sensors": sensors}


@router.post("/sensors")
async def register_sensor(data: SensorConfigInput):
    """Register a new sensor"""
    from services.iot_sensors import SensorConfig

    config = SensorConfig(
        sensor_id=data.sensor_id,
        sensor_type=data.sensor_type,
        location={"lat": data.latitude, "lng": data.longitude},
        road_name=data.road_name,
        county=data.county,
        alert_thresholds=data.alert_thresholds or {},
    )
    mqtt_sensor_service.register_sensor(config)
    return {"message": "Sensor registered", "sensor_id": data.sensor_id}


@router.delete("/sensors/{sensor_id}")
async def unregister_sensor(sensor_id: str):
    """Unregister a sensor"""
    mqtt_sensor_service.unregister_sensor(sensor_id)
    return {"message": "Sensor unregistered"}


@router.get("/sensors/{sensor_id}/readings")
async def get_sensor_readings(sensor_id: str, limit: int = 100):
    """Get sensor readings"""
    readings = mqtt_sensor_service.get_readings(sensor_id=sensor_id, limit=limit)
    return {"total": len(readings), "readings": readings}


@router.get("/sensors/readings")
async def get_all_readings(sensor_type: Optional[str] = None, limit: int = 100):
    """Get all sensor readings"""
    readings = mqtt_sensor_service.get_readings(sensor_type=sensor_type, limit=limit)
    return {"total": len(readings), "readings": readings}


# ==================== WEBRTC GATEWAY MODELS ====================


class StreamCreateInput(BaseModel):
    user_id: str
    latitude: float
    longitude: float


# ==================== WEBRTC GATEWAY ENDPOINTS ====================


@router.post("/webrtc/stream")
async def create_stream(data: StreamCreateInput):
    """Create a new citizen stream"""
    return await webrtc_gateway.create_stream(
        user_id=data.user_id, latitude=data.latitude, longitude=data.longitude
    )


@router.post("/webrtc/stream/{stream_id}/start")
async def start_stream(stream_id: str):
    """Mark stream as live"""
    success = await webrtc_gateway.start_stream(stream_id)
    if not success:
        raise HTTPException(status_code=404, detail="Stream not found")
    return {"message": "Stream started"}


@router.post("/webrtc/stream/{stream_id}/end")
async def end_stream(stream_id: str):
    """End a stream"""
    return await webrtc_gateway.end_stream(stream_id)


@router.get("/webrtc/streams")
async def list_streams():
    """List active streams"""
    streams = webrtc_gateway.get_active_streams()
    return {"total": len(streams), "streams": streams}


@router.get("/webrtc/stream/{stream_id}")
async def get_stream(stream_id: str):
    """Get stream info"""
    stream = webrtc_gateway.get_stream(stream_id)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    return stream


# ==================== BEHAVIOR ANALYSIS MODELS ====================


class CameraCalibrationInput(BaseModel):
    camera_id: str
    road_name: str = ""
    speed_limit: float = 50.0
    latitude: float = 0.0
    longitude: float = 0.0
    mounting_height: float = 6.0
    lane_width: float = 3.5
    orientation: str = "overhead"


# ==================== BEHAVIOR ANALYSIS ENDPOINTS ====================


@router.post("/ai/calibration")
async def create_calibration(data: CameraCalibrationInput):
    """Create camera calibration for speed estimation"""
    from services.ai.behavior_analysis import CameraCalibration

    calibration = CameraCalibration(
        camera_id=data.camera_id,
        road_name=data.road_name,
        speed_limit=data.speed_limit,
        lat=data.latitude,
        lng=data.longitude,
        mounting_height=data.mounting_height,
        lane_width=data.lane_width,
        orientation=data.orientation,
    )
    get_or_create_calibration(data.camera_id)
    return {"message": "Calibration created", "camera_id": data.camera_id}


@router.get("/ai/calibration/{camera_id}")
async def get_calibration(camera_id: str):
    """Get camera calibration"""
    from services.ai.behavior_analysis import CAMERA_CALIBRATIONS

    if camera_id not in CAMERA_CALIBRATIONS:
        raise HTTPException(status_code=404, detail="Calibration not found")
    cal = CAMERA_CALIBRATIONS[camera_id]
    return {
        "camera_id": cal.camera_id,
        "road_name": cal.road_name,
        "speed_limit": cal.speed_limit,
        "latitude": cal.lat,
        "longitude": cal.lng,
        "mounting_height": cal.mounting_height,
        "lane_width": cal.lane_width,
        "orientation": cal.orientation,
    }


@router.get("/ai/calibrations")
async def list_calibrations():
    """List all camera calibrations"""
    from services.ai.behavior_analysis import CAMERA_CALIBRATIONS

    return {
        "total": len(CAMERA_CALIBRATIONS),
        "calibrations": [
            {
                "camera_id": cal.camera_id,
                "road_name": cal.road_name,
                "speed_limit": cal.speed_limit,
            }
            for cal in CAMERA_CALIBRATIONS.values()
        ],
    }
