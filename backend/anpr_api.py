"""
Kenya NTSA Road Safety - ANPR API
Automatic Number Plate Recognition API endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter(prefix="/api/anpr", tags=["ANPR"])


# Kenyan plate patterns
KENYA_PLATE_PATTERNS = [
    r"^K[A-Z]{1,2}\d{3}[A-Z]$",  # KAA 123A
    r"^K[A-Z]{1,2}\d{4}$",       # KAA 1234
    r"^KA[A-Z]\d{3}[A-Z]$",      # KAA 123A
]


class PlateDetection(BaseModel):
    plate_number: str
    confidence: float
    camera_id: str
    timestamp: str
    location: str
    speed_detected: Optional[float] = None
    speed_limit: Optional[float] = None
    vehicle_type: Optional[str] = None


class CameraStream(BaseModel):
    id: str
    name: str
    location: str
    road_name: str
    type: str
    status: str
    is_recording: bool
    last_plate_detected: Optional[str] = None
    last_detection_time: Optional[str] = None
    detections_today: int


# In-memory storage
DETECTIONS_DB = []
CAMERA_STREAMS = {
    "cam_001": {
        "id": "cam_001",
        "name": "Mombasa Road - Junction",
        "location": "Mombasa Road",
        "road_name": "A109",
        "type": "ANPR",
        "status": "online",
        "is_recording": True,
        "last_plate_detected": None,
        "last_detection_time": None,
        "detections_today": 0
    },
    "cam_002": {
        "id": "cam_002",
        "name": "Thika Superhighway - Exit",
        "location": "Thika Road",
        "road_name": "A2",
        "type": "speed",
        "status": "online",
        "is_recording": True,
        "last_plate_detected": None,
        "last_detection_time": None,
        "detections_today": 0
    },
    "cam_003": {
        "id": "cam_003",
        "name": "Kenyatta Ave - CBD",
        "location": "Kenyatta Avenue",
        "road_name": "Kenyatta Ave",
        "type": "red_light",
        "status": "online",
        "is_recording": True,
        "last_plate_detected": None,
        "last_detection_time": None,
        "detections_today": 0
    },
}


# Generate random Kenyan plates
def generate_random_plate() -> str:
    prefixes = ["KAA", "KAB", "KAC", "KAD", "KBA", "KBB", "KBC", "KCA", "KCB", "KDA"]
    prefix = random.choice(prefixes)
    number = random.randint(100, 9999)
    suffix = random.choice(["A", "B", "C", "D", "E", "", "", ""])
    return f"{prefix}{number}{suffix}"


@router.get("/plates", response_model=List[PlateDetection])
async def get_detected_plates(
    camera_id: Optional[str] = None,
    limit: int = 100
):
    """Get list of detected license plates"""
    plates = DETECTIONS_DB
    
    if camera_id:
        plates = [p for p in plates if p["camera_id"] == camera_id]
    
    return plates[-limit:]


@router.post("/detect")
async def simulate_detection(camera_id: str):
    """Simulate plate detection (for demo/testing)"""
    if camera_id not in CAMERA_STREAMS:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    camera = CAMERA_STREAMS[camera_id]
    
    # Generate random plate
    plate = generate_random_plate()
    confidence = random.uniform(0.85, 0.99)
    
    # Check if speeding
    speed_detected = None
    speed_limit = None
    if camera["type"] == "speed":
        speed_limit = random.choice([50, 60, 80, 100])
        speed_detected = speed_limit + random.randint(5, 40)
    
    detection = {
        "plate_number": plate,
        "confidence": confidence,
        "camera_id": camera_id,
        "timestamp": datetime.now().isoformat(),
        "location": camera["location"],
        "speed_detected": speed_detected,
        "speed_limit": speed_limit if speed_detected else None,
        "vehicle_type": random.choice(["saloon", "pickup", "matatu", "lorry"])
    }
    
    DETECTIONS_DB.append(detection)
    
    # Update camera
    camera["last_plate_detected"] = plate
    camera["last_detection_time"] = detection["timestamp"]
    camera["detections_today"] += 1
    
    return detection


@router.get("/cameras")
async def get_anpr_cameras():
    """Get all ANPR cameras"""
    return list(CAMERA_STREAMS.values())


@router.get("/cameras/{camera_id}")
async def get_camera(camera_id: str):
    """Get specific ANPR camera"""
    if camera_id not in CAMERA_STREAMS:
        raise HTTPException(status_code=404, detail="Camera not found")
    return CAMERA_STREAMS[camera_id]


@router.post("/cameras/{camera_id}/control")
async def control_camera(camera_id: str, action: str):
    """Control camera (start/stop recording)"""
    if camera_id not in CAMERA_STREAMS:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    if action == "start":
        CAMERA_STREAMS[camera_id]["is_recording"] = True
    elif action == "stop":
        CAMERA_STREAMS[camera_id]["is_recording"] = False
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    return {"status": "success", "camera_id": camera_id, "is_recording": CAMERA_STREAMS[camera_id]["is_recording"]}


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload image for plate recognition"""
    # In production, this would process the image
    # For now, return a simulated response
    return {
        "detected": True,
        "plate": generate_random_plate(),
        "confidence": random.uniform(0.85, 0.99),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/statistics")
async def get_anpr_statistics():
    """Get ANPR statistics"""
    return {
        "total_detections": len(DETECTIONS_DB),
        "unique_plates": len(set(d["plate_number"] for d in DETECTIONS_DB)),
        "cameras_online": len([c for c in CAMERA_STREAMS.values() if c["status"] == "online"]),
        "cameras_total": len(CAMERA_STREAMS),
        "detections_by_camera": {
            camera_id: len([d for d in DETECTIONS_DB if d["camera_id"] == camera_id])
            for camera_id in CAMERA_STREAMS.keys()
        }
    }


@router.get("/search/{plate_number}")
async def search_plate(plate_number: str):
    """Search for a specific plate"""
    matches = [d for d in DETECTIONS_DB if d["plate_number"] == plate_number]
    return {
        "plate_number": plate_number,
        "matches": len(matches),
        "detections": matches
    }
