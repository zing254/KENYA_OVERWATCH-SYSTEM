"""
GPS Tracking Service
Real-time GPS tracking for responders and citizens
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

class UserType(Enum):
    RESPONDER = "responder"
    CITIZEN = "citizen"

@dataclass
class GPSPosition:
    """GPS position data"""
    user_id: str
    user_type: UserType
    latitude: float
    longitude: float
    accuracy: float = 10.0
    altitude: float = 0.0
    speed: float = 0.0
    heading: float = 0.0
    battery_level: float = 100.0
    timestamp: datetime = field(default_factory=datetime.now(timezone.utc))

class GPSTrackingService:
    """
    Real-time GPS tracking service
    """
    
    def __init__(self):
        self.positions: Dict[str, GPSPosition] = {}
        self.position_history: Dict[str, List[GPSPosition]] = {}
        self.max_history_per_user = 1000
        
    async def update_position(
        self,
        user_id: str,
        user_type: str,
        latitude: float,
        longitude: float,
        accuracy: float = 10.0,
        altitude: float = 0.0,
        speed: float = 0.0,
        heading: float = 0.0,
        battery_level: float = 100.0
    ) -> GPSPosition:
        """Update GPS position for a user"""
        position = GPSPosition(
            user_id=user_id,
            user_type=UserType(user_type),
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            altitude=altitude,
            speed=speed,
            heading=heading,
            battery_level=battery_level,
            timestamp=datetime.now(timezone.utc)()
        )
        
        self.positions[user_id] = position
        
        if user_id not in self.position_history:
            self.position_history[user_id] = []
        
        self.position_history[user_id].append(position)
        
        if len(self.position_history[user_id]) > self.max_history_per_user:
            self.position_history[user_id] = self.position_history[user_id][-self.max_history_per_user:]
        
        return position
    
    async def get_position(self, user_id: str) -> Optional[GPSPosition]:
        """Get current position of a user"""
        return self.positions.get(user_id)
    
    async def get_all_positions(
        self,
        user_type: Optional[str] = None,
        active_within_seconds: int = 300
    ) -> List[Dict[str, Any]]:
        """Get all active positions"""
        cutoff = datetime.now(timezone.utc)() - timedelta(seconds=active_within_seconds)
        
        results = []
        
        for user_id, position in self.positions.items():
            if user_type and position.user_type.value != user_type:
                continue
            if position.timestamp < cutoff:
                continue
                
            results.append({
                "user_id": user_id,
                "user_type": position.user_type.value,
                "latitude": position.latitude,
                "longitude": position.longitude,
                "accuracy": position.accuracy,
                "altitude": position.altitude,
                "speed": position.speed,
                "heading": position.heading,
                "battery_level": position.battery_level,
                "timestamp": position.timestamp.isoformat(),
                "is_moving": position.speed > 1.0
            })
        
        return results
    
    async def get_position_history(
        self,
        user_id: str,
        since: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get position history for a user"""
        history = self.position_history.get(user_id, [])
        
        if since:
            history = [p for p in history if p.timestamp >= since]
        
        history = history[-limit:]
        
        return [
            {
                "latitude": p.latitude,
                "longitude": p.longitude,
                "accuracy": p.accuracy,
                "speed": p.speed,
                "heading": p.heading,
                "timestamp": p.timestamp.isoformat()
            }
            for p in history
        ]
    
    async def calculate_distance(
        self,
        lat1: float, lon1: float,
        lat2: float, lon2: float
    ) -> float:
        """Calculate distance between two points in meters using Haversine"""
        import math
        
        R = 6371000  # Earth radius in meters
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = math.sin(delta_phi / 2) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda / 2) ** 2
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    async def get_nearest_users(
        self,
        latitude: float,
        longitude: float,
        user_type: Optional[str] = None,
        limit: int = 10,
        max_distance_meters: float = 50000
    ) -> List[Dict[str, Any]]:
        """Find nearest users to a location"""
        users_with_distance = []
        
        for user_id, position in self.positions.items():
            if user_type and position.user_type.value != user_type:
                continue
                
            distance = await self.calculate_distance(
                latitude, longitude,
                position.latitude, position.longitude
            )
            
            if distance <= max_distance_meters:
                users_with_distance.append({
                    "user_id": user_id,
                    "user_type": position.user_type.value,
                    "distance_meters": distance,
                    "latitude": position.latitude,
                    "longitude": position.longitude,
                    "speed": position.speed,
                    "heading": position.heading,
                    "timestamp": position.timestamp.isoformat()
                })
        
        users_with_distance.sort(key=lambda x: x["distance_meters"])
        
        return users_with_distance[:limit]
    
    async def get_route_to_destination(
        self,
        user_id: str,
        dest_latitude: float,
        dest_longitude: float
    ) -> Optional[Dict[str, Any]]:
        """Calculate route to destination (simplified)"""
        position = await self.get_position(user_id)
        
        if not position:
            return None
        
        distance = await self.calculate_distance(
            position.latitude, position.longitude,
            dest_latitude, dest_longitude
        )
        
        import math
        bearing = math.degrees(math.atan2(
            math.sin(math.radians(dest_longitude - position.longitude)) * math.cos(math.radians(dest_latitude)),
            math.cos(math.radians(position.latitude)) * math.sin(math.radians(dest_latitude)) -
            math.sin(math.radians(position.latitude)) * math.cos(math.radians(dest_latitude)) *
            math.cos(math.radians(dest_longitude - position.longitude))
        ))
        
        return {
            "user_id": user_id,
            "start": {
                "latitude": position.latitude,
                "longitude": position.longitude
            },
            "destination": {
                "latitude": dest_latitude,
                "longitude": dest_longitude
            },
            "distance_meters": distance,
            "distance_km": distance / 1000,
            "bearing_degrees": bearing,
            "estimated_time_minutes": (distance / 1000) * 3,
            "route_type": "driving"
        }
    
    async def cleanup_old_positions(self, hours: int = 24):
        """Remove old position data"""
        cutoff = datetime.now(timezone.utc)() - timedelta(hours=hours)
        
        for user_id in list(self.positions.keys()):
            if self.positions[user_id].timestamp < cutoff:
                del self.positions[user_id]
        
        for user_id in list(self.position_history.keys()):
            self.position_history[user_id] = [
                p for p in self.position_history[user_id]
                if p.timestamp >= cutoff
            ]
            
            if not self.position_history[user_id]:
                del self.position_history[user_id]
