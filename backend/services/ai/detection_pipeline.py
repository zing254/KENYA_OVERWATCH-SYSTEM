"""
AI Detection Pipeline
YOLOv8-based real-time object detection and behavior analysis
"""

import asyncio
import logging
import os
import time
from typing import Dict, List, Optional, Tuple, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import numpy as np

# PyTorch 2.6+ compatibility fix
import torch
_original_torch_load = torch.load
def _patched_torch_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)
torch.load = _patched_torch_load

logger = logging.getLogger(__name__)

# Try to import YOLOv8
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    logger.warning("Ultralytics YOLO not available - using mock detection")
    YOLO_AVAILABLE = False


class DetectionClass(str, Enum):
    CAR = "car"
    TRUCK = "truck"
    BUS = "bus"
    MOTORCYCLE = "motorcycle"
    BICYCLE = "bicycle"
    PEDESTRIAN = "pedestrian"
    POTHOLE = "pothole"
    DEBRIS = "debris"
    FIRE = "fire"


@dataclass
class BoundingBox:
    x1: float
    y1: float
    x2: float
    y2: float
    
    @property
    def center(self) -> Tuple[float, float]:
        return ((self.x1 + self.x2) / 2, (self.y1 + self.y2) / 2)
    
    @property
    def width(self) -> float:
        return self.x2 - self.x1
    
    @property
    def height(self) -> float:
        return self.y2 - self.y1
    
    @property
    def area(self) -> float:
        return self.width * self.height


@dataclass
class Detection:
    class_name: str
    confidence: float
    bbox: BoundingBox
    track_id: Optional[int] = None


@dataclass
class DetectionResult:
    camera_id: str
    frame_number: int
    timestamp: datetime
    detections: List[Detection]
    processing_time_ms: float


@dataclass
class BehaviorAnalysis:
    speeds: Dict[int, float] = field(default_factory=dict)  # track_id -> speed km/h
    lane_violations: List[int] = field(default_factory=list)  # track_ids
    stopped_vehicles: List[int] = field(default_factory=list)  # track_ids
    dangerous_overtaking: List[int] = field(default_factory=list)  # track_ids


