"""
Satellite Data Sources Module
Integrates free satellite imagery from Sentinel, Landsat for road monitoring
"""

import random
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from enum import Enum


class SatelliteType(Enum):
    SENTINEL_1 = "Sentinel-1"
    SENTINEL_2 = "Sentinel-2"
    LANDSAT_8 = "Landsat-8"
    LANDSAT_9 = "Landsat-9"


class SatelliteSensor(Enum):
    SAR = "SAR (Radar)"
    MSI = "Multispectral"
    TIRS = "Thermal Infrared"


class HazardType(Enum):
    FLOODING = "Flooding"
    LANDSLIDE = "Landslide"
    ROAD_DAMAGE = "Road Damage"
    WATER_ACCUMULATION = "Water Accumulation"
    EROSION = "Erosion"
    VEGETATION_ENCROACHMENT = "Vegetation Encroachment"


@dataclass
class SatelliteImage:
    satellite_id: str
    satellite_type: SatelliteType
    sensor: SatelliteSensor
    acquisition_date: datetime
    latitude: float
    longitude: float
    cloud_coverage: float
    spatial_resolution: int
    tile_id: str
    bounds: Tuple[float, float, float, float]
    processed: bool = False


@dataclass
class HazardDetection:
    id: str
    hazard_type: HazardType
    satellite_id: str
    detection_date: datetime
    latitude: float
    longitude: float
    severity: str
    confidence: float
    affected_area_km2: float
    description: str
    nearby_roads: List[str] = field(default_factory=list)
    nearby_county: str = ""
    status: str = "detected"


@dataclass
class RoadSegmentHazard:
    road_name: str
    county: str
    segment_start: Tuple[float, float]
    segment_end: Tuple[float, float]
    hazard_type: HazardType
    severity: str
    detected_at: datetime
    satellite_source: str


@dataclass
class SatelliteCoverage:
    tile_id: str
    latitude: float
    longitude: float
    covered_by: List[str]
    last_updated: datetime
    hazard_count: int


