"""
Traffic Data Integration Module
Integrates traffic data from Google Maps, TomTom and other sources
"""

import random
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum


class CongestionLevel(Enum):
    FREE = "Free Flow"
    LIGHT = "Light Traffic"
    MODERATE = "Moderate"
    HEAVY = "Heavy Traffic"
    SEVERE = "Severe Congestion"


class IncidentSeverity(Enum):
    MINOR = "Minor"
    MODERATE = "Moderate"
    MAJOR = "Major"
    SEVERE = "Severe"


class IncidentType(Enum):
    TRAFFIC = "Traffic Incident"
    ROAD_WORK = "Road Work"
    ACCIDENT = "Accident"
    VEHICLE_BREAKDOWN = "Vehicle Breakdown"
    WEATHER = "Weather Related"
    EVENT = "Special Event"


@dataclass
class TrafficData:
    road_name: str
    county: str
    segment: str
    congestion_level: CongestionLevel
    speed_kmh: float
    avg_speed_kmh: float
    travel_time_min: float
    delay_min: float
    updated_at: datetime


@dataclass
class TrafficIncident:
    incident_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    road_name: str
    county: str
    location: Dict[str, float]
    description: str
    reported_at: datetime
    cleared_at: Optional[datetime]
    lanes_affected: int
    alternative_routes: List[str]


@dataclass
class RoadSegment:
    road_id: str
    road_name: str
    county: str
    category: str
    start_point: str
    end_point: str
    length_km: float
    speed_limit_kmh: int
    lanes: int
    avg_daily_traffic: int
    congestion_index: float


