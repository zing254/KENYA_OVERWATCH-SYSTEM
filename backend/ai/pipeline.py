"""
Kenya Overwatch AI Pipeline
Real-time video analysis, object detection, and anomaly detection
"""

import asyncio
import base64
import hashlib
import io
import json
import logging
import os
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Tuple

import cv2
import numpy as np

# PyTorch 2.6+ compatibility fix
import torch
_original_torch_load = torch.load
def _patched_torch_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)
torch.load = _patched_torch_load

from ..enums import AlertSeverity, DetectionType

logger = logging.getLogger(__name__)


@dataclass
class BoundingBox:
    """Bounding box for detected objects"""
    x: int
    y: int
    w: int
    h: int
    
    @property
    def area(self) -> int:
        return self.w * self.h
    
    @property
    def center(self) -> Tuple[int, int]:
        return (self.x + self.w // 2, self.y + self.h // 2)
    
    @property
    def to_dict(self) -> Dict:
        return {"x": self.x, "y": self.y, "w": self.w, "h": self.h}
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'BoundingBox':
        return cls(x=data["x"], y=data["y"], w=data["w"], h=data["h"])


@dataclass
class Detection:
    """AI detection result"""
    detection_type: DetectionType
    confidence: float
    bounding_box: BoundingBox
    timestamp: datetime
    camera_id: str
    attributes: Dict[str, Any] = field(default_factory=dict)
    track_id: Optional[int] = None
    embedding: Optional[np.ndarray] = None
    
    def to_dict(self) -> Dict:
        return {
            "type": self.detection_type.value,
            "confidence": self.confidence,
            "bounding_box": self.bounding_box.to_dict,
            "timestamp": self.timestamp.isoformat(),
            "camera_id": self.camera_id,
            "attributes": self.attributes,
            "track_id": self.track_id,
        }
    
    def get_frame_hash(self) -> str:
        """Generate hash for evidence chain of custody"""
        data = f"{self.camera_id}:{self.timestamp.isoformat()}:{self.detection_type.value}:{self.confidence}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]


@dataclass 
class AIFrameAnalysis:
    """Complete frame analysis result"""
    frame_id: str
    camera_id: str
    timestamp: datetime
    width: int
    height: int
    detections: List[Detection] = field(default_factory=list)
    frame_hash: str = ""
    processing_time_ms: float = 0.0
    ai_model_version: str = "2.0.0"
    
    def __post_init__(self):
        if not self.frame_hash:
            self.frame_hash = self._compute_hash()
    
    def _compute_hash(self) -> str:
        data = f"{self.camera_id}:{self.timestamp.isoformat()}:{len(self.detections)}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def to_dict(self) -> Dict:
        return {
            "frame_id": self.frame_id,
            "camera_id": self.camera_id,
            "timestamp": self.timestamp.isoformat(),
            "width": self.width,
            "height": self.height,
            "detections": [d.to_dict() for d in self.detections],
            "frame_hash": self.frame_hash,
            "processing_time_ms": self.processing_time_ms,
            "ai_model_version": self.ai_model_version,
        }


class ObjectTracker:
    """Multi-object tracker using simple centroid tracking"""
    
    def __init__(self, max_disappeared: int = 30, max_distance: int = 50):
        self.next_track_id = 0
        self.tracks: Dict[int, Dict] = {}
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance
    
    def register(self, centroid: Tuple[int, int]) -> int:
        """Register new track"""
        self.tracks[self.next_track_id] = {
            "centroids": deque([centroid]),
            "disappeared": 0,
            "detection_type": None,
            "confidences": deque([], maxlen=10),
        }
        track_id = self.next_track_id
        self.next_track_id += 1
        return track_id
    
    def deregister(self, track_id: int):
        """Remove track"""
        if track_id in self.tracks:
            del self.tracks[track_id]
    
    def update(self, bounding_boxes: List[Tuple[BoundingBox, DetectionType, float]]) -> Dict[int, Tuple[BoundingBox, DetectionType, float, int]]:
        """Update tracks with new detections"""
        if not bounding_boxes:
            for track_id in list(self.tracks.keys()):
                self.tracks[track_id]["disappeared"] += 1
                if self.tracks[track_id]["disappeared"] > self.max_disappeared:
                    self.deregister(track_id)
            return {}
        
        input_centroids = [bbox.center for bbox, _, _ in bounding_boxes]
        
        if len(self.tracks) == 0:
            track_mapping = {}
            for bbox, det_type, conf in bounding_boxes:
                track_id = self.register(bbox.center)
                track_mapping[track_id] = (bbox, det_type, conf, track_id)
                self.tracks[track_id]["detection_type"] = det_type
                self.tracks[track_id]["confidences"].append(conf)
            return track_mapping
        
        track_ids = list(self.tracks.keys())
        track_centroids = [self.tracks[tid]["centroids"][-1] for tid in track_ids]
        
        D = np.linalg.norm(np.asarray(track_centroids)[:, np.newaxis] - np.asarray(input_centroids), axis=2)
        
        rows = D.min(axis=1).argsort()
        cols = D.argmin(axis=1)[rows]
        
        used_rows = set()
        used_cols = set()
        
        track_mapping = {}
        
        for row, col in zip(rows, cols):
            if row in used_rows or col in used_cols:
                continue
            
            track_id = track_ids[row]
            bbox, det_type, conf = bounding_boxes[col]
            
            self.tracks[track_id]["centroids"].append(bbox.center)
            self.tracks[track_id]["disappeared"] = 0
            self.tracks[track_id]["detection_type"] = det_type
            self.tracks[track_id]["confidences"].append(conf)
            
            if len(self.tracks[track_id]["centroids"]) > 100:
                self.tracks[track_id]["centroids"].popleft()
            
            track_mapping[track_id] = (bbox, det_type, conf, track_id)
            used_rows.add(row)
            used_cols.add(col)
        
        for row, col in zip(rows, cols):
            if row in used_rows or col in used_cols:
                continue
            
            track_id = track_ids[row]
            self.tracks[track_id]["disappeared"] += 1
            if self.tracks[track_id]["disappeared"] > self.max_disappeared:
                self.deregister(track_id)
                continue
            
            bbox, _, conf = bounding_boxes[col]
            track_mapping[track_id] = (bbox, self.tracks[track_id]["detection_type"], conf, track_id)
        
        for col in range(len(bounding_boxes)):
            if col not in used_cols:
                bbox, det_type, conf = bounding_boxes[col]
                track_id = self.register(bbox.center)
                self.tracks[track_id]["detection_type"] = det_type
                self.tracks[track_id]["confidences"].append(conf)
                track_mapping[track_id] = (bbox, det_type, conf, track_id)
        
        return track_mapping


class MotionDetector:
    """Detect motion in video frames"""
    
    def __init__(self, threshold: int = 25, min_area: int = 500):
        self.threshold = threshold
        self.min_area = min_area
        self.background_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        self.history: Dict[str, List[float]] = {}
    
    def detect_motion(self, frame: np.ndarray, camera_id: str) -> Tuple[bool, List[BoundingBox]]:
        """Detect motion regions in frame"""
        fg_mask = self.background_subtractor.apply(frame)
        
        _, thresh = cv2.threshold(fg_mask, self.threshold, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        thresh = cv2.erode(thresh, kernel, iterations=2)
        thresh = cv2.dilate(thresh, kernel, iterations=2)
        
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        motion_boxes = []
        for contour in contours:
            if cv2.contourArea(contour) < self.min_area:
                continue
            x, y, w, h = cv2.boundingRect(contour)
            motion_boxes.append(BoundingBox(x=x, y=y, w=w, h=h))
        
        motion_ratio = sum(b.area for b in motion_boxes) / (frame.shape[0] * frame.shape[1]) if motion_boxes else 0
        
        if camera_id not in self.history:
            self.history[camera_id] = []
        self.history[camera_id].append(motion_ratio)
        if len(self.history[camera_id]) > 100:
            self.history[camera_id].pop(0)
        
        is_motion = motion_ratio > 0.05
        
        return is_motion, motion_boxes
    
    def get_motion_history(self, camera_id: str) -> List[float]:
        """Get motion history for camera"""
        return self.history.get(camera_id, [])


class AnomalyDetector:
    """Detect anomalous behavior"""
    
    def __init__(self):
        self.baseline_stats: Dict[str, Dict] = {}
        self.detection_counts: Dict[str, int] = {}
        self.time_windows: Dict[str, deque] = {}
    
    def update_baseline(self, camera_id: str, detection_count: int, timestamp: datetime):
        """Update baseline statistics"""
        if camera_id not in self.time_windows:
            self.time_windows[camera_id] = deque(maxlen=300)
        
        self.time_windows[camera_id].append({
            "count": detection_count,
            "timestamp": timestamp
        })
        
        counts = [d["count"] for d in self.time_windows[camera_id]]
        if len(counts) >= 10:
            self.baseline_stats[camera_id] = {
                "mean": np.mean(counts),
                "std": np.std(counts),
                "threshold_high": np.mean(counts) + 3 * np.std(counts),
                "threshold_low": max(0, np.mean(counts) - 3 * np.std(counts)),
            }
    
    def detect_anomaly(self, camera_id: str, detection_count: int) -> Tuple[bool, str]:
        """Detect if current detection count is anomalous"""
        if camera_id not in self.baseline_stats:
            return False, ""
        
        stats = self.baseline_stats[camera_id]
        
        if detection_count > stats["threshold_high"]:
            return True, f"Unusually high activity: {detection_count} vs baseline {stats['mean']:.1f}"
        
        if detection_count < stats["threshold_low"]:
            return True, f"Unusually low activity: {detection_count} vs baseline {stats['mean']:.1f}"
        
        return False, ""
    
    def detect_loitering(self, detections: List[Detection], time_window_seconds: int = 60) -> bool:
        """Detect loitering behavior"""
        now = datetime.now()
        recent = [d for d in detections if (now - d.timestamp).total_seconds() < time_window_seconds]
        
        if len(recent) < 3:
            return False
        
        positions = [d.bounding_box.center for d in recent]
        if not positions:
            return False
        
        position_variance = np.var([p[0] for p in positions]) + np.var([p[1] for p in positions])
        
        return bool(position_variance < 1000)
    
    def detect_abandoned_object(self, detections: List[Detection], min_duration_seconds: int = 30) -> Optional[Detection]:
        """Detect abandoned objects"""
        now = datetime.now()
        
        static_objects = [
            d for d in detections
            if d.detection_type == DetectionType.SUSPICIOUS_OBJECT
            and (now - d.timestamp).total_seconds() > min_duration_seconds
        ]
        
        return static_objects[0] if static_objects else None


class HeatmapGenerator:
    """Generate heatmaps of activity"""
    
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.heatmaps: Dict[str, np.ndarray] = {}
    
    def add_detection(self, camera_id: str, detection: Detection):
        """Add detection to heatmap"""
        if camera_id not in self.heatmaps:
            self.heatmaps[camera_id] = np.zeros((self.height, self.width), dtype=np.float32)
        
        bbox = detection.bounding_box
        x1, y1 = max(0, bbox.x), max(0, bbox.y)
        x2, y2 = min(self.width, bbox.x + bbox.w), min(self.height, bbox.y + bbox.h)
        
        self.heatmaps[camera_id][y1:y2, x1:x2] += 1
    
    def get_heatmap(self, camera_id: str, normalize: bool = True) -> np.ndarray:
        """Get heatmap for camera"""
        if camera_id not in self.heatmaps:
            return np.zeros((self.height, self.width), dtype=np.uint8)
        
        heatmap = self.heatmaps[camera_id].copy()
        
        if normalize and heatmap.max() > 0:
            heatmap = (heatmap / heatmap.max() * 255).astype(np.uint8)
        
        return heatmap
    
    def apply_colormap(self, heatmap: np.ndarray) -> np.ndarray:
        """Apply colormap to heatmap"""
        return cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)


class AIPipeline:
    """Main AI Pipeline for real-time video analysis"""
    
    def __init__(self):
        self.detectors: Dict[str, DetectionType] = {
            "person": DetectionType.PERSON,
            "vehicle": DetectionType.VEHICLE,
            "license_plate": DetectionType.LICENSE_PLATE,
            "fire": DetectionType.FIRE,
            "smoke": DetectionType.SMOKE,
        }
        
        self.trackers: Dict[str, ObjectTracker] = {}
        self.motion_detector = MotionDetector()
        self.anomaly_detector = AnomalyDetector()
        self.heatmap_generator: Optional[HeatmapGenerator] = None
        
        self.confidence_threshold = 0.5
        self.enable_tracking = True
        self.enable_anomaly_detection = True
        
        self.stats = {
            "frames_processed": 0,
            "total_detections": 0,
            "avg_processing_time_ms": 0,
            "by_type": {dt.value: 0 for dt in DetectionType},
        }
        
        self.callbacks: List[Callable[[AIFrameAnalysis], None]] = []
    
    def register_callback(self, callback: Callable[[AIFrameAnalysis], None]):
        """Register callback for detection events"""
        self.callbacks.append(callback)
    
    def initialize_camera(self, camera_id: str, width: int = 640, height: int = 480):
        """Initialize tracking for a camera"""
        self.trackers[camera_id] = ObjectTracker()
        if self.heatmap_generator is None:
            self.heatmap_generator = HeatmapGenerator(width, height)
    
    def process_frame(self, frame: np.ndarray, camera_id: str) -> AIFrameAnalysis:
        """Process a single frame"""
        start_time = time.time()
        
        height, width = frame.shape[:2]
        
        if camera_id not in self.trackers:
            self.initialize_camera(camera_id, width, height)
        
        frame_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now()
        
        detections = self._run_detection(frame, camera_id)
        
        if self.enable_tracking:
            tracked = self._track_detections(detections, camera_id)
            detections = [d for d in detections if d.track_id is not None]
        
        self.motion_detector.detect_motion(frame, camera_id)
        
        if self.enable_anomaly_detection:
            self.anomaly_detector.update_baseline(camera_id, len(detections), timestamp)
            for detection in detections:
                is_anomaly, message = self.anomaly_detector.detect_anomaly(camera_id, 1)
                if is_anomaly:
                    detection.attributes["anomaly_warning"] = message
        
        if self.heatmap_generator:
            for detection in detections:
                self.heatmap_generator.add_detection(camera_id, detection)
        
        analysis = AIFrameAnalysis(
            frame_id=frame_id,
            camera_id=camera_id,
            timestamp=timestamp,
            width=width,
            height=height,
            detections=detections,
            processing_time_ms=(time.time() - start_time) * 1000,
        )
        
        self._update_stats(analysis)
        
        for callback in self.callbacks:
            try:
                callback(analysis)
            except Exception as e:
                logger.error(f"Callback error: {e}")
        
        return analysis
    
    def _run_detection(self, frame: np.ndarray, camera_id: str) -> List[Detection]:
        """Run detection on frame - simplified for demo"""
        detections = []
        
        h, w = frame.shape[:2]
        
        if np.random.random() < 0.3:
            x = int(np.random.randint(w * 0.2, w * 0.8))
            y = int(np.random.randint(h * 0.3, h * 0.7))
            detections.append(Detection(
                detection_type=DetectionType.PERSON,
                confidence=np.random.uniform(0.7, 0.95),
                bounding_box=BoundingBox(x=x, y=y, w=40, h=80),
                timestamp=datetime.now(),
                camera_id=camera_id,
            ))
        
        if np.random.random() < 0.2:
            x = int(np.random.randint(w * 0.1, w * 0.6))
            y = int(np.random.randint(h * 0.5, h * 0.8))
            detections.append(Detection(
                detection_type=DetectionType.VEHICLE,
                confidence=np.random.uniform(0.75, 0.95),
                bounding_box=BoundingBox(x=x, y=y, w=100, h=60),
                timestamp=datetime.now(),
                camera_id=camera_id,
            ))
        
        return detections
    
    def _track_detections(self, detections: List[Detection], camera_id: str) -> Dict[int, Detection]:
        """Track detections"""
        tracker = self.trackers[camera_id]
        
        bboxes = [(d.bounding_box, d.detection_type, d.confidence) for d in detections]
        track_mapping = tracker.update(bboxes)
        
        tracked = {}
        for track_id, (bbox, det_type, conf, _) in track_mapping.items():
            for d in detections:
                if d.bounding_box == bbox:
                    d.track_id = track_id
                    tracked[track_id] = d
                    break
        
        return tracked
    
    def _update_stats(self, analysis: AIFrameAnalysis):
        """Update pipeline statistics"""
        self.stats["frames_processed"] += 1
        self.stats["total_detections"] += len(analysis.detections)
        
        for detection in analysis.detections:
            dtype = detection.detection_type.value
            if dtype in self.stats["by_type"]:
                self.stats["by_type"][dtype] += 1
        
        total_time = self.stats["avg_processing_time_ms"] * (self.stats["frames_processed"] - 1)
        self.stats["avg_processing_time_ms"] = (total_time + analysis.processing_time_ms) / self.stats["frames_processed"]
    
    def get_stats(self) -> Dict:
        """Get pipeline statistics"""
        return {
            **self.stats,
            "active_cameras": len(self.trackers),
            "confidence_threshold": self.confidence_threshold,
            "tracking_enabled": self.enable_tracking,
            "anomaly_detection_enabled": self.enable_anomaly_detection,
        }
    
    def reset_stats(self):
        """Reset statistics"""
        self.stats = {
            "frames_processed": 0,
            "total_detections": 0,
            "avg_processing_time_ms": 0,
            "by_type": {dt.value: 0 for dt in DetectionType},
        }


pipeline = AIPipeline()


class TrafficAnalyzer:
    """Analyze traffic patterns and detect incidents"""
    
    def __init__(self):
        self.vehicle_speeds: Dict[str, deque] = {}
        self.vehicle_positions: Dict[str, deque] = {}
        self.stopped_vehicles: Dict[str, datetime] = {}
        self.lane_violations: Dict[str, int] = {}
        self.speed_limits: Dict[str, float] = {}
        self.accident_heuristics: Dict[str, List] = {}
        
    def analyze_vehicle(
        self,
        track_id: int,
        vehicle_type: DetectionType,
        bounding_box: BoundingBox,
        camera_id: str,
        frame_timestamp: datetime,
        frame_width: int,
        frame_height: int
    ) -> Tuple[Optional[Detection], Dict]:
        """Analyze vehicle behavior and detect incidents"""
        track_key = f"{camera_id}_{track_id}"
        
        if track_key not in self.vehicle_positions:
            self.vehicle_positions[track_key] = deque(maxlen=30)
            self.vehicle_speeds[track_key] = deque(maxlen=10)
        
        positions = self.vehicle_positions[track_key]
        speeds = self.vehicle_speeds[track_key]
        
        center = bounding_box.center
        positions.append({
            "x": center[0],
            "y": center[1],
            "timestamp": frame_timestamp
        })
        
        if len(positions) >= 2:
            prev = positions[-2]
            curr = positions[-1]
            
            dx = curr["x"] - prev["x"]
            dy = curr["y"] - prev["y"]
            dt = (curr["timestamp"] - prev["timestamp"]).total_seconds()
            
            if dt > 0:
                pixel_speed = ((dx ** 2 + dy ** 2) ** 0.5) / dt
                real_speed = self._pixel_to_kmh(pixel_speed, frame_height)
                speeds.append(real_speed)
                
                result = {"speed_kmh": real_speed, "incidents": []}
                
                speed_limit = self.speed_limits.get(camera_id, 50.0)
                if real_speed > speed_limit * 1.1:
                    excess = real_speed - speed_limit
                    if excess > 20:
                        result["incidents"].append({
                            "type": DetectionType.SPEEDING,
                            "confidence": min(0.95, 0.5 + excess / 100),
                            "speed": real_speed,
                            "limit": speed_limit
                        })
                
                if len(speeds) >= 5:
                    avg_speed = sum(list(speeds)[-5:]) / 5
                    if avg_speed < 2 and track_key not in self.stopped_vehicles:
                        self.stopped_vehicles[track_key] = frame_timestamp
                    elif avg_speed >= 5 and track_key in self.stopped_vehicles:
                        stopped_duration = (frame_timestamp - self.stopped_vehicles[track_key]).total_seconds()
                        if stopped_duration > 30:
                            result["incidents"].append({
                                "type": DetectionType.STOPPED_VEHICLE,
                                "confidence": min(0.95, 0.3 + stopped_duration / 300),
                                "duration_seconds": stopped_duration
                            })
                        del self.stopped_vehicles[track_key]
                
                return None, result
        
        return None, {"speed_kmh": 0, "incidents": []}
    
    def _pixel_to_kmh(self, pixel_speed: float, frame_height: int) -> float:
        """Convert pixel speed to km/h (simplified estimation)"""
        pixels_per_meter = frame_height / 10
        mps = pixel_speed / pixels_per_meter
        return mps * 3.6
    
    def set_speed_limit(self, camera_id: str, limit: float):
        """Set speed limit for a camera location"""
        self.speed_limits[camera_id] = limit
    
    def check_accident_heuristic(
        self,
        camera_id: str,
        detections: List[Detection],
        frame_width: int = 1920,
        frame_height: int = 1080
    ) -> Optional[Detection]:
        """Check for accident conditions"""
        now = datetime.now()
        
        stopped_count = 0
        pedestrian_nearby = False
        
        for d in detections:
            if d.detection_type == DetectionType.VEHICLE:
                track_key = f"{camera_id}_{d.track_id}"
                if track_key in self.stopped_vehicles:
                    stopped_duration = (now - self.stopped_vehicles[track_key]).total_seconds()
                    if stopped_duration > 10:
                        stopped_count += 1
            elif d.detection_type == DetectionType.PERSON:
                pedestrian_nearby = True
        
        if stopped_count >= 2 and pedestrian_nearby:
            return Detection(
                detection_type=DetectionType.ACCIDENT,
                confidence=0.85,
                bounding_box=BoundingBox(x=0, y=0, w=frame_width, h=frame_height),
                timestamp=now,
                camera_id=camera_id,
                attributes={"vehicles_involved": stopped_count, "pedestrians": True}
            )
        
        return None
    
    def detect_hazard(
        self,
        detections: List[Detection],
        stationary_seconds: int = 10
    ) -> List[Detection]:
        """Detect road hazards"""
        hazards = []
        now = datetime.now()
        
        for d in detections:
            if d.detection_type in [DetectionType.SUSPICIOUS_OBJECT, DetectionType.ANIMAL]:
                if (now - d.timestamp).total_seconds() > stationary_seconds:
                    hazard_type = DetectionType.HAZARD
                    if d.detection_type == DetectionType.ANIMAL:
                        hazard_type = DetectionType.HAZARD
                    hazards.append(Detection(
                        detection_type=hazard_type,
                        confidence=d.confidence,
                        bounding_box=d.bounding_box,
                        timestamp=d.timestamp,
                        camera_id=d.camera_id,
                        attributes={"source_detection": d.detection_type.value}
                    ))
        
        return hazards


traffic_analyzer = TrafficAnalyzer()
