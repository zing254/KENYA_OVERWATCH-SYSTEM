"""
Sound Alert Manager
Manages audio alerts for different incident types
"""

from typing import Dict, Optional
from enum import Enum
from dataclasses import dataclass


class AlertSound(Enum):
    """Alert sound types"""

    CRITICAL_INCIDENT = "critical"
    TRAFFIC_VIOLATION = "traffic"
    PERSON_DETECTED = "person"
    VEHICLE_OF_INTEREST = "vehicle_interest"
    TEAM_DISPATCHED = "dispatch"
    NEW_CITIZEN_REPORT = "citizen_report"
    SYSTEM_ALERT = "system"
    CAMERA_OFFLINE = "camera_offline"
    EMERGENCY = "emergency"


@dataclass
class AlertConfig:
    """Configuration for an alert sound"""

    name: str
    sound_file: str
    volume: float = 1.0
    enabled: bool = True
    repeat: int = 1
    duration: Optional[float] = None


class SoundAlertManager:
    """
    Manages audio alerts for the control center
    """

    def __init__(self, sounds_dir: str = "/data/sounds"):
        self.sounds_dir = sounds_dir
        self.alerts_config: Dict[AlertSound, AlertConfig] = {
            AlertSound.CRITICAL_INCIDENT: AlertConfig(
                name="Critical Incident",
                sound_file="critical.mp3",
                volume=1.0,
                repeat=3,
            ),
            AlertSound.TRAFFIC_VIOLATION: AlertConfig(
                name="Traffic Violation",
                sound_file="traffic_horn.mp3",
                volume=0.7,
                repeat=1,
            ),
            AlertSound.PERSON_DETECTED: AlertConfig(
                name="Person Detected", sound_file="ping.mp3", volume=0.3, repeat=1
            ),
            AlertSound.VEHICLE_OF_INTEREST: AlertConfig(
                name="Vehicle of Interest",
                sound_file="warning.mp3",
                volume=0.9,
                repeat=2,
            ),
            AlertSound.TEAM_DISPATCHED: AlertConfig(
                name="Team Dispatched",
                sound_file="radio_chirp.mp3",
                volume=0.6,
                repeat=1,
            ),
            AlertSound.NEW_CITIZEN_REPORT: AlertConfig(
                name="New Citizen Report",
                sound_file="notification.mp3",
                volume=0.5,
                repeat=1,
            ),
            AlertSound.SYSTEM_ALERT: AlertConfig(
                name="System Alert", sound_file="beep.mp3", volume=0.4, repeat=1
            ),
            AlertSound.CAMERA_OFFLINE: AlertConfig(
                name="Camera Offline", sound_file="offline.mp3", volume=0.5, repeat=2
            ),
            AlertSound.EMERGENCY: AlertConfig(
                name="Emergency", sound_file="emergency.mp3", volume=1.0, repeat=5
            ),
        }

        self.global_volume = 1.0
        self.muted = False

    def set_volume(self, alert_type: AlertSound, volume: float):
        """Set volume for specific alert type"""
        if alert_type in self.alerts_config:
            self.alerts_config[alert_type].volume = max(0, min(1, volume))

    def set_enabled(self, alert_type: AlertSound, enabled: bool):
        """Enable/disable specific alert"""
        if alert_type in self.alerts_config:
            self.alerts_config[alert_type].enabled = enabled

    def set_global_volume(self, volume: float):
        """Set global volume"""
        self.global_volume = max(0, min(1, volume))

    def toggle_mute(self) -> bool:
        """Toggle mute state"""
        self.muted = not self.muted
        return self.muted

    def get_config(self) -> Dict:
        """Get all alert configurations"""
        return {
            "global_volume": self.global_volume,
            "muted": self.muted,
            "alerts": {
                alert_type.value: {
                    "name": config.name,
                    "volume": config.volume,
                    "enabled": config.enabled,
                    "repeat": config.repeat,
                }
                for alert_type, config in self.alerts_config.items()
            },
        }

    def update_config(self, config: Dict):
        """Update configurations"""
        if "global_volume" in config:
            self.global_volume = config["global_volume"]
        if "muted" in config:
            self.muted = config["muted"]
        if "alerts" in config:
            for alert_key, alert_config in config["alerts"].items():
                try:
                    alert_type = AlertSound(alert_key)
                    if alert_type in self.alerts_config:
                        if "volume" in alert_config:
                            self.alerts_config[alert_type].volume = alert_config[
                                "volume"
                            ]
                        if "enabled" in alert_config:
                            self.alerts_config[alert_type].enabled = alert_config[
                                "enabled"
                            ]
                        if "repeat" in alert_config:
                            self.alerts_config[alert_type].repeat = alert_config[
                                "repeat"
                            ]
                except ValueError:
                    pass


