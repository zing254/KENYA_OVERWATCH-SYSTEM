from dataclasses import dataclass


@dataclass
class DRConfig:
    storage_path: str = "ops/disaster_recovery/storage"
    backup_retention_days: int = 30
    default_backup_type: str = "incremental"
    auto_backup_enabled: bool = True
    backup_interval_hours: int = 24
    enable_compression: bool = True
    enable_encryption: bool = True
    restore_timeout_minutes: int = 60


__all__ = ["DRConfig"]
