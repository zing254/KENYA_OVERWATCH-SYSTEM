"""
Kenya NTSA Road Safety - CCTV Stream Simulation Service
Simulates camera streams for testing and demo purposes
"""

import random
import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class CameraFrame:
    """Represents a single camera frame"""
    camera_id: str
    timestamp: str
    frame_number: int
    detections: List[Dict]
    vehicle_count: int
    average_speed: float
    anomaly_detected: bool
    image_quality: str
    

class CCTVStreamSimulator:
    """Simulates CCTV camera streams"""
    
    def __init__(self):
        self.active_streams: Dict[str, bool] = {}
        self.frame_counters: Dict[str, int] = {}
        self.vehicle_types = ["saloon", "pickup", "matatu", "bus", "lorry", "motorcycle"]
        self.anomaly_types = ["speeding", "wrong_way", "illegal_turn", "red_light", "no_plate"]
        
    def start_stream(self, camera_id: str):
        """Start simulating a camera stream"""
        self.active_streams[camera_id] = True
        self.frame_counters[camera_id] = 0
        logger.info(f"Stream started for camera: {camera_id}")
        
    def stop_stream(self, camera_id: str):
        """Stop simulating a camera stream"""
        self.active_streams[camera_id] = False
        logger.info(f"Stream stopped for camera: {camera_id}")
        
    def generate_frame(self, camera_id: str) -> CameraFrame:
        """Generate a simulated camera frame"""
        if camera_id not in self.frame_counters:
            self.frame_counters[camera_id] = 0
            
        self.frame_counters[camera_id] += 1
        
        # Generate random vehicle detections
        num_vehicles = random.randint(0, 10)
        detections = []
        
        for _ in range(num_vehicles):
            vehicle = {
                "id": f"veh_{uuid.uuid4().hex[:8]}",
                "type": random.choice(self.vehicle_types),
                "plate": f"K{chr(65+random.randint(0,25))}{chr(65+random.randint(0,25))}{random.randint(100,999)}{chr(65+random.randint(0,25))}",
                "speed": random.uniform(0, 120),
                "lane": random.randint(1, 4),
                "confidence": random.uniform(0.7, 0.99)
            }
            detections.append(vehicle)
        
        # Detect anomalies occasionally
        anomaly = random.random() < 0.05  # 5% chance
        anomaly_data = None
        if anomaly:
            anomaly_data = {
                "type": random.choice(self.anomaly_types),
                "confidence": random.uniform(0.6, 0.95),
                "vehicle_id": detections[0]["id"] if detections else None
            }
        
        avg_speed = sum(v["speed"] for v in detections) / max(len(detections), 1)
        
        return CameraFrame(
            camera_id=camera_id,
            timestamp=datetime.now().isoformat(),
            frame_number=self.frame_counters[camera_id],
            detections=detections,
            vehicle_count=num_vehicles,
            average_speed=avg_speed,
            anomaly_detected=anomaly,
            image_quality=random.choice(["excellent", "good", "fair"])
        )
    
    def get_stream_stats(self, camera_id: str) -> Dict:
        """Get stream statistics"""
        return {
            "camera_id": camera_id,
            "active": self.active_streams.get(camera_id, False),
            "frames_generated": self.frame_counters.get(camera_id, 0)
        }


# Global simulator instance
cctv_simulator = CCTVStreamSimulator()


# ANPR/OCR Simulation
class ANPRSimulator:
    """Simulates ANPR/OCR processing"""
    
    def __init__(self):
        self.processed_frames = 0
        self.plate_detections = []
        
    def process_frame(self, frame: CameraFrame) -> Dict:
        """Process a frame and extract license plates"""
        self.processed_frames += 1
        
        results = {
            "frame_id": f"frame_{frame.frame_number}",
            "camera_id": frame.camera_id,
            "timestamp": frame.timestamp,
            "plates": [],
            "violations": []
        }
        
        for detection in frame.detections:
            if detection["confidence"] > 0.8:
                plate_data = {
                    "plate_number": detection["plate"],
                    "confidence": detection["confidence"],
                    "vehicle_type": detection["type"],
                    "speed": detection["speed"],
                    "location": {"lane": detection["lane"]}
                }
                results["plates"].append(plate_data)
                
                # Check for speed violation
                speed_limit = 80  # Default speed limit
                if detection["speed"] > speed_limit:
                    violation = {
                        "plate_number": detection["plate"],
                        "speed_detected": detection["speed"],
                        "speed_limit": speed_limit,
                        "excess": detection["speed"] - speed_limit,
                        "fine": (detection["speed"] - speed_limit) * 500 + 3000
                    }
                    results["violations"].append(violation)
                    
                    # Store detection
                    self.plate_detections.append({
                        "plate": detection["plate"],
                        "timestamp": frame.timestamp,
                        "camera_id": frame.camera_id,
                        "speed": detection["speed"]
                    })
        
        return results
    
    def get_statistics(self) -> Dict:
        """Get ANPR statistics"""
        return {
            "total_frames_processed": self.processed_frames,
            "total_plate_detections": len(self.plate_detections),
            "unique_plates": len(set(d["plate"] for d in self.plate_detections)),
            "recent_detections": self.plate_detections[-10:]
        }


# Global ANPR simulator
anpr_simulator = ANPRSimulator()


# Traffic Analysis
class TrafficAnalyzer:
    """Analyzes traffic patterns"""
    
    def __init__(self):
        self.hourly_data: Dict[int, Dict] = {h: {"count": 0, "speeds": []} for h in range(24)}
        
    def analyze_frame(self, frame: CameraFrame):
        """Analyze a frame for traffic patterns"""
        hour = datetime.now().hour
        
        self.hourly_data[hour]["count"] += frame.vehicle_count
        for detection in frame.detections:
            self.hourly_data[hour]["speeds"].append(detection["speed"])
    
    def get_peak_hours(self) -> List[Dict]:
        """Get peak traffic hours"""
        peak_hours = []
        for hour, data in self.hourly_data.items():
            if data["count"] > 0:
                avg_speed = sum(data["speeds"]) / max(len(data["speeds"]), 1)
                peak_hours.append({
                    "hour": hour,
                    "vehicle_count": data["count"],
                    "average_speed": avg_speed
                })
        
        return sorted(peak_hours, key=lambda x: x["vehicle_count"], reverse=True)[:5]
    
    def get_traffic_score(self, hour: int) -> str:
        """Get traffic score for an hour"""
        data = self.hourly_data.get(hour, {"count": 0})
        count = data["count"]
        
        if count < 10:
            return "low"
        elif count < 30:
            return "moderate"
        elif count < 60:
            return "high"
        else:
            return "congested"


# Global traffic analyzer
traffic_analyzer = TrafficAnalyzer()
