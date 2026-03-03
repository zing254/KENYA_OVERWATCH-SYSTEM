from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable
from datetime import datetime
import math


@dataclass
class RoadSign:
    sign_id: str
    sign_type: str
    latitude: float
    longitude: float
    description: str
    warning_radius_meters: float = 100.0
    alert_sound: Optional[str] = "default"
    active: bool = True


@dataclass
class SignAlert:
    alert_id: str
    sign: RoadSign
    distance_meters: float
    timestamp: datetime
    acknowledged: bool = False


class RoadSignAlertSystem:
    SIGN_TYPES = {
        "speed_bump": {
            "warning": "Speed Bump Ahead",
            "icon": "⚠️",
            "radius": 150,
            "sound": "bump_alert"
        },
        "school_zone": {
            "warning": "School Zone Ahead",
            "icon": "🎓",
            "radius": 200,
            "sound": "school_alert"
        },
        "dangerous_curve": {
            "warning": "Dangerous Curve Ahead",
            "icon": "🔄",
            "radius": 180,
            "sound": "curve_alert"
        },
        "railway_crossing": {
            "warning": "Railway Crossing Ahead",
            "icon": "🚂",
            "radius": 250,
            "sound": "railway_alert"
        },
        "road_narrow": {
            "warning": "Road Narrows Ahead",
            "icon": "↔️",
            "radius": 120,
            "sound": "narrow_alert"
        },
        "steep_hill": {
            "warning": "Steep Hill Ahead",
            "icon": "⛰️",
            "radius": 150,
            "sound": "hill_alert"
        },
        "slippery": {
            "warning": "Slippery Road",
            "icon": "❄️",
            "radius": 100,
            "sound": "slippery_alert"
        },
        "no_overtaking": {
            "warning": "No Overtaking Zone",
            "icon": "🚫",
            "radius": 100,
            "sound": "no_overtake_alert"
        },
        "traffic_light": {
            "warning": "Traffic Light Ahead",
            "icon": "🚦",
            "radius": 100,
            "sound": "traffic_light_alert"
        },
        "pedestrian_crossing": {
            "warning": "Pedestrian Crossing Ahead",
            "icon": "🚶",
            "radius": 100,
            "sound": "pedestrian_alert"
        }
    }

    def __init__(self):
        self.registered_signs: Dict[str, RoadSign] = {}
        self.alert_callbacks: List[Callable[[SignAlert], None]] = []
        self.active_alerts: Dict[str, SignAlert] = {}
        self._load_default_signs()

    def _load_default_signs(self):
        nairobi_signs = [
            RoadSign("SIG001", "speed_bump", -1.2921, 36.8219, "Mombasa Road Speed Bump", 150, "bump_alert"),
            RoadSign("SIG002", "school_zone", -1.2864, 36.8232, "CBD School Zone", 200, "school_alert"),
            RoadSign("SIG003", "dangerous_curve", -1.3300, 36.9800, "Mombasa Road Curve", 180, "curve_alert"),
            RoadSign("SIG004", "railway_crossing", -1.3100, 36.8500, "Industrial Area Railway", 250, "railway_alert"),
            RoadSign("SIG005", "steep_hill", -1.0800, 37.1000, "Thika Highway Hill", 150, "hill_alert"),
            RoadSign("SIG006", "pedestrian_crossing", -1.3000, 36.8100, "Kenyatta Avenue Crossing", 100, "pedestrian_alert"),
            RoadSign("SIG007", "traffic_light", -1.2850, 36.8250, "City Center Traffic Light", 100, "traffic_light_alert"),
            RoadSign("SIG008", "slippery", -1.2500, 36.9000, "Highland Area Slippery", 100, "slippery_alert"),
        ]
        
        for sign in nairobi_signs:
            self.registered_signs[sign.sign_id] = sign

    def register_sign(self, sign: RoadSign):
        self.registered_signs[sign.sign_id] = sign

    def unregister_sign(self, sign_id: str):
        if sign_id in self.registered_signs:
            del self.registered_signs[sign_id]

    def check_proximity(self, latitude: float, longitude: float) -> List[SignAlert]:
        alerts = []
        
        for sign in self.registered_signs.values():
            if not sign.active:
                continue
                
            distance = self._calculate_distance(
                latitude, longitude,
                sign.latitude, sign.longitude
            )
            
            if distance <= sign.warning_radius_meters:
                alert = SignAlert(
                    alert_id=f"ALT_{sign.sign_id}_{int(datetime.now().timestamp())}",
                    sign=sign,
                    distance_meters=distance,
                    timestamp=datetime.now()
                )
                alerts.append(alert)
                self.active_alerts[alert.alert_id] = alert
                
                for callback in self.alert_callbacks:
                    callback(alert)
        
        return alerts

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

    def register_alert_callback(self, callback: Callable[[SignAlert], None]):
        self.alert_callbacks.append(callback)

    def acknowledge_alert(self, alert_id: str):
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id].acknowledged = True

    def get_active_alerts(self) -> List[SignAlert]:
        return [a for a in self.active_alerts.values() if not a.acknowledged]

    def get_signs_in_area(self, latitude: float, longitude: float, radius_km: float) -> List[RoadSign]:
        signs = []
        for sign in self.registered_signs.values():
            distance_km = self._calculate_distance(latitude, longitude, sign.latitude, sign.longitude) / 1000
            if distance_km <= radius_km:
                signs.append(sign)
        return signs

    def get_sign_by_type(self, sign_type: str) -> List[RoadSign]:
        return [s for s in self.registered_signs.values() if s.sign_type == sign_type]


road_sign_system = RoadSignAlertSystem()
