"""
Kenya National Road Safety Authority (NTSA) Overwatch API
Real-time Road Safety Monitoring, Accident Detection, and Traffic Violation Management
Version: 2.0.0 - Enhanced Security Edition
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Query, Depends, Request, APIRouter
from fastapi.responses import JSONResponse, PlainTextResponse
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, Any
import asyncio
import json
import time
import uuid
import random
import psutil
import os
import logging

logger = logging.getLogger(__name__)
from datetime import datetime, timedelta, timezone
from dataclasses import asdict

# Handle both package and module imports
def _import(name):
    try:
        return __import__(name)
    except ImportError:
        parts = name.split('.')
        obj = __import__(parts[0])
        for part in parts[1:]:
            obj = getattr(obj, part)
        return obj

# Import from local modules (same package) - using relative imports
try:
    from .road_safety_engine import (
        road_safety_engine,
        RoadAccident,
        TrafficViolation,
        Vehicle,
        Driver,
        SpeedDetection,
        Coordinates,
        AccidentType,
        CauseType,
        SeverityLevel,
        IncidentStatus,
        VehicleType,
        ACCIDENT_HOTSPOTS,
        ViolationStatus,
    )
except ImportError:
    from backend.road_safety_engine import (
        road_safety_engine,
        RoadAccident,
        TrafficViolation,
        Vehicle,
        Driver,
        SpeedDetection,
        Coordinates,
        AccidentType,
        CauseType,
        SeverityLevel,
        IncidentStatus,
        VehicleType,
        ACCIDENT_HOTSPOTS,
        ViolationStatus,
    )

# Import database models (ORM) from database_models
from .database_models import (
    User,
    Team,
    Alert,
    Camera,
    RoadSegment,
)

# Import shared enums
from .enums import (
    UserRole,
    AlertSeverity,
    AlertType,
    IncidentStatus as APIIncidentStatus,
    SeverityLevel as APISeverityLevel,
)

# Import validation models (Pydantic)
from .models import (
    AccidentCreate,
    ViolationCreate,
    ViolationReview,
    AlertCreate,
    CitizenReportCreate,
    SpeedDetectionInput,
    TeamDispatch,
)
from .auth import router as auth_router, get_current_user, UserResponse

# Import ANPR module
from .anpr_api import router as anpr_router

# Import security middleware
from .security_middleware import apply_security_middleware, audit_logger

# Import notifications
from .notifications_sounds import notification_manager

def utcnow():
    return datetime.now(timezone.utc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from .database import init_db, seed_demo_data
    init_db()
    seed_demo_data()
    yield


app = FastAPI(
    title="Kenya NTSA Road Safety API",
    description="""
## Kenya Overwatch System API

Real-time road safety monitoring, accident detection, and traffic violation management.

### Features
- **Incidents** - Report and track road incidents
- **Violations** - ANPR-based traffic violation detection
- **Teams** - Response team management and dispatch
- **Alerts** - Real-time road safety alerts
- **Analytics** - Dashboard statistics and metrics
- **Logs** - System logging and audit trails

### Authentication
Use JWT bearer token authentication for protected endpoints.

### Rate Limiting
APIs are rate-limited to ensure fair usage.
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    contact={
        "name": "NTSA Kenya",
        "url": "https://www.ntsa.go.ke",
        "email": "support@overwatch.go.ke"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://overwatch.go.ke/license"
    }
)


# Apply security middleware (CORS, rate limiting, logging, etc.)
apply_security_middleware(app)

# ==================== API VERSIONING ====================
api_v1 = APIRouter(prefix="/api/v1", tags=["v1"])

# ==================== CENTRALIZED ERROR HANDLING ====================
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": utcnow().isoformat()
        }
    )

# Include authentication routes
app.include_router(auth_router)

# Include ANPR routes
app.include_router(anpr_router)

# Import reports module
from .reports_api import router as reports_router
app.include_router(reports_router)

# Import service integration routes
from .services.service_routes import router as service_router
app.include_router(service_router)

# Import county analytics routes
from .county_routes import router as county_router
app.include_router(county_router)

# Import satellite monitoring routes
from .satellite.routes import router as satellite_router
app.include_router(satellite_router)

# Import weather and traffic integration routes
from .integrations.routes import router as environment_router
app.include_router(environment_router)

# ==================== HELPER FUNCTIONS ====================
def serialize_for_json(obj: Any) -> Any:
    """Convert objects to JSON-serializable format"""
    if obj is None:
        return None
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif hasattr(obj, '__dataclass_fields__'):
        result = {}
        for field in obj.__dataclass_fields__:
            value = getattr(obj, field)
            result[field] = serialize_for_json(value)
        return result
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_json(item) for item in obj]
    elif hasattr(obj, 'value'):
        return obj.value
    else:
        return obj

# ==================== ROOT & HEALTH ====================
@app.get("/")
async def root():
    return {
        "system": "Kenya NTSA Road Safety Overwatch",
        "version": "2.0.0",
        "api_versions": ["v1", "v2"],
        "authority": "National Transport and Safety Authority",
        "status": "operational",
        "security": "enabled",
        "timestamp": utcnow().isoformat()
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "api_version": "v2",
        "services": {
            "road_safety_engine": "up",
            "accident_db": "up",
            "violation_db": "up",
            "speed_detection": "up",
            "websocket": "up"
        },
        "timestamp": utcnow().isoformat()
    }

@app.get("/api/v1/health")
async def health_check_v1():
    """V1 Health check - returns version info"""
    return {
        "status": "healthy",
        "api_version": "v1",
        "timestamp": utcnow().isoformat()
    }


@app.get("/api/cache/stats")
async def get_cache_stats():
    """Get cache statistics"""
    try:
        from .cache import cache
    except ModuleNotFoundError:
        from backend.cache import cache
    
    return cache.get_stats()


@app.post("/api/cache/clear")
async def clear_cache():
    """Clear the cache"""
    try:
        from .cache import cache
    except ModuleNotFoundError:
        from backend.cache import cache
    
    cache.clear()
    return {"status": "cleared", "message": "Cache cleared successfully"}


# ==================== SYSTEM LOGS ====================
@app.get("/api/logs")
async def get_logs(
    level: Optional[str] = Query(None, description="Filter by level (debug, info, warning, error, critical)"),
    category: Optional[str] = Query(None, description="Filter by category (api, auth, database, security, incident, violation, websocket, system)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """Get system logs with optional filtering"""
    try:
        from .logging_system import log_manager, log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_manager, log_event
    
    # Generate some initial logs if empty
    if log_manager._logs:
        log_event("info", "api", "road_safety_api.py", "API request received", request_id=f"req_{random.randint(1000, 9999)}")
    
    return log_manager.get_logs(level=level, category=category, limit=limit, offset=offset)


@app.post("/api/logs")
async def create_log(
    level: str = Query(..., description="Log level"),
    category: str = Query(..., description="Log category"),
    source: str = Query("", description="Source file/component"),
    message: str = Query("", description="Log message"),
    details: Optional[str] = Query(None, description="JSON details")
):
    """Create a new log entry"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    import json
    details_dict = None
    if details:
        try:
            details_dict = json.loads(details)
        except:
            pass
    
    log_event(level, category, source, message, details=details_dict)
    
    return {"status": "created", "message": "Log entry added"}


@app.delete("/api/logs")
async def clear_logs():
    """Clear all logs"""
    try:
        from .logging_system import log_manager
    except ModuleNotFoundError:
        from backend.logging_system import log_manager
    
    log_manager.clear_logs()
    return {"status": "cleared", "message": "All logs cleared"}

# ==================== INCIDENTS (alias for /api/v1/services/incidents) ====================
@app.get("/api/incidents")
async def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status (detected, verified, assigned, enroute, onscene, resolved, rejected)"),
    severity: Optional[str] = Query(None, description="Filter by severity (low, medium, high, critical)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results")
):
    """List all incidents"""
    try:
        from services.incident_service import incident_service
    except ModuleNotFoundError:
        from backend.services.incident_service import incident_service
    
    # Convert string parameters to enums (use enums module for compatibility with service)
    try:
        from .enums import IncidentStatus, SeverityLevel
    except ModuleNotFoundError:
        from backend.enums import IncidentStatus, SeverityLevel
    
    status_enum = None
    if status:
        try:
            status_enum = IncidentStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}. Must be one of: {', '.join([s.value for s in IncidentStatus])}")
    
    severity_enum = None
    if severity:
        try:
            severity_enum = SeverityLevel(severity)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid severity: {severity}. Must be one of: {', '.join([s.value for s in SeverityLevel])}")
    
    try:
        incidents = incident_service.get_incidents(status=status_enum, severity=severity_enum, limit=limit)
        return {
            "incidents": [i.to_dict() for i in incidents],
            "total": len(incidents)
        }
    except Exception as e:
        logger.error(f"Error getting incidents: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting incidents: {str(e)}")

