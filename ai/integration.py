#!/usr/bin/env python3
"""
Kenya Overwatch AI Integration Module
Integrates vehicle detection and license plate recognition with the backend
"""

import os
import sys
import json
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional
import pickle
import logging
from datetime import datetime
import base64
import hashlib

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path("/home/zingri/Desktop/HACKATHON/kenya-overwatch-production")
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = DATA_DIR / "models"


class KenyaOverwatchAI:
    """Main AI integration class for Kenya Overwatch"""
    
    def __init__(self):
        self.vehicle_classifier = None
        self.vehicle_detector = None
        self.plate_detector = None
        self.model_config = None
        
        # Initialize components
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize all AI models"""
        logger.info("Initializing Kenya Overwatch AI models...")
        
        # Load model configuration
        config_path = MODELS_DIR / "model_config.json"
        if config_path.exists():
            with open(config_path, 'r') as f:
                self.model_config = json.load(f)
            logger.info(f"Loaded model config: {self.model_config}")
        
        # Initialize vehicle classifier if available
        classifier_path = MODELS_DIR / "vehicle_classifier.pkl"
        if classifier_path.exists():
            try:
                with open(classifier_path, 'rb') as f:
                    data = pickle.load(f)
                    self.vehicle_classifier = data
                logger.info("Loaded vehicle classifier")
            except Exception as e:
                logger.warning(f"Could not load vehicle classifier: {e}")
        
        # Initialize detectors
        self._init_detectors()
        
        logger.info("AI models initialized successfully")
    
    def _init_detectors(self):
        """Initialize OpenCV-based detectors"""
        
        # Vehicle detector using background subtraction
        self.vehicle_detector = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        
        # License plate detector parameters
        self.plate_min_area = 500
        self.plate_max_area = 50000
    
    def detect_vehicles(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect vehicles in a frame"""
        if frame is None or frame.size == 0:
            return []
        
        result = []
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (640, 480))
        
        # Apply background subtraction
        fg_mask = self.vehicle_detector.apply(gray)
        
        # Clean up the mask
        _, thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Scale factors
        scale_x = frame.shape[1] / 640
        scale_y = frame.shape[0] / 480
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 1500:  # Minimum vehicle size
                x, y, w, h = cv2.boundingRect(contour)
                
                # Scale to original size
                x = int(x * scale_x)
                y = int(y * scale_y)
                w = int(w * scale_x)
                h = int(h * scale_y)
                
                # Extract vehicle region for classification
                vehicle_img = frame[y:y+h, x:x+w]
                
                vehicle_type = "vehicle"
                confidence = 0.5
                
                # Try to classify if classifier available
                if self.vehicle_classifier is not None:
                    try:
                        vehicle_type, confidence = self._classify_vehicle(vehicle_img)
                    except Exception as e:
                        logger.debug(f"Classification failed: {e}")
                
                result.append({
                    'type': vehicle_type,
                    'bbox': [x, y, x + w, y + h],
                    'confidence': confidence,
                    'timestamp': datetime.now().isoformat()
                })
        
        return result
    
    def _classify_vehicle(self, vehicle_img: np.ndarray) -> tuple:
        """Classify vehicle type"""
        if vehicle_img is None or vehicle_img.size == 0:
            return "unknown", 0.0
        
        try:
            # Resize for classifier
            img = cv2.resize(vehicle_img, (64, 64))
            
            # Extract features (simplified)
            features = self._extract_features(img).reshape(1, -1)
            
            # Predict (if model is properly loaded)
            if hasattr(self.vehicle_classifier, 'predict'):
                pred = self.vehicle_classifier.predict(features)[0]
                classes = self.vehicle_classifier.get('classes', ['car', 'truck', 'bus', 'motorcycle'])
                return classes[pred] if pred < len(classes) else "vehicle"
            
            return "vehicle", 0.5
        except Exception as e:
            logger.debug(f"Vehicle classification error: {e}")
            return "vehicle", 0.5
    
    def _extract_features(self, image: np.ndarray) -> np.ndarray:
        """Extract features from image for classification"""
        # Simplified feature extraction
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (64, 64))
        
        # Flatten and normalize
        features = gray.flatten().astype(np.float32) / 255.0
        
        return features
    
    def detect_license_plates(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect license plates in a frame"""
        if frame is None or frame.size == 0:
            return []
        
        result = []
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        edges = cv2.dilate(edges, kernel, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if self.plate_min_area < area < self.plate_max_area:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / float(h)
                
                # License plates typically have aspect ratio between 2:1 and 5:1
                if 1.5 < aspect_ratio < 5.0:
                    # Extract plate region
                    plate_img = frame[y:y+h, x:x+w]
                    
                    # Encode as base64
                    _, buffer = cv2.imencode('.jpg', plate_img)
                    plate_b64 = base64.b64encode(buffer).decode()
                    
                    result.append({
                        'bbox': [int(x), int(y), int(x + w), int(y + h)],
                        'confidence': min(area / 10000, 1.0),
                        'aspect_ratio': aspect_ratio,
                        'image_base64': plate_b64,
                        'timestamp': datetime.now().isoformat()
                    })
        
        return result
    
    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """Process a frame and return all detection results"""
        timestamp = datetime.now().isoformat()
        
        # Detect vehicles
        vehicles = self.detect_vehicles(frame)
        
        # Detect license plates
        plates = self.detect_license_plates(frame)
        
        # Calculate overall risk score (simplified)
        risk_score = 0.0
        if vehicles:
            high_conf_vehicles = [v for v in vehicles if v['confidence'] > 0.7]
            risk_score = min(len(high_conf_vehicles) * 0.2, 1.0)
        
        if plates:
            risk_score = min(risk_score + 0.3, 1.0)
        
        return {
            'timestamp': timestamp,
            'vehicles': vehicles,
            'license_plates': plates,
            'risk_score': risk_score,
            'risk_level': self._get_risk_level(risk_score),
            'model_version': '1.0.0',
            'total_detections': len(vehicles) + len(plates),
            'frame_hash': self.compute_frame_hash(frame)
        }
    
    def _get_risk_level(self, score: float) -> str:
        """Convert risk score to risk level"""
        if score < 0.25:
            return "low"
        elif score < 0.5:
            return "medium"
        elif score < 0.75:
            return "high"
        else:
            return "critical"
    
    def compute_frame_hash(self, frame: np.ndarray) -> str:
        """Compute hash of frame for evidence integrity"""
        # Resize for consistent hashing
        small = cv2.resize(frame, (128, 128))
        
        # Convert to bytes
        _, buffer = cv2.imencode('.jpg', small)
        frame_bytes = buffer.tobytes()
        
        # Compute SHA-256 hash
        return hashlib.sha256(frame_bytes).hexdigest()


# Global AI instance
_ai_instance = None

def get_ai_instance() -> KenyaOverwatchAI:
    """Get or create the global AI instance"""
    global _ai_instance
    if _ai_instance is None:
        _ai_instance = KenyaOverwatchAI()
    return _ai_instance


def process_image_data(image_data: bytes) -> Dict[str, Any]:
    """Process raw image data and return results"""
    # Decode image
    nparr = np.frombuffer(image_data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return {'error': 'Failed to decode image'}
    
    # Get AI instance
    ai = get_ai_instance()
    
    # Process frame
    result = ai.process_frame(frame)
    
    # Add frame hash for evidence integrity
    result['frame_hash'] = ai.compute_frame_hash(frame)
    
    return result


def main():
    """Test the AI module"""
    print("=" * 60)
    print("Kenya Overwatch AI Module Test")
    print("=" * 60)
    
    # Initialize AI
    ai = get_ai_instance()
    
    # Test with sample images
    sample_dir = DATA_DIR / "training" / "samples"
    
    if sample_dir.exists():
        print("\nTesting with sample images...")
        
        test_images = list(sample_dir.glob("**/*.jpg"))[:5]
        
        for img_path in test_images:
            print(f"\nProcessing: {img_path.name}")
            
            img = cv2.imread(str(img_path))
            result = ai.process_frame(img)
            
            print(f"  Vehicles: {len(result['vehicles'])}")
            print(f"  Plates: {len(result['license_plates'])}")
            print(f"  Risk Score: {result['risk_score']:.2f}")
            print(f"  Risk Level: {result['risk_level']}")
            print(f"  Frame Hash: {result['frame_hash'][:16]}...")
    
    print("\n" + "=" * 60)
    print("AI Module Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
