"""
Kenya Overwatch Alerting System
Real-time alerts and notifications management
"""

import asyncio
import hashlib
import logging
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional

from ..enums import AlertType, AlertSeverity, AlertStatus, NotificationChannel

logger = logging.getLogger(__name__)


@dataclass
class Alert:
    """Alert entity"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:12])
    alert_type: AlertType = AlertType.INCIDENT
    severity: AlertSeverity = AlertSeverity.MEDIUM
    status: AlertStatus = AlertStatus.NEW
    title: str = ""
    message: str = ""
    source: str = ""
    source_id: str = ""
    location: Optional[Dict[str, float]] = None
    camera_id: Optional[str] = None
    incident_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    related_alerts: List[str] = field(default_factory=list)
    
    def acknowledge(self, user_id: str):
        """Acknowledge the alert"""
        self.status = AlertStatus.ACKNOWLEDGED
        self.acknowledged_at = datetime.now()
        self.acknowledged_by = user_id
    
    def resolve(self, user_id: str):
        """Resolve the alert"""
        self.status = AlertStatus.RESOLVED
        self.resolved_at = datetime.now()
        self.resolved_by = user_id
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "alert_type": self.alert_type.value,
            "severity": self.severity.value,
            "status": self.status.value,
            "title": self.title,
            "message": self.message,
            "source": self.source,
            "source_id": self.source_id,
            "location": self.location,
            "camera_id": self.camera_id,
            "incident_id": self.incident_id,
            "created_at": self.created_at.isoformat(),
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "acknowledged_by": self.acknowledged_by,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "metadata": self.metadata,
            "related_alerts": self.related_alerts,
        }


@dataclass
class Notification:
    """Notification entity"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:12])
    channel: NotificationChannel = NotificationChannel.PUSH
    recipient: str = ""
    title: str = ""
    message: str = ""
    alert_id: Optional[str] = None
    status: str = "pending"
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "channel": self.channel.value,
            "recipient": self.recipient,
            "title": self.title,
            "message": self.message,
            "alert_id": self.alert_id,
            "status": self.status,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
            "error": self.error,
            "metadata": self.metadata,
        }


class AlertRule:
    """Alert rule for automated alerting"""
    
    def __init__(
        self,
        name: str,
        condition: Callable[[Dict], bool],
        alert_type: AlertType,
        severity: AlertSeverity,
        message_template: str,
    ):
        self.name = name
        self.condition = condition
        self.alert_type = alert_type
        self.severity = severity
        self.message_template = message_template
        self.enabled = True
    
    def evaluate(self, data: Dict) -> Optional[Alert]:
        """Evaluate the rule and create alert if condition is met"""
        if not self.enabled:
            return None
        
        if self.condition(data):
            message = self.message_template.format(**data)
            return Alert(
                alert_type=self.alert_type,
                severity=self.severity,
                title=self.name,
                message=message,
                source="rule_engine",
                metadata=data,
            )
        
        return None


