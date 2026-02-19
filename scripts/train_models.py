#!/usr/bin/env python3
"""
Kenya Overwatch AI Model Training Pipeline
Using OpenCV and scikit-learn for vehicle detection and classification
"""

import os
import sys
import json
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging
from datetime import datetime
import pickle
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path("/home/zingri/Desktop/HACKATHON/kenya-overwatch-production")
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = DATA_DIR / "models"
TRAINING_DIR = DATA_DIR / "training"

# Ensure directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def extract_hog_features(image: np.ndarray, cell_size=(16, 16), block_size=(2, 2)) -> np.ndarray:
    """Extract HOG-like features from image"""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    # Resize to fixed size
    gray = cv2.resize(gray, (64, 64))
    
    # Compute gradients
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=1)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=1)
    
    # Compute magnitude and angle
    magnitude = np.sqrt(gx**2 + gy**2)
    angle = np.arctan2(gy, gx) * 180 / np.pi
    angle[angle < 0] += 180
    
    # Compute histogram in cells
    h, w = gray.shape
    n_cells_y = h // cell_size[0]
    n_cells_x = w // cell_size[1]
    
    features = []
    for i in range(n_cells_y):
        for j in range(n_cells_x):
            y1 = i * cell_size[0]
            y2 = (i + 1) * cell_size[0]
            x1 = j * cell_size[1]
            x2 = (j + 1) * cell_size[1]
            
            cell_mag = magnitude[y1:y2, x1:x2]
            cell_ang = angle[y1:y2, x1:x2]
            
            hist, _ = np.histogram(cell_ang.flatten(), bins=9, range=(0, 180), weights=cell_mag.flatten())
            features.extend(hist)
    
    return np.array(features)


def extract_color_histogram(image: np.ndarray, bins: int = 32) -> np.ndarray:
    """Extract color histogram features"""
    features = []
    
    # BGR histogram
    for i in range(3):
        hist = cv2.calcHist([image], [i], None, [bins], [0, 256])
        features.extend(hist.flatten())
    
    # HSV histogram
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    for i in range(3):
        hist = cv2.calcHist([hsv], [i], None, [bins], [0, 256])
        features.extend(hist.flatten())
    
    return np.array(features) / (image.shape[0] * image.shape[1])


def extract_lbp_features(image: np.ndarray) -> np.ndarray:
    """Extract Local Binary Pattern features (simplified)"""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    gray = cv2.resize(gray, (64, 64))
    
    # Simple LBP-like computation
    features = []
    for i in range(1, gray.shape[0] - 1):
        for j in range(1, gray.shape[1] - 1):
            center = gray[i, j]
            binary_val = 0
            binary_val |= (gray[i-1, j-1] > center) << 7
            binary_val |= (gray[i-1, j] > center) << 6
            binary_val |= (gray[i-1, j+1] > center) << 5
            binary_val |= (gray[i, j+1] > center) << 4
            binary_val |= (gray[i+1, j+1] > center) << 3
            binary_val |= (gray[i+1, j] > center) << 2
            binary_val |= (gray[i+1, j-1] > center) << 1
            binary_val |= (gray[i, j-1] > center) << 0
            features.append(binary_val)
    
    # Create histogram
    hist, _ = np.histogram(features, bins=64, range=(0, 256))
    return hist / (len(features) + 1e-6)


