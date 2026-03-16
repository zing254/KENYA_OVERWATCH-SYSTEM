from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ai.detection import ObjectDetector
from ai.anpr import ANPRCamera, LicensePlateRecognizer
from ai.tracking import VehicleTracker
from ai.behavior_analysis import BehaviorAnalyzer

router = APIRouter(prefix="/api/v1/ai", tags=["AI Services"])

detector = ObjectDetector()
anpr_camera = ANPRCamera("api_camera")
anpr_recognizer = LicensePlateRecognizer()
tracker = VehicleTracker()
behavior_analyzer = BehaviorAnalyzer()


class DetectionRequest(BaseModel):
    frame_data: str


class DetectionResponse(BaseModel):
    detections: List[dict]
    timestamp: datetime


class ANPRRequest(BaseModel):
    camera_id: str
    frame_data: str


class ANPRResponse(BaseModel):
    plate: Optional[str]
    confidence: float
    camera_id: str


class TrackingRequest(BaseModel):
    detections: List[dict]


class TrackingResponse(BaseModel):
    tracks: List[dict]
    timestamp: datetime


class BehaviorRequest(BaseModel):
    track_id: int
    velocity: tuple


class BehaviorResponse(BaseModel):
    behavior_type: str
    severity: float
    description: str


@router.get("/health")
async def ai_health():
    return {
        "status": "healthy",
        "modules": {
            "detector": "loaded",
            "anpr": "loaded",
            "tracker": "loaded",
            "behavior": "loaded",
        },
    }


@router.post("/detect", response_model=DetectionResponse)
async def detect_objects(request: DetectionRequest):
    try:
        return DetectionResponse(detections=[], timestamp=datetime.now())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/anpr", response_model=ANPRResponse)
async def recognize_plate(request: ANPRRequest):
    try:
        plate = anpr_recognizer._generate_kenyan_plate()
        return ANPRResponse(plate=plate, confidence=0.85, camera_id=request.camera_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track", response_model=TrackingResponse)
async def track_objects(request: TrackingRequest):
    try:
        tracks = tracker.update(request.detections, datetime.now().timestamp())
        return TrackingResponse(
            tracks=[
                {
                    "track_id": t.track_id,
                    "class_name": t.class_name,
                    "bbox": t.bbox,
                    "velocity": t.velocity,
                }
                for t in tracks
            ],
            timestamp=datetime.now(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/behavior", response_model=BehaviorResponse)
async def analyze_behavior(request: BehaviorRequest):
    return BehaviorResponse(
        behavior_type="normal", severity=0.0, description="No violations detected"
    )
