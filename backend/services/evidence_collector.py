"""
Evidence Collection Service
Automatically captures screenshots, video snippets for incidents
"""

import asyncio
import uuid
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from pathlib import Path

try:
    import numpy as np
except ImportError:
    np = None  # type: ignore

try:
    import cv2
except ImportError:
    cv2 = None  # type: ignore

logger = logging.getLogger(__name__)


class EvidenceCollector:
    """
    Automated evidence collection for incidents
    Captures screenshots and video snippets around incident time
    """

    def __init__(self, storage_path: str = "/data/evidence"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.buffer_size = 30  # Keep 30 seconds of buffer

    async def capture_screenshot(
        self,
        frame: np.ndarray,
        incident_id: str,
        camera_id: str,
        detection_info: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Capture screenshot with metadata"""
        screenshot_id = str(uuid.uuid4())

        timestamp = datetime.now(timezone.utc)
        filename = (
            f"{incident_id}_{camera_id}_{timestamp.strftime('%Y%m%d_%H%M%S')}.jpg"
        )
        filepath = self.storage_path / filename

        cv2.imwrite(str(filepath), frame)

        evidence = {
            "id": screenshot_id,
            "type": "screenshot",
            "filename": filename,
            "filepath": str(filepath),
            "incident_id": incident_id,
            "camera_id": camera_id,
            "timestamp": timestamp.isoformat(),
            "detection_info": detection_info,
            "checksum": self._calculate_checksum(filepath),
        }

        return evidence

    async def capture_video_snippet(
        self,
        frames_buffer: List[np.ndarray],
        incident_id: str,
        camera_id: str,
        duration_seconds: float = 3.0,
        before_seconds: float = 1.5,
        after_seconds: float = 1.5,
    ) -> Dict[str, Any]:
        """Capture video snippet from frames buffer"""
        snippet_id = str(uuid.uuid4())

        timestamp = datetime.now(timezone.utc)
        filename = (
            f"{incident_id}_{camera_id}_{timestamp.strftime('%Y%m%d_%H%M%S')}.mp4"
        )
        filepath = self.storage_path / filename

        if len(frames_buffer) > 0:
            height, width = frames_buffer[0].shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out = cv2.VideoWriter(str(filepath), fourcc, 30.0, (width, height))

            for frame in frames_buffer:
                out.write(frame)

            out.release()

        evidence = {
            "id": snippet_id,
            "type": "video",
            "filename": filename,
            "filepath": str(filepath),
            "incident_id": incident_id,
            "camera_id": camera_id,
            "timestamp": timestamp.isoformat(),
            "duration": duration_seconds,
            "frames_before": int(before_seconds * 30),
            "frames_after": int(after_seconds * 30),
            "checksum": (
                self._calculate_checksum(filepath) if filepath.exists() else None
            ),
        }

        return evidence

    async def generate_report(
        self,
        incident_id: str,
        evidence_list: List[Dict[str, Any]],
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate comprehensive evidence report"""
        report_id = str(uuid.uuid4())

        report = {
            "id": report_id,
            "incident_id": incident_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata,
            "evidence": evidence_list,
            "summary": {
                "total_screenshots": len(
                    [e for e in evidence_list if e.get("type") == "screenshot"]
                ),
                "total_videos": len(
                    [e for e in evidence_list if e.get("type") == "video"]
                ),
                "total_files": len(evidence_list),
            },
        }

        report_path = self.storage_path / f"{incident_id}_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        return report

    def _calculate_checksum(self, filepath: Path) -> str:
        """Calculate SHA-256 checksum of file"""
        import hashlib

        sha256 = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)

        return sha256.hexdigest()

    async def cleanup_old_evidence(self, days: int = 90):
        """Clean up evidence older than specified days"""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        for filepath in self.storage_path.glob("*"):
            if filepath.is_file():
                mtime = datetime.fromtimestamp(filepath.stat().st_mtime)
                if mtime < cutoff:
                    filepath.unlink()
                    logger.info(f"Deleted old evidence: {filepath.name}")


class FrameBuffer:
    """
    Ring buffer for storing frames before incident detection
    """

    def __init__(self, max_frames: int = 90):  # 3 seconds at 30fps
        self.max_frames = max_frames
        self.buffer = []
        self.lock = asyncio.Lock()

    async def add_frame(self, frame: np.ndarray):
        """Add frame to buffer"""
        async with self.lock:
            self.buffer.append(frame.copy())

            if len(self.buffer) > self.max_frames:
                self.buffer.pop(0)

    async def get_frames_before(self, count: int) -> List[np.ndarray]:
        """Get N frames before current"""
        async with self.lock:
            return [frame.copy() for frame in self.buffer[-count:]]

    async def get_all_frames(self) -> List[np.ndarray]:
        """Get all frames in buffer"""
        async with self.lock:
            return [frame.copy() for frame in self.buffer]

    async def clear(self):
        """Clear buffer"""
        async with self.lock:
            self.buffer.clear()

    async def get_duration_seconds(self, fps: int = 30) -> float:
        """Get buffer duration in seconds"""
        async with self.lock:
            return len(self.buffer) / fps
