import pytest
from fastapi.testclient import TestClient
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.road_safety_api import app


class TestDashboardEndpoints:
    def setup_method(self):
        self.client = TestClient(app)
    
    def test_dashboard_stats(self):
        response = self.client.get("/api/dashboard/stats")
        assert response.status_code == 200
    
    def test_dashboard_summary(self):
        response = self.client.get("/api/dashboard/summary")
        assert response.status_code == 200
    
    def test_dashboard_metrics(self):
        response = self.client.get("/api/dashboard/metrics")
        assert response.status_code == 200
    
    def test_dashboard_charts(self):
        response = self.client.get("/api/dashboard/charts")
        assert response.status_code == 200


class TestMetricsEndpoints:
    def setup_method(self):
        self.client = TestClient(app)
    
    def test_system_metrics(self):
        response = self.client.get("/api/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        assert "system" in data
    
    def test_system_overview(self):
        response = self.client.get("/api/system/overview")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "services" in data
    
    def test_prometheus_metrics(self):
        response = self.client.get("/api/metrics/prometheus")
        assert response.status_code == 200
        assert "text/plain" in response.headers.get("content-type", "")


class TestCacheEndpoints:
    def setup_method(self):
        self.client = TestClient(app)
    
    def test_cache_stats(self):
        response = self.client.get("/api/cache/stats")
        assert response.status_code == 200
    
    def test_cache_clear(self):
        response = self.client.post("/api/cache/clear")
        assert response.status_code in [200, 201]


class TestRoadsEndpoints:
    def setup_method(self):
        self.client = TestClient(app)
    
    def test_list_roads(self):
        response = self.client.get("/api/roads")
        assert response.status_code == 200
    
    def test_road_stats(self):
        response = self.client.get("/api/roads/Test%20Road/stats")
        assert response.status_code in [200, 404]


class TestReportsEndpoints:
    def setup_method(self):
        self.client = TestClient(app)
    
    def test_list_reports(self):
        response = self.client.get("/api/reports")
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