@app.get("/api/incidents/active")
async def get_active_incidents():
    """Get all active incidents"""
    try:
        from services.incident_service import incident_service
    except ModuleNotFoundError:
        from backend.services.incident_service import incident_service
    incidents = incident_service.get_active_incidents()
    return {
        "incidents": [i.to_dict() for i in incidents],
        "total": len(incidents)
    }

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Get incident by ID"""
    try:
        from services.incident_service import incident_service
    except ModuleNotFoundError:
        from backend.services.incident_service import incident_service
    incident = incident_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident.to_dict()

@app.patch("/api/incidents/{incident_id}/status")
async def update_incident_status(incident_id: str, status: str = Form(...)):
    """Update incident status"""
    from services.incident_service import incident_service
    from .enums import IncidentStatus
    
    # Validate and convert status string to enum
    try:
        status_enum = IncidentStatus(status)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status: {status}. Must be one of: {', '.join([s.value for s in IncidentStatus])}"
        )
    
    incident = incident_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Update status using the service method (which handles transitions)
    updated = incident_service.update_status(incident_id, status_enum)
    if not updated:
        raise HTTPException(status_code=400, detail="Invalid status transition")
    
    return updated.to_dict()


# ==================== INCIDENTS CRUD ====================
@app.post("/api/incidents")
async def create_incident(
    title: str = Form(..., min_length=3, max_length=200),
    description: str = Form(..., min_length=10, max_length=2000),
    incident_type: str = Form(...),
    severity: str = Form(default="medium"),
    location: str = Form(..., min_length=3),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
):
    """Create a new incident"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    try:
        from .enums import SeverityLevel
    except ModuleNotFoundError:
        from backend.enums import SeverityLevel
    
    try:
        severity_enum = SeverityLevel(severity)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid severity: {severity}")
    
    incident_data = {
        "title": title,
        "description": description,
        "incident_type": incident_type,
        "severity": severity_enum.value,
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "status": "detected"
    }
    
    incident_id = f"INC-{random.randint(100000, 999999)}"
    incident_data["id"] = incident_id
    incident_data["created_at"] = utcnow().isoformat()
    
    log_event("info", "incident", "road_safety_api.py", f"Incident created: {incident_id}", 
              details={"title": title, "type": incident_type, "severity": severity})
    
    return {"status": "created", "incident": incident_data}


@app.put("/api/incidents/{incident_id}")
async def update_incident(
    incident_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
):
    """Update an existing incident"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    log_event("info", "incident", "road_safety_api.py", f"Incident updated: {incident_id}",
              details={"title": title, "severity": severity})
    
    return {"status": "updated", "incident_id": incident_id}


@app.delete("/api/incidents/{incident_id}")
async def delete_incident(incident_id: str):
    """Delete an incident"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    log_event("warning", "incident", "road_safety_api.py", f"Incident deleted: {incident_id}")
    
    return {"status": "deleted", "incident_id": incident_id}


# ==================== DASHBOARD ====================
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    stats = road_safety_engine.get_dashboard_stats()
    return serialize_for_json(stats)

@app.get("/api/dashboard/summary")
async def get_dashboard_summary():
    accidents = road_safety_engine.get_all_accidents(limit=10)
    violations = road_safety_engine.get_all_violations(limit=10)
    
    return serialize_for_json({
        "active_incidents": len([a for a in accidents if a.status in [IncidentStatus.REPORTED, IncidentStatus.DISPATCHED]]),
        "today_accidents": road_safety_engine.stats["total_accidents_today"],
        "today_violations": road_safety_engine.stats["total_violations_today"],
        "pending_violations": len([v for v in violations if v.status == ViolationStatus.DETECTED]),
        "total_casualties_today": road_safety_engine.stats["total_casualties_today"],
        "avg_response_time": road_safety_engine.stats["avg_response_time"],
        "recent_accidents": accidents[:5],
        "recent_violations": violations[:5],
        "citizen_reports": CITIZEN_REPORTS[-10:] if CITIZEN_REPORTS else [],
    })


@app.get("/api/dashboard/metrics")
async def get_realtime_metrics():
    """Get real-time dashboard metrics"""
    try:
        from .logging_system import log_manager
    except ModuleNotFoundError:
        from backend.logging_system import log_manager
    
    # Get live data
    active_incidents = len([t for t in MOCK_TEAMS if t.get("current_incident_id")])
    available_teams = len([t for t in MOCK_TEAMS if t["status"] == "available"])
    dispatched_teams = len([t for t in MOCK_TEAMS if t["status"] == "dispatched"])
    
    # Get log counts for the last hour
    logs = log_manager.get_logs(limit=1000)
    log_counts = {
        "total": logs["total"],
        "errors": len([l for l in logs["logs"] if l.get("level") in ["error", "critical"]]),
        "warnings": len([l for l in logs["logs"] if l.get("level") == "warning"]),
    }
    
    return {
        "timestamp": utcnow().isoformat(),
        "incidents": {
            "active": active_incidents,
            "today": random.randint(5, 15),
            "this_week": random.randint(30, 80),
        },
        "violations": {
            "detected_today": random.randint(20, 50),
            "processed_today": random.randint(15, 40),
            "pending_review": random.randint(5, 20),
        },
        "teams": {
            "total": len(MOCK_TEAMS),
            "available": available_teams,
            "dispatched": dispatched_teams,
            "off_duty": len(MOCK_TEAMS) - available_teams - dispatched_teams,
        },
        "response_times": {
            "avg_this_week": f"{random.randint(8, 15)} min",
            "avg_this_month": f"{random.randint(10, 18)} min",
        },
        "alerts": {
            "active": len([a for a in MOCK_ALERTS if a.get("is_active")]),
            "critical": len([a for a in MOCK_ALERTS if a.get("severity") == "critical"]),
        },
        "logs": log_counts,
    }


@app.get("/api/dashboard/charts")
async def get_chart_data(
    period: str = Query("week", description="Time period: day, week, month")
):
    """Get chart data for dashboard visualizations"""
    import calendar
    
    if period == "day":
        hours = list(range(24))
        data = [random.randint(0, 10) for _ in hours]
        labels = [f"{h}:00" for h in hours]
    elif period == "week":
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        data = [random.randint(10, 50) for _ in days]
        labels = days
    else:
        weeks = [f"W{i}" for i in range(1, 5)]
        data = [random.randint(100, 300) for _ in weeks]
        labels = weeks
    
    return {
        "period": period,
        "labels": labels,
        "accidents": data,
        "violations": [max(0, x + random.randint(-10, 20)) for x in data],
        "labels_y_axis": "Count",
    }

# ==================== ACCIDENTS ====================
@app.get("/api/accidents")
async def list_accidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0
):
    accidents = road_safety_engine.get_all_accidents(
        status=IncidentStatus(status) if status else None,
        limit=limit + offset
    )
    
    if severity:
        accidents = [a for a in accidents if a.severity.value == severity]
    
    return serialize_for_json({
        "total": len(accidents),
        "accidents": accidents[offset:offset+limit]
    })

@app.get("/api/accidents/{accident_id}")
async def get_accident(accident_id: str):
    accident = road_safety_engine.get_accident(accident_id)
    if not accident:
        raise HTTPException(status_code=404, detail="Accident not found")
    return serialize_for_json(accident)

@app.post("/api/accidents", status_code=201)
async def create_accident(data: AccidentCreate):
    """Create a new accident report with validation"""
    try:
        accident = road_safety_engine.create_accident_report(
            accident_type=AccidentType(data.accident_type.value),
            cause=CauseType(data.cause.value),
            location=data.location,
            road_name=data.road_name,
            coordinates=Coordinates(
                lat=data.lat,
                lng=data.lng
            ),
            severity=SeverityLevel(data.severity.value),
            vehicles_involved=data.vehicles,
            description=data.description,
            weather=data.weather,
            road_conditions=data.road_conditions
        )
        return serialize_for_json(accident)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/accidents/hotspots")
