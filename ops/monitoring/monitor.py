from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from enum import Enum
import time


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"


@dataclass
class Metric:
    name: str
    value: float
    metric_type: MetricType
    timestamp: datetime = field(default_factory=datetime.now)
    labels: Dict[str, str] = field(default_factory=dict)


@dataclass
class Alert:
    alert_id: str
    name: str
    severity: AlertSeverity
    message: str
    service: str
    triggered_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None
    status: str = "firing"


class MonitoringService:
    def __init__(self):
        self.metrics: List[Metric] = []
        self.alerts: Dict[str, Alert] = {}
        self.alert_handlers: List[Callable[[Alert], None]] = []
        self.alert_rules: Dict[str, dict] = {}

    def record_metric(self, name: str, value: float, metric_type: MetricType = MetricType.GAUGE, labels: Dict[str, str] = None):
        metric = Metric(
            name=name,
            value=value,
            metric_type=metric_type,
            labels=labels or {}
        )
        self.metrics.append(metric)
        self._check_alert_rules(name, value)

    def _check_alert_rules(self, metric_name: str, value: float):
        for rule_name, rule in self.alert_rules.items():
            if rule.get("metric") != metric_name:
                continue
            
            condition = rule.get("condition", "gt")
            threshold = rule.get("threshold", 0)
            
            should_fire = False
            if condition == "gt" and value > threshold:
                should_fire = True
            elif condition == "lt" and value < threshold:
                should_fire = True
            elif condition == "eq" and value == threshold:
                should_fire = True
            
            if should_fire:
                self._trigger_alert(rule_name, value, rule)

    def _trigger_alert(self, rule_name: str, value: float, rule: dict):
        if rule_name in self.alerts and self.alerts[rule_name].status == "firing":
            return
        
        alert = Alert(
            alert_id=f"alert_{int(time.time())}",
            name=rule_name,
            severity=AlertSeverity(rule.get("severity", "warning")),
            message=f"{rule_name}: {value} {rule.get('condition', '>')} {rule.get('threshold', 0)}",
            service=rule.get("service", "unknown")
        )
        
        self.alerts[rule_name] = alert
        
        for handler in self.alert_handlers:
            handler(alert)

    def add_alert_rule(self, name: str, metric: str, condition: str, threshold: float, severity: str = "warning", service: str = "unknown"):
        self.alert_rules[name] = {
            "metric": metric,
            "condition": condition,
            "threshold": threshold,
            "severity": severity,
            "service": service
        }

    def register_alert_handler(self, handler: Callable[[Alert], None]):
        self.alert_handlers.append(handler)

    def get_metrics(self, name: Optional[str] = None, since: Optional[datetime] = None) -> List[Metric]:
        results = self.metrics
        
        if name:
            results = [m for m in results if m.name == name]
        if since:
            results = [m for m in results if m.timestamp >= since]
        
        return results

    def get_alerts(self, status: Optional[str] = None, severity: Optional[AlertSeverity] = None) -> List[Alert]:
        results = list(self.alerts.values())
        
        if status:
            results = [a for a in results if a.status == status]
        if severity:
            results = [a for a in results if a.severity == severity]
        
        return results

    def resolve_alert(self, alert_name: str):
        if alert_name in self.alerts:
            self.alerts[alert_name].status = "resolved"
            self.alerts[alert_name].resolved_at = datetime.now()

    def get_service_health(self, service_name: str) -> Dict[str, any]:
        recent_metrics = [m for m in self.metrics if m.labels.get("service") == service_name]
        
        if not recent_metrics:
            return {"status": "unknown", "message": "No metrics available"}
        
        latest = recent_metrics[-1]
        
        active_alerts = [a for a in self.alerts.values() 
                        if a.service == service_name and a.status == "firing"]
        
        if any(a.severity == AlertSeverity.CRITICAL for a in active_alerts):
            status = "critical"
        elif active_alerts:
            status = "degraded"
        else:
            status = "healthy"
        
        return {
            "status": status,
            "last_metric": latest.name,
            "last_value": latest.value,
            "active_alerts": len(active_alerts),
            "timestamp": latest.timestamp.isoformat()
        }


monitor = MonitoringService()