class VehicleClassifier:
    """Vehicle type classifier using traditional ML"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.classes = ['car', 'truck', 'bus', 'motorcycle']
        
    def extract_features(self, image: np.ndarray) -> np.ndarray:
        """Extract all features from an image"""
        if image is None or image.size == 0:
            return np.zeros(256)
        
        # Resize image
        image = cv2.resize(image, (64, 64))
        
        # Extract different features
        hog = extract_hog_features(image)
        color = extract_color_histogram(image)
        lbp = extract_lbp_features(image)
        
        # Combine all features
        features = np.concatenate([hog, color, lbp])
        
        return features
    
    def load_training_data(self, data_dir: Path) -> Tuple[np.ndarray, np.ndarray]:
        """Load training data from directory"""
        X = []
        y = []
        
        for class_idx, class_name in enumerate(self.classes):
            class_dir = data_dir / class_name
            
            if not class_dir.exists():
                continue
            
            for img_path in class_dir.glob("*.jpg"):
                img = cv2.imread(str(img_path))
                if img is not None:
                    features = self.extract_features(img)
                    X.append(features)
                    y.append(class_idx)
            
            for img_path in class_dir.glob("*.png"):
                img = cv2.imread(str(img_path))
                if img is not None:
                    features = self.extract_features(img)
                    X.append(features)
                    y.append(class_idx)
        
        return np.array(X), np.array(y)
    
    def train(self, data_dir: Path):
        """Train the classifier"""
        logger.info("Loading training data...")
        X, y = self.load_training_data(data_dir)
        
        if len(X) == 0:
            logger.warning("No training data found!")
            return False
        
        logger.info(f"Loaded {len(X)} training samples")
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        logger.info("Training classifier...")
        self.model = HistGradientBoostingClassifier(
            max_iter=100,
            learning_rate=0.1,
            random_state=42
        )
        self.model.fit(X_scaled, y)
        
        # Calculate training accuracy
        train_acc = self.model.score(X_scaled, y)
        logger.info(f"Training accuracy: {train_acc * 100:.2f}%")
        
        return True
    
    def predict(self, image: np.ndarray) -> Tuple[str, float]:
        """Predict vehicle type from image"""
        if self.model is None:
            logger.error("Model not trained!")
            return "unknown", 0.0
        
        features = self.extract_features(image).reshape(1, -1)
        features_scaled = self.scaler.transform(features)
        
        pred_class_idx = self.model.predict(features_scaled)[0]
        pred_proba = self.model.predict_proba(features_scaled)[0]
        
        return self.classes[pred_class_idx], float(pred_proba[pred_class_idx])
    
    def save(self, path: Path):
        """Save model to disk"""
        with open(path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'scaler': self.scaler,
                'classes': self.classes,
            }, f)
        logger.info(f"Model saved to {path}")
    
    def load(self, path: Path):
        """Load model from disk"""
        with open(path, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.scaler = data['scaler']
            self.classes = data['classes']
        logger.info(f"Model loaded from {path}")


class LicensePlateDetector:
    """License plate detection using image processing"""
    
    def __init__(self):
        self.min_area = 500
        self.max_area = 50000
    
    def detect_plates(self, image: np.ndarray) -> List[Dict]:
        """Detect license plates in an image"""
        if image is None or image.size == 0:
            return []
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        edges = cv2.dilate(edges, kernel, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        plates = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if self.min_area < area < self.max_area:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / float(h)
                
                # License plates typically have aspect ratio between 2:1 and 5:1
                if 1.5 < aspect_ratio < 5.0:
                    plates.append({
                        'bbox': [int(x), int(y), int(x + w), int(y + h)],
                        'confidence': min(area / 10000, 1.0),
                        'aspect_ratio': aspect_ratio,
                    })
        
        return plates
    
    def extract_plate_region(self, image: np.ndarray, bbox: List[int]) -> np.ndarray:
        """Extract the license plate region from image"""
        x1, y1, x2, y2 = bbox
        return image[y1:y2, x1:x2]


class VehicleDetector:
    """Vehicle detection using image processing"""
    
    def __init__(self):
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        
    def detect_vehicles(self, image: np.ndarray) -> List[Dict]:
        """Detect vehicles in an image"""
        if image is None or image.size == 0:
            return []
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (320, 240))
        
        # Apply background subtraction
        fg_mask = self.bg_subtractor.apply(gray)
        
        # Threshold and clean
        _, thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        vehicles = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 1000:  # Minimum vehicle size
                x, y, w, h = cv2.boundingRect(contour)
                
                # Scale coordinates back to original image size
                scale_x = image.shape[1] / 320
                scale_y = image.shape[0] / 240
                
                x = int(x * scale_x)
                y = int(y * scale_y)
                w = int(w * scale_x)
                h = int(h * scale_y)
                
                aspect_ratio = w / float(h)
                
                if 0.3 < aspect_ratio < 5:
                    vehicles.append({
                        'type': 'vehicle',
                        'bbox': [x, y, x + w, y + h],
                        'confidence': min(area / 5000, 0.9),
                    })
        
        return vehicles


class ANPRSystem:
    """Automatic Number Plate Recognition System"""
    
    def __init__(self):
        self.plate_detector = LicensePlateDetector()
        self.vehicle_detector = VehicleDetector()
        self.vehicle_classifier = None
        
        # Try to load vehicle classifier
        classifier_path = MODELS_DIR / "vehicle_classifier.pkl"
        if classifier_path.exists():
            try:
                self.vehicle_classifier = VehicleClassifier()
                self.vehicle_classifier.load(classifier_path)
                logger.info("Loaded trained vehicle classifier")
            except Exception as e:
                logger.warning(f"Could not load classifier: {e}")
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """Process a frame and return detection results"""
        result = {
            'timestamp': datetime.now().isoformat(),
            'vehicles': [],
            'plates': [],
            'ocr_results': [],
        }
        
        # Detect vehicles
        vehicles = self.vehicle_detector.detect_vehicles(frame)
        
        # Classify vehicles if classifier available
        for vehicle in vehicles:
            if self.vehicle_classifier is not None:
                x1, y1, x2, y2 = vehicle['bbox']
                vehicle_img = frame[y1:y2, x1:x2]
                if vehicle_img.size > 0:
                    vehicle_type, conf = self.vehicle_classifier.predict(vehicle_img)
                    vehicle['type'] = vehicle_type
                    vehicle['classification_confidence'] = conf
        
        result['vehicles'] = vehicles
        
        # Detect license plates
        plates = self.plate_detector.detect_plates(frame)
        result['plates'] = plates
        
        return result
    
    def save_models(self):
        """Save all trained models"""
        if self.vehicle_classifier:
            self.vehicle_classifier.save(MODELS_DIR / "vehicle_classifier.pkl")
        
        # Save config
        config = {
            'models': {
                'vehicle_classifier': str(MODELS_DIR / "vehicle_classifier.pkl"),
            },
            'classes': ['car', 'truck', 'bus', 'motorcycle'],
            'created_at': datetime.now().isoformat(),
        }
        
        config_path = MODELS_DIR / "model_config.json"
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"Configuration saved to {config_path}")


def main():
    logger.info("=" * 60)
    logger.info("Kenya Overwatch AI Model Training")
    logger.info("=" * 60)
    
    # Initialize ANPR system
    logger.info("Initializing ANPR system...")
    anpr = ANPRSystem()
    
    # Train classifier if data exists
    sample_dir = TRAINING_DIR / "samples"
    if (sample_dir / "car").exists():
        logger.info("Training vehicle classifier...")
        
        classifier = VehicleClassifier()
        
        if classifier.train(sample_dir):
            # Save model
            classifier.save(MODELS_DIR / "vehicle_classifier.pkl")
            logger.info("Vehicle classifier trained and saved!")
            
            # Update ANPR system with new classifier
            anpr.vehicle_classifier = classifier
        else:
            logger.warning("Training failed or no data available")
    else:
        logger.warning(f"Training data not found at {sample_dir}")
    
    # Test with sample data
    logger.info("Testing with sample data...")
    sample_images = list((TRAINING_DIR / "samples").glob("**/*.jpg"))[:3]
    
    for img_path in sample_images:
        logger.info(f"Testing with {img_path}")
        img = cv2.imread(str(img_path))
        
        if img is not None:
            result = anpr.process_frame(img)
            logger.info(f"  Vehicles: {len(result['vehicles'])}, Plates: {len(result['plates'])}")
            
            # Try classification
            if anpr.vehicle_classifier:
                vehicle_type, conf = anpr.vehicle_classifier.predict(img)
                logger.info(f"  Classification: {vehicle_type} ({conf:.2f})")
    
    # Save models and config
    anpr.save_models()
    
    logger.info("=" * 60)
    logger.info("Training Complete!")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