class ObjectTracker:
    """Simple object tracker using Kalman filter-like logic"""
    
    def __init__(self, max_age: int = 30, min_hits: int = 3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.next_id = 1
        self.tracks: Dict[int, Dict] = {}
    
    def update(self, detections: List[Detection]) -> List[Detection]:
        """Update tracks with new detections"""
        if not self.tracks:
            # First frame - create new tracks
            for det in detections:
                det.track_id = self.next_id
                self.tracks[self.next_id] = {
                    'detections': [det],
                    'last_seen': time.time(),
                    'age': 0,
                    'position_history': [det.bbox.center]
                }
                self.next_id += 1
            return detections
        
        # Simple IoU-based matching
        matched_detections = []
        
        for det in detections:
            best_match_id = None
            best_iou = 0.5  # Threshold
            
            for track_id, track in self.tracks.items():
                last_bbox = track['detections'][-1].bbox
                iou = self._compute_iou(det.bbox, last_bbox)
                
                if iou > best_iou:
                    best_iou = iou
                    best_match_id = track_id
            
            if best_match_id is not None:
                det.track_id = best_match_id
                self.tracks[best_match_id]['detections'].append(det)
                self.tracks[best_match_id]['last_seen'] = time.time()
                self.tracks[best_match_id]['age'] += 1
                self.tracks[best_match_id]['position_history'].append(det.bbox.center)
                
                # Keep only recent history
                if len(self.tracks[best_match_id]['position_history']) > 30:
                    self.tracks[best_match_id]['position_history'] = \
                        self.tracks[best_match_id]['position_history'][-30:]
            else:
                # New track
                det.track_id = self.next_id
                self.tracks[self.next_id] = {
                    'detections': [det],
                    'last_seen': time.time(),
                    'age': 0,
                    'position_history': [det.bbox.center]
                }
                self.next_id += 1
            
            matched_detections.append(det)
        
        # Remove old tracks
        current_time = time.time()
        to_remove = []
        for track_id, track in self.tracks.items():
            if current_time - track['last_seen'] > self.max_age:
                to_remove.append(track_id)
        
        for track_id in to_remove:
            del self.tracks[track_id]
        
        return matched_detections
    
    def _compute_iou(self, bbox1: BoundingBox, bbox2: BoundingBox) -> float:
        """Compute Intersection over Union"""
        x1 = max(bbox1.x1, bbox2.x1)
        y1 = max(bbox1.y1, bbox2.y1)
        x2 = min(bbox1.x2, bbox2.x2)
        y2 = min(bbox1.y2, bbox2.y2)
        
        if x2 < x1 or y2 < y1:
            return 0.0
        
        intersection = (x2 - x1) * (y2 - y1)
        area1 = bbox1.area
        area2 = bbox2.area
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def get_track(self, track_id: int) -> Optional[Dict]:
        """Get track by ID"""
        return self.tracks.get(track_id)


class AIDetectionPipeline:
    """AI Detection Pipeline for road safety"""
    
    def __init__(self):
        self.model = None
        self.tracker = ObjectTracker()
        self.camera_configs: Dict[str, Dict] = {}
        self.frame_callback: Optional[Callable] = None
        
        # Load model if available
        if YOLO_AVAILABLE:
            self._load_model()
        
        # Detection classes we care about
        self.vehicle_classes = {'car', 'truck', 'bus', 'motorcycle'}
        self.person_classes = {'person'}
    
    def _load_model(self):
        """Load YOLOv8 model"""
        try:
            model_path = os.environ.get('YOLO_MODEL_PATH', '/app/models/yolo/yolov8n.pt')
            if os.path.exists(model_path):
                self.model = YOLO(model_path)
                logger.info(f"Loaded YOLO model from {model_path}")
            else:
                logger.warning(f"YOLO model not found at {model_path}, using mock")
                self.model = None
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None
    
    def register_camera(self, camera_id: str, config: Dict):
        """Register camera with its configuration"""
        self.camera_configs[camera_id] = {
            'speed_limit': config.get('speed_limit', 50),  # km/h
            'road_name': config.get('road_name', ''),
            'county': config.get('county', ''),
            'location': config.get('location', {}),
            'pixel_to_meter_ratio': config.get('pixel_to_meter_ratio', 0.01),
            'fps': config.get('fps', 5)
        }
    
    async def process_frame(self, camera_id: str, frame: np.ndarray, 
                           frame_number: int) -> DetectionResult:
        """Process a single frame"""
        start_time = time.time()
        
        detections = []
        
        if self.model is not None:
            # Run YOLO inference
            try:
                results = self.model(frame, verbose=False, conf=0.25)
                
                for result in results:
                    boxes = result.boxes
                    if boxes is None:
                        continue
                    
                    for box in boxes:
                        # Get class name
                        class_id = int(box.cls[0])
                        class_name = result.names[class_id]
                        
                        # Only process relevant classes
                        if class_name not in self.vehicle_classes and \
                           class_name not in self.person_classes:
                            continue
                        
                        # Get bounding box
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0])
                        
                        detection = Detection(
                            class_name=class_name,
                            confidence=confidence,
                            bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)
                        )
                        detections.append(detection)
                        
            except Exception as e:
                logger.error(f"YOLO inference error: {e}")
        else:
            # Mock detection for testing
            detections = self._mock_detection(frame.shape)
        
        # Update tracker
        detections = self.tracker.update(detections)
        
        # Behavior analysis
        behavior = self._analyze_behavior(camera_id, detections)
        
        processing_time = (time.time() - start_time) * 1000
        
        result = DetectionResult(
            camera_id=camera_id,
            frame_number=frame_number,
            timestamp=datetime.now(timezone.utc),
            detections=detections,
            processing_time_ms=processing_time
        )
        
        return result
    
    def _mock_detection(self, frame_shape: Tuple) -> List[Detection]:
        """Generate mock detections for testing"""
        height, width = frame_shape[:2]
        
        # Random vehicle detection
        detections = []
        
        # Add 1-3 vehicles
        import random
        for i in range(random.randint(1, 3)):
            x1 = random.randint(0, width - 200)
            y1 = random.randint(height // 2, height - 100)
            x2 = x1 + random.randint(100, 200)
            y2 = y1 + random.randint(50, 100)
            
            detections.append(Detection(
                class_name=random.choice(['car', 'truck', 'bus']),
                confidence=random.uniform(0.7, 0.95),
                bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)
            ))
        
        return detections
    
    def _analyze_behavior(self, camera_id: str, 
                         detections: List[Detection]) -> BehaviorAnalysis:
        """Analyze detected objects for behavior"""
        behavior = BehaviorAnalysis()
        
        config = self.camera_configs.get(camera_id, {})
        fps = config.get('fps', 5)
        px_to_m = config.get('pixel_to_meter_ratio', 0.01)
        
        for det in detections:
            if det.track_id is None:
                continue
            
            track = self.tracker.get_track(det.track_id)
            if not track:
                continue
            
            # Get position history
            history = track.get('position_history', [])
            if len(history) < 2:
                continue
            
            # Calculate speed
            if len(history) >= fps:
                # Calculate displacement over last second
                pos_current = history[-1]
                pos_prev = history[-fps]
                
                pixel_distance = np.sqrt(
                    (pos_current[0] - pos_prev[0])**2 + 
                    (pos_current[1] - pos_prev[1])**2
                )
                
                # Convert to km/h
                meters_per_second = pixel_distance * px_to_m * fps
                speed_kmh = meters_per_second * 3.6
                
                behavior.speeds[det.track_id] = speed_kmh
                
                # Check for stopped vehicle
                if speed_kmh < 2:  # Less than 2 km/h
                    if track.get('stopped_frames', 0) > 30:  # ~6 seconds
                        behavior.stopped_vehicles.append(det.track_id)
                    track['stopped_frames'] = track.get('stopped_frames', 0) + 1
                else:
                    track['stopped_frames'] = 0
                
                # Check for speeding
                speed_limit = config.get('speed_limit', 50)
                if speed_kmh > speed_limit * 1.1:  # 10% over limit
                    pass  # Would trigger speeding alert
        
        return behavior
    
    def detect_accident(self, camera_id: str, behavior: BehaviorAnalysis,
                       all_detections: List[Detection]) -> bool:
        """Detect potential accident based"""
        # Heuristic 1: Two or more stopped vehicles with pedestrians nearby
        stopped_vehicles = getattr(behavior, 'stopped_vehicles', 0)
        pedestrians = sum(1 for d in all_detections 
                         if d.class_name == 'pedestrian')
        
        if stopped_vehicles >= 2 and pedestrians >= 1:
            return True
        
        # Heuristic 2: Single vehicle with abnormal orientation
        # (would require orientation analysis)
        
        return False


# Global instance
ai_pipeline = AIDetectionPipeline()
