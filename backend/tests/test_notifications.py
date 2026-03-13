import pytest
from fastapi.testclient import TestClient
from backend.notifications_sounds import (
    Notification, 
    SoundAlert, 
    NotificationManager,
    notification_manager
)
from datetime import datetime


class TestNotifications:
    def test_notification_creation(self):
        notification = Notification(
            notification_id="test_001",
            title="Test Alert",
            message="This is a test notification",
            notification_type="alert",
            severity="high",
            timestamp=datetime.now().isoformat()
        )
        assert notification.notification_id == "test_001"
        assert notification.title == "Test Alert"
        assert notification.notification_type == "alert"

    def test_sound_alert_creation(self):
        sound = SoundAlert(
            alert_id="sound_001",
            sound_type="emergency",
            volume=0.8,
            repeat=False
        )
        assert sound.alert_id == "sound_001"
        assert sound.sound_type == "emergency"
        assert sound.volume == 0.8

    def test_notification_manager_initialization(self):
        manager = NotificationManager()
        assert manager.active_connections == {}
        assert manager.notifications == {}
        assert manager.sound_alerts == []

    def test_get_user_notifications_empty(self):
        manager = NotificationManager()
        notifications = manager.get_user_notifications("test_user")
        assert notifications == []

    def test_get_user_notifications_with_data(self):
        manager = NotificationManager()
        notification = Notification(
            notification_id="test_002",
            title="Test",
            message="Test message",
            notification_type="alert",
            severity="medium",
            timestamp=datetime.now().isoformat()
        )
        manager.notifications["test_user"] = [notification]
        notifications = manager.get_user_notifications("test_user")
        assert len(notifications) == 1
        assert notifications[0].notification_id == "test_002"

    def test_mark_as_read(self):
        manager = NotificationManager()
        notification = Notification(
            notification_id="test_003",
            title="Test",
            message="Test message",
            notification_type="alert",
            severity="medium",
            timestamp=datetime.now().isoformat(),
            read=False
        )
        manager.notifications["test_user"] = [notification]
        manager.mark_as_read("test_user", "test_003")
        assert manager.notifications["test_user"][0].read is True

    def test_mark_all_as_read(self):
        manager = NotificationManager()
        notifications = [
            Notification(
                notification_id=f"test_{i}",
                title=f"Test {i}",
                message=f"Test message {i}",
                notification_type="alert",
                severity="medium",
                timestamp=datetime.now().isoformat(),
                read=False
            )
            for i in range(3)
        ]
        manager.notifications["test_user"] = notifications
        manager.mark_all_as_read("test_user")
        assert all(n.read for n in manager.notifications["test_user"])

    def test_unread_only_filter(self):
        manager = NotificationManager()
        notifications = [
            Notification(
                notification_id="test_001",
                title="Test 1",
                message="Test 1",
                notification_type="alert",
                severity="medium",
                timestamp=datetime.now().isoformat(),
                read=True
            ),
            Notification(
                notification_id="test_002",
                title="Test 2",
                message="Test 2",
                notification_type="alert",
                severity="medium",
                timestamp=datetime.now().isoformat(),
                read=False
            )
        ]
        manager.notifications["test_user"] = notifications
        unread = manager.get_user_notifications("test_user", unread_only=True)
        assert len(unread) == 1
        assert unread[0].notification_id == "test_002"

    def test_notification_limit(self):
        manager = NotificationManager()
        for i in range(150):
            notification = Notification(
                notification_id=f"test_{i}",
                title=f"Test {i}",
                message=f"Test message {i}",
                notification_type="alert",
                severity="medium",
                timestamp=datetime.now().isoformat()
            )
            manager.notifications["test_user"] = [notification]
        
        assert len(manager.notifications["test_user"]) <= 100

    def test_emergency_alert_creation(self):
        manager = NotificationManager()
        notification = Notification(
            notification_id=f"EMG_{datetime.now().timestamp()}",
            title="Emergency Alert",
            message="Critical incident reported",
            notification_type="emergency",
            severity="critical",
            timestamp=datetime.now().isoformat()
        )
        assert notification.notification_type == "emergency"
        assert notification.severity == "critical"


class TestSoundTypes:
    def test_sound_types_defined(self):
        sound_types = [
            "emergency", "alert", "warning", "notification",
            "incident", "dispatch", "road_sign", "speed_camera"
        ]
        for sound_type in sound_types:
            sound = SoundAlert(
                alert_id=f"test_{sound_type}",
                sound_type=sound_type,
                volume=1.0
            )
            assert sound.sound_type == sound_type

    def test_volume_range(self):
        sound = SoundAlert(
            alert_id="test_vol",
            sound_type="alert",
            volume=0.5
        )
        assert 0 <= sound.volume <= 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
