"""
Kenya Overwatch - Centralized Configuration Management
Uses Pydantic Settings for environment-based configuration
"""

import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseConfig(BaseModel):
    """Database configuration"""
    url: str = Field(..., description="Database connection URL")
    pool_size: int = Field(20, description="Connection pool size")
    max_overflow: int = Field(30, description="Max overflow connections")
    echo: bool = Field(False, description="Log SQL queries")
    ssl_mode: str = Field("require", description="SSL mode for connections")


class RedisConfig(BaseModel):
    """Redis configuration"""
    url: str = Field(..., description="Redis connection URL")
    decode_responses: bool = Field(True, description="Decode responses to strings")
    max_connections: int = Field(50, description="Max connections in pool")
    socket_timeout: int = Field(5, description="Socket timeout in seconds")
    socket_connect_timeout: int = Field(5, description="Connect timeout")


class MinIOConfig(BaseModel):
    """MinIO/S3 object storage configuration"""
    endpoint: str = Field(..., description="MinIO endpoint URL")
    access_key: str = Field(..., description="Access key")
    secret_key: str = Field(..., description="Secret key")
    evidence_bucket: str = Field("overwatch-evidence", description="Evidence storage bucket")
    models_bucket: str = Field("overwatch-models", description="AI models bucket")
    backup_bucket: str = Field("overwatch-backups", description="Backup storage bucket")
    secure: bool = Field(True, description="Use HTTPS")
    region: str = Field("us-east-1", description="Region")


class AIModelsConfig(BaseModel):
    """AI model configuration"""
    yolo_weights_path: str = Field("/app/models/yolo/yolov8n.pt", description="YOLO model path")
    anpr_model_path: str = Field("/app/models/anpr/license_plate_recognition.pt", description="ANPR model path")
    behavior_model_path: str = Field("/app/models/behavior/behavior_model.pt", description="Behavior analysis model")
    confidence_thresholds: Dict[str, float] = Field(
        default_factory=lambda: {
            "person": 0.6,
            "vehicle": 0.7,
            "weapon": 0.9,
            "license_plate": 0.8,
        }
    )
    model_cache_size: int = Field(10, description="Number of models to keep in memory")
    use_gpu: bool = Field(False, description="Enable GPU inference")
    tensorrt_enabled: bool = Field(False, description="Use TensorRT acceleration")


class PerformanceConfig(BaseModel):
    """Performance tuning configuration"""
    max_concurrent_streams: int = Field(10, description="Max concurrent camera streams")
    max_processing_fps: int = Field(30, description="Max FPS for AI processing")
    max_queue_size: int = Field(1000, description="Max frame queue size")
    frame_buffer_size: int = Field(1, description="OpenCV buffer size (minimize latency)")
    worker_threads: int = Field(4, description="Number of worker threads")
    cache_ttl_incidents: int = Field(30, description="Incident cache TTL in seconds")
    cache_ttl_cameras: int = Field(60, description="Camera cache TTL")
    cache_ttl_stats: int = Field(10, description="Stats cache TTL")
    cleanup_interval_hours: int = Field(1, description="Cache cleanup interval")


class SecurityConfig(BaseModel):
    """Security configuration"""
    jwt_secret_key: str = Field(..., description="JWT secret key")
    jwt_algorithm: str = Field("HS256", description="JWT algorithm")
    jwt_expiration_hours: int = Field(24, description="JWT token expiration")
    password_hash_rounds: int = Field(12, description="Bcrypt rounds")
    encryption_key: str = Field(..., description="Encryption key for sensitive data")
    require_https: bool = Field(True, description="Enforce HTTPS")
    cors_origins: List[str] = Field(default_factory=list, description="Allowed CORS origins")
    rate_limit_requests_per_minute: int = Field(60, description="Global rate limit")
    session_timeout_minutes: int = Field(30, description="Session timeout")


class MonitoringConfig(BaseModel):
    """Monitoring and observability configuration"""
    prometheus_port: int = Field(9090, description="Prometheus metrics port")
    health_check_interval: int = Field(30, description="Health check interval in seconds")
    log_level: str = Field("INFO", description="Log level")
    structured_logging: bool = Field(True, description="Use JSON structured logging")
    metrics_enabled: bool = Field(True, description="Enable Prometheus metrics")
    tracing_enabled: bool = Field(False, description="Enable distributed tracing")
    jaeger_endpoint: Optional[str] = Field(None, description="Jaeger collector endpoint")


