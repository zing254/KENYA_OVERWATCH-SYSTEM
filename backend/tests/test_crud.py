import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.road_safety_api import app


class TestIncidentsCRUD:
    def setup_method(self):
        self.client = TestClient(app)

    def test_list_incidents(self):
        response = self.client.get("/api/incidents")
        assert response.status_code == 200

    def test_create_incident(self):
        response = self.client.post(
            "/api/incidents",
            data={
                "title": "Test Road Accident",
                "description": "A test incident for testing purposes",
                "incident_type": "accident",
                "severity": "high",
                "location": "Nairobi, Kenya",
                "latitude": -1.2921,
                "longitude": 36.8219,
            },
        )
        assert response.status_code in [200, 201]

    def test_update_incident(self):
        response = self.client.put(
            "/api/incidents/TEST001",
            json={"status": "resolved", "description": "Updated"},
        )
        assert response.status_code in [200, 404]

    def test_delete_incident(self):
        response = self.client.delete("/api/incidents/TEST001")
        assert response.status_code in [200, 404]


class TestViolationsCRUD:
    def setup_method(self):
        self.client = TestClient(app)

    def test_list_violations(self):
        response = self.client.get("/api/violations")
        assert response.status_code == 200

    def test_get_violation_stats(self):
        response = self.client.get("/api/violations/stats")
        assert response.status_code in [200, 404]

    def test_get_revenue_stats(self):
        response = self.client.get("/api/violations/stats/revenue")
        assert response.status_code in [200, 404]

    def test_update_violation(self):
        response = self.client.put("/api/violations/TEST001", json={"status": "paid"})
        assert response.status_code in [200, 201, 404]

    def test_delete_violation(self):
        response = self.client.delete("/api/violations/TEST001")
        assert response.status_code in [200, 404]


class TestVehiclesCRUD:
    def setup_method(self):
        self.client = TestClient(app)

    def test_list_vehicles(self):
        response = self.client.get("/api/vehicles")
        assert response.status_code == 200

    def test_create_vehicle(self):
        response = self.client.post(
            "/api/vehicles",
            data={
                "plate_number": "KTEST001",
                "vehicle_type": "car",
                "make": "Toyota",
                "model": "Corolla",
                "year": 2020,
                "color": "Silver",
            },
        )
        assert response.status_code in [200, 201, 400]

    def test_update_vehicle(self):
        response = self.client.put("/api/vehicles/KTEST001", json={"color": "Blue"})
        assert response.status_code in [200, 404]

    def test_delete_vehicle(self):
        response = self.client.delete("/api/vehicles/KTEST001")
        assert response.status_code in [200, 404]


class TestDriversCRUD:
    def setup_method(self):
        self.client = TestClient(app)

    def test_list_drivers(self):
        response = self.client.get("/api/drivers")
        assert response.status_code == 200

    def test_create_driver(self):
        response = self.client.post(
            "/api/drivers",
            data={
                "license_number": "DL999999",
                "first_name": "Test",
                "last_name": "Driver",
                "phone": "+254712345678",
            },
        )
        assert response.status_code in [200, 201, 400]

    def test_update_driver(self):
        response = self.client.put(
            "/api/drivers/DL999999", json={"phone": "+254798765432"}
        )
        assert response.status_code in [200, 404]

    def test_delete_driver(self):
        response = self.client.delete("/api/drivers/DL999999")
        assert response.status_code in [200, 404]


class TestTeamsCRUD:
    def setup_method(self):
        self.client = TestClient(app)

    def test_list_teams(self):
        response = self.client.get("/api/teams")
        assert response.status_code == 200

    def test_create_team(self):
        response = self.client.post(
            "/api/teams",
            data={
                "name": "Test Team",
                "team_type": "rescue",
                "base": "Nairobi Central",
                "members": 5,
            },
        )
        assert response.status_code in [200, 201, 400]

    def test_update_team(self):
        response = self.client.put("/api/teams/TEAM001", json={"status": "active"})
        assert response.status_code in [200, 404]

    def test_delete_team(self):
        response = self.client.delete("/api/teams/TEAM001")
        assert response.status_code in [200, 404]


class TestAlertsCRUD:
    def setup_method(self):
        self.client = TestClient(app)

    def test_list_alerts(self):
        response = self.client.get("/api/alerts")
        assert response.status_code == 200

    def test_create_alert(self):
        response = self.client.post(
            "/api/alerts",
            json={
                "title": "Test Alert",
                "message": "This is a test alert message",
                "severity": "high",
                "alert_type": "road",
                "location": "Test Location",
            },
        )
        assert response.status_code in [200, 201, 400]

    def test_update_alert(self):
        response = self.client.put("/api/alerts/ALERT001", json={"acknowledged": True})
        assert response.status_code in [200, 404]

    def test_delete_alert(self):
        response = self.client.delete("/api/alerts/ALERT001")
        assert response.status_code in [200, 404]


class TestCamerasCRUD:
    def setup_method(self):
        self.client = TestClient(app)

    def test_list_cameras(self):
        response = self.client.get("/api/cameras")
        assert response.status_code == 200

    def test_get_camera_stats(self):
        response = self.client.get("/api/cameras/stats")
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
