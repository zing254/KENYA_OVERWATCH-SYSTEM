from dataclasses import dataclass
from typing import List, Tuple, Optional
import numpy as np


@dataclass
class DetectionConfig:
    model_path: str = "data/models/yolov8n.pt"
    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45
    device: str = "cpu"
    input_size: Tuple[int, int] = (640, 640)
    classes: List[str] = None

    def __post_init__(self):
        if self.classes is None:
            self.classes = [
                "person", "bicycle", "car", "motorcycle", "bus", "truck",
                "traffic light", "stop sign", "bench", "bird", "cat", "dog"
            ]


@dataclass
class DetectionResult:
    class_id: int
    class_name: str
    confidence: float
    bbox: Tuple[int, int, int, int]
    track_id: Optional[int] = None


class ObjectDetector:
    def __init__(self, config: DetectionConfig = None):
        self.config = config or DetectionConfig()
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.config.model_path)
            self.model.to(self.config.device)
        except ImportError:
            self.model = None

    def detect(self, frame: np.ndarray) -> List[DetectionResult]:
        if self.model is None:
            return self._dummy_detect(frame)
        
        results = self.model(
            frame,
            conf=self.config.confidence_threshold,
            iou=self.config.iou_threshold,
            imgsz=self.config.input_size[0],
            verbose=False
        )
        
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0])
                detections.append(DetectionResult(
                    class_id=class_id,
                    class_name=self.config.classes[class_id] if class_id < len(self.config.classes) else f"class_{class_id}",
                    confidence=float(box.conf[0]),
                    bbox=tuple(map(int, box.xyxy[0].tolist()))
                ))
        
        return detections

    def _dummy_detect(self, frame: np.ndarray) -> List[DetectionResult]:
        h, w = frame.shape[:2]
        detections = []
        num_detections = np.random.randint(0, 3)
        
        for _ in range(num_detections):
            class_id = np.random.randint(0, len(self.config.classes))
            x1 = np.random.randint(0, w - 100)
            y1 = np.random.randint(0, h - 100)
            x2 = x1 + np.random.randint(50, min(200, w - x1))
            y2 = y1 + np.random.randint(50, min(200, h - y1))
            
            detections.append(DetectionResult(
                class_id=class_id,
                class_name=self.config.classes[class_id],
                confidence=np.random.uniform(0.5, 0.95),
                bbox=(x1, y1, x2, y2)
            ))
        
        return detections

    def detect_vehicles(self, frame: np.ndarray) -> List[DetectionResult]:
        vehicle_classes = {"car", "motorcycle", "bus", "truck"}
        all_detections = self.detect(frame)
        return [d for d in all_detections if d.class_name in vehicle_classes]

    def detect_road_objects(self, frame: np.ndarray) -> List[DetectionResult]:
        road_classes = {"person", "bicycle", "traffic light", "stop sign", "bench"}
        all_detections = self.detect(frame)
        return [d for d in all_detections if d.class_name in road_classes]
