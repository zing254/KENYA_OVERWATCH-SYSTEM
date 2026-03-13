"""
Backend Tests - AI and Core Modules
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestAIPipeline:
    """Test AI Pipeline"""
    
    def test_pipeline_import(self):
        """Test AI pipeline can be imported"""
        from backend.ai.pipeline import AIPipeline, pipeline
        assert pipeline is not None
        assert isinstance(pipeline, AIPipeline)
    
    def test_pipeline_stats(self):
        """Test pipeline statistics"""
        from backend.ai.pipeline import pipeline
        stats = pipeline.get_stats()
        assert "frames_processed" in stats
        assert "total_detections" in stats


class TestANPR:
    """Test ANPR module"""
    
    def test_anpr_import(self):
        """Test ANPR can be imported"""
        from backend.ai.anpr import ANPR, anpr
        assert anpr is not None
        assert isinstance(anpr, ANPR)


class TestRiskEngine:
    """Test Risk Engine"""
    
    def test_risk_engine_import(self):
        """Test risk engine can be imported"""
        from backend.risk_engine.engine import risk_engine
        assert risk_engine is not None


class TestOffenceEngine:
    """Test Offence Engine"""
    
    def test_offence_engine_import(self):
        """Test offence engine can be imported"""
        from backend.offence_engine.engine import offence_engine
        assert offence_engine is not None


class TestAlerting:
    """Test Alerting Manager"""
    
    def test_alert_manager_import(self):
        """Test alert manager can be imported"""
        from backend.alerting.manager import alert_manager
        assert alert_manager is not None


class TestEnums:
    """Test Enums"""
    
    def test_user_roles(self):
        """Test user role enums"""
        from backend.enums import UserRole
        assert UserRole.ADMIN.value == "admin"
        assert UserRole.OFFICER.value == "officer"
    
    def test_severity_levels(self):
        """Test severity level enums"""
        from backend.enums import SeverityLevel
        assert SeverityLevel.LOW.value == "low"
        assert SeverityLevel.CRITICAL.value == "critical"


class TestDatabaseModels:
    """Test Database Models"""
    
    def test_user_model_import(self):
        """Test User model can be imported"""
        from backend.database_models import User
        assert User is not None
    
    def test_team_model_import(self):
        """Test Team model can be imported"""
        from backend.database_models import Team
        assert Team is not None
    
    def test_camera_model_import(self):
        """Test Camera model can be imported"""
        from backend.database_models import Camera
        assert Camera is not None