class ComplianceConfig(BaseModel):
    """Compliance and data retention configuration"""
    gdpr_enabled: bool = Field(True, description="Enable GDPR compliance features")
    audit_log_enabled: bool = Field(True, description="Enable audit logging")
    data_anonymization: bool = Field(True, description="Anonymize PII in logs")
    evidence_chain_of_custody: bool = Field(True, description="Maintain evidence chain")
    citizen_appeal_enabled: bool = Field(True, description="Enable citizen appeals")
    retention_days: Dict[str, int] = Field(
        default_factory=lambda: {
            "non_offence": 3,
            "offence_evidence": 365,
            "appeals": 2555,
            "audit_logs": 1825,
        }
    )


class AlertsConfig(BaseModel):
    """Alerting configuration"""
    high_risk_webhook: Optional[str] = Field(None, description="Webhook for high-risk alerts")
    sms_enabled: bool = Field(True, description="Enable SMS notifications")
    email_enabled: bool = Field(True, description="Enable email notifications")
    escalation_policies: Dict[str, str] = Field(
        default_factory=lambda: {
            "medium": "operator_notification",
            "high": "supervisor_review",
            "critical": "immediate_response",
        }
    )


class Settings(BaseSettings):
    """Main application settings"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )

    # Environment
    app_name: str = Field("Kenya Overwatch Production System", description="Application name")
    version: str = Field("2.0.0", description="Application version")
    environment: str = Field("development", description="Environment (development/staging/production)")
    debug: bool = Field(False, description="Debug mode")

    # Component configurations
    database: DatabaseConfig
    redis: RedisConfig
    minio: MinIOConfig
    ai_models: AIModelsConfig
    performance: PerformanceConfig
    security: SecurityConfig
    monitoring: MonitoringConfig
    compliance: ComplianceConfig
    alerts: AlertsConfig

    # External services
    sms_provider: Optional[str] = Field(None, description="SMS provider (africastalking/twilio)")
    sms_api_key: Optional[str] = Field(None, description="SMS API key")
    sms_username: Optional[str] = Field(None, description="SMS username")
    email_smtp_host: Optional[str] = Field(None, description="SMTP host")
    email_smtp_port: Optional[int] = Field(587, description="SMTP port")
    email_smtp_user: Optional[str] = Field(None, description="SMTP username")
    email_smtp_password: Optional[str] = Field(None, description="SMTP password")
    map_provider: str = Field("openstreetmap", description="Map provider (openstreetmap/google)")

    @validator("environment")
    def validate_environment(cls, v):
        allowed = ["development", "staging", "production", "test"]
        if v not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return v

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def database_url_async(self) -> str:
        """Get async database URL (PostgreSQL only)"""
        if self.database.url.startswith("sqlite"):
            # SQLite doesn't have async driver, return sync URL
            return self.database.url
        # Convert postgresql:// to postgresql+asyncpg://
        return self.database.url.replace("postgresql://", "postgresql+asyncpg://", 1)


def load_settings() -> Settings:
    """Load settings from environment"""
    # Read critical secrets from environment
    database_url = os.getenv("DATABASE_URL", "sqlite:///./ntsa_overwatch.db")
    redis_url = os.getenv("REDIS_URL")
    jwt_secret = os.getenv("JWT_SECRET")
    encryption_key = os.getenv("ENCRYPTION_KEY")

    # Build configuration
    return Settings(
        database=DatabaseConfig(url=database_url),
        redis=RedisConfig(url=redis_url or "redis://localhost:6379/0"),
        minio=MinIOConfig(
            endpoint=os.getenv("MINIO_ENDPOINT", "http://localhost:9000"),
            access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        ),
        ai_models=AIModelsConfig(),
        performance=PerformanceConfig(),
        security=SecurityConfig(
            jwt_secret_key=jwt_secret or "dev-secret-key-CHANGE-IN-PRODUCTION",
            encryption_key=encryption_key or "dev-encryption-key-CHANGE-IN-PRODUCTION",
        ),
        monitoring=MonitoringConfig(),
        compliance=ComplianceConfig(),
        alerts=AlertsConfig(),
        sms_provider=os.getenv("SMS_PROVIDER"),
        sms_api_key=os.getenv("SMS_API_KEY"),
        sms_username=os.getenv("SMS_USERNAME"),
        email_smtp_host=os.getenv("SMTP_HOST"),
        email_smtp_user=os.getenv("SMTP_USER"),
        email_smtp_password=os.getenv("SMTP_PASSWORD"),
    )


# Global settings instance
settings = load_settings()