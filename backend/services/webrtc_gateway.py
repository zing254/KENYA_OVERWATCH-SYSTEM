"""
WebRTC Gateway
Handles live streaming from citizen phones
"""

import logging
import asyncio
import json
from typing import Dict, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)


@dataclass
class CitizenStream:
    """A citizen's live video stream"""
    stream_id: str
    user_id: str
    session_id: str
    latitude: float
    longitude: float
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "connecting"  # connecting, live, ended
    quality: str = "low"
    frame_count: int = 0


class WebRTCGateway:
    """
    WebRTC Gateway for receiving live streams from citizen phones
    
    In production, this would integrate with:
    - A signaling server (e.g., using aiortc or mediasoup)
    - An SFU/MCU for multi-party streaming
    - STUN/TURN servers for NAT traversal
    
    This is a placeholder implementation showing the interface.
    """
    
    def __init__(self):
        self.active_streams: Dict[str, CitizenStream] = {}
        self.stream_callbacks: Dict[str, Callable] = {}
        self.user_sessions: Dict[str, Dict] = {}
        
        # Configuration
        self.max_concurrent_streams = 100
        self.stream_timeout_minutes = 30
    
    async def create_stream(
        self,
        user_id: str,
        latitude: float,
        longitude: float,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new citizen stream"""
        
        if len(self.active_streams) >= self.max_concurrent_streams:
            return {
                "success": False,
                "error": "Maximum concurrent streams reached"
            }
        
        stream_id = f"stream_{uuid.uuid4().hex[:12]}"
        session = session_id or uuid.uuid4().hex
        
        stream = CitizenStream(
            stream_id=stream_id,
            user_id=user_id,
            session_id=session,
            latitude=latitude,
            longitude=longitude,
            status="connecting"
        )
        
        self.active_streams[stream_id] = stream
        self.user_sessions[session] = {
            "stream_id": stream_id,
            "user_id": user_id,
            "started_at": stream.started_at.isoformat()
        }
        
        logger.info(f"Created stream {stream_id} for user {user_id}")
        
        return {
            "success": True,
            "stream_id": stream_id,
            "session_id": session,
            "ice_servers": self._get_ice_servers(),
            "config": {
                "max_bitrate": 1000000,
                "resolution": {"width": 640, "height": 480},
                "frame_rate": 15
            }
        }
    
    def _get_ice_servers(self) -> list:
        """Get ICE servers configuration"""
        # In production, use actual STUN/TURN servers
        return [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"}
        ]
    
    async def start_stream(self, stream_id: str) -> bool:
        """Mark stream as live"""
        
        if stream_id not in self.active_streams:
            return False
        
        self.active_streams[stream_id].status = "live"
        logger.info(f"Stream {stream_id} is now live")
        
        return True
    
    async def end_stream(self, stream_id: str) -> Dict:
        """End a citizen stream"""
        
        if stream_id not in self.active_streams:
            return {"success": False, "error": "Stream not found"}
        
        stream = self.active_streams[stream_id]
        stream.status = "ended"
        
        duration = (datetime.now(timezone.utc) - stream.started_at).total_seconds()
        
        # Clean up
        del self.active_streams[stream_id]
        
        logger.info(f"Stream {stream_id} ended after {duration:.0f}s")
        
        return {
            "success": True,
            "stream_id": stream_id,
            "duration_seconds": duration,
            "frames_processed": stream.frame_count
        }
    
    async def handle_frame(
        self,
        stream_id: str,
        frame_data: bytes,
        frame_info: Dict
    ) -> bool:
        """Handle incoming frame from citizen stream"""
        
        if stream_id not in self.active_streams:
            return False
        
        stream = self.active_streams[stream_id]
        
        if stream.status != "live":
            return False
        
        stream.frame_count += 1
        
        # Process frame (in production, would pass to AI pipeline)
        if stream_id in self.stream_callbacks:
            try:
                await self.stream_callbacks[stream_id]({
                    "stream_id": stream_id,
                    "frame": frame_data,
                    "info": frame_info,
                    "location": {
                        "lat": stream.latitude,
                        "lng": stream.longitude
                    }
                })
            except Exception as e:
                logger.error(f"Frame callback error: {e}")
        
        return True
    
    def register_frame_callback(
        self,
        stream_id: str,
        callback: Callable
    ):
        """Register callback for stream frames"""
        self.stream_callbacks[stream_id] = callback
    
    def unregister_callback(self, stream_id: str):
        """Unregister frame callback"""
        if stream_id in self.stream_callbacks:
            del self.stream_callbacks[stream_id]
    
    def get_active_streams(self) -> list:
        """Get all active streams"""
        return [
            {
                "stream_id": s.stream_id,
                "user_id": s.user_id,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "started_at": s.started_at.isoformat(),
                "status": s.status,
                "frame_count": s.frame_count
            }
            for s in self.active_streams.values()
            if s.status == "live"
        ]
    
    def get_stream(self, stream_id: str) -> Optional[Dict]:
        """Get stream info"""
        if stream_id not in self.active_streams:
            return None
        
        stream = self.active_streams[stream_id]
        return {
            "stream_id": stream.stream_id,
            "user_id": stream.user_id,
            "latitude": stream.latitude,
            "longitude": stream.longitude,
            "started_at": stream.started_at.isoformat(),
            "status": stream.status,
            "quality": stream.quality
        }


# Global WebRTC gateway
webrtc_gateway = WebRTCGateway()


# Signaling server placeholder
class SignalingServer:
    """WebRTC signaling server for stream negotiation"""
    
    def __init__(self):
        self.pending_offers: Dict[str, Dict] = {}
        self.connected_clients: Dict[str, set] = {}  # stream_id -> set of client_ids
    
    async def handle_offer(
        self,
        stream_id: str,
        offer: Dict,
        client_id: str
    ) -> Dict:
        """Handle WebRTC offer from citizen"""
        
        # In production, this would:
        # 1. Validate the offer
        # 2. Create or join a room for the stream
        # 3. Forward to appropriate handlers
        
        self.pending_offers[stream_id] = {
            "offer": offer,
            "client_id": client_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Return SDP answer (would be generated by backend)
        return {
            "type": "answer",
            "sdp": "placeholder_sdp_answer"
        }
    
    async def handle_ice_candidate(
        self,
        stream_id: str,
        candidate: Dict,
        client_id: str
    ):
        """Handle ICE candidate exchange"""
        
        # Forward to other participants in the stream
        pass
    
    async def notify_viewers(
        self,
        stream_id: str,
        event: str,
        data: Dict
    ):
        """Notify viewers of stream events"""
        
        if stream_id in self.connected_clients:
            # Would use WebSocket to notify
            pass
