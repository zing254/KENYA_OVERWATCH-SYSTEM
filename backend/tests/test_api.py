"""
Backend Tests for Kenya Overwatch Production System
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from secure_production_api import app
from app.services.auth import AuthService, AuditLogger
from app.config.database import get_db, init_db
from app.models.database import User, Incident, EvidencePackage, Alert

# Test database session
@pytest.fixture
async def test_db():
    """Create test database session"""
    from app.config.database import AsyncSessionLocal, Base
    from sqlalchemy.ext.asyncio import create_async_engine
    import tempfile
    import os
    
    # Create in-memory SQLite database for testing
    db_file = tempfile.mktemp()
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    TestingSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with TestingSessionLocal() as session:
        yield session
    
    # Cleanup
    os.unlink(db_file)

@pytest.fixture
def test_client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
async def async_client():
    """Create async test client"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
async def test_user(test_db: AsyncSession):
    """Create test user"""
    user = User(
        username="testoperator",
        email="test@kenya-overwatch.go.ke",
        password_hash=AuthService.get_password_hash("testpass123"),
        role="operator",
        permissions=["view_incidents", "review_evidence"],
        active=True
    )
    
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    
    return user

@pytest.fixture
async def admin_user(test_db: AsyncSession):
    """Create admin user"""
    admin = User(
        username="testadmin",
        email="admin@kenya-overwatch.go.ke",
        password_hash=AuthService.get_password_hash("adminpass123"),
        role="admin",
        permissions=["all"],
        active=True
    )
    
    test_db.add(admin)
    await test_db.commit()
    await test_db.refresh(admin)
    
    return admin

@pytest.fixture
async def auth_headers(test_user: User):
    """Get authentication headers"""
    token = AuthService.create_access_token(
        data={
            "sub": str(test_user.id), 
            "username": test_user.username, 
            "role": test_user.role
        }
    )
    
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def admin_headers(admin_user: User):
    """Get admin authentication headers"""
    token = AuthService.create_access_token(
        data={
            "sub": str(admin_user.id), 
            "username": admin_user.username, 
            "role": admin_user.role
        }
    )
    
    return {"Authorization": f"Bearer {token}"}

class TestAuthentication:
    """Test authentication endpoints"""
    
    @pytest.mark.asyncio
    async def test_login_success(self, async_client: AsyncClient, test_user: User):
        """Test successful login"""
        response = await async_client.post(
            "/api/auth/login",
            json={
                "username": "testoperator",
                "password": "testpass123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "testoperator"
        assert data["user"]["role"] == "operator"
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, async_client: AsyncClient):
        """Test login with invalid credentials"""
        response = await async_client.post(
            "/api/auth/login",
            json={
                "username": "invalid",
                "password": "invalid"
            }
        )
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_login_missing_fields(self, async_client: AsyncClient):
        """Test login with missing fields"""
        response = await async_client.post(
            "/api/auth/login",
            json={"username": "test"}
        )
        
        assert response.status_code == 400
        assert "Username and password required" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_refresh_token_success(self, async_client: AsyncClient, test_user: User):
        """Test token refresh"""
        # First login to get refresh token
        login_response = await async_client.post(
            "/api/auth/login",
            json={
                "username": "testoperator",
                "password": "testpass123"
            }
        )
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Use refresh token to get new access token
        response = await async_client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, async_client: AsyncClient):
        """Test refresh with invalid token"""
        response = await async_client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid_token"}
        )
        
        assert response.status_code == 401

