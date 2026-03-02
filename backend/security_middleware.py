"""
Kenya NTSA Road Safety - Security Middleware
Comprehensive security features: rate limiting, CORS, error handling, logging
"""

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import Callable, Dict, Optional, Any
import time
import logging
import uuid
import os
import secrets
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from functools import wraps

logger = logging.getLogger(__name__)


# ==================== RATE LIMITING ====================
class RateLimiter:
    """Token bucket rate limiter with Redis support"""
    
    def __init__(self, requests_per_minute: int = 60, burst_size: int = 10):
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.use_redis = False
        self.redis_client: Any = None
        
        # Try to initialize Redis connection
        self._init_redis()
        
        # Fallback to in-memory
        if not self.use_redis:
            self.buckets: Dict[str, Dict] = defaultdict(lambda: {
                "tokens": burst_size,
                "last_update": time.time()
            })
    
    def _init_redis(self):
        """Initialize Redis connection for distributed rate limiting"""
        try:
            import redis
            redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            self.use_redis = True
            logger.info("Using Redis-based rate limiting")
        except Exception as e:
            logger.warning(f"Redis not available, using in-memory rate limiting: {e}")
            self.use_redis = False
    
    def _refill_bucket(self, client_id: str):
        """Refill tokens based on time passed"""
        bucket = self.buckets[client_id]
        now = time.time()
        elapsed = now - bucket["last_update"]
        
        tokens_to_add = elapsed * (self.requests_per_minute / 60.0)
        bucket["tokens"] = min(self.burst_size, bucket["tokens"] + tokens_to_add)
        bucket["last_update"] = now
    
    def check_rate_limit(self, client_id: str) -> bool:
        """Check if request is allowed"""
        if self.use_redis and self.redis_client:
            return self._check_redis(client_id)
        return self._check_memory(client_id)
    
    def _check_redis(self, client_id: str) -> bool:
        """Check rate limit using Redis"""
        try:
            key = f"rate_limit:{client_id}"
            current = self.redis_client.get(key)
            
            if current is None:
                self.redis_client.setex(key, 60, 1)
                return True
            
            current = int(current)
            if current >= self.requests_per_minute:
                return False
            
            self.redis_client.incr(key)
            return True
        except Exception:
            # Fallback to memory on error
            return self._check_memory(client_id)
    
    def _check_memory(self, client_id: str) -> bool:
        """Check rate limit using in-memory (fallback)"""
        self._refill_bucket(client_id)
        
        if self.buckets[client_id]["tokens"] >= 1:
            self.buckets[client_id]["tokens"] -= 1
            return True
        return False
    
    def get_remaining(self, client_id: str) -> int:
        """Get remaining tokens"""
        if self.use_redis and self.redis_client:
            try:
                key = f"rate_limit:{client_id}"
                current = self.redis_client.get(key)
                if current is None:
                    return self.requests_per_minute
                return max(0, self.requests_per_minute - int(current))
            except Exception:
                pass
        
        self._refill_bucket(client_id)
        return int(self.buckets[client_id]["tokens"])


