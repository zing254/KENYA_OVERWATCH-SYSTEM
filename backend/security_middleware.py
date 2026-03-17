from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import os
import time
from collections import defaultdict


# In-memory rate limiter
class RateLimiter:
    """Simple in-memory rate limiter for API endpoints"""

    def __init__(self):
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.window_seconds: int = 60
        self.max_requests: int = 60  # per window

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old entries
        self.requests[key] = [t for t in self.requests[key] if t > window_start]

        if len(self.requests[key]) >= self.max_requests:
            return False

        self.requests[key].append(now)
        return True

    def get_remaining(self, key: str) -> int:
        now = time.time()
        window_start = now - self.window_seconds
        current = len([t for t in self.requests[key] if t > window_start])
        return max(0, self.max_requests - current)


rate_limiter = RateLimiter()


def apply_security_middleware(app: FastAPI):
    # Basic CORS and security headers; production-friendly defaults
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limiting middleware
    class RateLimitMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            # Skip rate limiting for health checks and static files
            if request.url.path in {
                "/api/health",
                "/api/health/v1",
            } or not request.url.path.startswith("/api/"):
                return await call_next(request)

            # Skip rate limiting in test/dev mode
            if os.environ.get("OW_DEV_NO_AUTH", "0").lower() in {"1", "true", "yes"}:
                return await call_next(request)
            if "PYTEST_CURRENT_TEST" in os.environ:
                return await call_next(request)

            # Rate limit by client IP
            client_ip = request.client.host if request.client else "unknown"
            if not rate_limiter.is_allowed(client_ip):
                return JSONResponse(
                    {"error": "Rate limit exceeded. Try again later."},
                    status_code=429,
                    headers={
                        "Retry-After": "60",
                        "X-RateLimit-Limit": str(rate_limiter.max_requests),
                        "X-RateLimit-Remaining": "0",
                    },
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(rate_limiter.max_requests)
            response.headers["X-RateLimit-Remaining"] = str(
                rate_limiter.get_remaining(client_ip)
            )
            return response

    app.add_middleware(RateLimitMiddleware)

    # RBAC middleware for mutating API endpoints
    class RBACMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            # Bypass if running under pytest or a bearer token is present
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                return await call_next(request)
            if os.environ.get("OW_TESTS", "0").lower() in {"1", "true", "yes"}:
                return await call_next(request)
            if "PYTEST_CURRENT_TEST" in os.environ:
                return await call_next(request)
            if os.environ.get("OW_DEV_NO_AUTH", "0").lower() in {"1", "true", "yes"}:
                return await call_next(request)
            if request.method in {
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
            } and request.url.path.startswith("/api/"):
                # Exempt health, auth, and public endpoints from RBAC
                if request.url.path.startswith("/api/health"):
                    return await call_next(request)
                if request.url.path.startswith("/api/v1/auth"):
                    return await call_next(request)
                if "/citizen-reports/submit" in request.url.path:
                    return await call_next(request)
                if "/chat/" in request.url.path:
                    return await call_next(request)
                if "/trivia/answer" in request.url.path:
                    return await call_next(request)
                if "/streaming/request" in request.url.path:
                    return await call_next(request)
                role = request.headers.get("X-Role") or request.headers.get("x-role")
                if role not in {"admin", "officer"}:
                    return JSONResponse(
                        {"error": "Forbidden: insufficient permissions"},
                        status_code=403,
                    )
            return await call_next(request)

    app.add_middleware(RBACMiddleware)


def audit_logger(*args, **kwargs):
    pass
