# Kenya Overwatch - Backend Services Package

try:
    from .ingestion.rtsp_client import camera_ingestion_service
except ImportError:
    try:
        from services.ingestion.rtsp_client import camera_ingestion_service
    except:
        camera_ingestion_service = None

try:
    from .incident_service import incident_service
except ImportError:
    try:
        from services.incident_service import incident_service
    except:
        incident_service = None

try:
    from .notification_service import notification_service
except ImportError:
    try:
        from services.notification_service import notification_service
    except:
        notification_service = None

try:
    from .cctv_simulation import cctv_simulator, anpr_simulator, traffic_analyzer
except ImportError:
    try:
        from services.cctv_simulation import cctv_simulator, anpr_simulator, traffic_analyzer
    except:
        cctv_simulator = anpr_simulator = traffic_analyzer = None

try:
    from .service_routes import router as service_router
except ImportError:
    try:
        from services.service_routes import router as service_router
    except:
        service_router = None

__all__ = [
    'camera_ingestion_service',
    'incident_service',
    'notification_service',
    'cctv_simulator',
    'anpr_simulator',
    'traffic_analyzer',
    'service_router',
]
