"""
ANPR (Automatic Number Plate Recognition) Module
Kenya Overwatch - License Plate Detection & Tracking System

Uses YOLO for plate detection, EasyOCR for reading, and SORT for tracking.
"""

import cv2
import numpy as np
import time
import threading
import uuid
from datetime import datetime
from collections import defaultdict, deque
from typing import Dict, List, Optional, Tuple, Any
import json
import logging

logger = logging.getLogger(__name__)


class PlateDetection:
    """License plate detection using YOLO"""
    
    def __init__(self, model_path: str = "yolov8n.pt", confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.model_path = model_path
        self.load_model()
    
    def load_model(self):
        """Load YOLO model"""
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            logger.info(f"YOLO model loaded: {self.model_path}")
        except ImportError:
            logger.warning("Ultralytics not installed, using mock detection")
            self.model = None
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None
    
    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect license plates in frame
        Returns list of detections with bounding boxes
        """
        if self.model is None:
            return self._mock_detect(frame)
        
        try:
            results = self.model(frame, conf=self.confidence_threshold, verbose=False)
            detections = []
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': conf,
                        'class': cls,
                        'plate_crop': frame[int(y1):int(y2), int(x1):int(x2)]
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Detection error: {e}")
            return []
    
    def _mock_detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Mock detection for testing without YOLO"""
        h, w = frame.shape[:2]
        
        # Random mock detections
        if np.random.random() > 0.7:
            x = int(w * 0.3 + np.random.random() * w * 0.4)
            y = int(h * 0.6 + np.random.random() * h * 0.2)
            bw = int(w * 0.15)
            bh = int(h * 0.08)
            
            return [{
                'bbox': [x, y, x + bw, y + bh],
                'confidence': 0.85 + np.random.random() * 0.1,
                'class': 0,
                'plate_crop': frame[y:y+bh, x:x+bw]
            }]
        return []


class PlateOCR:
    """EasyOCR for reading license plate text"""
    
    def __init__(self, languages: List[str] = ['en']):
        self.reader = None
        self.languages = languages
        self.load_reader()
    
    def load_reader(self):
        """Load EasyOCR reader"""
        try:
            import easyocr
            self.reader = easyocr.Reader(self.languages, gpu=False, verbose=False)
            logger.info("EasyOCR reader loaded")
        except ImportError:
            logger.warning("EasyOCR not installed, using mock OCR")
            self.reader = None
        except Exception as e:
            logger.error(f"Failed to load OCR: {e}")
            self.reader = None
    
    def read_plate(self, plate_crop: np.ndarray) -> Tuple[str, float]:
        """
        Read text from plate crop
        Returns: (plate_text, confidence)
        """
        if self.reader is None:
            return self._mock_read(plate_crop)
        
        try:
            results = self.reader.readtext(plate_crop)
            
            if not results:
                return "", 0.0
            
            # Get best result
            best_text = ""
            best_conf = 0.0
            
            for (bbox, text, conf) in results:
                if conf > best_conf:
                    best_conf = conf
                    # Clean text - keep only alphanumeric
                    best_text = ''.join(c for c in text.upper() if c.isalnum())
            
            return best_text, best_conf
        except Exception as e:
            logger.error(f"OCR error: {e}")
            return "", 0.0
    
    def _mock_read(self, plate_crop: np.ndarray) -> Tuple[str, float]:
        """Mock OCR for testing"""
        kenyan_plates = [
            "KAA 123A", "KBA 456B", "KCA 789C", "KDA 012D",
            "KEA 345E", "KFA 678F", "KGA 901G", "KHA 234H",
            "KJA 567J", "KKA 890K", "KLA 123L", "KMA 456M"
        ]
        return np.random.choice(kenyan_plates), 0.85 + np.random.random() * 0.1


class VehicleTracker:
    """SORT-based vehicle tracking"""
    
    def __init__(self, max_age: int = 30, min_hits: int = 3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.tracks = defaultdict(lambda: {
            'id': None,
            'plate': '',
            'plate_confidence': 0.0,
            'last_seen': None,
            'hits': 0,
            'age': 0,
            'bbox': [0, 0, 0, 0],
            'centroid_history': deque(maxlen=30),
            'camera_id': '',
            'verified': False
        })
        self.next_id = 1
        self.track_lock = threading.Lock()
    
    def update(self, detections: List[Dict], camera_id: str = "cam_001") -> List[Dict]:
        """
        Update tracks with new detections
        Returns list of active tracks
        """
        with self.track_lock:
            current_time = datetime.now()
            
            # Get centroids of current detections
            current_centroids = []
            for det in detections:
                bbox = det['bbox']
                cx = (bbox[0] + bbox[2]) / 2
                cy = (bbox[1] + bbox[3]) / 2
                current_centroids.append((cx, cy, det))
            
            # Match detections to existing tracks
            matched_tracks = set()
            matched_detections = set()
            
            for track_id, track_data in self.tracks.items():
                if track_data['id'] is None:
                    continue
                    
                best_match_idx = -1
                best_distance = float('inf')
                
                for idx, (cx, cy, det) in enumerate(current_centroids):
                    if idx in matched_detections:
                        continue
                    
                    # Calculate distance from track's last centroid
                    last_centroids = list(track_data['centroid_history'])
                    if last_centroids:
                        lcx, lcy = last_centroids[-1]
                        distance = np.sqrt((cx - lcx)**2 + (cy - lcy)**2)
                        
                        if distance < best_distance and distance < 150:  # Max distance threshold
                            best_distance = distance
                            best_match_idx = idx
                
                if best_match_idx >= 0:
                    # Update track
                    cx, cy, det = current_centroids[best_match_idx]
                    self.tracks[track_id]['bbox'] = det['bbox']
                    self.tracks[track_id]['centroid_history'].append((cx, cy))
                    self.tracks[track_id]['last_seen'] = current_time
                    self.tracks[track_id]['hits'] += 1
                    self.tracks[track_id]['age'] = 0
                    
                    # Update plate if we have one
                    if 'plate' in det and det['plate']:
                        self.tracks[track_id]['plate'] = det['plate']
                        self.tracks[track_id]['plate_confidence'] = det.get('plate_confidence', 0)
                        if det.get('plate_confidence', 0) > 0.85:
                            self.tracks[track_id]['verified'] = True
                    
                    matched_tracks.add(track_id)
                    matched_detections.add(best_match_idx)
            
            # Create new tracks for unmatched detections
            for idx, (cx, cy, det) in enumerate(current_centroids):
                if idx in matched_detections:
                    continue
                
                # Find first available track ID
                new_id = None
                for track_id, track_data in self.tracks.items():
                    if track_data['id'] is None:
                        new_id = track_id
                        break
                
                if new_id is None:
                    new_id = self.next_id
                    self.next_id += 1
                
                self.tracks[new_id] = {
                    'id': new_id,
                    'plate': det.get('plate', ''),
                    'plate_confidence': det.get('plate_confidence', 0),
                    'last_seen': current_time,
                    'hits': 1,
                    'age': 0,
                    'bbox': det['bbox'],
                    'centroid_history': deque([(cx, cy)], maxlen=30),
                    'camera_id': camera_id,
                    'verified': False
                }
            
            # Age tracks and remove old ones
            tracks_to_remove = []
            for track_id, track_data in self.tracks.items():
                if track_data['id'] is not None:
                    track_data['age'] += 1
                    if track_data['age'] > self.max_age:
                        tracks_to_remove.append(track_id)
            
            for track_id in tracks_to_remove:
                del self.tracks[track_id]
            
            # Return active, confirmed tracks
            active_tracks = []
            for track_id, track_data in self.tracks.items():
                if track_data['hits'] >= self.min_hits:
                    active_tracks.append({
                        'track_id': track_data['id'],
                        'plate': track_data['plate'],
                        'plate_confidence': track_data['plate_confidence'],
                        'bbox': track_data['bbox'],
                        'verified': track_data['verified'],
                        'camera_id': track_data['camera_id'],
                        'last_seen': track_data['last_seen'].isoformat() if track_data['last_seen'] else None,
                        'hits': track_data['hits']
                    })
            
            return active_tracks


class PlateDatabase:
    """Database for storing detected plates"""
    
    def __init__(self, db_path: str = "data/plates.db"):
        self.db_path = db_path
        self.plates: Dict[str, Dict] = {}
        self.load_database()
    
    def load_database(self):
        """Load existing plates"""
        try:
            import os
            if os.path.exists(self.db_path):
                # Simple JSON-based storage for now
                logger.info(f"Loaded plate database from {self.db_path}")
        except Exception as e:
            logger.error(f"Failed to load database: {e}")
    
    def save_plate(self, plate: str, confidence: float, camera_id: str, 
                   bbox: List[int], track_id: int) -> Dict:
        """Save a detected plate"""
        plate = plate.upper().strip()
        
        entry = {
            'id': str(uuid.uuid4()),
            'plate': plate,
            'confidence': confidence,
            'camera_id': camera_id,
            'bbox': bbox,
            'track_id': track_id,
            'timestamp': datetime.now().isoformat(),
            'verified': confidence > 0.85
        }
        
        # Update existing or add new
        if plate in self.plates:
            self.plates[plate]['detections'] += 1
            self.plates[plate]['last_seen'] = entry['timestamp']
            self.plates[plate]['last_confidence'] = confidence
        else:
            self.plates[plate] = {
                'plate': plate,
                'first_seen': entry['timestamp'],
                'last_seen': entry['timestamp'],
                'detections': 1,
                'last_confidence': confidence,
                'entries': [entry]
            }
        
        return entry
    
    def get_plate(self, plate: str) -> Optional[Dict]:
        """Get plate info"""
        return self.plates.get(plate.upper())
    
    def get_all_plates(self) -> List[Dict]:
        """Get all plates"""
        return list(self.plates.values())
    
    def get_today_count(self) -> int:
        """Get count of plates detected today"""
        today = datetime.now().date()
        count = 0
        for plate_data in self.plates.values():
            if plate_data.get('last_seen'):
                try:
                    last_seen = datetime.fromisoformat(str(plate_data['last_seen'])).date()
                    if last_seen == today:
                        count += int(plate_data.get('detections', 1))
                except:
                    pass
        return count
    
    def is_blacklisted(self, plate: str) -> bool:
        """Check if plate is blacklisted"""
        blacklist = ['STOLEN', 'WANTED', 'SUSPECTED']
        return any(b in plate.upper() for b in blacklist)


class ANPRSystem:
    """Complete ANPR System combining all components"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        
        # Initialize components
        self.detector = PlateDetection(
            model_path=self.config.get('model_path', 'yolov8n.pt'),
            confidence_threshold=self.config.get('detection_threshold', 0.5)
        )
        
        self.ocr = PlateOCR(
            languages=self.config.get('languages', ['en'])
        )
        
        self.tracker = VehicleTracker(
            max_age=self.config.get('max_age', 30),
            min_hits=self.config.get('min_hits', 3)
        )
        
        self.database = PlateDatabase(
            db_path=self.config.get('db_path', 'data/plates.db')
        )
        
        # Statistics
        self.stats = {
            'total_detections': 0,
            'total_plates': 0,
            'avg_confidence': 0.0,
            'fps': 0.0,
            'latency_ms': 0.0,
            'active_tracks': 0
        }
        
        self.frame_times = deque(maxlen=30)
        self.last_frame_time = time.time()
        
        logger.info("ANPR System initialized")
    
    def process_frame(self, frame: np.ndarray, camera_id: str = "cam_001") -> Dict:
        """Process a single frame through the ANPR pipeline"""
        start_time = time.time()
        
        # Step 1: Detect plates
        detections = self.detector.detect(frame)
        
        # Step 2: Read plate text (OCR)
        for det in detections:
            plate_text, ocr_conf = self.ocr.read_plate(det['plate_crop'])
            det['plate'] = plate_text
            det['plate_confidence'] = ocr_conf
        
        # Step 3: Track vehicles
        active_tracks = self.tracker.update(detections, camera_id)
        
        # Step 4: Save to database
        for track in active_tracks:
            if track['plate']:
                self.database.save_plate(
                    track['plate'],
                    track['plate_confidence'],
                    track['camera_id'],
                    track['bbox'],
                    track['track_id']
                )
        
        # Step 5: Update statistics
        self._update_stats(start_time, detections, active_tracks)
        
        return {
            'detections': detections,
            'tracks': active_tracks,
            'stats': self.stats.copy()
        }
    
    def _update_stats(self, start_time: float, detections: List, tracks: List):
        """Update system statistics"""
        # FPS calculation
        current_time = time.time()
        self.frame_times.append(current_time)
        
        if len(self.frame_times) > 1:
            time_diff = self.frame_times[-1] - self.frame_times[0]
            self.stats['fps'] = len(self.frame_times) / time_diff if time_diff > 0 else 0
        
        # Latency
        self.stats['latency_ms'] = (current_time - start_time) * 1000
        
        # Other stats
        self.stats['total_detections'] += len(detections)
        self.stats['total_plates'] = len(self.database.plates)
        self.stats['active_tracks'] = len(tracks)
        
        # Average confidence
        if tracks:
            confs = [t['plate_confidence'] for t in tracks if t['plate_confidence'] > 0]
            if confs:
                self.stats['avg_confidence'] = sum(confs) / len(confs)


class CameraProcessor:
    """Process camera feeds with ANPR"""
    
    def __init__(self, camera_id: str, camera_url: str, anpr: ANPRSystem):
        self.camera_id = camera_id
        self.camera_url = camera_url
        self.anpr = anpr
        self.capture = None
        self.running = False
        self.thread = None
        
        # Frame buffer
        self.latest_frame = None
        self.latest_result = None
        self.lock = threading.Lock()
    
    def start(self):
        """Start processing camera"""
        self.capture = cv2.VideoCapture(self.camera_url)
        self.running = True
        self.thread = threading.Thread(target=self._process_loop, daemon=True)
        self.thread.start()
        logger.info(f"Camera {self.camera_id} started")
    
    def stop(self):
        """Stop processing"""
        self.running = False
        if self.capture:
            self.capture.release()
        logger.info(f"Camera {self.camera_id} stopped")
    
    def _process_loop(self):
        """Main processing loop"""
        while self.running:
            ret, frame = self.capture.read()
            if not ret:
                time.sleep(0.1)
                continue
            
            # Process frame
            result = self.anpr.process_frame(frame, self.camera_id)
            
            # Store latest
            with self.lock:
                self.latest_frame = frame
                self.latest_result = result
    
    def get_frame_with_overlay(self) -> Tuple[np.ndarray, Dict]:
        """Get frame with ANPR overlay"""
        with self.lock:
            if self.latest_frame is None:
                return None, {}
            return self.latest_frame.copy(), self.latest_result.copy() if self.latest_result else {}
    
    def get_current_tracks(self) -> List[Dict]:
        """Get current active tracks"""
        with self.lock:
            if self.latest_result:
                return self.latest_result.get('tracks', [])
            return []


# Global ANPR instance
_anpr_system: Optional[ANPRSystem] = None


def get_anpr_system(config: Dict = None) -> ANPRSystem:
    """Get or create global ANPR system"""
    global _anpr_system
    if _anpr_system is None:
        _anpr_system = ANPRSystem(config)
    return _anpr_system