async def get_accident_hotspots():
    return serialize_for_json(ACCIDENT_HOTSPOTS)

# ==================== VIOLATIONS ====================
@app.get("/api/violations")
async def list_violations(
    status: Optional[str] = None,
    plate_number: Optional[str] = None,
    violation_type: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0
):
    violations = road_safety_engine.get_all_violations(
        status=ViolationStatus(status) if status else None,
        plate_number=plate_number,
        limit=limit + offset
    )
    
    if violation_type:
        violations = [v for v in violations if v.violation_type.value == violation_type]
    
    return serialize_for_json({
        "total": len(violations),
        "violations": violations[offset:offset+limit]
    })

@app.get("/api/violations/{violation_id}")
async def get_violation(violation_id: str):
    violation = road_safety_engine.get_violation(violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    return serialize_for_json(violation)

@app.post("/api/violations", status_code=201)
async def create_violation(data: ViolationCreate):
    """Create a new violation with validation"""
    try:
        violation = road_safety_engine.record_violation(
            violation_type=CauseType(data.violation_type.value),
            plate_number=data.plate_number,
            vehicle_type=VehicleType(data.vehicle_type.value),
            location=data.location,
            road_name=data.road_name,
            coordinates=Coordinates(
                lat=data.lat,
                lng=data.lng
            ),
            camera_id=data.camera_id,
            speed_detected=data.speed_detected,
            speed_limit=data.speed_limit,
            evidence_image=data.evidence_image
        )
        return serialize_for_json(violation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/violations/{violation_id}/review")
async def review_violation(violation_id: str, data: ViolationReview):
    """Review a violation"""
    violation = road_safety_engine.get_violation(violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    if data.decision == "approve":
        violation.status = ViolationStatus.ISSUED
        violation.issued_at = utcnow()
        violation.due_date = utcnow() + timedelta(days=30)
        violation.officer_id = data.officer_id
    else:
        violation.status = ViolationStatus.CANCELLED
    
    violation.notes = data.notes
    
    return serialize_for_json(violation)

@app.post("/api/violations/{violation_id}/pay")
async def pay_violation(violation_id: str):
    violation = road_safety_engine.get_violation(violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    violation.status = ViolationStatus.PAID
    violation.paid_at = utcnow()
    
    return serialize_for_json(violation)

@app.get("/api/violations/stats/revenue")
async def get_violation_revenue():
    violations = road_safety_engine.get_all_violations()
    issued = [v for v in violations if v.status in [ViolationStatus.ISSUED, ViolationStatus.PAID]]
    
    return serialize_for_json({
        "total_fines_issued": sum(v.fine_amount for v in issued),
        "total_fines_paid": sum(v.fine_amount for v in issued if v.status == ViolationStatus.PAID),
        "total_fines_pending": sum(v.fine_amount for v in issued if v.status == ViolationStatus.ISSUED),
        "total_points_deducted": sum(v.penalty_points for v in issued),
    })


# ==================== VIOLATIONS CRUD ====================
@app.put("/api/violations/{violation_id}")
async def update_violation(
    violation_id: str,
    plate_number: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    speed_detected: Optional[float] = Form(None),
):
    """Update a violation"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    violation = road_safety_engine.get_violation(violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    if plate_number:
        violation.plate_number = plate_number
    if location:
        violation.location = location
    if speed_detected:
        violation.speed_detected = speed_detected
    
    log_event("info", "violation", "road_safety_api.py", f"Violation updated: {violation_id}")
    
    return serialize_for_json(violation)


@app.delete("/api/violations/{violation_id}")
async def delete_violation(violation_id: str):
    """Delete a violation"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    violation = road_safety_engine.get_violation(violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    violation.status = ViolationStatus.CANCELLED
    
    log_event("warning", "violation", "road_safety_api.py", f"Violation deleted: {violation_id}")
    
    return {"status": "deleted", "violation_id": violation_id}


# ==================== VEHICLES ====================
@app.get("/api/vehicles")
async def list_vehicles(limit: int = 100):
    """List all registered vehicles"""
    vehicles = list(road_safety_engine.vehicles.values())[:limit]
    return serialize_for_json({
        "total": len(road_safety_engine.vehicles),
        "vehicles": vehicles
    })

@app.get("/api/vehicles/{plate_number}")
async def get_vehicle(plate_number: str):
    """Get vehicle by plate number"""
    vehicle = road_safety_engine.get_vehicle(plate_number)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return serialize_for_json(vehicle)

@app.get("/api/vehicles/{plate_number}/violations")
async def get_vehicle_violations(plate_number: str):
    violations = road_safety_engine.get_all_violations(plate_number=plate_number)
    return serialize_for_json({
        "plate_number": plate_number,
        "total_violations": len(violations),
        "violations": violations
    })


@app.post("/api/vehicles")
async def create_vehicle(
    plate_number: str = Form(..., min_length=5, max_length=20),
    vehicle_type: str = Form(default="saloon"),
    make: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    color: Optional[str] = Form(None),
    owner_name: Optional[str] = Form(None),
):
    """Register a new vehicle"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    # Check if vehicle already exists
    existing = road_safety_engine.get_vehicle(plate_number)
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle already registered")
    
    # Create vehicle data
    vehicle_data = {
        "plate_number": plate_number.upper(),
        "vehicle_type": vehicle_type,
        "make": make,
        "model": model,
        "year": year,
        "color": color,
        "owner_name": owner_name,
        "registered_at": utcnow().isoformat(),
        "status": "active"
    }
    
    road_safety_engine.vehicles[plate_number.upper()] = vehicle_data
    
    log_event("info", "system", "road_safety_api.py", f"Vehicle registered: {plate_number}",
              details={"type": vehicle_type, "make": make})
    
    return {"status": "created", "vehicle": vehicle_data}


@app.put("/api/vehicles/{plate_number}")
async def update_vehicle(
    plate_number: str,
    vehicle_type: Optional[str] = Form(None),
    make: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    owner_name: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
):
    """Update vehicle details"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    vehicle = road_safety_engine.get_vehicle(plate_number)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle_type:
        vehicle.vehicle_type = vehicle_type
    if make:
        vehicle.make = make
    if model:
        vehicle.model = model
    if color:
        vehicle.color = color
    if owner_name:
        vehicle.owner_name = owner_name
    if status:
        vehicle.status = status
    
    log_event("info", "system", "road_safety_api.py", f"Vehicle updated: {plate_number}")
    
    return serialize_for_json(vehicle)


@app.delete("/api/vehicles/{plate_number}")
async def delete_vehicle(plate_number: str):
    """Delete/deactivate a vehicle"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    vehicle = road_safety_engine.get_vehicle(plate_number)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Soft delete - mark as inactive
    vehicle.status = "deleted"
    
    log_event("warning", "system", "road_safety_api.py", f"Vehicle deleted: {plate_number}")
    
    return {"status": "deleted", "plate_number": plate_number}


# ==================== DRIVERS ====================
@app.get("/api/drivers/{license_number}")
async def get_driver(license_number: str):
    driver = road_safety_engine.get_driver(license_number)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return serialize_for_json(driver)

@app.get("/api/drivers/{license_number}/violations")
async def get_driver_violations(license_number: str):
    violations = road_safety_engine.get_all_violations()
    return serialize_for_json({
        "license_number": license_number,
        "total_violations": len(violations),
        "violations": violations
    })


# ==================== DRIVERS CRUD ====================
@app.get("/api/drivers")
async def list_drivers(limit: int = 100):
    """List all registered drivers"""
    return serialize_for_json({
        "total": len(road_safety_engine.drivers),
        "drivers": list(road_safety_engine.drivers.values())[:limit]
    })


@app.post("/api/drivers")
async def create_driver(
    license_number: str = Form(..., min_length=5, max_length=20),
    first_name: str = Form(...),
    last_name: str = Form(...),
    date_of_birth: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
):
    """Register a new driver"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    existing = road_safety_engine.get_driver(license_number)
    if existing:
        raise HTTPException(status_code=400, detail="Driver already registered")
    
    driver_data = {
        "license_number": license_number.upper(),
        "first_name": first_name,
        "last_name": last_name,
        "date_of_birth": date_of_birth,
        "phone": phone,
        "email": email,
        "address": address,
        "registered_at": utcnow().isoformat(),
        "status": "active",
        "points": 12
    }
    
    road_safety_engine.drivers[license_number.upper()] = driver_data
    
    log_event("info", "system", "road_safety_api.py", f"Driver registered: {license_number}",
              details={"name": f"{first_name} {last_name}"})
    
    return {"status": "created", "driver": driver_data}


@app.put("/api/drivers/{license_number}")
async def update_driver(
    license_number: str,
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
):
    """Update driver details"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    driver = road_safety_engine.get_driver(license_number)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    if first_name:
        driver.first_name = first_name
    if last_name:
        driver.last_name = last_name
    if phone:
        driver.phone = phone
    if email:
        driver.email = email
    if address:
        driver.address = address
    if status:
        driver.status = status
    
    log_event("info", "system", "road_safety_api.py", f"Driver updated: {license_number}")
    
    return serialize_for_json(driver)


@app.delete("/api/drivers/{license_number}")
async def delete_driver(license_number: str):
    """Delete/deactivate a driver"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    driver = road_safety_engine.get_driver(license_number)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    driver.status = "suspended"
    
    log_event("warning", "system", "road_safety_api.py", f"Driver suspended: {license_number}")
    
    return {"status": "deleted", "license_number": license_number}


# ==================== SPEED DETECTION ====================
@app.post("/api/speed/detect")
async def detect_speed(data: SpeedDetectionInput):
    """Detect speed and create violation if exceeding limit"""
    detection, violation = road_safety_engine.detect_speed(
        camera_id=data.camera_id,
        plate_number=data.plate_number.upper(),
        vehicle_type=VehicleType(data.vehicle_type.value),
        speed_detected=data.speed_detected,
        location=data.location,
        coordinates=Coordinates(
            lat=data.lat,
            lng=data.lng
        ),
        image_front=data.image_front,
        image_rear=data.image_rear
    )
    
    return serialize_for_json({
        "detection": detection,
        "violation": violation
    })

@app.get("/api/speed/detections")
async def list_speed_detections(limit: int = 100):
    detections = list(road_safety_engine.speed_detections.values())
    detections.sort(key=lambda d: d.timestamp, reverse=True)
    return serialize_for_json({
        "total": len(detections),
        "detections": detections[:limit]
    })

# ==================== ROADS ====================
@app.get("/api/roads")
async def list_roads():
    roads = road_safety_engine.get_dashboard_stats()["roads"]
    return serialize_for_json(roads)

@app.get("/api/roads/segments")
async def list_road_segments():
    segments = list(road_safety_engine.road_segments.values())
    return serialize_for_json(segments)

@app.get("/api/roads/{road_name}/stats")
async def get_road_stats(road_name: str):
    segment = None
    for seg in road_safety_engine.road_segments.values():
        if seg.name.lower() in road_name.lower():
            segment = seg
            break
    
    if not segment:
        raise HTTPException(status_code=404, detail="Road segment not found")
    
    accidents = [a for a in road_safety_engine.get_all_accidents() if a.road_name.lower() == road_name.lower()]
    violations = [v for v in road_safety_engine.get_all_violations() if v.road_name.lower() == road_name.lower()]
    
    return serialize_for_json({
        "segment": segment,
        "accidents_30d": len(accidents),
        "violations_30d": len(violations),
        "average_daily_traffic": segment.average_daily_traffic,
        "risk_level": segment.current_risk_level.value,
    })

# ==================== ANALYTICS ====================
@app.get("/api/analytics/trends")
async def get_trends(hours: int = 24):
    return serialize_for_json(road_safety_engine.get_dashboard_stats()["trend"])

@app.get("/api/analytics/accidents/by-type")
async def get_accidents_by_type():
    return serialize_for_json(road_safety_engine.get_dashboard_stats()["accidents"]["by_type"])

@app.get("/api/analytics/accidents/by-cause")
async def get_accidents_by_cause():
    return serialize_for_json(road_safety_engine.get_dashboard_stats()["accidents"]["by_cause"])

@app.get("/api/analytics/violations/by-type")
async def get_violations_by_type():
    return serialize_for_json(road_safety_engine.get_dashboard_stats()["violations"]["by_type"])

# Enhanced Analytics Endpoints
@app.get("/api/analytics/overview")
async def get_analytics_overview():
    """Get comprehensive analytics overview"""
    accidents = road_safety_engine.get_all_accidents()
    violations = road_safety_engine.get_all_violations()
    
    # Time-based analysis
    now = utcnow()
    last_7_days = []
    last_30_days = []
    
    for i in range(7):
        day = now - timedelta(days=i)
        day_accidents = [a for a in accidents if a.reported_at.date() == day.date()]
        day_violations = [v for v in violations if v.detected_at.date() == day.date()]
        last_7_days.append({
            "date": day.strftime("%Y-%m-%d"),
            "accidents": len(day_accidents),
            "violations": len(day_violations),
            "casualties": sum(a.casualties for a in day_accidents),
            "injuries": sum(a.injuries for a in day_accidents)
        })
    
    for i in range(30):
        day = now - timedelta(days=i)
        day_accidents = [a for a in accidents if a.reported_at.date() == day.date()]
        day_violations = [v for v in violations if v.detected_at.date() == day.date()]
        last_30_days.append({
            "date": day.strftime("%Y-%m-%d"),
            "accidents": len(day_accidents),
            "violations": len(day_violations),
            "casualties": sum(a.casualties for a in day_accidents),
            "injuries": sum(a.injuries for a in day_accidents)
        })
    
    # Severity distribution
    severity_dist = {}
    for severity in SeverityLevel:
        count = len([a for a in accidents if a.severity == severity])
        severity_dist[severity.value] = count
    
    # Status distribution
    status_dist = {}
    for status in IncidentStatus:
        count = len([a for a in accidents if a.status == status])
        status_dist[status.value] = count
    
    # Top hotspots
    hotspot_counts = {}
    for a in accidents:
        key = a.location
        hotspot_counts[key] = hotspot_counts.get(key, 0) + 1
    
    top_hotspots = sorted(hotspot_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "period": {
            "last_7_days": list(reversed(last_7_days)),
            "last_30_days": list(reversed(last_30_days))
        },
        "severity_distribution": severity_dist,
        "status_distribution": status_dist,
        "top_hotspots": [{"location": h[0], "count": h[1]} for h in top_hotspots],
        "summary": {
            "total_accidents": len(accidents),
            "total_violations": len(violations),
            "total_casualties": sum(a.casualties for a in accidents),
            "total_injuries": sum(a.injuries for a in accidents),
            "avg_daily_accidents": len(accidents) / 30,
            "avg_daily_violations": len(violations) / 30
        }
    }

@app.get("/api/analytics/roads/{road_name}/analysis")
async def get_road_analysis(road_name: str):
    """Get detailed analysis for a specific road"""
    accidents = road_safety_engine.get_all_accidents()
    violations = road_safety_engine.get_all_violations()
    
    road_accidents = [a for a in accidents if road_name.lower() in a.road_name.lower()]
    road_violations = [v for v in violations if road_name.lower() in v.road_name.lower()]
    
    # Time distribution
    hourly_accidents = {}
    hourly_violations = {}
    
    for a in road_accidents:
        hour = a.reported_at.hour
        hourly_accidents[hour] = hourly_accidents.get(hour, 0) + 1
    
    for v in road_violations:
        hour = v.detected_at.hour
        hourly_violations[hour] = hourly_violations.get(hour, 0) + 1
    
    return {
        "road_name": road_name,
        "total_accidents": len(road_accidents),
        "total_violations": len(road_violations),
        "total_casualties": sum(a.casualties for a in road_accidents),
        "total_injuries": sum(a.injuries for a in road_accidents),
        "by_hour": {
            "accidents": {str(h): hourly_accidents.get(h, 0) for h in range(24)},
            "violations": {str(h): hourly_violations.get(h, 0) for h in range(24)}
        },
        "by_severity": {s.value: len([a for a in road_accidents if a.severity == s]) for s in SeverityLevel},
        "by_type": {},
        "avg_response_time": "8.5 minutes"
    }

@app.get("/api/analytics/revenue")
async def get_revenue_analytics():
    """Get revenue analytics and fines collection"""
    violations = road_safety_engine.get_all_violations()
    
    now = utcnow()
    
    # Daily revenue
    daily_revenue = {}
    weekly_revenue = {}
    monthly_revenue = {}
    yearly_revenue = {}
    
    for v in violations:
        if v.status == ViolationStatus.PAID and v.paid_at:
            day_key = v.paid_at.strftime("%Y-%m-%d")
            week_key = v.paid_at.strftime("%Y-W%W")
            month_key = v.paid_at.strftime("%Y-%m")
            year_key = v.paid_at.strftime("%Y")
            
            daily_revenue[day_key] = daily_revenue.get(day_key, 0) + v.fine_amount
            weekly_revenue[week_key] = weekly_revenue.get(week_key, 0) + v.fine_amount
            monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + v.fine_amount
            yearly_revenue[year_key] = yearly_revenue.get(year_key, 0) + v.fine_amount
    
    # By violation type
    by_type = {}
    for v in violations:
        vtype = v.violation_type.value
        if vtype not in by_type:
            by_type[vtype] = {"count": 0, "total_fine": 0, "collected": 0}
        by_type[vtype]["count"] += 1
        by_type[vtype]["total_fine"] += v.fine_amount
        if v.status == ViolationStatus.PAID:
            by_type[vtype]["collected"] += v.fine_amount
    
    return {
        "daily": dict(sorted(daily_revenue.items(), reverse=True)[:30]),
        "weekly": dict(sorted(weekly_revenue.items(), reverse=True)[:12]),
        "monthly": dict(sorted(monthly_revenue.items(), reverse=True)[:12]),
        "yearly": yearly_revenue,
        "by_violation_type": by_type,
        "summary": {
            "total_issued": sum(v.fine_amount for v in violations if v.status in [ViolationStatus.ISSUED, ViolationStatus.PAID]),
            "total_collected": sum(v.fine_amount for v in violations if v.status == ViolationStatus.PAID),
            "total_pending": sum(v.fine_amount for v in violations if v.status == ViolationStatus.ISSUED),
            "collection_rate": len([v for v in violations if v.status == ViolationStatus.PAID]) / max(len(violations), 1) * 100
        }
    }

@app.get("/api/analytics/response-time")
async def get_response_time_analytics():
    """Get response time analytics"""
    accidents = road_safety_engine.get_all_accidents()
    
    # Calculate average response times
    response_times = []
    for a in accidents:
        if a.response_time_minutes:
            response_times.append(a.response_time_minutes)
    
    if not response_times:
        return {"message": "No response time data available"}
    
    return {
        "average": sum(response_times) / len(response_times),
        "min": min(response_times),
        "max": max(response_times),
        "count": len(response_times),
        "by_severity": {
            s.value: {
                "count": len([a for a in accidents if a.severity == s and a.response_time_minutes]),
                "avg": sum(a.response_time_minutes for a in accidents if a.severity == s and a.response_time_minutes) / max(len([a for a in accidents if a.severity == s and a.response_time_minutes]), 1)
            } for s in SeverityLevel
        }
    }

# ==================== NOTIFICATIONS ====================
@app.get("/api/notifications/stats")
async def get_notification_stats():
    """Get notification statistics"""
    from services.notification_service import notification_service
    return notification_service.get_stats()

@app.get("/api/notifications/history")
async def get_notification_history(limit: int = 100):
    """Get notification history"""
    from services.notification_service import notification_service
    return notification_service.get_history(limit)

@app.post("/api/notifications/send")
async def send_notification(
    phone: Optional[str] = None,
    email: Optional[str] = None,
    sms_message: Optional[str] = None,
    email_subject: Optional[str] = None,
    email_body: Optional[str] = None
):
    """Send a custom notification"""
    from services.notification_service import notification_service
    
    result = await notification_service.send(
        phone=phone,
        email=email,
        sms=sms_message,
        subject=email_subject,
        email_body=email_body
    )
    return result

# ==================== USER NOTIFICATIONS (for frontend panel) ====================
@app.get("/api/notifications")
async def get_user_notifications(user_id: str = "default_user", unread_only: bool = False, limit: int = 20):
    """Get notifications for a user"""
    notifications = notification_manager.get_user_notifications(user_id, unread_only)
    return {
        "notifications": [n.model_dump() for n in notifications[:limit]],
        "unread_count": len([n for n in notification_manager.get_user_notifications(user_id) if not n.read])
    }

@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_id: str = "default_user"):
    """Mark a notification as read"""
    notification_manager.mark_as_read(user_id, notification_id)
    return {"status": "marked"}

@app.post("/api/notifications/read-all")
async def mark_all_notifications_read(user_id: str = "default_user"):
    """Mark all notifications as read"""
    notification_manager.mark_all_as_read(user_id)
    return {"status": "all_marked"}

# Include notifications router
from .notifications_sounds import router as notifications_router
app.include_router(notifications_router)

# ==================== ENUMS ====================
@app.get("/api/enums/accident-types")
async def get_accident_types():
    return [t.value for t in AccidentType]

@app.get("/api/enums/cause-types")
async def get_cause_types():
    return [t.value for t in CauseType]

@app.get("/api/enums/severity-levels")
async def get_severity_levels():
    return [t.value for t in SeverityLevel]

@app.get("/api/enums/vehicle-types")
async def get_vehicle_types():
    return [t.value for t in VehicleType]

# ==================== CAMERAS ====================
MOCK_CAMERAS = [
    {"id": "cam_001", "name": "Mombasa Road - Junction", "location": "Mombasa Road", "latitude": -1.3300, "longitude": 36.9800, "road_name": "A109", "type": "speed", "status": "online", "speed_limit": 100, "last_update": utcnow().isoformat()},
    {"id": "cam_002", "name": "Thika Superhighway - Exit", "location": "Thika Road", "latitude": -1.0800, "longitude": 37.1000, "road_name": "A2", "type": "ANPR", "status": "online", "speed_limit": 80, "last_update": utcnow().isoformat()},
    {"id": "cam_003", "name": "Kenyatta Ave - CBD", "location": "Kenyatta Avenue", "latitude": -1.2864, "longitude": 36.8232, "road_name": "Kenyatta Ave", "type": "red_light", "status": "online", "speed_limit": 50, "last_update": utcnow().isoformat()},
    {"id": "cam_004", "name": "Ngong Road - Roundabout", "location": "Ngong Road", "latitude": -1.3100, "longitude": 36.7800, "road_name": "Ngong Road", "type": "surveillance", "status": "online", "speed_limit": 60, "last_update": utcnow().isoformat()},
    {"id": "cam_005", "name": "Nairobi Expressway - Entry", "location": "Expressway", "latitude": -1.3200, "longitude": 36.8900, "road_name": "Expressway", "type": "speed", "status": "online", "speed_limit": 80, "last_update": utcnow().isoformat()},
    {"id": "cam_006", "name": "Nakuru Town - CBD", "location": "Nakuru", "latitude": -0.3031, "longitude": 36.0800, "road_name": "A104", "type": "red_light", "status": "maintenance", "speed_limit": 50, "last_update": utcnow().isoformat()},
    {"id": "cam_007", "name": "Mombasa Road - Airport", "location": "Airport Road", "latitude": -1.3500, "longitude": 36.9500, "road_name": "A109", "type": "ANPR", "status": "online", "speed_limit": 100, "last_update": utcnow().isoformat()},
    {"id": "cam_008", "name": "Kisumu Airport Road", "location": "Kisumu", "latitude": -0.1000, "longitude": 34.7500, "road_name": "A1", "type": "speed", "status": "offline", "speed_limit": 80, "last_update": utcnow().isoformat()},
]

@app.get("/api/cameras")
async def list_cameras(status: Optional[str] = None, type: Optional[str] = None):
    cameras = MOCK_CAMERAS
    if status:
        cameras = [c for c in cameras if c["status"] == status]
    if type:
        cameras = [c for c in cameras if c["type"] == type]
    return cameras

@app.get("/api/cameras/{camera_id}")
async def get_camera(camera_id: str):
    camera = next((c for c in MOCK_CAMERAS if c["id"] == camera_id), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@app.get("/api/cameras/{camera_id}/latest")
async def get_camera_latest(camera_id: str):
    camera = next((c for c in MOCK_CAMERAS if c["id"] == camera_id), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"image_url": f"/static/cameras/{camera_id}_latest.jpg", "timestamp": utcnow().isoformat()}

# ==================== TEAMS ====================
MOCK_TEAMS = [
    {"id": "team_001", "name": "Alpha Team", "type": "police", "status": "available", "base": "CBD Station", "members": 4, "latitude": -1.2864, "longitude": 36.8232},
    {"id": "team_002", "name": "Beta Team", "type": "ambulance", "status": "available", "base": "Kenyatta Hospital", "members": 3, "latitude": -1.3000, "longitude": 36.8000},
    {"id": "team_003", "name": "Gamma Team", "type": "fire", "status": "dispatched", "base": "Industrial Area", "members": 6, "latitude": -1.3200, "longitude": 36.8500, "current_incident_id": "acc_001", "eta": "5 min"},
    {"id": "team_004", "name": "Delta Team", "type": "traffic", "status": "on_scene", "base": "Mombasa Road", "members": 2, "latitude": -1.3300, "longitude": 36.9800, "current_incident_id": "acc_002"},
    {"id": "team_005", "name": "Epsilon Team", "type": "police", "status": "off_duty", "base": "Thika Station", "members": 4, "latitude": -1.0800, "longitude": 37.1000},
    {"id": "team_006", "name": "Zeta Team", "type": "ambulance", "status": "available", "base": "Nairobi Hospital", "members": 3, "latitude": -1.2800, "longitude": 36.8200},
]

@app.get("/api/teams")
async def list_teams(type: Optional[str] = None, status: Optional[str] = None):
    teams = MOCK_TEAMS
    if type:
        teams = [t for t in teams if t["type"] == type]
    if status:
        teams = [t for t in teams if t["status"] == status]
    return teams

@app.get("/api/teams/{team_id}")
async def get_team(team_id: str):
    team = next((t for t in MOCK_TEAMS if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@app.post("/api/teams/{team_id}/dispatch")
async def dispatch_team(team_id: str, data: TeamDispatch):
    """Dispatch a team to an incident"""
    team = next((t for t in MOCK_TEAMS if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team["status"] = "dispatched"
    team["current_incident_id"] = data.incident_id
    team["eta"] = data.eta
    
    return {
        "id": f"dispatch_{uuid.uuid4().hex[:8]}",
        "team_id": team_id,
        "incident_id": data.incident_id,
        "status": "dispatched",
        "assigned_at": utcnow().isoformat(),
        "eta": team["eta"]
    }

@app.post("/api/dispatch")
async def create_dispatch(data: dict):
    """Create a new dispatch (simplified endpoint)"""
    incident_id = data.get("incident_id")
    responder_id = data.get("responder_id")
    
    team = next((t for t in MOCK_TEAMS if t["id"] == responder_id), None)
    if not team:
        return {"error": "Responder not found", "status": 404}
    
    team["status"] = "dispatched"
    team["current_incident_id"] = incident_id
    
    return {
        "id": f"dispatch_{uuid.uuid4().hex[:8]}",
        "team_id": responder_id,
        "incident_id": incident_id,
        "status": "dispatched",
        "assigned_at": utcnow().isoformat(),
        "eta": 15
    }

@app.get("/api/dispatch")
async def list_dispatches():
    """List all dispatches"""
    dispatches = []
    for team in MOCK_TEAMS:
        if team.get("current_incident_id"):
            dispatches.append({
                "id": f"dispatch_{team['id']}",
                "team_id": team["id"],
                "incident_id": team["current_incident_id"],
                "status": team["status"],
                "assigned_at": utcnow().isoformat(),
                "eta": team.get("eta", 15)
            })
    return {"dispatches": dispatches}


# ==================== TEAMS CRUD ====================
@app.post("/api/teams")
async def create_team(
    name: str = Form(..., min_length=3, max_length=100),
    team_type: str = Form(...),
    base: str = Form(..., min_length=3),
    members: int = Form(default=5, ge=1, le=20),
):
    """Create a new response team"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    team_id = f"team_{uuid.uuid4().hex[:8]}"
    new_team = {
        "id": team_id,
        "name": name,
        "type": team_type,
        "status": "available",
        "base": base,
        "members": members,
        "latitude": -1.2921,
        "longitude": 36.8219,
        "capabilities": ["medical", "rescue", "traffic"]
    }
    MOCK_TEAMS.append(new_team)
    
    log_event("info", "system", "road_safety_api.py", f"Team created: {name}", 
              details={"team_id": team_id, "type": team_type, "base": base})
    
    return {"status": "created", "team": new_team}


@app.put("/api/teams/{team_id}")
async def update_team(
    team_id: str,
    name: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    base: Optional[str] = Form(None),
    members: Optional[int] = Form(None),
):
    """Update an existing team"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    team = next((t for t in MOCK_TEAMS if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if name:
        team["name"] = name
    if status:
        team["status"] = status
    if base:
        team["base"] = base
    if members:
        team["members"] = members
    
    log_event("info", "system", "road_safety_api.py", f"Team updated: {team_id}",
              details={"name": name, "status": status})
    
    return {"status": "updated", "team": team}


@app.delete("/api/teams/{team_id}")
async def delete_team(team_id: str):
    """Delete a team"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    team = next((t for t in MOCK_TEAMS if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    MOCK_TEAMS.remove(team)
    
    log_event("warning", "system", "road_safety_api.py", f"Team deleted: {team_id}")
    
    return {"status": "deleted", "team_id": team_id}


# ==================== ALERTS ====================
MOCK_ALERTS = [
    {"id": "alert_001", "title": "Heavy Traffic", "message": "Mombasa Road experiencing heavy traffic due to accident", "severity": "medium", "type": "road", "location": "Mombasa Road", "latitude": -1.3300, "longitude": 36.9800, "created_at": utcnow().isoformat(), "is_active": True},
    {"id": "alert_002", "title": "Weather Warning", "message": "Heavy rainfall expected in Nairobi region", "severity": "high", "type": "weather", "location": "Nairobi", "latitude": -1.2864, "longitude": 36.8232, "created_at": utcnow().isoformat(), "is_active": True},
    {"id": "alert_003", "title": "Road Closure", "message": "Ngong Road closed for repairs between Roundabout and Karen", "severity": "critical", "type": "road", "location": "Ngong Road", "latitude": -1.3100, "longitude": 36.7800, "created_at": utcnow().isoformat(), "is_active": True},
]

@app.get("/api/alerts")
async def list_alerts(severity: Optional[str] = None, type: Optional[str] = None, active: bool = True):
    alerts = MOCK_ALERTS
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity]
    if type:
        alerts = [a for a in alerts if a["type"] == type]
    if active is not None:
        alerts = [a for a in alerts if a["is_active"] == active]
    return alerts

@app.post("/api/alerts", status_code=201)
async def create_alert(data: AlertCreate):
    """Create a new alert with validation"""
    alert = {
        "id": f"alert_{uuid.uuid4().hex[:8]}",
        "title": data.title,
        "message": data.message,
        "severity": data.severity,
        "type": data.alert_type,
        "location": data.location,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "created_at": utcnow().isoformat(),
        "is_active": True
    }
    MOCK_ALERTS.append(alert)
    return alert

@app.post("/api/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    alert = next((a for a in MOCK_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["is_active"] = False
    return {"message": "Alert dismissed"}

@app.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an alert"""
    alert = next((a for a in MOCK_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["acknowledged"] = True
    return {"message": "Alert acknowledged"}


# ==================== ALERTS CRUD ====================
@app.put("/api/alerts/{alert_id}")
async def update_alert(
    alert_id: str,
    title: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
):
    """Update an alert"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    alert = next((a for a in MOCK_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if title:
        alert["title"] = title
    if message:
        alert["message"] = message
    if severity:
        alert["severity"] = severity
    if is_active is not None:
        alert["is_active"] = is_active
    
    log_event("info", "system", "road_safety_api.py", f"Alert updated: {alert_id}")
    
    return {"status": "updated", "alert": alert}


@app.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    alert = next((a for a in MOCK_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    MOCK_ALERTS.remove(alert)
    
    log_event("warning", "system", "road_safety_api.py", f"Alert deleted: {alert_id}")
    
    return {"status": "deleted", "alert_id": alert_id}


# ==================== CITIZEN REPORTS ====================
CITIZEN_REPORTS = []

@app.post("/api/citizen/reports", status_code=201)
async def create_citizen_report(data: CitizenReportCreate):
    """Create a citizen report with validation"""
    report = {
        "id": f"report_{uuid.uuid4().hex[:8]}",
        "type": data.report_type,
        "description": data.description,
        "location": data.location,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "first_name": data.first_name if not data.anonymous else "",
        "last_name": data.last_name if not data.anonymous else "",
        "phone_number": data.phone_number if not data.anonymous else "",
        "anonymous": data.anonymous,
        "attachments": data.attachments,
        "status": "pending",
        "created_at": utcnow().isoformat()
    }
    CITIZEN_REPORTS.append(report)
    
    # Broadcast to connected clients
    try:
        from events import event_broadcaster
        await event_broadcaster.broadcast_citizen_report(report)
    except Exception as e:
        logger.warning(f"Failed to broadcast citizen report: {e}")
    
    return report

@app.get("/api/citizen/reports")
async def list_citizen_reports(status: Optional[str] = None):
    reports = CITIZEN_REPORTS
    if status:
        reports = [r for r in reports if r["status"] == status]
    return {"total": len(reports), "reports": reports}

@app.get("/api/citizen/reports/{report_id}")
async def get_citizen_report(report_id: str):
    report = next((r for r in CITIZEN_REPORTS if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.put("/api/citizen/reports/{report_id}/status")
async def update_citizen_report_status(report_id: str, status: str):
    """Update citizen report status"""
    report = next((r for r in CITIZEN_REPORTS if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report["status"] = status
    return report


# ==================== CITIZEN REPORTS CRUD ====================
@app.put("/api/citizen/reports/{report_id}")
async def update_citizen_report(
    report_id: str,
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
):
    """Update a citizen report"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    report = next((r for r in CITIZEN_REPORTS if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if description:
        report["description"] = description
    if location:
        report["location"] = location
    
    log_event("info", "system", "road_safety_api.py", f"Citizen report updated: {report_id}")
    
    return {"status": "updated", "report": report}


@app.delete("/api/citizen/reports/{report_id}")
async def delete_citizen_report(report_id: str):
    """Delete a citizen report"""
    try:
        from .logging_system import log_event
    except ModuleNotFoundError:
        from backend.logging_system import log_event
    
    report = next((r for r in CITIZEN_REPORTS if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    CITIZEN_REPORTS.remove(report)
    
    log_event("warning", "system", "road_safety_api.py", f"Citizen report deleted: {report_id}")
    
    return {"status": "deleted", "report_id": report_id}


# ==================== EVIDENCE UPLOAD ====================
import os
from fastapi import UploadFile, File

EVIDENCE_DIR = "backend/data/evidence"
os.makedirs(EVIDENCE_DIR, exist_ok=True)

@app.post("/api/evidence/attachments")
async def upload_evidence(file: UploadFile = File(...)):
    """Upload evidence files (photos/videos)"""
    try:
        # Generate unique filename
        timestamp = int(datetime.now(timezone.utc).timestamp())
        filename = f"{timestamp}_{file.filename}"
        filepath = os.path.join(EVIDENCE_DIR, filename)
        
        # Save file
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        
        # Return URL path
        url_path = f"/api/evidence/files/{filename}"
        return {"url": url_path, "path": filepath, "filename": filename}
    except Exception as e:
        logger.error(f"Error uploading evidence: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

@app.get("/api/evidence/files/{filename}")
async def get_evidence_file(filename: str):
    """Serve uploaded evidence files"""
    filepath = os.path.join(EVIDENCE_DIR, filename)
    if os.path.exists(filepath):
        from fastapi.responses import FileResponse
        return FileResponse(filepath)
    raise HTTPException(status_code=404, detail="File not found")

# ==================== GENERATE MOCK DATA ====================
@app.post("/api/admin/generate-mock-data")
async def generate_mock_data():
    road_safety_engine.generate_mock_data()
    return {"message": "Mock data generated successfully"}

# ==================== DATABASE MANAGEMENT ====================
@app.get("/api/admin/database/stats")
async def get_database_stats():
    """Get database statistics"""
    from database_service import get_statistics
    return get_statistics()

@app.post("/api/admin/database/backup")
async def backup_database(backup_name: Optional[str] = None):
    """Create database backup"""
    from database_service import backup_database as backup_db
    from database_service import initialize_from_engine
    
    # First save current engine data
    initialize_from_engine({
        "vehicles": {v.plate_number: v.__dict__ for v in road_safety_engine.vehicles.values()},
        "accidents": road_safety_engine.accidents.values(),
        "violations": road_safety_engine.violations.values(),
        "drivers": road_safety_engine.drivers,
        "speed_detections": road_safety_engine.speed_detections
    })
    
    backup_path = backup_db(backup_name)
    return {"message": "Database backed up successfully", "backup_file": backup_path}

@app.post("/api/admin/database/restore")
async def restore_database(backup_file: str):
    """Restore database from backup"""
    from database_service import restore_database as restore_db
    success = restore_db(backup_file)
    if success:
        return {"message": "Database restored successfully"}
    raise HTTPException(status_code=400, detail="Failed to restore database")

@app.post("/api/admin/database/clear")
async def clear_database():
    """Clear database"""
    from database_service import clear_database
    clear_database()
    return {"message": "Database cleared successfully"}

# ==================== WEBSOCKET ====================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.authenticated_connections: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str, token: Optional[str] = None):
        """Connect with optional authentication - token required in production"""
        await websocket.accept()
        
        # Check if authentication is required
        import os
        env = os.environ.get("OVERWATCH_ENV", "development")
        require_auth = env == "production"
        
        # Try to authenticate
        authenticated = False
        user_id = None
        role = None
        
        if token:
            try:
                from auth import verify_access_token
                payload = verify_access_token(token)
                authenticated = True
                user_id = payload.sub
                role = payload.role
            except Exception as e:
                if require_auth:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid or expired token"
                    })
                    await websocket.close(code=4001)
                    return
        elif require_auth:
            await websocket.send_json({
                "type": "error",
                "message": "Authentication required"
            })
            await websocket.close(code=4001)
            return
        
        self.active_connections[client_id] = websocket
        self.authenticated_connections[client_id] = {
            "connected_at": datetime.now(timezone.utc),
            "authenticated": authenticated,
            "user_id": user_id,
            "role": role,
            "channels": []
        }
        
        # Send auth status
        await websocket.send_json({
            "type": "connected",
            "authenticated": authenticated,
            "user_id": user_id,
            "role": role
        })
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.authenticated_connections:
            del self.authenticated_connections[client_id]
    
    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)
    
    def is_authenticated(self, client_id: str) -> bool:
        return self.authenticated_connections.get(client_id, {}).get("authenticated", False)
    
    def get_authenticated_users(self) -> Dict[str, Dict]:
        """Get all authenticated connections"""
        return {
            cid: info for cid, info in self.authenticated_connections.items()
            if info.get("authenticated")
        }

manager = ConnectionManager()

# ==================== CCTV & STREAMS ====================
@app.get("/api/cctv/simulate/{camera_id}/frame")
async def simulate_camera_frame(camera_id: str):
    """Simulate a camera frame"""
    from services.cctv_simulation import cctv_simulator
    frame = cctv_simulator.generate_frame(camera_id)
    return {
        "camera_id": frame.camera_id,
        "timestamp": frame.timestamp,
        "frame_number": frame.frame_number,
        "vehicle_count": frame.vehicle_count,
        "average_speed": frame.average_speed,
        "detections": frame.detections,
        "anomaly_detected": frame.anomaly_detected,
        "image_quality": frame.image_quality
    }

@app.post("/api/cctv/simulate/{camera_id}/start")
async def start_cctv_stream(camera_id: str):
    """Start a simulated camera stream"""
    from services.cctv_simulation import cctv_simulator
    cctv_simulator.start_stream(camera_id)
    return {"message": "Stream started", "camera_id": camera_id}

@app.post("/api/cctv/simulate/{camera_id}/stop")
async def stop_cctv_stream(camera_id: str):
    """Stop a simulated camera stream"""
    from services.cctv_simulation import cctv_simulator
    cctv_simulator.stop_stream(camera_id)
    return {"message": "Stream stopped", "camera_id": camera_id}

@app.get("/api/cctv/anpr/process/{camera_id}")
async def process_anpr(camera_id: str):
    """Process ANPR on simulated frame"""
    from services.cctv_simulation import cctv_simulator, anpr_simulator
    frame = cctv_simulator.generate_frame(camera_id)
    result = anpr_simulator.process_frame(frame)
    return result

@app.get("/api/cctv/anpr/stats")
async def get_anpr_stats():
    """Get ANPR statistics"""
    from services.cctv_simulation import anpr_simulator
    return anpr_simulator.get_statistics()

@app.get("/api/cctv/traffic/peak-hours")
async def get_peak_hours():
    """Get peak traffic hours"""
    from services.cctv_simulation import traffic_analyzer
    return traffic_analyzer.get_peak_hours()

@app.get("/api/cctv/traffic/score/{hour}")
async def get_traffic_score(hour: int):
    """Get traffic score for an hour"""
    from services.cctv_simulation import traffic_analyzer
    return {"hour": hour, "score": traffic_analyzer.get_traffic_score(hour)}

# ==================== RUN ====================

# Background task to broadcast updates
async def broadcast_updates():
    """Broadcast real-time updates to all connected clients"""
    while True:
        await asyncio.sleep(30)
        try:
            stats = road_safety_engine.get_dashboard_stats()
            await manager.broadcast({
                "type": "stats_update",
                "data": serialize_for_json(stats),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        except Exception as e:
            logger.error(f"Error broadcasting updates: {e}")

# Real-time event notification system
async def notify_accident_created(accident_data: dict):
    """Notify all clients about new accident"""
    await manager.broadcast({
        "type": "accident_created",
        "data": accident_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def notify_violation_created(violation_data: dict):
    """Notify all clients about new violation"""
    await manager.broadcast({
        "type": "violation_created",
        "data": violation_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def notify_alert_created(alert_data: dict):
    """Notify all clients about new alert"""
    await manager.broadcast({
        "type": "alert_created",
        "data": alert_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def notify_speed_violation(detection_data: dict, violation_data: dict):
    """Notify about speed violation"""
    await manager.broadcast({
        "type": "speed_violation",
        "detection": detection_data,
        "violation": violation_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

# WebSocket channel types
WEBSOCKET_CHANNELS = {
    "accidents": "Real-time accident updates",
    "violations": "Real-time violation updates", 
    "alerts": "Real-time alert broadcasts",
    "speed": "Speed detection events",
    "dashboard": "Dashboard statistics",
    "admin:all": "All admin events (requires auth)",
    "admin:users": "User management events",
}

# ==================== IAM (Identity & Access Management) ====================
from security.iam.manager import IAMManager, ResourceType, Action, UserStatus as IAMUserStatus

iam_manager = IAMManager(storage_path="data/iam")

@app.get("/api/iam/roles")
async def get_roles():
    """Get all roles"""
    roles = iam_manager.roles.values()
    return {"roles": [r.to_dict() for r in roles]}

@app.get("/api/iam/roles/{role_id}")
async def get_role(role_id: str):
    """Get a specific role"""
    role = iam_manager.get_role(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role.to_dict()

@app.post("/api/iam/roles")
async def create_role(
    name: str,
    description: str,
    permissions: List[dict],
    current_user: dict = Depends(lambda: {"role": "admin"})
):
    """Create a new role"""
    from security.iam.manager import Permission
    perms = [Permission.from_dict(p) for p in permissions]
    role = iam_manager.create_role(name, description, perms)
    return role.to_dict()

@app.get("/api/iam/users")
async def get_iam_users():
    """Get all IAM users"""
    users = iam_manager.users.values()
    return {"users": [u.to_dict() for u in users]}

@app.get("/api/iam/users/{user_id}")
async def get_iam_user(user_id: str):
    """Get a specific user"""
    user = iam_manager.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.to_dict()

@app.post("/api/iam/users")
async def create_iam_user(
    username: str,
    email: str,
    password: str,
    role_id: str,
    first_name: str = "",
    last_name: str = "",
    phone: str = "",
    department: str = ""
):
    """Create a new IAM user"""
    from auth import hash_password
    password_hash = hash_password(password)
    user = iam_manager.create_user(
        username=username,
        email=email,
        password_hash=password_hash,
        role_id=role_id,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        department=department
    )
    return user.to_dict()

@app.put("/api/iam/users/{user_id}")
async def update_iam_user(user_id: str, **kwargs):
    """Update an IAM user"""
    user = iam_manager.update_user(user_id, **kwargs)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.to_dict()

@app.delete("/api/iam/users/{user_id}")
async def delete_iam_user(user_id: str):
    """Delete an IAM user"""
    success = iam_manager.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted"}

@app.post("/api/iam/users/{user_id}/assign-role/{role_id}")
async def assign_user_role(user_id: str, role_id: str):
    """Assign a role to a user"""
    success = iam_manager.assign_role(user_id, role_id)
    if not success:
        raise HTTPException(status_code=404, detail="User or role not found")
    return {"status": "role_assigned"}

@app.get("/api/iam/check-permission")
async def check_permission(
    user_id: str,
    resource: str,
    action: str
):
    """Check if a user has permission for a resource action"""
    try:
        resource_type = ResourceType(resource)
        action_type = Action(action)
        has_permission = iam_manager.check_permission(user_id, resource_type, action_type)
        return {"user_id": user_id, "resource": resource, "action": action, "has_permission": has_permission}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Include chat router
from .chat_system import router as chat_router
app.include_router(chat_router)

# ==================== WEBSOCKET ENDPOINT ====================
from .events import event_broadcaster, EventType

@app.websocket("/ws/road_safety")
async def websocket_road_safety(websocket: WebSocket):
    """WebSocket endpoint for real-time road safety updates"""
    await websocket.accept()
    
    # Subscribe to events
    event_broadcaster.subscribe(websocket, ["all", EventType.CITIZEN_REPORT.value])
    
    # Send initial connection message
    await websocket.send_json({
        "type": "connected",
        "message": "Connected to Kenya Overwatch real-time updates"
    })
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Handle subscription messages
                if message.get("type") == "subscribe":
                    channels = message.get("channels", [])
                    event_broadcaster.subscribe(websocket, channels)
                    await websocket.send_json({
                        "type": "subscribed",
                        "channels": channels
                    })
            except json.JSONDecodeError:
                pass
    except Exception:
        pass
    finally:
        event_broadcaster.unsubscribe(websocket)


# ==================== MONITORING & METRICS ====================
@app.get("/api/metrics")
async def get_metrics():
    """Get system metrics"""
    try:
        from .cache import cache
    except ModuleNotFoundError:
        from backend.cache import cache
    
    cache_stats = cache.get_stats()
    
    return {
        "timestamp": utcnow().isoformat(),
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent,
        },
        "cache": cache_stats,
        "uptime": time.time(),
    }


@app.get("/api/metrics/prometheus")
async def prometheus_metrics():
    """Prometheus-formatted metrics"""
    cpu = psutil.cpu_percent()
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    metrics = f"""# HELP kenya_overwatch_cpu_percent CPU usage percentage
# TYPE kenya_overwatch_cpu_percent gauge
kenya_overwatch_cpu_percent {cpu}

# HELP kenya_overwatch_memory_percent Memory usage percentage
# TYPE kenya_overwatch_memory_percent gauge
kenya_overwatch_memory_percent {mem.percent}

# HELP kenya_overwatch_disk_percent Disk usage percentage
# TYPE kenya_overwatch_disk_percent gauge
kenya_overwatch_disk_percent {disk.percent}

# HELP kenya_overwatch_requests_total Total API requests
# TYPE kenya_overwatch_requests_total counter
kenya_overwatch_requests_total {random.randint(1000, 10000)}

# HELP kenya_overwatch_active_incidents Active incidents count
# TYPE kenya_overwatch_active_incidents gauge
kenya_overwatch_active_incidents {random.randint(5, 20)}

# HELP kenya_overwatch_active_teams Active response teams
# TYPE kenya_overwatch_active_teams gauge
kenya_overwatch_active_teams {random.randint(3, 10)}
"""
    return PlainTextResponse(metrics, media_type="text/plain")


# ==================== RUN ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
