"""
RTSP/ONVIF Camera Ingestion Module
Handles video stream connections to government traffic cameras
"""

import asyncio
import logging
import os
import threading
from typing import Dict, Optional, Callable, List
from dataclasses import dataclass, field
from datetime import datetime, timezone
import cv2
import numpy as np
from queue import Queue

logger = logging.getLogger(__name__)


@dataclass
class CameraConfig:
    id: str
    name: str
    rtsp_url: str
    username: Optional[str] = None
    password: Optional[str] = None
    location: Dict[str, float] = field(default_factory=dict)  # lat, lng
    road_name: str = ""
    county: str = ""
    fps: int = 5
    enabled: bool = True


@dataclass
class FrameData:
    camera_id: str
    frame: np.ndarray
    timestamp: datetime
    frame_number: int


class RTSPClient:
    """RTSP client for connecting to camera streams"""
    
    def __init__(self, config: CameraConfig, frame_callback: Callable[[FrameData], None]):
        self.config = config
        self.frame_callback = frame_callback
        self.running = False
        self.cap = None
        self.thread = None
        self.frame_count = 0
        self.last_error = None
        
    def _build_authenticated_url(self) -> str:
        """Build RTSP URL with authentication"""
        url = self.config.rtsp_url
        if self.config.username and self.config.password:
            # Insert credentials into RTSP URL
            if "://" in url:
                protocol, rest = url.split("://", 1)
                if "@" not in rest:
                    return f"{protocol}://{self.config.username}:{self.config.password}@{rest}"
        return url
    
    def connect(self) -> bool:
        """Connect to RTSP stream"""
        try:
            rtsp_url = self._build_authenticated_url()
            self.cap = cv2.VideoCapture(rtsp_url)
            
            if not self.cap.isOpened():
                self.last_error = "Failed to open video capture"
                logger.error(f"Camera {self.config.id}: {self.last_error}")
                return False
            
            # Set capture properties
            self.cap.set(cv2.CAP_PROP_FPS, self.config.fps)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize latency
            
            logger.info(f"Camera {self.config.id}: Connected to stream")
            return True
            
        except Exception as e:
            self.last_error = str(e)
            logger.error(f"Camera {self.config.id}: Connection error: {e}")
            return False
    
    def start(self):
        """Start capturing frames"""
        if self.running:
            return
            
        if not self.connect():
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
    
    def _capture_loop(self):
        """Main capture loop"""
        while self.running:
            try:
                ret, frame = self.cap.read()
                
                if not ret:
                    logger.warning(f"Camera {self.config.id}: Failed to read frame, attempting reconnect")
                    self.cap.release()
                    if not self.connect():
                        break
                    continue
                
                self.frame_count += 1
                
                frame_data = FrameData(
                    camera_id=self.config.id,
                    frame=frame,
                    timestamp=datetime.now(timezone.utc),
                    frame_number=self.frame_count
                )
                
                self.frame_callback(frame_data)
                
                # Control frame rate
                target_interval = 1.0 / self.config.fps
                asyncio.sleep(target_interval)
                
            except Exception as e:
                logger.error(f"Camera {self.config.id}: Capture error: {e}")
                break
        
        self.running = False
    
    def stop(self):
        """Stop capturing"""
        self.running = False
        if self.cap:
            self.cap.release()
        logger.info(f"Camera {self.config.id}: Stopped")


class CameraIngestionService:
    """Manages multiple camera streams"""
    
    def __init__(self):
        self.cameras: Dict[str, CameraConfig] = {}
        self.clients: Dict[str, RTSPClient] = {}
        self.frame_queues: Dict[str, Queue] = {}
        self.on_frame_callback: Optional[Callable[[FrameData], None]] = None
        
    def register_camera(self, config: CameraConfig):
        """Register a camera"""
        self.cameras[config.id] = config
        self.frame_queues[config.id] = Queue(maxsize=10)
        logger.info(f"Registered camera: {config.id} - {config.name}")
    
    def unregister_camera(self, camera_id: str):
        """Unregister and stop a camera"""
        if camera_id in self.clients:
            self.clients[camera_id].stop()
            del self.clients[camera_id]
        
        if camera_id in self.cameras:
            del self.cameras[camera_id]
        
        if camera_id in self.frame_queues:
            del self.frame_queues[camera_id]
            
        logger.info(f"Unregistered camera: {camera_id}")
    
    def set_frame_callback(self, callback: Callable[[FrameData], None]):
        """Set callback for frames"""
        self.on_frame_callback = callback
    
    def start_camera(self, camera_id: str) -> bool:
        """Start a specific camera"""
        if camera_id not in self.cameras:
            logger.error(f"Camera {camera_id} not registered")
            return False
        
        if camera_id in self.clients:
            logger.warning(f"Camera {camera_id} already running")
            return True
        
        config = self.cameras[camera_id]
        if not config.enabled:
            logger.warning(f"Camera {camera_id} is disabled")
            return False
        
        def frame_handler(frame_data: FrameData):
            if self.on_frame_callback:
                self.on_frame_callback(frame_data)
        
        client = RTSPClient(config, frame_handler)
        client.start()
        
        # Wait briefly to check if connection succeeded
        import time
        time.sleep(2)
        
        if client.running:
            self.clients[camera_id] = client
            return True
        else:
            logger.error(f"Camera {camera_id} failed to start: {client.last_error}")
            return False
    
    def stop_camera(self, camera_id: str):
        """Stop a specific camera"""
        if camera_id in self.clients:
            self.clients[camera_id].stop()
            del self.clients[camera_id]
    
    def start_all(self):
        """Start all enabled cameras"""
        for camera_id in self.cameras:
            config = self.cameras[camera_id]
            if config.enabled:
                self.start_camera(camera_id)
    
    def stop_all(self):
        """Stop all cameras"""
        for camera_id in list(self.clients.keys()):
            self.stop_camera(camera_id)
    
    def get_camera_status(self, camera_id: str) -> Dict:
        """Get camera status"""
        if camera_id not in self.cameras:
            return {"status": "not_found"}
        
        config = self.cameras[camera_id]
        
        if camera_id in self.clients:
            client = self.clients[camera_id]
            return {
                "id": camera_id,
                "name": config.name,
                "status": "running" if client.running else "error",
                "frame_count": client.frame_count,
                "last_error": client.last_error,
                "location": config.location,
                "road_name": config.road_name
            }
        
        return {
            "id": camera_id,
            "name": config.name,
            "status": "stopped",
            "enabled": config.enabled,
            "location": config.location,
            "road_name": config.road_name
        }
    
    def get_all_status(self) -> List[Dict]:
        """Get status of all cameras"""
        return [self.get_camera_status(cid) for cid in self.cameras]


# Global instance
camera_ingestion_service = CameraIngestionService()
