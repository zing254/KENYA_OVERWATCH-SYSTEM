"""
Satellite Monitoring API Routes
REST API endpoints for satellite imagery and hazard detection
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timezone

try:
    from .data_sources import (
        satellite_source,
        SatelliteType,
        HazardType
    )
except ImportError:
    from satellite.data_sources import (
        satellite_source,
        SatelliteType,
        HazardType
    )


router = APIRouter(prefix="/api/satellite", tags=["Satellite Monitoring"])


@router.get("/imagery")
async def get_available_imagery(
    satellite_type: Optional[str] = None,
    max_cloud: float = Query(50.0, le=100),
    days: int = Query(30, le=90)
):
    sat_type = None
    if satellite_type:
        try:
            sat_type = SatelliteType[satellite_type.upper().replace("-", "_")]
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid satellite type: {satellite_type}")
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "query_params": {
            "satellite_type": satellite_type,
            "max_cloud_coverage": max_cloud,
            "days": days
        },
        "images": satellite_source.get_available_imagery(sat_type, max_cloud, days)
    }


@router.get("/hazards")
async def get_hazard_detections(
    hazard_type: Optional[str] = None,
    min_confidence: float = Query(0.5, ge=0, le=1),
    severity: Optional[str] = None,
    county: Optional[str] = None
):
    hz_type = None
    if hazard_type:
        try:
            hz_type = HazardType[hazard_type.upper().replace(" ", "_")]
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid hazard type: {hazard_type}")
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "hazards": satellite_source.get_hazard_detections(hz_type, min_confidence, severity, county)
    }


@router.get("/hazards/{county_name}")
async def get_county_hazards(county_name: str):
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "county_data": satellite_source.get_hazards_by_county(county_name)
    }


@router.get("/roads/overlay")
async def get_road_hazard_overlay():
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "road_hazards": satellite_source.get_road_hazards_overlay()
    }


@router.get("/coverage/statistics")
async def get_coverage_statistics():
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "statistics": satellite_source.get_coverage_statistics()
    }


@router.get("/detections/recent")
async def get_recent_detections(days: int = Query(7, le=30)):
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "days": days,
        "detections": satellite_source.get_recent_detections(days)
    }


@router.get("/types")
async def get_satellite_types():
    return {
        "satellites": [
            {"name": st.value, "description": desc}
            for st, desc in [
                (SatelliteType.SENTINEL_1, "Radar (SAR) - Works through clouds, day/night"),
                (SatelliteType.SENTINEL_2, "Optical (10m) - High resolution multispectral"),
                (SatelliteType.LANDSAT_8, "Thermal + Optical - Long-term monitoring"),
                (SatelliteType.LANDSAT_9, "Enhanced Thermal - Improved climate data")
            ]
        ],
        "hazard_types": [
            {"name": ht.value, "description": desc}
            for ht, desc in [
                (HazardType.FLOODING, "Water accumulation on roads and surrounding areas"),
                (HazardType.LANDSLIDE, "Terrain displacement near roadways"),
                (HazardType.ROAD_DAMAGE, "Pavement degradation and surface damage"),
                (HazardType.WATER_ACCUMULATION, "Standing water indicating drainage issues"),
                (HazardType.EROSION, "Road shoulder and adjacent terrain erosion"),
                (HazardType.VEGETATION_ENCROACHMENT, "Plant growth affecting road visibility/width")
            ]
        ]
    }


from datetime import timezone
