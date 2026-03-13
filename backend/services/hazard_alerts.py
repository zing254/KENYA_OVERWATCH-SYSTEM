"""
Hazard Alert Service
Real-time hazard detection and alerting system
"""

import random
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Callable, Optional
from dataclasses import dataclass, field
from enum import Enum


class AlertPriority(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertCategory(Enum):
    FLOOD = "flood"
    LANDSLIDE = "landslide"
    ROAD_DAMAGE = "road_damage"
    WEATHER = "weather"
    TRAFFIC = "traffic"
    INFRASTRUCTURE = "infrastructure"


@dataclass
class HazardAlert:
    alert_id: str
    title: str
    message: str
    county: str
    region: str
    category: AlertCategory
    priority: AlertPriority
    latitude: float
    longitude: float
    affected_roads: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None


class AlertManager:
    def __init__(self):
        self.active_alerts: List[HazardAlert] = []
        self.alert_history: List[HazardAlert] = []
        self.subscribers: List[Callable] = []
        self._generate_initial_alerts()
    
    def _generate_initial_alerts(self):
        counties = [
            ("Nairobi", "Central", -1.2921, 36.8219),
            ("Mombasa", "Coastal", -4.0435, 39.6682),
            ("Kisumu", "Nyanza", -0.1022, 34.7617),
            ("Nakuru", "Rift Valley", -0.3034, 36.0800),
            ("Eldoret", "Rift Valley", 0.5144, 35.2698),
            ("Garissa", "North Eastern", -0.4536, 39.6401),
            ("Kakamega", "Western", 0.2827, 34.7519),
            ("Meru", "Eastern", 0.0500, 37.6500),
        ]
        
        alert_templates = [
            (AlertCategory.FLOOD, AlertPriority.HIGH, "Flash Flood Warning", "Heavy rainfall has been detected. Possible flooding on nearby roads."),
            (AlertCategory.LANDSLIDE, AlertPriority.CRITICAL, "Landslide Risk", "Soil saturation levels high. Landslide possible on steep terrain."),
            (AlertCategory.ROAD_DAMAGE, AlertPriority.MEDIUM, "Road Surface Damage", "Pothole or road damage reported. Exercise caution."),
            (AlertCategory.WEATHER, AlertPriority.HIGH, "Severe Weather Alert", "Thunderstorms expected. Reduced visibility on roads."),
            (AlertCategory.TRAFFIC, AlertPriority.MEDIUM, "Heavy Traffic", "Congestion detected. Expect delays."),
            (AlertCategory.INFRASTRUCTURE, AlertPriority.LOW, "Road Work", "Construction work ongoing. Follow diversion signs."),
        ]
        
        for i, (county, region, lat, lon) in enumerate(counties[:5]):
            category, priority, title, message = random.choice(alert_templates)
            
            alert = HazardAlert(
                alert_id=f"HAZ-{1000 + i}",
                title=title,
                message=message,
                county=county,
                region=region,
                category=category,
                priority=priority,
                latitude=lat + random.uniform(-0.05, 0.05),
                longitude=lon + random.uniform(-0.05, 0.05),
                affected_roads=[f"Road {j+1}" for j in range(random.randint(1, 3))],
                created_at=datetime.now(timezone.utc)
            )
            self.active_alerts.append(alert)
    
    def subscribe(self, callback: Callable):
        self.subscribers.append(callback)
    
    def unsubscribe(self, callback: Callable):
        if callback in self.subscribers:
            self.subscribers.remove(callback)
    
    async def _notify_subscribers(self, alert: HazardAlert):
        for callback in self.subscribers:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(alert)
                else:
                    callback(alert)
            except Exception:
                pass
    
    def create_alert(
        self,
        title: str,
        message: str,
        county: str,
        region: str,
        category: AlertCategory,
        priority: AlertPriority,
        latitude: float,
        longitude: float,
        affected_roads: Optional[List[str]] = None
    ) -> HazardAlert:
        alert = HazardAlert(
            alert_id=f"HAZ-{random.randint(10000, 99999)}",
            title=title,
            message=message,
            county=county,
            region=region,
            category=category,
            priority=priority,
            latitude=latitude,
            longitude=longitude,
            affected_roads=affected_roads or []
        )
        
        self.active_alerts.append(alert)
        asyncio.create_task(self._notify_subscribers(alert))
        
        return alert
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> Optional[HazardAlert]:
        for alert in self.active_alerts:
            if alert.alert_id == alert_id:
                alert.acknowledged = True
                alert.acknowledged_by = acknowledged_by
                alert.acknowledged_at = datetime.now(timezone.utc)
                return alert
        return None
    
    def resolve_alert(self, alert_id: str) -> Optional[HazardAlert]:
        for i, alert in enumerate(self.active_alerts):
            if alert.alert_id == alert_id:
                resolved = self.active_alerts.pop(i)
                self.alert_history.append(resolved)
                return resolved
        return None
    
    def get_active_alerts(
        self,
        county: Optional[str] = None,
        priority: Optional[AlertPriority] = None,
        category: Optional[AlertCategory] = None
    ) -> List[HazardAlert]:
        alerts = self.active_alerts
        
        if county:
            alerts = [a for a in alerts if a.county == county]
        if priority:
            alerts = [a for a in alerts if a.priority == priority]
        if category:
            alerts = [a for a in alerts if a.category == category]
        
        return sorted(alerts, key=lambda x: (
            0 if x.priority == AlertPriority.CRITICAL else
            1 if x.priority == AlertPriority.HIGH else
            2 if x.priority == AlertPriority.MEDIUM else 3
        ))
    
    def get_alert_summary(self) -> Dict:
        return {
            "total_active": len(self.active_alerts),
            "by_priority": {
                "critical": len([a for a in self.active_alerts if a.priority == AlertPriority.CRITICAL]),
                "high": len([a for a in self.active_alerts if a.priority == AlertPriority.HIGH]),
                "medium": len([a for a in self.active_alerts if a.priority == AlertPriority.MEDIUM]),
                "low": len([a for a in self.active_alerts if a.priority == AlertPriority.LOW])
            },
            "by_category": {
                c.value: len([a for a in self.active_alerts if a.category == c])
                for c in AlertCategory
            },
            "by_county": self._group_by_county()
        }
    
    def _group_by_county(self) -> Dict[str, int]:
        counts = {}
        for alert in self.active_alerts:
            counts[alert.county] = counts.get(alert.county, 0) + 1
        return counts
    
    def to_dict(self, alert: HazardAlert) -> Dict:
        return {
            "alert_id": alert.alert_id,
            "title": alert.title,
            "message": alert.message,
            "county": alert.county,
            "region": alert.region,
            "category": alert.category.value,
            "priority": alert.priority.value,
            "latitude": alert.latitude,
            "longitude": alert.longitude,
            "affected_roads": alert.affected_roads,
            "created_at": alert.created_at.isoformat(),
            "acknowledged": alert.acknowledged,
            "acknowledged_by": alert.acknowledged_by,
            "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
        }


alert_manager = AlertManager()
