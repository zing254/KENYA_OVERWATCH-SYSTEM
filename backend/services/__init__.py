# Kenya Overwatch - Backend Services Package

try:
    from .ingestion.rtsp_client import camera_ingestion_service
except (ImportError, Exception):
    camera_ingestion_service = None

try:
    from .incident_service import incident_service
except (ImportError, Exception):
    incident_service = None

try:
    from .notification_service import notification_service
except (ImportError, Exception):
    notification_service = None

try:
    from .cctv_simulation import cctv_simulator, anpr_simulator, traffic_analyzer
except (ImportError, Exception):
    cctv_simulator = anpr_simulator = traffic_analyzer = None

try:
    from .service_routes import router as service_router
except (ImportError, Exception):
    service_router = None

__all__ = [
    "camera_ingestion_service",
    "incident_service",
    "notification_service",
    "cctv_simulator",
    "anpr_simulator",
    "traffic_analyzer",
    "service_router",
]
