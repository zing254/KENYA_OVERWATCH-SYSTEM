import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.road_safety_api import app, system_settings


class TestSettingsAPI:
    def setup_method(self):
        system_settings.settings = {
            "ai": {
                "confidence_threshold": 0.7,
                "risk_threshold": 0.7,
                "detect_persons": True,
                "detect_vehicles": True,
            },
            "alerts": {
                "critical_alerts": True,
                "traffic_alerts": True,
            },
            "audio": {
                "sound_enabled": True,
                "alert_volume": 80,
            },
            "notifications": {
                "email_enabled": True,
                "auto_refresh": True,
            },
            "map": {
                "map_type": "standard",
                "auto_refresh": True,
            },
            "cameras": {
                "default_resolution": "720p",
                "ptz_enabled": True,
            },
            "system": {
                "retention_days": 90,
                "max_upload_size": 10,
            },
        }

    def test_get_all_settings(self):
        client = TestClient(app)
        response = client.get("/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "ai" in data
        assert "alerts" in data
        assert "audio" in data

    def test_get_category_settings(self):
        client = TestClient(app)
        response = client.get("/api/settings?category=ai")
        assert response.status_code == 200
        data = response.json()
        assert "confidence_threshold" in data
        assert "risk_threshold" in data

    def test_update_ai_settings(self):
        client = TestClient(app)
        response = client.put(
            "/api/settings/ai",
            json={"confidence_threshold": 0.8, "detect_persons": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["confidence_threshold"] == 0.8
        assert data["detect_persons"] == False

    def test_update_alerts_settings(self):
        client = TestClient(app)
        response = client.put(
            "/api/settings/alerts",
            json={"critical_alerts": False, "traffic_alerts": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["critical_alerts"] == False

    def test_update_audio_settings(self):
        client = TestClient(app)
        response = client.put(
            "/api/settings/audio", json={"sound_enabled": False, "alert_volume": 50}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sound_enabled"] == False
        assert data["alert_volume"] == 50

    def test_update_map_settings(self):
        client = TestClient(app)
        response = client.put(
            "/api/settings/map", json={"map_type": "satellite", "gps_tracking": False}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["map_type"] == "satellite"
        assert data["gps_tracking"] == False

    def test_update_cameras_settings(self):
        client = TestClient(app)
        response = client.put(
            "/api/settings/cameras",
            json={"default_resolution": "1080p", "ptz_enabled": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["default_resolution"] == "1080p"
        assert data["ptz_enabled"] == False

    def test_update_system_settings(self):
        client = TestClient(app)
        response = client.put(
            "/api/settings/system", json={"retention_days": 30, "max_upload_size": 5}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["retention_days"] == 30
        assert data["max_upload_size"] == 5

    def test_reset_settings(self):
        client = TestClient(app)
        client.put("/api/settings/ai", json={"confidence_threshold": 0.9})
        response = client.post("/api/settings/reset")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "reset"
        assert data["settings"]["ai"]["confidence_threshold"] == 0.7

    def test_update_notifications_settings(self):
        client = TestClient(app)
        response = client.put(
            "/api/settings/notifications",
            json={"email_enabled": False, "sms_enabled": True, "refresh_interval": 60},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email_enabled"] == False
        assert data["sms_enabled"] == True
        assert data["refresh_interval"] == 60


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