class TrafficService:
    def __init__(self):
        self.traffic_data: List[TrafficData] = []
        self.incidents: List[TrafficIncident] = []
        self.roads: List[RoadSegment] = []
        self._generate_traffic_data()
        self._generate_incidents()
        self._generate_roads()

    def _generate_traffic_data(self):
        roads = [
            ("Nairobi-Mombasa Highway", "Nairobi"),
            ("Nairobi-Mombasa Highway", "Machakos"),
            ("Thika Road", "Nairobi"),
            ("Ngong Road", "Nairobi"),
            ("Kenyatta Avenue", "Nairobi"),
            ("Nairobi-Nakuru Highway", "Nakuru"),
            ("Mombasa-Malindi Road", "Mombasa"),
            ("Mombasa-Malindi Road", "Kilifi"),
            ("Kisumu-Busia Road", "Kisumu"),
            ("Kisumu-Busia Road", "Siaya"),
            ("Eldoret-Webuye Road", "Uasin Gishu"),
            ("Eldoret-Webuye Road", "Trans-Nzoia"),
            ("Nairobi-Narok Road", "Kajiado"),
            ("Nairobi-Garissa Road", "Machakos"),
            ("Nairobi-Garissa Road", "Kitui"),
        ]

        for road, county in roads:
            for hour in range(24):
                is_rush_hour = (7 <= hour <= 9) or (16 <= hour <= 19)
                is_weekend = datetime.now().weekday() >= 5

                if is_rush_hour:
                    base_congestion = random.choice(
                        [
                            CongestionLevel.HEAVY,
                            CongestionLevel.MODERATE,
                            CongestionLevel.SEVERE,
                        ]
                    )
                    base_speed = random.uniform(20, 50)
                elif is_weekend and 10 <= hour <= 16:
                    base_congestion = random.choice(
                        [CongestionLevel.MODERATE, CongestionLevel.LIGHT]
                    )
                    base_speed = random.uniform(50, 70)
                else:
                    base_congestion = random.choice(
                        [CongestionLevel.FREE, CongestionLevel.LIGHT]
                    )
                    base_speed = random.uniform(60, 100)

                self.traffic_data.append(
                    TrafficData(
                        road_name=road,
                        county=county,
                        segment=f"{road} - Segment {random.randint(1, 5)}",
                        congestion_level=base_congestion,
                        speed_kmh=round(base_speed, 1),
                        avg_speed_kmh=round(base_speed * random.uniform(0.9, 1.1), 1),
                        travel_time_min=random.uniform(5, 60),
                        delay_min=max(
                            0,
                            (
                                random.uniform(0, 30)
                                if base_congestion != CongestionLevel.FREE
                                else 0
                            ),
                        ),
                        updated_at=datetime.now(timezone.utc),
                    )
                )

    def _generate_incidents(self):
        incident_types = [
            (
                IncidentType.ACCIDENT,
                IncidentSeverity.MAJOR,
                ["Mombasa Road", "Thika Road", "Ngong Road"],
            ),
            (
                IncidentType.VEHICLE_BREAKDOWN,
                IncidentSeverity.MINOR,
                ["Thika Road", "Nairobi-Nakuru Highway"],
            ),
            (
                IncidentType.ROAD_WORK,
                IncidentSeverity.MODERATE,
                ["Nairobi-Nakuru Highway", "Mombasa-Malindi Road"],
            ),
            (
                IncidentType.TRAFFIC,
                IncidentSeverity.MODERATE,
                ["Kenyatta Avenue", "Mombasa Road"],
            ),
        ]

        for i, (inc_type, severity, roads) in enumerate(incident_types):
            for road in roads[:2]:
                county = (
                    "Nairobi"
                    if road
                    in ["Thika Road", "Ngong Road", "Kenyatta Avenue", "Mombasa Road"]
                    else "Mombasa"
                )

                self.incidents.append(
                    TrafficIncident(
                        incident_id=f"INC-{1000 + i}",
                        incident_type=inc_type,
                        severity=severity,
                        road_name=road,
                        county=county,
                        location={
                            "lat": random.uniform(-1.5, 0),
                            "lon": random.uniform(36.5, 40),
                        },
                        description=f"{inc_type.value} reported on {road}",
                        reported_at=datetime.now(timezone.utc)
                        - timedelta(hours=random.randint(0, 6)),
                        cleared_at=(
                            None
                            if random.random() > 0.5
                            else datetime.now(timezone.utc)
                            + timedelta(hours=random.randint(1, 3))
                        ),
                        lanes_affected=random.randint(1, 3),
                        alternative_routes=[
                            f"Alternative Route {j+1}" for j in range(2)
                        ],
                    )
                )

    def _generate_roads(self):
        road_list = [
            ("Nairobi-Mombasa Highway", "Nairobi", "Highway", 120, 4, 45000),
            ("Nairobi-Mombasa Highway", "Machakos", "Highway", 100, 4, 35000),
            ("Thika Road", "Nairobi", "Primary", 80, 6, 55000),
            ("Ngong Road", "Nairobi", "Primary", 60, 4, 32000),
            ("Kenyatta Avenue", "Nairobi", "Arterial", 50, 4, 28000),
            ("Nairobi-Nakuru Highway", "Nakuru", "Highway", 110, 4, 30000),
            ("Mombasa-Malindi Road", "Mombasa", "Primary", 80, 4, 25000),
            ("Kisumu-Busia Road", "Kisumu", "Primary", 70, 2, 15000),
            ("Eldoret-Webuye Road", "Uasin Gishu", "Primary", 80, 2, 12000),
            ("Nairobi-Narok Road", "Kajiado", "Highway", 100, 2, 18000),
        ]

        for i, (name, county, category, speed, lanes, traffic) in enumerate(road_list):
            self.roads.append(
                RoadSegment(
                    road_id=f"ROAD-{i+1:03d}",
                    road_name=name,
                    county=county,
                    category=category,
                    start_point=f"Start of {name}",
                    end_point=f"End of {name}",
                    length_km=random.uniform(10, 80),
                    speed_limit_kmh=speed,
                    lanes=lanes,
                    avg_daily_traffic=traffic,
                    congestion_index=random.uniform(0.3, 0.9),
                )
            )

    def get_current_traffic(
        self, road: Optional[str] = None, county: Optional[str] = None
    ) -> Dict:
        data = self.traffic_data

        if road:
            data = [t for t in data if road.lower() in t.road_name.lower()]
        if county:
            data = [t for t in data if t.county == county]

        latest = {}
        for t in data:
            key = f"{t.road_name}_{t.segment}"
            if key not in latest or t.updated_at > latest[key].updated_at:
                latest[key] = t

        return {
            "roads_monitored": len(latest),
            "congestion_summary": {
                "free_flow": len(
                    [
                        t
                        for t in latest.values()
                        if t.congestion_level == CongestionLevel.FREE
                    ]
                ),
                "light": len(
                    [
                        t
                        for t in latest.values()
                        if t.congestion_level == CongestionLevel.LIGHT
                    ]
                ),
                "moderate": len(
                    [
                        t
                        for t in latest.values()
                        if t.congestion_level == CongestionLevel.MODERATE
                    ]
                ),
                "heavy": len(
                    [
                        t
                        for t in latest.values()
                        if t.congestion_level == CongestionLevel.HEAVY
                    ]
                ),
                "severe": len(
                    [
                        t
                        for t in latest.values()
                        if t.congestion_level == CongestionLevel.SEVERE
                    ]
                ),
            },
            "traffic": [
                {
                    "road_name": t.road_name,
                    "county": t.county,
                    "segment": t.segment,
                    "congestion": t.congestion_level.value,
                    "speed_kmh": t.speed_kmh,
                    "travel_time_min": t.travel_time_min,
                    "delay_min": t.delay_min,
                    "updated_at": t.updated_at.isoformat(),
                }
                for t in latest.values()
            ],
        }

    def get_incidents(
        self, county: Optional[str] = None, severity: Optional[str] = None
    ) -> Dict:
        incidents = self.incidents

        if county:
            incidents = [i for i in incidents if i.county == county]
        if severity:
            incidents = [i for i in incidents if i.severity.value == severity]

        active = [i for i in incidents if i.cleared_at is None]
        cleared = [i for i in incidents if i.cleared_at is not None]

        return {
            "total_incidents": len(incidents),
            "active_incidents": len(active),
            "cleared_incidents": len(cleared),
            "incidents": [
                {
                    "id": i.incident_id,
                    "type": i.incident_type.value,
                    "severity": i.severity.value,
                    "road_name": i.road_name,
                    "county": i.county,
                    "location": i.location,
                    "description": i.description,
                    "reported_at": i.reported_at.isoformat(),
                    "cleared_at": i.cleared_at.isoformat() if i.cleared_at else None,
                    "lanes_affected": i.lanes_affected,
                    "status": "active" if i.cleared_at is None else "cleared",
                }
                for i in incidents
            ],
        }

    def get_congestion_heatmap(self) -> Dict:
        heatmap = []

        for road, county in set((t.road_name, t.county) for t in self.traffic_data):
            road_data = [t for t in self.traffic_data if t.road_name == road]

            hourly_avg = {}
            for t in road_data:
                hour = t.updated_at.hour
                if hour not in hourly_avg:
                    hourly_avg[hour] = []
                hourly_avg[hour].append(t.delay_min)

            heatmap.append(
                {
                    "road_name": road,
                    "county": county,
                    "hourly_delays": {
                        str(h): round(sum(dels) / len(dels), 1) if dels else 0
                        for h, dels in hourly_avg.items()
                    },
                }
            )

        return {
            "heatmap": heatmap,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_road_statistics(self) -> Dict:
        return {
            "total_roads": len(self.roads),
            "roads": [
                {
                    "road_id": r.road_id,
                    "road_name": r.road_name,
                    "county": r.county,
                    "category": r.category,
                    "length_km": round(r.length_km, 1),
                    "speed_limit_kmh": r.speed_limit_kmh,
                    "lanes": r.lanes,
                    "avg_daily_traffic": r.avg_daily_traffic,
                    "congestion_index": round(r.congestion_index, 2),
                }
                for r in sorted(
                    self.roads, key=lambda x: x.avg_daily_traffic, reverse=True
                )
            ],
        }


traffic_service = TrafficService()
