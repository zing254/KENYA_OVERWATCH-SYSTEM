from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any
from enum import Enum
import time
import re
from collections import defaultdict
import httpx

from .config import GatewayConfig


class HttpMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"


@dataclass
class RateLimit:
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    burst_limit: int = 10


@dataclass
class Route:
    path: str
    method: HttpMethod
    upstream_url: str
    methods: List[str] = field(default_factory=list)
    rate_limit: Optional[RateLimit] = None
    auth_required: bool = True
    roles: List[str] = field(default_factory=list)
    timeout: int = 30
    retry_count: int = 3
    cache_ttl: int = 0


class APIGateway:
    def __init__(self, config: Optional["GatewayConfig"] = None):
        self.config = config or GatewayConfig()
        self.routes: Dict[str, Route] = {}
        self.request_counts: Dict[str, List[float]] = defaultdict(list)
        self.service_urls = {
            "road_safety": "http://localhost:8001",
            "control_center": "http://localhost:3000",
            "taifa_guard": "http://localhost:3001",
            "taifaroad": "http://localhost:3002"
        }
        
        self._register_default_routes()

    def _register_default_routes(self):
        self.add_route(Route(
            path="/api/v1/services/incidents",
            method=HttpMethod.GET,
            upstream_url="{road_safety}/api/v1/services/incidents"
        ))
        self.add_route(Route(
            path="/api/v1/services/incidents",
            method=HttpMethod.POST,
            upstream_url="{road_safety}/api/v1/services/incidents"
        ))
        self.add_route(Route(
            path="/api/v1/services/dispatch",
            method=HttpMethod.POST,
            upstream_url="{road_safety}/api/v1/services/dispatch"
        ))
        self.add_route(Route(
            path="/api/cameras",
            method=HttpMethod.GET,
            upstream_url="{road_safety}/api/cameras"
        ))
        self.add_route(Route(
            path="/api/dashboard",
            method=HttpMethod.GET,
            upstream_url="{road_safety}/api/dashboard"
        ))

    def add_route(self, route: Route):
        key = f"{route.method.value}:{route.path}"
        self.routes[key] = route

    def remove_route(self, path: str, method: HttpMethod):
        key = f"{method.value}:{path}"
        if key in self.routes:
            del self.routes[key]

    def find_route(self, path: str, method: HttpMethod) -> Optional[Route]:
        for route_key, route in self.routes.items():
            if self._match_path(route.path, path):
                if route.method == method or route.method == HttpMethod.GET:
                    return route
        return None

    def _match_path(self, pattern: str, path: str) -> bool:
        pattern_parts = pattern.strip("/").split("/")
        path_parts = path.strip("/").split("/")
        
        if len(pattern_parts) != len(path_parts):
            return False
        
        for pp, p in zip(pattern_parts, path_parts):
            if pp.startswith("{"):
                continue
            if pp != p:
                return False
        
        return True

    def check_rate_limit(self, client_id: str, route: Route) -> bool:
        if not route.rate_limit:
            return True
        
        now = time.time()
        self.request_counts[client_id] = [
            t for t in self.request_counts[client_id] if now - t < 60
        ]
        
        if len(self.request_counts[client_id]) >= route.rate_limit.requests_per_minute:
            return False
        
        self.request_counts[client_id].append(now)
        return True

    async def forward_request(
        self,
        path: str,
        method: str,
        headers: Dict[str, str],
        body: Optional[bytes] = None,
        client_id: str = "anonymous"
    ) -> Dict[str, Any]:
        http_method = HttpMethod(method.upper())
        route = self.find_route(path, http_method)
        
        if not route:
            return {
                "status": 404,
                "body": {"error": "Route not found"}
            }
        
        if not self.check_rate_limit(client_id, route):
            return {
                "status": 429,
                "body": {"error": "Rate limit exceeded"}
            }
        
        upstream_url = route.upstream_url.format(**self.service_urls)
        full_url = f"{upstream_url}{path}"
        
        try:
            async with httpx.AsyncClient(timeout=route.timeout) as client:
                response = await client.request(
                    method=method,
                    url=full_url,
                    headers=headers,
                    content=body
                )
                
                return {
                    "status": response.status_code,
                    "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
                    "headers": dict(response.headers)
                }
        except httpx.TimeoutException:
            return {
                "status": 504,
                "body": {"error": "Gateway timeout"}
            }
        except Exception as e:
            return {
                "status": 502,
                "body": {"error": f"Bad gateway: {str(e)}"}
            }

    def register_service(self, service_name: str, url: str):
        self.service_urls[service_name] = url

    def get_registered_services(self) -> Dict[str, str]:
        return self.service_urls.copy()

    def get_route_stats(self) -> Dict[str, Any]:
        return {
            "total_routes": len(self.routes),
            "routes": [
                {
                    "path": r.path,
                    "method": r.method.value,
                    "upstream": r.upstream_url
                }
                for r in self.routes.values()
            ]
        }
