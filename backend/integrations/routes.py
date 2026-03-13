"""
Weather & Traffic API Routes
REST API endpoints for weather and traffic data
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timezone

try:
    from .weather import weather_service
    from .traffic import traffic_service
except ImportError:
    from integrations.weather import weather_service
    from integrations.traffic import traffic_service


router = APIRouter(prefix="/api/environment", tags=["Weather & Traffic"])


@router.get("/weather")
async def get_weather(county: Optional[str] = None):
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "weather": weather_service.get_current_weather(county)
    }


@router.get("/weather/alerts")
async def get_weather_alerts(
    county: Optional[str] = None,
    severity: Optional[str] = None
):
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **weather_service.get_weather_alerts(county, severity)
    }


@router.get("/weather/road-impact")
async def get_road_weather_impact():
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "road_impacts": weather_service.get_road_weather_impact()
    }


@router.get("/weather/forecast/{county}")
async def get_weather_forecast(
    county: str,
    days: int = Query(5, le=14)
):
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **weather_service.get_forecast(county, days)
    }


@router.get("/traffic")
async def get_traffic(
    road: Optional[str] = None,
    county: Optional[str] = None
):
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **traffic_service.get_current_traffic(road, county)
    }


@router.get("/traffic/incidents")
async def get_traffic_incidents(
    county: Optional[str] = None,
    severity: Optional[str] = None
):
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **traffic_service.get_incidents(county, severity)
    }


@router.get("/traffic/congestion-heatmap")
async def get_congestion_heatmap():
    return traffic_service.get_congestion_heatmap()


@router.get("/traffic/roads")
async def get_road_statistics():
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **traffic_service.get_road_statistics()
    }


@router.get("/dashboard/overview")
async def get_environment_dashboard():
    weather = weather_service.get_current_weather()
    weather_alerts = weather_service.get_weather_alerts()
    traffic = traffic_service.get_current_traffic()
    traffic_incidents = traffic_service.get_incidents()
    road_impacts = weather_service.get_road_weather_impact()
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "weather": {
            "locations_count": len(weather.get("locations", [])),
            "active_alerts": weather_alerts["active_alerts"],
            "high_risk_areas": len([r for r in road_impacts if r["risk_score"] >= 70])
        },
        "traffic": {
            "roads_monitored": traffic["roads_monitored"],
            "heavy_congestion": traffic["congestion_summary"]["heavy"],
            "severe_congestion": traffic["congestion_summary"]["severe"],
            "active_incidents": traffic_incidents["active_incidents"]
        },
        "alerts": weather_alerts["alerts"][:5],
        "incidents": traffic_incidents["incidents"][:5],
        "high_risk_roads": road_impacts[:10]
    }