# Global rate limiter
rate_limiter = RateLimiter(requests_per_minute=60, burst_size=10)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    # Endpoints that don't require rate limiting
    EXCLUDED_PATHS = ["/", "/docs", "/redoc", "/openapi.json", "/api/health"]
    
    def __init__(self, app: ASGIApp, requests_per_minute: int = 60):
        super().__init__(app)
        self.rate_limiter = RateLimiter(requests_per_minute=requests_per_minute)
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)
        
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Check rate limit
        if not self.rate_limiter.check_rate_limit(client_id):
            logger.warning(f"Rate limit exceeded for {client_id}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )
        
        # Add rate limit headers
        remaining = self.rate_limiter.get_remaining(client_id)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rate_limiter.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier"""
        # Try to get real IP from headers (if behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Fall back to client host
        return request.client.host if request.client else "unknown"


# ==================== REQUEST ID & LOGGING ====================
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Request logging middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timer
        start_time = time.time()
        
        # Get client info
        client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        
        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path} "
            f"[ID: {request_id}] [IP: {client_ip}]"
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"Request completed: {request.method} {request.url.path} "
                f"[ID: {request_id}] [Status: {response.status_code}] "
                f"[Duration: {duration:.3f}s]"
            )
            
            # Add headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{duration:.3f}s"
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path} "
                f"[ID: {request_id}] [Error: {str(e)}] "
                f"[Duration: {duration:.3f}s]"
            )
            raise


# ==================== SECURITY HEADERS ====================
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to responses"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy (adjust as needed)
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        return response


# ==================== ERROR HANDLING ====================
class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            response = await call_next(request)
            return response
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
            
        except Exception as exc:
            logger.exception(f"Unhandled exception: {str(exc)}")
            
            # Get request ID if available
            request_id = getattr(request.state, "request_id", "unknown")
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "Internal server error",
                    "error": str(exc) if os.environ.get("DEBUG") else "An error occurred",
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            )


# ==================== CONFIGURE CORS ====================
def configure_cors(app: FastAPI):
    """Configure CORS with secure defaults"""
    
    # Get allowed origins from environment
    allowed_origins = os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://localhost:3002"
    ).split(",")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Request-ID",
            "X-Client-ID",
            "Accept",
            "Accept-Language",
        ],
        expose_headers=[
            "X-Request-ID",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-Response-Time",
        ],
        max_age=600,  # 10 minutes
    )


# ==================== API VERSIONING ====================
class APIRouterV1:
    """Simple API versioning support"""
    
    @staticmethod
    def create_versioned_router(prefix: str = "/api/v1"):
        """Create a versioned router"""
        from fastapi import APIRouter
        return APIRouter(prefix=prefix)


# ==================== DEPENDENCY INJECTION HELPERS ====================
def get_request_id(request: Request) -> str:
    """Get request ID from request state"""
    return getattr(request.state, "request_id", "unknown")


# ==================== AUDIT LOGGING ====================
class AuditLogger:
    """Audit logging for sensitive operations"""
    
    def __init__(self):
        self.log_file = os.environ.get("AUDIT_LOG_FILE", "logs/audit.log")
        os.makedirs(os.path.dirname(self.log_file) if os.path.dirname(self.log_file) else "logs", exist_ok=True)
    
    def log(self, event: str, user_id: str, details: dict):
        """Log an audit event"""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "user_id": user_id,
            "details": details
        }
        
        # Log to file
        try:
            with open(self.log_file, "a") as f:
                f.write(f"{entry}\n")
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
        
        # Also log to standard logger
        logger.info(f"AUDIT: {event} - User: {user_id} - {details}")


# Global audit logger
audit_logger = AuditLogger()


# ==================== SECURITY DEPENDENCIES ====================
from fastapi import Depends
from typing import Optional


async def verify_api_key(request: Request, api_key: Optional[str] = None):
    """Verify API key for programmatic access"""
    if not api_key:
        # Check header
        api_key = request.headers.get("X-API-Key")
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # In production, validate against stored keys using constant-time comparison
    valid_keys = os.environ.get("API_KEYS", "dev-key-123").split(",")
    env = os.environ.get("OVERWATCH_ENV", "development")
    
    # Use constant-time comparison to prevent timing attacks
    api_key_valid = False
    for valid_key in valid_keys:
        if secrets.compare_digest(api_key, valid_key.strip()):
            api_key_valid = True
            break
    
    # In production, don't reveal if key exists at all
    if not api_key_valid:
        if env == "production":
            # Add small delay to prevent enumeration
            time.sleep(0.1)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )
        else:
            raise HTTPException(
                status_code=403,
                detail="Invalid API key"
            )
    
    return True


# ==================== SENSITIVE DATA REDACTION ====================
import re


def redact_sensitive_data(data: dict) -> dict:
    """Redact sensitive information from logs"""
    sensitive_fields = [
        "password", "token", "secret", "api_key", "authorization",
        "credit_card", "card_number", "ssn", "national_id"
    ]
    
    redacted = data.copy()
    
    def redact_value(key: str, val: any) -> any:
        key_lower = key.lower()
        
        # Check if field is sensitive
        if any(field in key_lower for field in sensitive_fields):
            if isinstance(val, str) and len(val) > 4:
                return f"***{val[-4:]}"
            return "***"
        
        # Recursively check nested dicts
        if isinstance(val, dict):
            return {k: redact_value(k, v) for k, v in val.items()}
        
        # Check lists
        if isinstance(val, list):
            return [redact_value(key, item) for item in val]
        
        return val
    
    return {k: redact_value(k, v) for k, v in redacted.items()}


# ==================== APPLY ALL MIDDLEWARE ====================
def apply_security_middleware(app: FastAPI):
    """Apply all security middleware to the app"""
    
    # Add CORS
    configure_cors(app)
    
    # Add custom middleware (order matters - last added = first executed)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(ErrorHandlingMiddleware)
    app.add_middleware(RateLimitMiddleware, requests_per_minute=60)
    app.add_middleware(RequestLoggingMiddleware)
    
    logger.info("Security middleware applied successfully")
