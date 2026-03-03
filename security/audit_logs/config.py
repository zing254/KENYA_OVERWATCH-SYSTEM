from dataclasses import dataclass
from pathlib import Path


@dataclass
class AuditConfig:
    log_path: str = "logs/audit"
    retention_days: int = 90
    enable_file_logging: bool = True
    enable_console_logging: bool = True
    rotate_logs: bool = True
    max_log_size_mb: int = 100
    compress_old_logs: bool = True


__all__ = ["AuditConfig"]
