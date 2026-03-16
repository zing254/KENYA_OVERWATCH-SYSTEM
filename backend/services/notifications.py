"""
Push Notification Service for Kenya Overwatch
Supports: Email, SMS, Push (FCM), WebSocket
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging
import asyncio
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class Notification:
    """Notification data structure"""

    id: str
    type: str  # email, sms, push, websocket
    recipient: str
    title: str
    message: str
    priority: str = "normal"  # low, normal, high, critical
    data: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    sent: bool = False
    error: Optional[str] = None


class PushNotificationService:
    """Push notification service for all notification types"""

    def __init__(self):
        self.email_config = {
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "from_email": "alerts@kenya-overwatch.go.ke",
        }
        self.sms_config = {
            "provider": "africastalking",
            "api_key": "",
            "sender_id": "OVERWATCH",
        }
        self.push_config = {"fcm_server_key": "", "apns_cert": "", "apns_key": ""}
        self.notification_history: List[Notification] = []

    async def send_notification(
        self,
        notification_type: str,
        recipient: str,
        title: str,
        message: str,
        priority: str = "normal",
        data: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        """Send a notification"""
        import uuid

        notification = Notification(
            id=str(uuid.uuid4()),
            type=notification_type,
            recipient=recipient,
            title=title,
            message=message,
            priority=priority,
            data=data or {},
        )

        try:
            if notification_type == "email":
                await self._send_email(notification)
            elif notification_type == "sms":
                await self._send_sms(notification)
            elif notification_type == "push":
                await self._send_push(notification)
            elif notification_type == "websocket":
                await self._send_websocket(notification)
            else:
                raise ValueError(f"Unknown notification type: {notification_type}")

            notification.sent = True
            logger.info(f"Notification sent: {notification.id} to {recipient}")

        except Exception as e:
            notification.error = str(e)
            logger.error(f"Failed to send notification: {e}")

        self.notification_history.append(notification)
        return notification

    async def _send_email(self, notification: Notification):
        """Send email notification"""
        logger.info(
            f"Email would be sent to {notification.recipient}: {notification.title}"
        )
        # In production, implement with aiosmtplib
        await asyncio.sleep(0.1)  # Simulate async operation

    async def _send_sms(self, notification: Notification):
        """Send SMS notification"""
        logger.info(
            f"SMS would be sent to {notification.recipient}: {notification.title}"
        )
        # In production, implement with Africa's Talking SDK
        await asyncio.sleep(0.1)

    async def _send_push(self, notification: Notification):
        """Send push notification (FCM/APNs)"""
        logger.info(
            f"Push notification would be sent to {notification.recipient}: {notification.title}"
        )
        # In production, implement with firebase-admin or pyapns
        await asyncio.sleep(0.1)

    async def _send_websocket(self, notification: Notification):
        """Send WebSocket notification"""
        logger.info(
            f"WebSocket notification would be sent to {notification.recipient}: {notification.title}"
        )
        # This is handled by the WebSocket manager
        await asyncio.sleep(0.1)

    async def send_bulk_notifications(
        self,
        notification_type: str,
        recipients: List[str],
        title: str,
        message: str,
        priority: str = "normal",
    ) -> List[Notification]:
        """Send bulk notifications"""
        tasks = [
            self.send_notification(
                notification_type, recipient, title, message, priority
            )
            for recipient in recipients
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if isinstance(r, Notification)]

    def get_notification_history(
        self, notification_type: Optional[str] = None, limit: int = 100
    ) -> List[Notification]:
        """Get notification history"""
        history = self.notification_history
        if notification_type:
            history = [n for n in history if n.type == notification_type]
        return history[-limit:]

    def get_statistics(self) -> Dict[str, Any]:
        """Get notification statistics"""
        total = len(self.notification_history)
        sent = len([n for n in self.notification_history if n.sent])
        failed = len([n for n in self.notification_history if n.error])

        by_type = {}
        for n in self.notification_history:
            by_type[n.type] = by_type.get(n.type, 0) + 1

        return {"total": total, "sent": sent, "failed": failed, "by_type": by_type}


# Global instance
notification_service = PushNotificationService()
