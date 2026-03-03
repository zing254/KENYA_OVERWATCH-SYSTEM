from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum
import uuid


class StreamQuality(Enum):
    LOW = "240p"
    MEDIUM = "480p"
    HIGH = "720p"
    FULL_HD = "1080p"


class StreamStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PROCESSING = "processing"


@dataclass
class CameraStream:
    stream_id: str
    camera_id: str
    camera_name: str
    stream_url: str
    quality: StreamQuality
    status: StreamStatus
    resolution: tuple
    fps: int
    bitrate: int
    started_at: Optional[datetime] = None
    viewer_count: int = 0
    total_views: int = 0
    location: Optional[Dict] = None


@dataclass
class StreamRecording:
    recording_id: str
    stream_id: str
    camera_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int = 0
    file_path: str = ""
    file_size_mb: float = 0.0
    status: str = "recording"


class VideoStreamingService:
    def __init__(self):
        self.active_streams: Dict[str, CameraStream] = {}
        self.recordings: Dict[str, StreamRecording] = {}
        self._initialize_demo_streams()

    def _initialize_demo_streams(self):
        demo_cameras = [
            {
                "id": "CAM001",
                "name": "Mombasa Road Junction",
                "url": "rtsp://demo-camera-1.kenyaoverwatch.ke/live",
                "location": {"lat": -1.3300, "lng": 36.9800}
            },
            {
                "id": "CAM002",
                "name": "Nairobi CBD Roundabout",
                "url": "rtsp://demo-camera-2.kenyaoverwatch.ke/live",
                "location": {"lat": -1.2864, "lng": 36.8232}
            },
            {
                "id": "CAM003",
                "name": "Thika Superhighway",
                "url": "rtsp://demo-camera-3.kenyaoverwatch.ke/live",
                "location": {"lat": -1.0800, "lng": 37.1000}
            },
            {
                "id": "CAM004",
                "name": "Kenyatta Avenue",
                "url": "rtsp://demo-camera-4.kenyaoverwatch.ke/live",
                "location": {"lat": -1.2900, "lng": 36.8250}
            },
            {
                "id": "CAM005",
                "name": "Nakuru Town Center",
                "url": "rtsp://demo-camera-5.kenyaoverwatch.ke/live",
                "location": {"lat": -0.3031, "lng": 36.0800}
            }
        ]
        
        for cam in demo_cameras:
            stream = CameraStream(
                stream_id=f"STR_{cam['id']}",
                camera_id=cam['id'],
                camera_name=cam['name'],
                stream_url=cam['url'],
                quality=StreamQuality.HIGH,
                status=StreamStatus.ACTIVE,
                resolution=(1280, 720),
                fps=30,
                bitrate=2500,
                started_at=datetime.now(),
                viewer_count=0,
                total_views=0,
                location=cam['location']
            )
            self.active_streams[stream.stream_id] = stream

    def start_stream(self, camera_id: str, quality: StreamQuality = StreamQuality.HIGH) -> Optional[CameraStream]:
        stream_id = f"STR_{camera_id}_{uuid.uuid4().hex[:8]}"
        
        stream = CameraStream(
            stream_id=stream_id,
            camera_id=camera_id,
            camera_name=f"Camera {camera_id}",
            stream_url=f"rtsp://camera-{camera_id}.kenyaoverwatch.ke/live",
            quality=quality,
            status=StreamStatus.ACTIVE,
            resolution=self._get_resolution(quality),
            fps=30,
            bitrate=self._get_bitrate(quality),
            started_at=datetime.now()
        )
        
        self.active_streams[stream_id] = stream
        return stream

    def stop_stream(self, stream_id: str) -> bool:
        if stream_id in self.active_streams:
            self.active_streams[stream_id].status = StreamStatus.INACTIVE
            del self.active_streams[stream_id]
            return True
        return False

    def get_stream(self, stream_id: str) -> Optional[CameraStream]:
        return self.active_streams.get(stream_id)

    def get_all_streams(self) -> List[CameraStream]:
        return list(self.active_streams.values())

    def get_streams_by_status(self, status: StreamStatus) -> List[CameraStream]:
        return [s for s in self.active_streams.values() if s.status == status]

    def increment_viewer_count(self, stream_id: str):
        if stream_id in self.active_streams:
            self.active_streams[stream_id].viewer_count += 1
            self.active_streams[stream_id].total_views += 1

    def decrement_viewer_count(self, stream_id: str):
        if stream_id in self.active_streams:
            self.active_streams[stream_id].viewer_count = max(0, self.active_streams[stream_id].viewer_count - 1)

    def start_recording(self, stream_id: str) -> Optional[StreamRecording]:
        if stream_id not in self.active_streams:
            return None
        
        recording = StreamRecording(
            recording_id=f"REC_{uuid.uuid4().hex[:12]}",
            stream_id=stream_id,
            camera_id=self.active_streams[stream_id].camera_id,
            start_time=datetime.now(),
            status="recording"
        )
        
        self.recordings[recording.recording_id] = recording
        return recording

    def stop_recording(self, recording_id: str) -> Optional[StreamRecording]:
        if recording_id in self.recordings:
            recording = self.recordings[recording_id]
            recording.end_time = datetime.now()
            recording.status = "completed"
            recording.duration_seconds = int((recording.end_time - recording.start_time).total_seconds())
            return recording
        return None

    def get_recording(self, recording_id: str) -> Optional[StreamRecording]:
        return self.recordings.get(recording_id)

    def get_recordings_by_camera(self, camera_id: str) -> List[StreamRecording]:
        return [r for r in self.recordings.values() if r.camera_id == camera_id]

    def _get_resolution(self, quality: StreamQuality) -> tuple:
        resolutions = {
            StreamQuality.LOW: (320, 240),
            StreamQuality.MEDIUM: (640, 480),
            StreamQuality.HIGH: (1280, 720),
            StreamQuality.FULL_HD: (1920, 1080)
        }
        return resolutions.get(quality, (1280, 720))

    def _get_bitrate(self, quality: StreamQuality) -> int:
        bitrates = {
            StreamQuality.LOW: 500,
            StreamQuality.MEDIUM: 1000,
            StreamQuality.HIGH: 2500,
            StreamQuality.FULL_HD: 5000
        }
        return bitrates.get(quality, 2500)

    def get_stream_statistics(self) -> Dict:
        streams = list(self.active_streams.values())
        
        return {
            "total_streams": len(streams),
            "active_streams": len([s for s in streams if s.status == StreamStatus.ACTIVE]),
            "total_viewers": sum(s.viewer_count for s in streams),
            "total_views": sum(s.total_views for s in streams),
            "streams_by_quality": {
                q.value: len([s for s in streams if s.quality == q])
                for q in StreamQuality
            }
        }


video_streaming_service = VideoStreamingService()
