"""
RTSP/ONVIF Camera Ingestion Module
High-performance video stream handling with optimized memory management
"""

import time
import logging
import threading
from typing import Dict, Optional, Callable, List, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone

try:
    import cv2  # type: ignore
except Exception:
    cv2 = None  # type: ignore

try:
    import numpy as np  # type: ignore
except Exception:
    np = None  # type: ignore
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
    queue_size: int = 30  # Buffer size for frames
    buffer_size: int = 1  # OpenCV buffer size (minimize latency)


@dataclass
class FrameData:
    camera_id: str
    frame: object
    timestamp: datetime
    frame_number: int
    dropped: bool = False


class RTSPClient:
    """High-performance RTSP client with optimized frame capture"""

    def __init__(
        self, config: CameraConfig, frame_callback: Callable[[FrameData], None]
    ):
        self.config = config
        self.frame_callback = frame_callback
        self.running = False
        self.cap = None
        self.thread = None
        self.frame_count = 0
        self.last_error = None
        self.dropped_frames = 0
        self.last_frame_time = 0.0
        self._frame_interval = 1.0 / config.fps if config.fps > 0 else 0.1
        self._lock = threading.Lock()

    def _build_authenticated_url(self) -> str:
        """Build RTSP URL with authentication"""
        url = self.config.rtsp_url
        if self.config.username and self.config.password:
            if "://" in url:
                protocol, rest = url.split("://", 1)
                if "@" not in rest:
                    return f"{protocol}://{self.config.username}:{self.config.password}@{rest}"
        return url

    def _should_drop_frame(self) -> bool:
        """Determine if we should drop this frame to maintain FPS"""
        now = time.time()
        if self.last_frame_time > 0:
            elapsed = now - self.last_frame_time
            if elapsed < self._frame_interval * 0.8:
                return True
        return False

    def connect(self) -> bool:
        """Connect to RTSP stream with optimized settings"""
        try:
            if cv2 is None:
                logger.error(
                    f"Camera {self.config.id}: OpenCV not available (cv2 missing). Cannot open stream."
                )
                self.last_error = "opencv_missing"
                return False
            rtsp_url = self._build_authenticated_url()
            self.cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)

            if self.cap is None or not self.cap.isOpened():
                self.last_error = "Failed to open video capture"
                logger.error(f"Camera {self.config.id}: {self.last_error}")
                return False

            # Optimize capture settings for low latency
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, self.config.buffer_size)
            self.cap.set(cv2.CAP_PROP_FPS, self.config.fps)

            # Try to set MJPG codec for lower CPU usage (if supported)
            # Note: Codec settings are camera/stream dependent, so we skip if not available

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
        """Main capture loop with performance optimizations"""
        logger.info(f"Camera {self.config.id}: Starting capture loop")

        while self.running:
            try:
                # Check if capture device is still valid
                if self.cap is None or not self.cap.isOpened():
                    logger.warning(
                        f"Camera {self.config.id}: Capture device not open, reconnecting..."
                    )
                    if not self.connect():
                        break
                    continue

                # Check if we should drop frame to maintain timing
                if self._should_drop_frame():
                    self.dropped_frames += 1
                    continue

                # Read frame
                ret, frame = self.cap.read()

                if not ret or frame is None:
                    logger.warning(
                        f"Camera {self.config.id}: Failed to read frame, attempting reconnect"
                    )
                    if self.cap:
                        self.cap.release()
                    if not self.connect():
                        break
                    continue

                self.frame_count += 1
                self.last_frame_time = time.time()

                # Create frame data
                frame_data = FrameData(
                    camera_id=self.config.id,
                    frame=frame,
                    timestamp=datetime.now(timezone.utc),
                    frame_number=self.frame_count,
                    dropped=False,
                )

                # Call callback (non-blocking)
                try:
                    self.frame_callback(frame_data)
                except Exception as e:
                    logger.error(f"Camera {self.config.id}: Callback error: {e}")

                # Control frame rate
                elapsed = time.time() - self.last_frame_time
                sleep_time = max(0, self._frame_interval - elapsed)
                if sleep_time > 0:
                    time.sleep(sleep_time)

            except Exception as e:
                logger.error(f"Camera {self.config.id}: Capture error: {e}")
                time.sleep(1)

        self.running = False
        logger.info(f"Camera {self.config.id}: Capture loop ended")

    def stop(self):
        """Stop capturing"""
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2)
        if self.cap:
            self.cap.release()
        logger.info(
            f"Camera {self.config.id}: Stopped (dropped {self.dropped_frames} frames)"
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get client statistics"""
        return {
            "camera_id": self.config.id,
            "running": self.running,
            "frame_count": self.frame_count,
            "dropped_frames": self.dropped_frames,
            "drop_rate": self.dropped_frames / max(self.frame_count, 1) * 100,
            "fps": self.config.fps,
            "last_error": self.last_error,
        }


class CameraIngestionService:
    """High-performance camera ingestion manager"""

    def __init__(self):
        self.cameras: Dict[str, CameraConfig] = {}
        self.clients: Dict[str, RTSPClient] = {}
        self.frame_queues: Dict[str, Queue] = {}
        self.on_frame_callback: Optional[Callable[[FrameData], None]] = None
        self._lock = threading.RLock()
        self.stats = {
            "total_frames": 0,
            "total_dropped": 0,
            "active_cameras": 0,
        }

    def register_camera(self, config: CameraConfig):
        """Register a camera with optimized queue size"""
        with self._lock:
            self.cameras[config.id] = config
            # Create queue with configurable size
            self.frame_queues[config.id] = Queue(maxsize=config.queue_size)
            logger.info(f"Registered camera: {config.id} - {config.name}")

    def unregister_camera(self, camera_id: str):
        """Unregister and stop a camera"""
        with self._lock:
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

    def _create_frame_handler(self, camera_id: str):
        """Create a frame handler for a specific camera"""

        def handler(frame_data: FrameData):
            if self.on_frame_callback:
                try:
                    self.on_frame_callback(frame_data)
                    with self._lock:
                        self.stats["total_frames"] += 1
                except Exception as e:
                    logger.error(f"Frame callback error for {camera_id}: {e}")

        return handler

    def start_camera(self, camera_id: str) -> bool:
        """Start a specific camera"""
        with self._lock:
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

            frame_handler = self._create_frame_handler(camera_id)

            client = RTSPClient(config, frame_handler)
            client.start()

            # Wait briefly to check if connection succeeded
            time.sleep(2)

            if client.running:
                self.clients[camera_id] = client
                with self._lock:
                    self.stats["active_cameras"] += 1
                return True
            else:
                logger.error(f"Camera {camera_id} failed to start: {client.last_error}")
                return False

    def stop_camera(self, camera_id: str):
        """Stop a specific camera"""
        with self._lock:
            if camera_id in self.clients:
                self.clients[camera_id].stop()
                client_stats = self.clients[camera_id].get_stats()
                self.stats["total_dropped"] += client_stats["dropped_frames"]
                del self.clients[camera_id]
                self.stats["active_cameras"] -= 1

    def start_all(self):
        """Start all enabled cameras"""
        for camera_id in list(self.cameras.keys()):
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
            stats = client.get_stats()
            return {
                "id": camera_id,
                "name": config.name,
                "status": "running" if client.running else "error",
                "frame_count": client.frame_count,
                "dropped_frames": client.dropped_frames,
                "drop_rate": stats["drop_rate"],
                "last_error": client.last_error,
                "location": config.location,
                "road_name": config.road_name,
                "fps": config.fps,
            }

        return {
            "id": camera_id,
            "name": config.name,
            "status": "stopped",
            "enabled": config.enabled,
            "location": config.location,
            "road_name": config.road_name,
        }

    def get_all_status(self) -> List[Dict]:
        """Get status of all cameras"""
        return [self.get_camera_status(cid) for cid in self.cameras]

    def get_service_stats(self) -> Dict:
        """Get overall service statistics"""
        with self._lock:
            return {
                "registered_cameras": len(self.cameras),
                "active_clients": len(self.clients),
                "total_frames": self.stats["total_frames"],
                "total_dropped": self.stats["total_dropped"],
                "overall_drop_rate": (
                    self.stats["total_dropped"] / max(self.stats["total_frames"], 1)
                )
                * 100,
            }


# Global instance
camera_ingestion_service = CameraIngestionService()
