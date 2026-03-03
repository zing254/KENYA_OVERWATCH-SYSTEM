from typing import List, Optional, Tuple
import numpy as np
import cv2


class ANPRCamera:
    def __init__(self, camera_id: str, location: str = ""):
        self.camera_id = camera_id
        self.location = location
        self.is_active = False
        self.frame_count = 0

    def process_frame(self, frame: np.ndarray) -> dict:
        self.frame_count += 1
        return {
            "camera_id": self.camera_id,
            "frame_number": self.frame_count,
            "timestamp": self.frame_count * 0.033,
            "frame": frame
        }

    def detect_plate_region(self, frame: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        h, w = frame.shape[:2]
        
        height_scale = np.random.uniform(0.1, 0.4)
        width_scale = np.random.uniform(0.3, 0.7)
        
        y1 = int(h * height_scale)
        y2 = int(h * (height_scale + 0.15))
        x1 = int(w * (0.5 - width_scale / 2))
        x2 = int(w * (0.5 + width_scale / 2))
        
        if np.random.random() > 0.3:
            return (x1, y1, x2, y2)
        return None

    def enhance_plate_region(self, plate_region: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(plate_region, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
