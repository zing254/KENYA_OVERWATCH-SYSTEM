"""
Kenya Overwatch - Sentry Error Tracking Configuration
"""

import os
import logging

logger = logging.getLogger(__name__)

SENTRY_DSN = os.environ.get("SENTRY_DSN", "")


def init_sentry():
    """Initialize Sentry for error tracking"""
    if not SENTRY_DSN:
        logger.warning("Sentry DSN not configured - skipping Sentry initialization")
        return None
    
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        from sentry_sdk.integrations.websocket import WebsocketIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                FastApiIntegration(),
                LoggingIntegration(level=logging.WARNING),
                WebsocketIntegration(),
            ],
            traces_sample_rate=0.1,
            profiles_sample_rate=0.1,
            environment=os.environ.get("OVERWATCH_ENV", "development"),
            release=f"kenya-overwatch@{os.environ.get('APP_VERSION', '1.0.0')}",
            before_send=lambda event, hint: filter_sentry_event(event, hint),
        )
        
        logger.info("Sentry initialized successfully")
        return sentry_sdk
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")
        return None


def filter_sentry_event(event, hint):
    """Filter out noisy events"""
    # Filter out 404s and health checks
    if event.get("request"):
        url = event["request"].get("url", "")
        if any(x in url for x in ["/health", "/docs", "/openapi.json"]):
            return None
    
    # Filter out certain exception types
    if "exc_info" in hint:
        exc_type = hint["exc_info"][0]
        if exc_type.__name__ in ["ValidationError", "HTTPException"]:
            return None
    
    return event


def capture_exception(error, context=None):
    """Capture an exception with optional context"""
    if SENTRY_DSN:
        try:
            import sentry_sdk
            if context:
                sentry_sdk.set_context("custom", context)
            sentry_sdk.capture_exception(error)
        except Exception as e:
            logger.error(f"Failed to capture exception: {e}")


def capture_message(message, level="info"):
    """Capture a message with optional level"""
    if SENTRY_DSN:
        try:
            import sentry_sdk
            sentry_sdk.capture_message(message, level=level)
        except Exception as e:
            logger.error(f"Failed to capture message: {e}")


# Initialize Sentry on module import
sentry_sdk = init_sentry()