class AlertManager:
    """Main alert management system"""
    
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self.notification_history: deque = deque(maxlen=1000)
        self.alert_rules: List[AlertRule] = []
        self.subscribers: Dict[str, List[Callable[[Alert], None]]] = {
            "new": [],
            "acknowledged": [],
            "resolved": [],
        }
        self._initialize_default_rules()
    
    def _initialize_default_rules(self):
        """Initialize default alert rules"""
        self.alert_rules = [
            AlertRule(
                name="High Risk Detection",
                condition=lambda d: d.get("risk_score", 0) > 0.8,
                alert_type=AlertType.RISK,
                severity=AlertSeverity.HIGH,
                message_template="High risk activity detected: {location}",
            ),
            AlertRule(
                name="Camera Offline",
                condition=lambda d: d.get("status") == "offline",
                alert_type=AlertType.CAMERA,
                severity=AlertSeverity.MEDIUM,
                message_template="Camera {camera_id} is offline",
            ),
            AlertRule(
                name="Critical Incident",
                condition=lambda d: d.get("severity") == "critical",
                alert_type=AlertType.INCIDENT,
                severity=AlertSeverity.CRITICAL,
                message_template="Critical incident reported: {title}",
            ),
            AlertRule(
                name="Suspicious Vehicle",
                condition=lambda d: d.get("type") == "suspicious_vehicle",
                alert_type=AlertType.ANPR,
                severity=AlertSeverity.HIGH,
                message_template="Suspicious vehicle detected: {plate_number}",
            ),
        ]
    
    def create_alert(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        message: str,
        source: str = "",
        source_id: str = "",
        camera_id: Optional[str] = None,
        incident_id: Optional[str] = None,
        location: Optional[Dict[str, float]] = None,
        metadata: Optional[Dict] = None,
    ) -> Alert:
        """Create a new alert"""
        alert = Alert(
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            source=source,
            source_id=source_id,
            camera_id=camera_id,
            incident_id=incident_id,
            location=location,
            metadata=metadata or {},
        )
        
        self.alerts[alert.id] = alert
        self._notify_subscribers("new", alert)
        
        logger.info(f"Alert created: {alert.id} - {title}")
        
        return alert
    
    def get_alert(self, alert_id: str) -> Optional[Alert]:
        """Get alert by ID"""
        return self.alerts.get(alert_id)
    
    def get_alerts(
        self,
        status: Optional[AlertStatus] = None,
        severity: Optional[AlertSeverity] = None,
        alert_type: Optional[AlertType] = None,
        limit: int = 100,
    ) -> List[Alert]:
        """Get alerts with filters"""
        results = list(self.alerts.values())
        
        if status:
            results = [a for a in results if a.status == status]
        if severity:
            results = [a for a in results if a.severity == severity]
        if alert_type:
            results = [a for a in results if a.alert_type == alert_type]
        
        results.sort(key=lambda a: a.created_at, reverse=True)
        
        return results[:limit]
    
    def acknowledge_alert(self, alert_id: str, user_id: str) -> Optional[Alert]:
        """Acknowledge an alert"""
        alert = self.alerts.get(alert_id)
        if alert:
            alert.acknowledge(user_id)
            self._notify_subscribers("acknowledged", alert)
        return alert
    
    def resolve_alert(self, alert_id: str, user_id: str) -> Optional[Alert]:
        """Resolve an alert"""
        alert = self.alerts.get(alert_id)
        if alert:
            alert.resolve(user_id)
            self._notify_subscribers("resolved", alert)
        return alert
    
    def evaluate_rules(self, data: Dict) -> List[Alert]:
        """Evaluate all rules and create alerts"""
        created_alerts = []
        
        for rule in self.alert_rules:
            alert = rule.evaluate(data)
            if alert:
                self.alerts[alert.id] = alert
                created_alerts.append(alert)
                self._notify_subscribers("new", alert)
        
        return created_alerts
    
    def subscribe(self, event: str, callback: Callable[[Alert], None]):
        """Subscribe to alert events"""
        if event in self.subscribers:
            self.subscribers[event].append(callback)
    
    def _notify_subscribers(self, event: str, alert: Alert):
        """Notify subscribers of alert event"""
        if event in self.subscribers:
            for callback in self.subscribers[event]:
                try:
                    callback(alert)
                except Exception as e:
                    logger.error(f"Subscriber callback error: {e}")
    
    def get_stats(self) -> Dict:
        """Get alert statistics"""
        total = len(self.alerts)
        by_status = {}
        by_severity = {}
        by_type = {}
        
        for alert in self.alerts.values():
            status = alert.status.value
            severity = alert.severity.value
            alert_type = alert.alert_type.value
            
            by_status[status] = by_status.get(status, 0) + 1
            by_severity[severity] = by_severity.get(severity, 0) + 1
            by_type[alert_type] = by_type.get(alert_type, 0) + 1
        
        return {
            "total": total,
            "by_status": by_status,
            "by_severity": by_severity,
            "by_type": by_type,
            "active_rules": len(self.alert_rules),
        }


class NotificationService:
    """Notification delivery service"""
    
    def __init__(self, alert_manager: AlertManager):
        self.alert_manager = alert_manager
        self.notification_history: deque = deque(maxlen=1000)
    
    async def send_notification(
        self,
        channel: NotificationChannel,
        recipient: str,
        title: str,
        message: str,
        alert_id: Optional[str] = None,
    ) -> Notification:
        """Send notification through specified channel"""
        notification = Notification(
            channel=channel,
            recipient=recipient,
            title=title,
            message=message,
            alert_id=alert_id,
        )
        
        try:
            if channel == NotificationChannel.EMAIL:
                await self._send_email(recipient, title, message)
            elif channel == NotificationChannel.SMS:
                await self._send_sms(recipient, message)
            elif channel == NotificationChannel.PUSH:
                await self._send_push(recipient, title, message)
            elif channel == NotificationChannel.WEBHOOK:
                await self._send_webhook(recipient, title, message)
            
            notification.status = "sent"
            notification.sent_at = datetime.now()
            
        except Exception as e:
            notification.status = "failed"
            notification.error = str(e)
            logger.error(f"Notification failed: {e}")
        
        self.notification_history.append(notification)
        
        return notification
    
    async def _send_email(self, recipient: str, title: str, message: str):
        """Send email notification"""
        logger.info(f"Sending email to {recipient}: {title}")
        await asyncio.sleep(0.1)
    
    async def _send_sms(self, recipient: str, message: str):
        """Send SMS notification"""
        logger.info(f"Sending SMS to {recipient}: {message[:50]}")
        await asyncio.sleep(0.1)
    
    async def _send_push(self, recipient: str, title: str, message: str):
        """Send push notification"""
        logger.info(f"Sending push to {recipient}: {title}")
        await asyncio.sleep(0.1)
    
    async def _send_webhook(self, url: str, title: str, message: str):
        """Send webhook notification"""
        logger.info(f"Sending webhook to {url}: {title}")
        await asyncio.sleep(0.1)
    
    def get_notification_history(self, limit: int = 100) -> List[Notification]:
        """Get notification history"""
        return list(self.notification_history)[-limit:]


alert_manager = AlertManager()
notification_service = NotificationService(alert_manager)