class SatelliteDataSource:
    KENYA_BOUNDING_BOX = {"north": 5.0, "south": -5.0, "east": 42.0, "west": 33.5}

    def __init__(self):
        self.images: List[SatelliteImage] = []
        self.hazards: List[HazardDetection] = []
        self._generate_sample_data()

    def _generate_sample_data(self):
        for i in range(100):
            lat = random.uniform(-4.5, 5.0)
            lon = random.uniform(33.5, 42.0)

            satellite_type = random.choice(list(SatelliteType))
            sensor = (
                SatelliteSensor.MSI
                if satellite_type
                in [
                    SatelliteType.SENTINEL_2,
                    SatelliteType.LANDSAT_8,
                    SatelliteType.LANDSAT_9,
                ]
                else SatelliteSensor.SAR
            )

            self.images.append(
                SatelliteImage(
                    satellite_id=f"SAT-{i+1:04d}",
                    satellite_type=satellite_type,
                    sensor=sensor,
                    acquisition_date=datetime.now(timezone.utc)
                    - timedelta(days=random.randint(0, 30)),
                    latitude=lat,
                    longitude=lon,
                    cloud_coverage=(
                        random.uniform(0, 80) if sensor != SatelliteSensor.SAR else 0
                    ),
                    spatial_resolution=(
                        10 if satellite_type == SatelliteType.SENTINEL_2 else 30
                    ),
                    tile_id=f"TILE-{random.randint(1000, 9999)}",
                    bounds=(lon - 0.1, lat - 0.1, lon + 0.1, lat + 0.1),
                )
            )

        hazard_types = list(HazardType)
        counties = [
            "Nairobi",
            "Mombasa",
            "Kisumu",
            "Nakuru",
            "Eldoret",
            "Thika",
            "Garissa",
            "Kakamega",
            "Meru",
            "Nyeri",
            "Kiambu",
            "Bungoma",
        ]

        for i in range(50):
            lat = random.uniform(-4.5, 5.0)
            lon = random.uniform(33.5, 42.0)
            hazard_type = random.choice(hazard_types)

            severity_weights = ["Low", "Low", "Medium", "Medium", "High"]
            severity = random.choice(severity_weights)

            self.hazards.append(
                HazardDetection(
                    id=f"HAZ-{i+1:04d}",
                    hazard_type=hazard_type,
                    satellite_id=f"SAT-{random.randint(1, 100):04d}",
                    detection_date=datetime.now(timezone.utc)
                    - timedelta(days=random.randint(0, 14)),
                    latitude=lat,
                    longitude=lon,
                    severity=severity,
                    confidence=random.uniform(0.65, 0.98),
                    affected_area_km2=random.uniform(0.5, 25.0),
                    description=self._generate_hazard_description(
                        hazard_type, severity
                    ),
                    nearby_roads=self._get_nearby_roads(lat, lon),
                    nearby_county=random.choice(counties),
                    status="active",
                )
            )

    def _generate_hazard_description(
        self, hazard_type: HazardType, severity: str
    ) -> str:
        descriptions = {
            HazardType.FLOODING: f"Satellite imagery indicates water accumulation on roadway. {severity} severity flooding detected.",
            HazardType.LANDSLIDE: f"Terrain displacement detected near roadway. {severity} landslide risk identified.",
            HazardType.ROAD_DAMAGE: f"Pavement degradation detected through multispectral analysis. {severity} road damage observed.",
            HazardType.WATER_ACCUMULATION: "Standing water detected on road surface. May indicate drainage issues.",
            HazardType.EROSION: "Road shoulder erosion detected. Vegetation loss observed in adjacent areas.",
            HazardType.VEGETATION_ENCROACHMENT: "Vegetation growth encroaching on roadway. May affect visibility and road width.",
        }
        return descriptions.get(hazard_type, "Hazard detected via satellite imagery.")

    def _get_nearby_roads(self, lat: float, lon: float) -> List[str]:
        major_roads = [
            "Nairobi-Mombasa Highway",
            "Nairobi-Nakuru Highway",
            "Nairobi-Thika Highway",
            "Mombasa-Malindi Road",
            "Nairobi-Narok Road",
            "Nairobi-Addis Ababa Road",
            "Eldoret-Webuye Road",
            "Kisumu-Busia Road",
            "Nyeri-Marsabit Road",
            "Nakuru-Eldoret Highway",
            "Nairobi-Garissa Road",
            "Mombasa-Tanga Road",
        ]
        return random.sample(major_roads, random.randint(1, 3))

    def get_available_imagery(
        self,
        satellite_type: Optional[SatelliteType] = None,
        max_cloud: float = 50.0,
        days: int = 30,
    ) -> List[Dict]:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        filtered = [
            img
            for img in self.images
            if img.acquisition_date >= cutoff_date
            and (satellite_type is None or img.satellite_type == satellite_type)
            and img.cloud_coverage <= max_cloud
        ]

        return [
            {
                "satellite_id": img.satellite_id,
                "satellite_type": img.satellite_type.value,
                "sensor": img.sensor.value,
                "acquisition_date": img.acquisition_date.isoformat(),
                "latitude": img.latitude,
                "longitude": img.longitude,
                "cloud_coverage": round(img.cloud_coverage, 1),
                "spatial_resolution": img.spatial_resolution,
                "tile_id": img.tile_id,
                "bounds": img.bounds,
            }
            for img in filtered
        ]

    def get_hazard_detections(
        self,
        hazard_type: Optional[HazardType] = None,
        min_confidence: float = 0.5,
        severity: Optional[str] = None,
        county: Optional[str] = None,
    ) -> List[Dict]:
        filtered = [
            h
            for h in self.hazards
            if h.confidence >= min_confidence
            and (hazard_type is None or h.hazard_type == hazard_type)
            and (severity is None or h.severity == severity)
            and (county is None or h.nearby_county == county)
        ]

        return [
            {
                "id": h.id,
                "hazard_type": h.hazard_type.value,
                "satellite_id": h.satellite_id,
                "detection_date": h.detection_date.isoformat(),
                "latitude": h.latitude,
                "longitude": h.longitude,
                "severity": h.severity,
                "confidence": round(h.confidence, 2),
                "affected_area_km2": round(h.affected_area_km2, 2),
                "description": h.description,
                "nearby_roads": h.nearby_roads,
                "nearby_county": h.nearby_county,
                "status": h.status,
            }
            for h in filtered
        ]

    def get_hazards_by_county(self, county: str) -> Dict:
        county_hazards = [h for h in self.hazards if h.nearby_county == county]

        return {
            "county": county,
            "total_hazards": len(county_hazards),
            "by_type": {
                ht.value: len([h for h in county_hazards if h.hazard_type == ht])
                for ht in HazardType
            },
            "by_severity": {
                "High": len([h for h in county_hazards if h.severity == "High"]),
                "Medium": len([h for h in county_hazards if h.severity == "Medium"]),
                "Low": len([h for h in county_hazards if h.severity == "Low"]),
            },
            "active_alerts": len([h for h in county_hazards if h.status == "active"]),
            "hazards": self.get_hazard_detections(county=county),
        }

    def get_road_hazards_overlay(self) -> List[Dict]:
        road_hazards = []

        for hazard in self.hazards:
            if hazard.nearby_roads:
                for road in hazard.nearby_roads:
                    road_hazards.append(
                        {
                            "road_name": road,
                            "county": hazard.nearby_county,
                            "hazard_type": hazard.hazard_type.value,
                            "severity": hazard.severity,
                            "location": {
                                "lat": hazard.latitude,
                                "lon": hazard.longitude,
                            },
                            "detected_at": hazard.detection_date.isoformat(),
                            "confidence": hazard.confidence,
                            "satellite_source": hazard.satellite_id,
                        }
                    )

        return sorted(road_hazards, key=lambda x: x["confidence"], reverse=True)

    def get_coverage_statistics(self) -> Dict:
        return {
            "total_images": len(self.images),
            "by_satellite": {
                st.value: len([i for i in self.images if i.satellite_type == st])
                for st in SatelliteType
            },
            "total_hazards": len(self.hazards),
            "hazard_types": {
                ht.value: len([h for h in self.hazards if h.hazard_type == ht])
                for ht in HazardType
            },
            "severity_distribution": {
                "High": len([h for h in self.hazards if h.severity == "High"]),
                "Medium": len([h for h in self.hazards if h.severity == "Medium"]),
                "Low": len([h for h in self.hazards if h.severity == "Low"]),
            },
            "counties_affected": len(set(h.nearby_county for h in self.hazards)),
            "kenya_bounds": self.KENYA_BOUNDING_BOX,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

    def get_recent_detections(self, days: int = 7) -> List[Dict]:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        recent = [h for h in self.hazards if h.detection_date >= cutoff]

        return [
            {
                "id": h.id,
                "hazard_type": h.hazard_type.value,
                "severity": h.severity,
                "location": f"{h.latitude:.4f}, {h.longitude:.4f}",
                "county": h.nearby_county,
                "detected_at": h.detection_date.isoformat(),
                "roads_affected": h.nearby_roads,
            }
            for h in recent
        ]


satellite_source = SatelliteDataSource()
