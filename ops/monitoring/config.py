from dataclasses import dataclass


@dataclass
class MonitoringConfig:
    metrics_retention_days: int = 30
    alert_check_interval_seconds: int = 60
    enable_prometheus: bool = True
    prometheus_port: int = 9090
    enable_grafana: bool = True
    grafana_port: int = 3000
    notification_channels: list = None

    def __post_init__(self):
        if self.notification_channels is None:
            self.notification_channels = ["email", "slack"]


__all__ = ["MonitoringConfig"]