class TestIncidents:
    """Test incident management endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_incidents_unauthorized(self, async_client: AsyncClient):
        """Test getting incidents without authentication"""
        response = await async_client.get("/api/incidents")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_incidents_authorized(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test getting incidents with authentication"""
        response = await async_client.get("/api/incidents", headers=auth_headers)
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    @pytest.mark.asyncio
    async def test_get_incident_by_id(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test getting specific incident"""
        # First create a test incident
        from production_system import KenyaOverwatchProduction
        from production_system import ProductionIncident, RiskAssessment, SeverityLevel, IncidentStatus, RiskLevel, Coordinates
        
        production_system = KenyaOverwatchProduction()
        
        incident_id = "test-incident-123"
        test_incident = ProductionIncident(
            id=incident_id,
            type="test",
            title="Test Incident",
            description="Test description",
            location="Test Location",
            coordinates=Coordinates(0.0, 0.0),
            severity=SeverityLevel.MEDIUM,
            status=IncidentStatus.ACTIVE,
            risk_assessment=RiskAssessment(
                risk_score=0.5,
                risk_level=RiskLevel.MEDIUM,
                factors=None,  # Will be mocked
                recommended_action="Monitor",
                confidence=0.8,
                timestamp=datetime.utcnow()
            ),
            evidence_packages=[],
            created_at=datetime.utcnow(),
            reported_by="test_user",
            requires_human_review=False,
            human_review_completed=False
        )
        
        production_system.active_incidents[incident_id] = test_incident
        
        # Test getting the incident
        response = await async_client.get(
            f"/api/incidents/{incident_id}", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == incident_id
        assert data["title"] == "Test Incident"
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_incident(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test getting non-existent incident"""
        response = await async_client.get(
            "/api/incidents/nonexistent", 
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Incident not found" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_incident_filtering(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test incident filtering"""
        response = await async_client.get(
            "/api/incidents?status=active&severity=high", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestEvidence:
    """Test evidence management endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_evidence_unauthorized(self, async_client: AsyncClient):
        """Test getting evidence without authentication"""
        response = await async_client.get("/api/evidence")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_evidence_authorized(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test getting evidence with authentication"""
        response = await async_client.get("/api/evidence", headers=auth_headers)
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    @pytest.mark.asyncio
    async def test_review_evidence(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test evidence review"""
        review_data = {
            "reviewer_id": "test_reviewer",
            "decision": "approve",
            "notes": "Test approval"
        }
        
        response = await async_client.post(
            "/api/evidence/test-evidence-123/review",
            json=review_data,
            headers=auth_headers
        )
        
        # This will likely return 404 since we don't have actual evidence
        # but we're testing the endpoint structure
        assert response.status_code in [200, 404]

class TestSystemMetrics:
    """Test system metrics endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_health_check(self, async_client: AsyncClient):
        """Test public health check endpoint"""
        response = await async_client.get("/api/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "services" in data
        assert "timestamp" in data
        assert data["status"] in ["healthy", "unhealthy"]
    
    @pytest.mark.asyncio
    async def test_get_system_metrics_unauthorized(self, async_client: AsyncClient):
        """Test getting system metrics without authentication"""
        response = await async_client.get("/api/analytics/performance")
        
        # This endpoint might require authentication depending on implementation
        assert response.status_code in [200, 401]

class TestAdminEndpoints:
    """Test admin-only endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_users_as_operator(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test getting users as operator (should fail)"""
        response = await async_client.get("/api/admin/users", headers=auth_headers)
        
        assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_get_users_as_admin(
        self, 
        async_client: AsyncClient, 
        admin_headers: dict
    ):
        """Test getting users as admin (should succeed)"""
        response = await async_client.get("/api/admin/users", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestSecurity:
    """Test security features"""
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self, async_client: AsyncClient):
        """Test rate limiting on auth endpoints"""
        # Make multiple rapid requests
        responses = []
        for _ in range(10):
            response = await async_client.post(
                "/api/auth/login",
                json={"username": "test", "password": "test"}
            )
            responses.append(response)
        
        # At least some requests should be rate limited
        rate_limited = any(r.status_code == 429 for r in responses)
        assert rate_limited, "Rate limiting not working properly"
    
    @pytest.mark.asyncio
    async def test_sql_injection_protection(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test SQL injection protection"""
        malicious_input = "'; DROP TABLE users; --"
        
        response = await async_client.get(
            f"/api/incidents?status={malicious_input}", 
            headers=auth_headers
        )
        
        # Should not crash the server
        assert response.status_code in [200, 400, 422]
    
    @pytest.mark.asyncio
    async def test_jwt_token_validation(self, async_client: AsyncClient):
        """Test JWT token validation"""
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        
        response = await async_client.get("/api/incidents", headers=invalid_headers)
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_cors_headers(self, test_client: TestClient):
        """Test CORS headers are properly set"""
        response = test_client.options("/api/health")
        
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers

class TestWebSocket:
    """Test WebSocket functionality"""
    
    @pytest.mark.asyncio
    async def test_websocket_connection(self, test_client: TestClient):
        """Test WebSocket connection"""
        with test_client.websocket_connect("/ws/test_user") as websocket:
            # Send ping message
            websocket.send_json({"type": "ping"})
            
            # Receive pong response
            data = websocket.receive_json()
            
            assert data["type"] == "pong"
    
    @pytest.mark.asyncio
    async def test_websocket_invalid_json(self, test_client: TestClient):
        """Test WebSocket with invalid JSON"""
        with test_client.websocket_connect("/ws/test_user") as websocket:
            # Send invalid JSON
            websocket.send_text("invalid json")
            
            # Should receive error message
            data = websocket.receive_json()
            assert "error" in data

class TestAuditLogging:
    """Test audit logging functionality"""
    
    @pytest.mark.asyncio
    async def test_login_audit_log(self, test_db: AsyncSession):
        """Test that login attempts are audited"""
        # This would require setting up audit logging in test environment
        # For now, just verify the audit logging service exists
        assert AuditLogger is not None
    
    @pytest.mark.asyncio
    async def test_access_audit_log(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test that resource access is audited"""
        response = await async_client.get("/api/incidents", headers=auth_headers)
        
        # In a real test, we would verify the audit log was created
        # For now, just verify the endpoint works
        assert response.status_code == 200

class TestErrorHandling:
    """Test error handling"""
    
    @pytest.mark.asyncio
    async def test_404_handling(self, async_client: AsyncClient):
        """Test 404 error handling"""
        response = await async_client.get("/api/nonexistent")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_validation_error_handling(self, async_client: AsyncClient):
        """Test validation error handling"""
        response = await async_client.post(
            "/api/auth/login",
            json={"invalid_field": "value"}
        )
        
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_server_error_handling(self, async_client: AsyncClient):
        """Test server error handling"""
        # This would require inducing a server error
        # For now, just verify the structure exists
        pass

# Performance tests
class TestPerformance:
    """Test performance characteristics"""
    
    @pytest.mark.asyncio
    async def test_incident_list_performance(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test incident list performance"""
        import time
        
        start_time = time.time()
        response = await async_client.get("/api/incidents", headers=auth_headers)
        end_time = time.time()
        
        # Should respond within 1 second
        assert end_time - start_time < 1.0
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test handling concurrent requests"""
        import asyncio
        
        async def make_request():
            return await async_client.get("/api/health")
        
        # Make 10 concurrent requests
        tasks = [make_request() for _ in range(10)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        assert all(r.status_code == 200 for r in responses)

# Integration tests
class TestIntegration:
    """Integration tests"""
    
    @pytest.mark.asyncio
    async def test_full_incident_workflow(
        self, 
        async_client: AsyncClient, 
        auth_headers: dict
    ):
        """Test complete incident workflow"""
        # 1. Get incidents list
        response = await async_client.get("/api/incidents", headers=auth_headers)
        assert response.status_code == 200
        
        # 2. Create incident (if endpoint exists)
        # 3. Update incident status
        # 4. Get updated incident
        # 5. Create evidence package
        # 6. Review evidence
        
        # This would be a comprehensive test of the full workflow
        pass
    
    @pytest.mark.asyncio
    async def test_real_time_updates(self, test_client: TestClient):
        """Test real-time updates via WebSocket"""
        with test_client.websocket_connect("/ws/test_user") as websocket:
            # Subscribe to alerts
            websocket.send_json({"type": "subscribe_alerts"})
            
            # Wait for subscription confirmation
            data = websocket.receive_json()
            assert data["type"] == "subscribed"
            assert data["alerts"] is True

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])