class VoiceAlertManager:
    """
    Manages voice alerts using TTS
    """

    def __init__(self):
        self.enabled = True
        self.rate = 1.0
        self.pitch = 1.0
        self.voice_type = "male"

    def format_alert_message(self, alert_type: str, data: Dict) -> str:
        """Format alert data into voice message"""

        messages = {
            "critical": f"CRITICAL ALERT: {data.get('title', 'Incident')} at {data.get('location', 'Unknown location')}. Immediate response required.",
            "traffic": f"Traffic violation detected: Plate {data.get('plate', 'Unknown')} at {data.get('location', 'Unknown location')}. Dispatching traffic team.",
            "vehicle_interest": f"VEHICLE OF INTEREST REIDENTIFIED: Plate {data.get('plate', 'Unknown')} at {data.get('location', 'Unknown location')}. Previous incident {data.get('incident_number', 'Unknown')}.",
            "dispatch": f"Unit {data.get('team_name', 'Team')} dispatched to {data.get('location', 'Unknown location')}. ETA {data.get('eta', 'Unknown')} minutes.",
            "citizen_report": f"New citizen report: {data.get('title', 'Report')} at {data.get('location', 'Unknown location')}.",
            "camera_offline": f"Camera {data.get('camera_id', 'Unknown')} is now offline.",
            "emergency": f"EMERGENCY: {data.get('title', 'Emergency')} reported at {data.get('location', 'Unknown location')}. All units respond.",
        }

        return messages.get(alert_type, f"Alert: {data.get('title', 'Notification')}")

    def get_config(self) -> Dict:
        """Get voice configuration"""
        return {
            "enabled": self.enabled,
            "rate": self.rate,
            "pitch": self.pitch,
            "voice_type": self.voice_type,
        }

    def update_config(self, config: Dict):
        """Update voice configuration"""
        if "enabled" in config:
            self.enabled = config["enabled"]
        if "rate" in config:
            self.rate = config["rate"]
        if "pitch" in config:
            self.pitch = config["pitch"]
        if "voice_type" in config:
            self.voice_type = config["voice_type"]


class RadioCallSimulator:
    """
    Simulates military/police radio calls
    """

    PHRASES = {
        "dispatch": [
            "Base to Unit {unit}, copy?",
            "Unit {unit}, dispatch to {location}, priority {priority}.",
            "Copy, en route to {location}. ETA {eta} minutes.",
            "10-4, proceeding to location.",
        ],
        "arrival": [
            "Unit {unit} on scene.",
            "Arriving at {location}, requesting backup.",
            "On scene, assessing situation.",
        ],
        "status": [
            "Unit {unit} status check.",
            "All units be advised.",
            "Copy that.",
        ],
        "emergency": [
            "ALL UNITS RESPOND - {location} - PRIORITY ONE",
            "EMERGENCY TRAFFIC - {details}",
            "Officer needs assistance - all units respond",
        ],
    }

    def format_radio_call(self, call_type: str, data: Dict) -> list[str]:
        """Format radio call phrases"""
        phrases = self.PHRASES.get(call_type, [])
        return [phrase.format(**data) for phrase in phrases]

    def simulate_dispatch(
        self, team_name: str, location: str, priority: str, eta: int
    ) -> list[str]:
        """Generate dispatch radio call"""
        data = {
            "unit": team_name,
            "location": location,
            "priority": priority,
            "eta": str(eta),
        }
        return self.format_radio_call("dispatch", data)
