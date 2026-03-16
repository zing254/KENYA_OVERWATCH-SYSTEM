"""
Routing Service
Calculates ETAs using OSRM (Open Source Routing Machine)
"""

import logging
import os
import httpx
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


@dataclass
class RouteResult:
    """Result from routing API"""

    distance_km: float
    duration_minutes: float
    geometry: Optional[str] = None
    geometry_coords: Optional[List[List[float]]] = None


class RoutingService:
    """OSRM-based routing service for ETA calculation"""

    def __init__(self, osrm_url: str = "http://router.project-osrm.org"):
        self.osrm_url = osrm_url
        self.use_osrm = os.environ.get("USE_OSRM", "false").lower() == "true"
        self.cache: Dict[
            Tuple[float, float, float, float], Tuple[RouteResult, datetime]
        ] = {}
        self.cache_ttl_seconds = 300  # 5 minutes

    async def get_route(
        self,
        start_lng: float,
        start_lat: float,
        end_lng: float,
        end_lat: float,
        profile: str = "driving",
    ) -> Optional[RouteResult]:
        """Get route between two points using OSRM"""

        # Check cache first
        cache_key = (start_lng, start_lat, end_lng, end_lat)
        if cache_key in self.cache:
            result, cached_time = self.cache[cache_key]
            age = (datetime.now(timezone.utc) - cached_time).total_seconds()
            if age < self.cache_ttl_seconds:
                return result

        # Use OSRM if enabled
        if self.use_osrm:
            try:
                return await self._osrm_route(
                    start_lng, start_lat, end_lng, end_lat, profile
                )
            except Exception as e:
                logger.warning(f"OSRM routing failed, using fallback: {e}")

        # Fallback to haversine + average speed
        return self._fallback_route(start_lng, start_lat, end_lng, end_lat)

    async def _osrm_route(
        self,
        start_lng: float,
        start_lat: float,
        end_lng: float,
        end_lat: float,
        profile: str = "driving",
    ) -> Optional[RouteResult]:
        """Call OSRM API"""

        url = f"{self.osrm_url}/route/v1/{profile}/{start_lng},{start_lat};{end_lng},{end_lat}"
        params = {"overview": "full", "geometries": "geojson"}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()

            data = response.json()

            if data.get("code") != "Ok" or not data.get("routes"):
                logger.warning(f"OSRM returned error: {data.get('code')}")
                return self._fallback_route(start_lng, start_lat, end_lng, end_lat)

            route = data["routes"][0]

            # Extract geometry
            geometry = route.get("geometry", {})
            geometry_coords = geometry.get("coordinates", [])

            result = RouteResult(
                distance_km=route["distance"] / 1000.0,
                duration_minutes=route["duration"] / 60.0,
                geometry_coords=geometry_coords,
            )

            # Cache result
            cache_key = (start_lng, start_lat, end_lng, end_lat)
            self.cache[cache_key] = (result, datetime.now(timezone.utc))

            return result

    def _fallback_route(
        self, start_lng: float, start_lat: float, end_lng: float, end_lat: float
    ) -> RouteResult:
        """Fallback routing using haversine distance and average speed"""

        # Calculate distance
        distance_km = self._haversine_distance(start_lat, start_lng, end_lat, end_lng)

        # Assume average speed of 30 km/h for city driving
        # Could be adjusted based on time of day
        avg_speed_kmh = 30.0

        duration_minutes = (distance_km / avg_speed_kmh) * 60.0

        result = RouteResult(distance_km=distance_km, duration_minutes=duration_minutes)

        # Cache result
        cache_key = (start_lng, start_lat, end_lng, end_lat)
        self.cache[cache_key] = (result, datetime.now(timezone.utc))

        return result

    def _haversine_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calculate distance in km using haversine formula"""
        from math import radians, sin, cos, sqrt, atan2

        R = 6371  # Earth radius in km

        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return R * c

    async def calculate_eta(
        self,
        responder_lat: float,
        responder_lng: float,
        incident_lat: float,
        incident_lng: float,
    ) -> Dict[str, Any]:
        """Calculate ETA from responder to incident"""

        route = await self.get_route(
            responder_lng, responder_lat, incident_lng, incident_lat
        )

        if not route:
            return {
                "error": "Could not calculate route",
                "eta_minutes": None,
                "distance_km": None,
            }

        return {
            "eta_minutes": round(route.duration_minutes, 1),
            "distance_km": round(route.distance_km, 2),
            "route_geometry": route.geometry_coords,
            "calculated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def get_multiple_etas(
        self, responders: List[Dict], incident_lat: float, incident_lng: float
    ) -> List[Dict]:
        """Calculate ETAs for multiple responders"""

        results = []

        for responder in responders:
            responder_id = responder.get("id", "")
            lat = responder.get("latitude", 0)
            lng = responder.get("longitude", 0)

            if lat == 0 and lng == 0:
                continue

            eta = await self.calculate_eta(lat, lng, incident_lat, incident_lng)

            results.append(
                {
                    "responder_id": responder_id,
                    "responder_name": responder.get("name", ""),
                    "responder_type": responder.get("type", ""),
                    **eta,
                }
            )

        # Sort by ETA
        results.sort(key=lambda x: x.get("eta_minutes", 999))

        return results


# Global routing service
routing_service = RoutingService()


async def get_eta_for_dispatch(
    responder_id: str,
    responder_lat: float,
    responder_lng: float,
    incident_lat: float,
    incident_lng: float,
) -> Dict[str, Any]:
    """Helper function to get ETA for a responder"""
    return await routing_service.calculate_eta(
        responder_lat, responder_lng, incident_lat, incident_lng
    )
