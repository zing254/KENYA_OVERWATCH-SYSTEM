from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
import json
import uuid
from pathlib import Path


class EventType(Enum):
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_ACCESS_DENIED = "user_access_denied"
    DATA_ACCESS = "data_access"
    DATA_CREATE = "data_create"
    DATA_UPDATE = "data_update"
    DATA_DELETE = "data_delete"
    API_REQUEST = "api_request"
    CONFIG_CHANGE = "config_change"
    SECURITY_ALERT = "security_alert"
    SYSTEM_ERROR = "system_error"


class Severity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_type: EventType = EventType.API_REQUEST
    severity: Severity = Severity.INFO
    timestamp: datetime = field(default_factory=datetime.now)
    user_id: Optional[str] = None
    username: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    resource: str = ""
    action: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    status: str = "success"
    error_message: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "username": self.username,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "resource": self.resource,
            "action": self.action,
            "details": self.details,
            "status": self.status,
            "error_message": self.error_message
        }


class AuditLogger:
    def __init__(self, log_path: str = "logs/audit"):
        self.log_path = Path(log_path)
        self.log_path.mkdir(parents=True, exist_ok=True)
        self.events: List[AuditEvent] = []

    def log(self, event: AuditEvent):
        self.events.append(event)
        self._write_to_file(event)

    def _write_to_file(self, event: AuditEvent):
        date_str = event.timestamp.strftime("%Y-%m-%d")
        log_file = self.log_path / f"audit_{date_str}.jsonl"
        
        with open(log_file, "a") as f:
            f.write(json.dumps(event.to_dict()) + "\n")

    def log_user_login(self, username: str, user_id: str, ip_address: str, success: bool = True):
        event = AuditEvent(
            event_type=EventType.USER_LOGIN,
            severity=Severity.INFO if success else Severity.WARNING,
            username=username,
            user_id=user_id,
            ip_address=ip_address,
            action="login",
            status="success" if success else "failed"
        )
        self.log(event)

    def log_api_request(self, user_id: str, method: str, path: str, status_code: int, ip_address: str):
        severity = Severity.INFO if status_code < 400 else Severity.ERROR
        
        event = AuditEvent(
            event_type=EventType.API_REQUEST,
            severity=severity,
            user_id=user_id,
            ip_address=ip_address,
            resource=path,
            action=method,
            details={"status_code": status_code},
            status="success" if status_code < 400 else "failed"
        )
        self.log(event)

    def log_data_access(self, user_id: str, resource: str, action: str):
        event = AuditEvent(
            event_type=EventType.DATA_ACCESS,
            user_id=user_id,
            resource=resource,
            action=action
        )
        self.log(event)

    def log_security_alert(self, alert_type: str, details: Dict[str, Any], severity: Severity = Severity.WARNING):
        event = AuditEvent(
            event_type=EventType.SECURITY_ALERT,
            severity=severity,
            action=alert_type,
            details=details
        )
        self.log(event)

    def query_events(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        event_type: Optional[EventType] = None,
        user_id: Optional[str] = None,
        severity: Optional[Severity] = None
    ) -> List[AuditEvent]:
        results = self.events
        
        if start_date:
            results = [e for e in results if e.timestamp >= start_date]
        if end_date:
            results = [e for e in results if e.timestamp <= end_date]
        if event_type:
            results = [e for e in results if e.event_type == event_type]
        if user_id:
            results = [e for e in results if e.user_id == user_id]
        if severity:
            results = [e for e in results if e.severity == severity]
        
        return results

    def get_failed_logins(self, hours: int = 24) -> List[AuditEvent]:
        from datetime import timedelta
        cutoff = datetime.now() - timedelta(hours=hours)
        
        return [
            e for e in self.events
            if e.event_type == EventType.USER_LOGIN
            and e.status == "failed"
            and e.timestamp >= cutoff
        ]
