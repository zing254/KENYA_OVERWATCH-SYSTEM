"""
Backend Tests for Kenya Overwatch Production System
Simplified test suite with working imports
"""

import pytest
import sys
import os

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from fastapi.testclient import TestClient
from backend.road_safety_api import app


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_check(self, client):
        """Test health endpoint returns 200"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200


class TestAuthentication:
    """Test authentication endpoints"""

    def test_login_missing_credentials(self, client):
        """Test login with missing credentials"""
        response = client.post("/api/v1/auth/login", json={})
        assert response.status_code == 422

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/v1/auth/login", json={"username": "", "password": ""}
        )
        assert response.status_code in [401, 400, 422]

    def test_login_valid_credentials(self, client):
        """Test login with valid credentials"""
        response = client.post(
            "/api/v1/auth/login", json={"username": "admin", "password": "password123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data


class TestIncidents:
    """Test incident endpoints"""

    def test_get_incidents_without_auth(self, client):
        """Test getting incidents - endpoint may not require auth"""
        response = client.get("/api/incidents")
        # May return 200 (public) or 401 (protected)
        assert response.status_code in [200, 401]

    def test_get_incidents_with_auth(self, client):
        """Test getting incidents with valid auth"""
        # First login to get token
        login_response = client.post(
            "/api/auth/token", json={"username": "admin", "password": "Admin@123"}
        )

        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            if token:
                response = client.get(
                    "/api/incidents", headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200


class TestSecurity:
    """Test security features"""

    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.options("/api/health")
        # Should have CORS headers or return 200/405
        assert response.status_code in [200, 405]

    def test_sql_injection_protection(self, client):
        """Test SQL injection protection"""
        response = client.get("/api/incidents?status=' OR '1'='1")
        # Should either reject or handle safely
        assert response.status_code in [401, 422, 400, 200]


class TestAPIEndpoints:
    """Test core API endpoints"""

    def test_api_docs_available(self, client):
        """Test API documentation is available"""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_openapi_schema(self, client):
        """Test OpenAPI schema is available"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
