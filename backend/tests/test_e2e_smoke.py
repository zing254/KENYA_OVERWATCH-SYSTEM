"""End-to-end smoke test for Kenya Overwatch API"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.road_safety_api import app


@pytest.fixture
def client():
    return TestClient(app)


class TestE2ESmoke:
    """End-to-end smoke test covering critical paths"""

    def test_health_and_root(self, client):
        """Test basic health and root endpoints"""
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["status"] == "healthy"

        root = client.get("/")
        assert root.status_code == 200

    def test_dashboard_endpoints(self, client):
        """Test dashboard data endpoints"""
        stats = client.get("/api/dashboard/stats")
        assert stats.status_code == 200
        data = stats.json()
        assert "roads" in data or "trend" in data or "accidents" in data

        summary = client.get("/api/dashboard/summary")
        assert summary.status_code == 200

    def test_incidents_crud(self, client):
        """Test full incidents CRUD"""
        # List
        resp = client.get("/api/incidents")
        assert resp.status_code == 200

        # Create
        resp = client.post(
            "/api/incidents",
            data={
                "title": "E2E Test Incident",
                "description": "This is an end-to-end test incident for validation",
                "incident_type": "accident",
                "severity": "high",
                "location": "Nairobi CBD",
            },
        )
        assert resp.status_code == 200

    def test_violations_crud(self, client):
        """Test violations listing and stats"""
        resp = client.get("/api/violations")
        assert resp.status_code == 200

        resp = client.get("/api/violations/stats/revenue")
        assert resp.status_code == 200

    def test_vehicles_crud(self, client):
        """Test vehicles CRUD"""
        import uuid

        unique_plate = f"KAA{uuid.uuid4().hex[:4].upper()}Z"

        resp = client.get("/api/vehicles")
        assert resp.status_code == 200

        resp = client.post(
            "/api/vehicles",
            data={
                "plate_number": unique_plate,
                "vehicle_type": "car",
                "make": "Toyota",
                "model": "Corolla",
            },
        )
        assert resp.status_code == 200

        resp = client.get(f"/api/vehicles/{unique_plate}")
        assert resp.status_code == 200

    def test_drivers_crud(self, client):
        """Test drivers CRUD"""
        import uuid

        unique_id = f"DL{uuid.uuid4().hex[:6].upper()}"

        resp = client.get("/api/drivers")
        assert resp.status_code == 200

        resp = client.post(
            "/api/drivers",
            data={
                "license_number": unique_id,
                "first_name": "Test",
                "last_name": "Driver",
            },
        )
        assert resp.status_code == 200

        resp = client.get(f"/api/drivers/{unique_id}")
        assert resp.status_code == 200

    def test_alerts(self, client):
        """Test alerts endpoints"""
        resp = client.get("/api/alerts")
        assert resp.status_code == 200

    def test_teams(self, client):
        """Test teams endpoints"""
        resp = client.get("/api/teams")
        assert resp.status_code == 200

    def test_roads(self, client):
        """Test roads endpoints"""
        resp = client.get("/api/roads")
        assert resp.status_code == 200

    def test_analytics(self, client):
        """Test analytics endpoints"""
        resp = client.get("/api/analytics/trends")
        assert resp.status_code == 200

    def test_enums(self, client):
        """Test enum endpoints"""
        resp = client.get("/api/enums/accident-types")
        assert resp.status_code == 200

    def test_settings(self, client):
        """Test settings endpoints"""
        resp = client.get("/api/settings")
        assert resp.status_code == 200

    def test_api_docs_available(self, client):
        """Test API documentation is available"""
        resp = client.get("/docs")
        assert resp.status_code == 200

        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        assert "paths" in schema
        assert "info" in schema

    def test_login_endpoint(self, client):
        """Test authentication endpoint"""
        resp = client.post(
            "/api/v1/auth/login", json={"username": "admin", "password": "password123"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_multiple_endpoints_sequentially(self, client):
        """Test multiple endpoints in sequence to verify stability"""
        endpoints = [
            "/api/health",
            "/api/dashboard/stats",
            "/api/dashboard/summary",
            "/api/incidents",
            "/api/violations",
            "/api/vehicles",
            "/api/drivers",
            "/api/alerts",
            "/api/teams",
            "/api/roads",
            "/api/analytics/trends",
            "/api/enums/accident-types",
            "/api/settings",
        ]
        for endpoint in endpoints:
            resp = client.get(endpoint)
            assert resp.status_code == 200, f"Failed: GET {endpoint}"
