"""
County Analytics Service
Provides analytics and reporting for all 47 Kenyan counties
"""

import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Any
from dataclasses import dataclass

from ..county_data import (
    KENYA_COUNTIES, 
    County, 
    get_county_by_name, 
    get_county_by_code,
    CountyRegion
)


@dataclass
class CountyIncidentStats:
    county: str
    total_accidents: int
    total_violations: int
    fatalities: int
    injuries: int
    risk_score: float
    trend: str
    top_roads: List[Dict[str, Any]]
    incident_types: Dict[str, int]
    monthly_data: List[Dict[str, int]]
    severity_breakdown: Dict[str, int]


class CountyAnalyticsService:
    def __init__(self):
        self._seed_data = self._generate_seed_data()
    
    def _generate_seed_data(self) -> Dict[str, Dict]:
        seed = {}
        for county in KENYA_COUNTIES:
            pop_factor = county.population / 1000000
            base_accidents = int(50 * pop_factor + random.randint(10, 100))
            seed[county.name] = {
                "base_accidents": base_accidents,
                "base_violations": int(base_accidents * random.uniform(2, 4)),
                "fatality_rate": random.uniform(0.08, 0.25),
                "injury_rate": random.uniform(0.3, 0.6),
                "risk_score": min(95, max(15, 40 + pop_factor * 30 + random.randint(-15, 25))),
                "urban_factor": 1 if county.road_density_km > 400 else 0.7,
            }
        return seed
    
    def get_county_stats(self, county_name: str, time_period: str = "month") -> CountyIncidentStats:
        county = get_county_by_name(county_name)
        if not county:
            raise ValueError(f"County not found: {county_name}")
        
        seed = self._seed_data.get(county_name, {})
        
        period_multiplier = {
            "day": 1/30,
            "week": 7/30,
            "month": 1,
            "quarter": 3,
            "year": 12
        }.get(time_period, 1)
        
        total_accidents = int(seed.get("base_accidents", 50) * period_multiplier)
        total_violations = int(seed.get("base_violations", 150) * period_multiplier)
        
        fatalities = int(total_accidents * seed.get("fatality_rate", 0.1))
        injuries = int(total_accidents * seed.get("injury_rate", 0.4))
        
        return CountyIncidentStats(
            county=county_name,
            total_accidents=total_accidents,
            total_violations=total_violations,
            fatalities=fatalities,
            injuries=injuries,
            risk_score=seed.get("risk_score", 50),
            trend="increasing" if random.random() > 0.5 else "decreasing",
            top_roads=self._get_top_roads(county),
            incident_types=self._get_incident_types(),
            monthly_data=self._get_monthly_data(period_multiplier),
            severity_breakdown=self._get_severity_breakdown(total_accidents)
        )
    
    def _get_top_roads(self, county: County) -> List[Dict[str, Any]]:
        if county.major_roads:
            roads = [
                {"name": road, "accidents": random.randint(5, 50), "risk_level": random.choice(["high", "medium", "low"])}
                for road in county.major_roads[:3]
            ]
        else:
            roads = [
                {"name": f"Road {i+1}", "accidents": random.randint(5, 30), "risk_level": random.choice(["high", "medium", "low"])}
                for i in range(3)
            ]
        return sorted(roads, key=lambda x: x["accidents"], reverse=True)
    
    def _get_incident_types(self) -> Dict[str, int]:
        return {
            "Rear-end Collision": random.randint(20, 40),
            "Head-on Collision": random.randint(8, 18),
            "Side Impact": random.randint(12, 25),
            "Hit Pedestrian": random.randint(5, 15),
            "Roll Over": random.randint(3, 10),
            "Vehicle Theft": random.randint(2, 8),
            "Dangerous Driving": random.randint(15, 35),
            "Speeding": random.randint(25, 50)
        }
    
    def _get_monthly_data(self, period_multiplier: float) -> List[Dict[str, Any]]:
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return [
            {"month": month, "accidents": int(random.randint(15, 45) * period_multiplier)}
            for month in months
        ]
    
    def _get_severity_breakdown(self, total: int) -> Dict[str, int]:
        return {
            "Critical": int(total * 0.08),
            "Serious": int(total * 0.25),
            "Moderate": int(total * 0.35),
            "Minor": int(total * 0.32)
        }
    
    def get_all_counties_summary(self, time_period: str = "month") -> List[Dict]:
        summaries = []
        for county in KENYA_COUNTIES:
            stats = self.get_county_stats(county.name, time_period)
            summaries.append({
                "code": county.code,
                "name": county.name,
                "region": county.region.value,
                "capital": county.capital,
                "population": county.population,
                "road_density": county.road_density_km,
                "total_accidents": stats.total_accidents,
                "total_violations": stats.total_violations,
                "fatalities": stats.fatalities,
                "injuries": stats.injuries,
                "risk_score": stats.risk_score,
                "trend": stats.trend,
                "area_sq_km": county.area_sq_km,
                "major_roads": county.major_roads[:2]
            })
        return sorted(summaries, key=lambda x: x["risk_score"], reverse=True)
    
    def get_region_summary(self) -> List[Dict]:
        regions_data = {}
        for county in KENYA_COUNTIES:
            region = county.region.value
            if region not in regions_data:
                regions_data[region] = {
                    "region": region,
                    "county_count": 0,
                    "total_accidents": 0,
                    "total_violations": 0,
                    "total_fatalities": 0,
                    "total_injuries": 0,
                    "total_population": 0,
                    "risk_score": 0,
                    "counties": []
                }
            
            stats = self.get_county_stats(county.name, "month")
            regions_data[region]["county_count"] += 1
            regions_data[region]["total_accidents"] += stats.total_accidents
            regions_data[region]["total_violations"] += stats.total_violations
            regions_data[region]["total_fatalities"] += stats.fatalities
            regions_data[region]["total_injuries"] += stats.injuries
            regions_data[region]["total_population"] += county.population
            regions_data[region]["risk_score"] += stats.risk_score
            regions_data[region]["counties"].append(county.name)
        
        for region in regions_data:
            count = regions_data[region]["county_count"]
            regions_data[region]["risk_score"] = round(regions_data[region]["risk_score"] / count, 1)
        
        return list(regions_data.values())
    
    def get_comparative_analysis(self, metric: str = "accidents") -> List[Dict]:
        counties = []
        for county in KENYA_COUNTIES:
            stats = self.get_county_stats(county.name, "month")
            value = {
                "accidents": stats.total_accidents,
                "violations": stats.total_violations,
                "fatalities": stats.fatalities,
                "injuries": stats.injuries,
                "risk_score": stats.risk_score
            }.get(metric, 0)
            counties.append({
                "county": county.name,
                "region": county.region.value,
                "value": value,
                "population": county.population,
                "per_capita": round(value / (county.population / 100000), 2)
            })
        return sorted(counties, key=lambda x: x["value"], reverse=True)
    
    def get_hazard_hotspots(self, county_name: Optional[str] = None) -> List[Dict]:
        hotspots = []
        counties = [get_county_by_name(county_name)] if county_name else KENYA_COUNTIES
        
        for county in counties:
            if not county:
                continue
            stats = self.get_county_stats(county.name, "month")
            
            if county.major_roads:
                for i, road in enumerate(county.major_roads[:2]):
                    hotspots.append({
                        "id": f"HS-{county.code}-{i+1}",
                        "county": county.name,
                        "region": county.region.value,
                        "location": road,
                        "latitude": county.latitude + random.uniform(-0.05, 0.05),
                        "longitude": county.longitude + random.uniform(-0.05, 0.05),
                        "incident_count": stats.total_accidents // 2,
                        "risk_level": "High" if stats.risk_score > 60 else "Medium" if stats.risk_score > 40 else "Low",
                        "primary_causes": random.sample(["Speeding", " reckless driving", "Poor road conditions", "Weather", "Distracted driving"], 2)
                    })
        
        return sorted(hotspots, key=lambda x: x["incident_count"], reverse=True)[:20]
    
    def get_weather_impact(self) -> List[Dict]:
        weather_factors = []
        for county in KENYA_COUNTIES:
            weather_factors.append({
                "county": county.name,
                "region": county.region.value,
                "rainfall_risk": random.choice(["Low", "Medium", "High"]),
                "flood_risk": random.choice(["Low", "Medium", "High"]),
                "fog_visibility": random.choice(["Low", "Medium", "High"]),
                "heat_wave_risk": random.choice(["Low", "Medium", "High"]),
                "drought_impact": random.choice(["None", "Low", "Medium"]),
                "affected_roads": random.randint(1, 8),
                "seasonal_warning": random.choice([True, False])
            })
        return weather_factors
    
    def get_infrastructure_analysis(self) -> Dict:
        road_quality = []
        for county in KENYA_COUNTIES:
            road_quality.append({
                "county": county.name,
                "region": county.region.value,
                "road_density": county.road_density_km,
                "paved_roads_pct": random.randint(20, 95),
                "maintained_roads_pct": random.randint(30, 85),
                "traffic_capacity_utilization": random.randint(40, 100),
                "blackspots": random.randint(1, 15),
                "bridge_conditions": random.choice(["Good", "Fair", "Poor"]),
                "traffic_lights": random.randint(2, 150),
                "speed_bumps": random.randint(5, 100),
                "pedestrian_crossings": random.randint(1, 50)
            })
        
        return {
            "road_quality": road_quality,
            "summary": {
                "avg_paved_pct": round(sum(r["paved_roads_pct"] for r in road_quality) / len(road_quality), 1),
                "avg_maintained_pct": round(sum(r["maintained_roads_pct"] for r in road_quality) / len(road_quality), 1),
                "total_blackspots": sum(r["blackspots"] for r in road_quality),
                "total_traffic_lights": sum(r["traffic_lights"] for r in road_quality)
            }
        }
    
    def get_traffic_congestion_index(self) -> List[Dict]:
        congestion = []
        for county in KENYA_COUNTIES:
            congestion.append({
                "county": county.name,
                "region": county.region.value,
                "congestion_index": random.randint(20, 95),
                "avg_travel_time_min": random.randint(15, 90),
                "peak_hour_delay_min": random.randint(10, 60),
                "road_capacity_pct": random.randint(50, 100),
                "primary_congestion_cause": random.choice([
                    "High vehicle volume", "Road works", "Traffic signals", 
                    "Parking issues", "Poor road design", "Mixed traffic"
                ]),
                "alternative_routes_available": random.choice([True, False])
            })
        return sorted(congestion, key=lambda x: x["congestion_index"], reverse=True)
    
    def get_historical_trends(self, county_name: str, years: int = 3) -> Dict:
        county = get_county_by_name(county_name)
        if not county:
            return {}
        
        yearly_data = []
        current_year = datetime.now().year
        for year in range(current_year - years + 1, current_year + 1):
            yearly_data.append({
                "year": year,
                "accidents": int(random.randint(500, 1500) * (county.population / 1000000)),
                "violations": int(random.randint(2000, 6000) * (county.population / 1000000)),
                "fatalities": int(random.randint(50, 200) * (county.population / 1000000)),
                "injuries": int(random.randint(200, 800) * (county.population / 1000000)),
                "response_time_avg": round(random.uniform(8, 20), 1)
            })
        
        return {
            "county": county_name,
            "historical_data": yearly_data,
            "trend_analysis": {
                "accident_trend": random.choice(["increasing", "decreasing", "stable"]),
                "violation_trend": random.choice(["increasing", "decreasing", "stable"]),
                "fatality_trend": random.choice(["increasing", "decreasing", "stable"]),
                "improvement_area": random.choice(["Response time", "Road infrastructure", "Enforcement", "Awareness"])
            }
        }


county_analytics = CountyAnalyticsService()
