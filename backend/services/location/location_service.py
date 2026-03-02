"""
Responder Location Service
Tracks real-time GPS locations of responders via WebSocket
"""

import logging
import asyncio
from typing import Dict, List, Optional, Callable
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict

logger = logging.getLogger(__name__)


@dataclass
class LocationUpdate:
    responder_id: str
    latitude: float
    longitude: float
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    accuracy: float = 0.0
    speed: float = 0.0  # km/h
    heading: float = 0.0  # degrees


class ResponderLocationService:
    """Manages responder GPS locations with Redis for persistence"""
    
    def __init__(self):
        # In-memory storage (would be Redis in production)
        self.locations: Dict[str, LocationUpdate] = {}
        self.subscribers: List[Callable] = []
        
        # Try to use Redis if available
        self.redis_client = None
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis connection"""
        try:
            import redis
            redis_url = "redis://localhost:6379/0"
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("Redis connected for location service")
        except Exception as e:
            logger.warning(f"Redis not available, using in-memory: {e}")
            self.redis_client = None
    
    def update_location(
        self,
        responder_id: str,
        latitude: float,
        longitude: float,
        accuracy: float = 0.0,
        speed: float = 0.0,
        heading: float = 0.0
    ) -> bool:
        """Update responder's location"""
        
        location = LocationUpdate(
            responder_id=responder_id,
            latitude=latitude,
            longitude=longitude,
            timestamp=datetime.now(timezone.utc),
            accuracy=accuracy,
            speed=speed,
            heading=heading
        )
        
        # Store in memory
        self.locations[responder_id] = location
        
        # Store in Redis if available
        if self.redis_client:
            try:
                key = f"responder:location:{responder_id}"
                self.redis_client.hset(key, mapping={
                    'latitude': str(latitude),
                    'longitude': str(longitude),
                    'timestamp': location.timestamp.isoformat(),
                    'accuracy': str(accuracy),
                    'speed': str(speed),
                    'heading': str(heading)
                })
                # Set expiry of 5 minutes
                self.redis_client.expire(key, 300)
            except Exception as e:
                logger.error(f"Redis update error: {e}")
        
        # Notify subscribers
        self._notify_subscribers(location)
        
        return True
    
    def get_location(self, responder_id: str) -> Optional[LocationUpdate]:
        """Get responder's current location"""
        
        # Try memory first
        if responder_id in self.locations:
            return self.locations[responder_id]
        
        # Try Redis
        if self.redis_client:
            try:
                key = f"responder:location:{responder_id}"
                data = self.redis_client.hgetall(key)
                
                if data:
                    location = LocationUpdate(
                        responder_id=responder_id,
                        latitude=float(data.get('latitude', 0)),
                        longitude=float(data.get('longitude', 0)),
                        timestamp=datetime.fromisoformat(data['timestamp']),
                        accuracy=float(data.get('accuracy', 0)),
                        speed=float(data.get('speed', 0)),
                        heading=float(data.get('heading', 0))
                    )
                    self.locations[responder_id] = location
                    return location
            except Exception as e:
                logger.error(f"Redis get error: {e}")
        
        return None
    
    def get_all_locations(self) -> List[LocationUpdate]:
        """Get all responder locations"""
        return list(self.locations.values())
    
    def get_locations_by_type(self, responder_type: str) -> Dict[str, LocationUpdate]:
        """Get locations filtered by responder type"""
        # In production, this would query from Redis by type
        result = {}
        for rid, loc in self.locations.items():
            # Would need to look up type from dispatch coordinator
            result[rid] = loc
        return result
    
    def subscribe(self, callback: Callable[[LocationUpdate], None]):
        """Subscribe to location updates"""
        self.subscribers.append(callback)
    
    def unsubscribe(self, callback: Callable):
        """Unsubscribe from location updates"""
        if callback in self.subscribers:
            self.subscribers.remove(callback)
    
    def _notify_subscribers(self, location: LocationUpdate):
        """Notify all subscribers of location update"""
        for callback in self.subscribers:
            try:
                callback(location)
            except Exception as e:
                logger.error(f"Subscriber error: {e}")
    
    def get_responders_in_radius(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0
    ) -> List[Dict]:
        """Find responders within radius of a location"""
        
        import math
        
        result = []
        
        for responder_id, location in self.locations.items():
            distance = self._haversine_distance(
                latitude, longitude,
                location.latitude, location.longitude
            )
            
            if distance <= radius_km:
                result.append({
                    'responder_id': responder_id,
                    'distance_km': round(distance, 2),
                    'latitude': location.latitude,
                    'longitude': location.longitude,
                    'speed': location.speed,
                    'timestamp': location.timestamp.isoformat()
                })
        
        return sorted(result, key=lambda x: x['distance_km'])
    
    def _haversine_distance(self, lat1: float, lon1: float, 
                          lat2: float, lon2: float) -> float:
        """Calculate distance in km"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth radius in km
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    def broadcast_locations(self):
        """Broadcast all locations to WebSocket"""
        # This would integrate with WebSocket manager
        pass


# Global instance
location_service = ResponderLocationService()
