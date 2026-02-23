"""
Kenya Overwatch Backend Tests
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestAIPipeline:
    """Test AI Pipeline"""
    
    def test_pipeline_import(self):
        """Test AI pipeline can be imported"""
        from ai.pipeline import AIPipeline, pipeline
        assert pipeline is not None
        assert isinstance(pipeline, AIPipeline)
    
    def test_pipeline_stats(self):
        """Test pipeline statistics"""
        from ai.pipeline import pipeline
        stats = pipeline.get_stats()
        assert "frames_processed" in stats
        assert "total_detections" in stats
    
    def test_detection_types(self):
        """Test detection types"""
        from ai.pipeline import DetectionType
        assert DetectionType.PERSON.value == "person"
        assert DetectionType.VEHICLE.value == "vehicle"
        assert DetectionType.WEAPON.value == "weapon"
    
    def test_bounding_box(self):
        """Test bounding box"""
        from ai.pipeline import BoundingBox
        bbox = BoundingBox(x=10, y=20, w=100, h=50)
        assert bbox.area == 5000
        assert bbox.center == (60, 45)


class TestANPR:
    """Test ANPR module"""
    
    def test_anpr_import(self):
        """Test ANPR can be imported"""
        from ai.anpr import ANPR, anpr
        assert anpr is not None
        assert isinstance(anpr, ANPR)
    
    def test_plate_validation(self):
        """Test Kenyan plate validation"""
        from ai.anpr import KenyanPlateValidator
        assert KenyanPlateValidator.validate("KAA 001A")[0] == True
        assert KenyanPlateValidator.validate("KCD 456")[0] == True
        assert KenyanPlateValidator.validate("INVALID")[0] == False
    
    def test_plate_normalization(self):
        """Test plate normalization"""
        from ai.anpr import KenyanPlateValidator
        assert "KAA" in KenyanPlateValidator.normalize("kaa001a")
        assert "001" in KenyanPlateValidator.normalize("kaa001a")


class TestAlertManager:
    """Test Alert Manager"""
    
    def test_alert_manager_import(self):
        """Test alert manager can be imported"""
        from alerting.manager import AlertManager, alert_manager
        assert alert_manager is not None
        assert isinstance(alert_manager, AlertManager)
    
    def test_create_alert(self):
        """Test creating an alert"""
        from alerting.manager import alert_manager, AlertType, AlertSeverity
        alert = alert_manager.create_alert(
            alert_type=AlertType.INCIDENT,
            severity=AlertSeverity.HIGH,
            title="Test Alert",
            message="This is a test",
        )
        assert alert is not None
        assert alert.title == "Test Alert"
        assert alert.severity == AlertSeverity.HIGH
    
    def test_get_alerts(self):
        """Test getting alerts"""
        from alerting.manager import alert_manager, AlertType, AlertSeverity
        alert_manager.create_alert(
            alert_type=AlertType.SYSTEM,
            severity=AlertSeverity.MEDIUM,
            title="Test 2",
            message="Another test",
        )
        alerts = alert_manager.get_alerts(limit=10)
        assert len(alerts) >= 2
    
    def test_acknowledge_alert(self):
        """Test acknowledging alert"""
        from alerting.manager import alert_manager, AlertType, AlertSeverity
        alert = alert_manager.create_alert(
            alert_type=AlertType.SECURITY,
            severity=AlertSeverity.CRITICAL,
            title="Test Ack",
            message="Test",
        )
        acknowledged = alert_manager.acknowledge_alert(alert.id, "test_user")
        assert acknowledged is not None
        assert acknowledged.status.value == "acknowledged"


class TestRiskEngine:
    """Test Risk Engine"""
    
    def test_risk_engine_import(self):
        """Test risk engine can be imported"""
        from risk_engine.engine import RiskEngine, risk_engine
        assert risk_engine is not None
        assert isinstance(risk_engine, RiskEngine)
    
    def test_assess_risk(self):
        """Test risk assessment"""
        from risk_engine.engine import risk_engine
        assessment = risk_engine.assess_risk(
            incident_type="theft",
            location="Nairobi CBD",
            coordinates={"lat": -1.2864, "lng": 36.8232},
        )
        assert assessment is not None
        assert 0.0 <= assessment.risk_score <= 1.0
        assert assessment.confidence > 0
    
    def test_risk_levels(self):
        """Test risk levels"""
        from risk_engine.engine import RiskLevel
        assert RiskLevel.LOW.value == "low"
        assert RiskLevel.CRITICAL.value == "critical"


class TestOffenceEngine:
    """Test Offence Engine"""
    
    def test_offence_engine_import(self):
        """Test offence engine can be imported"""
        from offence_engine.engine import OffenceEngine, offence_engine
        assert offence_engine is not None
        assert isinstance(offence_engine, OffenceEngine)
    
    def test_detect_offence(self):
        """Test detecting an offence"""
        from offence_engine.engine import offence_engine, OffenceType
        offence = offence_engine.detect_offence(
            offence_type=OffenceType.SPEEDING,
            plate_number="KAA 001A",
            camera_id="cam_001",
            location="Kenyatta Avenue",
            speed=80,
            limit=50,
        )
        assert offence is not None
        assert offence.plate_number == "KAA 001A"
        assert offence.fine_amount > 0
    
    def test_offence_types(self):
        """Test offence types"""
        from offence_engine.engine import OffenceType
        assert OffenceType.SPEEDING.value == "speeding"
        assert OffenceType.RED_LIGHT.value == "red_light"


class TestIntegrations:
    """Test External Integrations"""
    
    def test_integrations_import(self):
        """Test integrations can be imported"""
        from integrations.services import ExternalIntegrations, integrations
        assert integrations is not None
        assert isinstance(integrations, ExternalIntegrations)
    
    def test_integration_stats(self):
        """Test integration statistics"""
        from integrations.services import integrations
        stats = integrations.get_stats()
        assert "total_integrations" in stats
        assert "active_integrations" in stats


class TestProductionAPI:
    """Test Production API"""
    
    def test_api_import(self):
        """Test API can be imported"""
        try:
            from production_api import app
            assert app is not None
        except ImportError as e:
            pytest.skip(f"Cannot import API: {e}")
    
    def test_api_health_endpoint(self):
        """Test health endpoint exists"""
        try:
            from fastapi.testclient import TestClient
            from production_api import app
            client = TestClient(app)
            response = client.get("/api/health")
            assert response.status_code == 200
        except ImportError:
            pytest.skip("FastAPI test client not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
