from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
import random


@dataclass
class RoadStarRating:
    road_id: str
    road_name: str
    overall_rating: float
    infrastructure_rating: float
    traffic_volume_rating: float
    accident_history_rating: float
    maintenance_rating: float
    safety_features_rating: float
    star_count: int
    risk_factors: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class VehicleStarRating:
    vehicle_id: str
    vehicle_type: str
    overall_rating: float
    safety_features_rating: float
    maintenance_rating: float
    age_rating: float
    star_count: int
    risk_factors: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)


class StarRatingSystem:
    def __init__(self):
        self.road_ratings: Dict[str, RoadStarRating] = {}
        self.vehicle_ratings: Dict[str, VehicleStarRating] = {}
        self._initialize_sample_data()

    def _initialize_sample_data(self):
        sample_roads = [
            {
                "road_id": "R001",
                "road_name": "Mombasa Road (A109)",
                "infrastructure": 3.5,
                "traffic": 2.0,
                "accidents": 2.5,
                "maintenance": 3.0,
                "safety": 3.0,
                "risks": ["High traffic volume", "Multiple accident blackspots", "Inadequate lighting in some sections"]
            },
            {
                "road_id": "R002", 
                "road_name": "Nairobi Expressway",
                "infrastructure": 4.5,
                "traffic": 3.5,
                "accidents": 4.0,
                "maintenance": 4.5,
                "safety": 4.5,
                "risks": ["High speed incidents", "Interchange congestion"]
            },
            {
                "road_id": "R003",
                "road_name": "Thika Superhighway",
                "infrastructure": 4.0,
                "traffic": 3.0,
                "accidents": 3.5,
                "maintenance": 4.0,
                "safety": 4.0,
                "risks": ["Pedestrian crossings", "Motorcycle accidents"]
            },
            {
                "road_id": "R004",
                "road_name": "Ngong Road",
                "infrastructure": 3.5,
                "traffic": 3.5,
                "accidents": 3.0,
                "maintenance": 3.5,
                "safety": 3.5,
                "risks": ["Peak hour congestion", "Parking issues"]
            },
            {
                "road_id": "R005",
                "road_name": "Kenyatta Avenue",
                "infrastructure": 4.0,
                "traffic": 4.0,
                "accidents": 3.5,
                "maintenance": 4.0,
                "safety": 4.0,
                "risks": ["Heavy pedestrian traffic", "Limited parking"]
            }
        ]
        
        for road in sample_roads:
            rating = self._calculate_road_rating(
                road["road_id"],
                road["road_name"],
                road["infrastructure"],
                road["traffic"],
                road["accidents"],
                road["maintenance"],
                road["safety"],
                road["risks"]
            )
            self.road_ratings[road["road_id"]] = rating

    def _calculate_road_rating(
        self,
        road_id: str,
        road_name: str,
        infrastructure: float,
        traffic: float,
        accidents: float,
        maintenance: float,
        safety: float,
        risks: List[str]
    ) -> RoadStarRating:
        weights = {
            "infrastructure": 0.20,
            "traffic": 0.15,
            "accidents": 0.30,
            "maintenance": 0.15,
            "safety": 0.20
        }
        
        traffic_inverse = 5 - traffic
        
        overall = (
            infrastructure * weights["infrastructure"] +
            traffic_inverse * weights["traffic"] +
            accidents * weights["accidents"] +
            maintenance * weights["maintenance"] +
            safety * weights["safety"]
        )
        
        star_count = self._rating_to_stars(overall)
        
        recommendations = self._generate_road_recommendations(
            infrastructure, traffic, accidents, maintenance, safety, risks
        )
        
        return RoadStarRating(
            road_id=road_id,
            road_name=road_name,
            overall_rating=round(overall, 2),
            infrastructure_rating=infrastructure,
            traffic_volume_rating=traffic,
            accident_history_rating=accidents,
            maintenance_rating=maintenance,
            safety_features_rating=safety,
            star_count=star_count,
            risk_factors=risks,
            recommendations=recommendations
        )

    def _rating_to_stars(self, rating: float) -> int:
        if rating >= 4.5:
            return 5
        elif rating >= 3.5:
            return 4
        elif rating >= 2.5:
            return 3
        elif rating >= 1.5:
            return 2
        return 1

    def _generate_road_recommendations(
        self,
        infrastructure: float,
        traffic: float,
        accidents: float,
        maintenance: float,
        safety: float,
        risks: List[str]
    ) -> List[str]:
        recommendations = []
        
        if infrastructure < 3.0:
            recommendations.append("Upgrade road infrastructure and signage")
        if traffic < 3.0:
            recommendations.append("Implement traffic management solutions")
        if accidents < 3.0:
            recommendations.append("Install safety barriers and speed cameras")
        if maintenance < 3.0:
            recommendations.append("Increase road maintenance frequency")
        if safety < 3.0:
            recommendations.append("Add street lighting and pedestrian crossings")
        
        return recommendations[:4]

    def get_road_rating(self, road_id: str) -> Optional[RoadStarRating]:
        return self.road_ratings.get(road_id)

    def get_all_road_ratings(self) -> List[RoadStarRating]:
        return list(self.road_ratings.values())

    def get_high_risk_roads(self) -> List[RoadStarRating]:
        return [r for r in self.road_ratings.values() if r.star_count <= 2]

    def calculate_vehicle_rating(
        self,
        vehicle_id: str,
        vehicle_type: str,
        safety_features: float,
        maintenance_status: float,
        vehicle_age: int
    ) -> VehicleStarRating:
        age_rating = max(1.0, 5.0 - (vehicle_age * 0.3))
        
        overall = (
            safety_features * 0.40 +
            maintenance_status * 0.35 +
            age_rating * 0.25
        )
        
        star_count = self._rating_to_stars(overall)
        
        risks = []
        if vehicle_age > 10:
            risks.append("Old vehicle - consider replacement")
        if safety_features < 3.0:
            risks.append("Limited safety features")
        if maintenance_status < 3.0:
            risks.append("Maintenance issues detected")
        
        recommendations = []
        if safety_features < 4.0:
            recommendations.append("Upgrade safety features (ABS, airbags)")
        if maintenance_status < 4.0:
            recommendations.append("Schedule regular maintenance")
        if vehicle_age > 7:
            recommendations.append("Consider vehicle replacement")
        
        return VehicleStarRating(
            vehicle_id=vehicle_id,
            vehicle_type=vehicle_type,
            overall_rating=round(overall, 2),
            safety_features_rating=safety_features,
            maintenance_rating=maintenance_status,
            age_rating=round(age_rating, 2),
            star_count=star_count,
            risk_factors=risks,
            recommendations=recommendations
        )

    def get_statistics(self) -> Dict:
        roads = list(self.road_ratings.values())
        
        road_stats = {
            "total_roads": len(roads),
            "five_star": len([r for r in roads if r.star_count == 5]),
            "four_star": len([r for r in roads if r.star_count == 4]),
            "three_star": len([r for r in roads if r.star_count == 3]),
            "two_star": len([r for r in roads if r.star_count == 2]),
            "one_star": len([r for r in roads if r.star_count == 1]),
            "average_rating": sum(r.overall_rating for r in roads) / len(roads) if roads else 0
        }
        
        return {
            "road_statistics": road_stats,
            "total_vehicles_rated": len(self.vehicle_ratings)
        }


star_rating_system = StarRatingSystem()
