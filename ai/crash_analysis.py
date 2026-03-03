from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import random


@dataclass
class CrashCause:
    cause_id: str
    category: str
    description: str
    severity_weight: float
    frequency: int = 0
    related_factors: List[str] = field(default_factory=list)


@dataclass
class CrashAnalysisResult:
    incident_id: str
    analysis_timestamp: datetime
    primary_cause: CrashCause
    contributing_factors: List[CrashCause]
    risk_level: str
    recommendations: List[str]
    road_segment_rating: int
    weather_impact: float
    visibility_impact: float


class CrashCauseAnalyzer:
    CAUSE_CATEGORIES = {
        "human_error": {
            "speeding": CrashCause("H001", "human_error", "Excessive speed", 0.85, factors=["time_of_day", "road_type"]),
            "distracted_driving": CrashCause("H002", "human_error", "Distracted driving", 0.75, factors=["mobile_phone", "passengers"]),
            "fatigue": CrashCause("H003", "human_error", "Driver fatigue", 0.70, factors=["time_of_day", "trip_duration"]),
            "drunk_driving": CrashCause("H004", "human_error", "Driving under influence", 0.95, factors=["alcohol_level", "time"]),
            "reckless_overtaking": CrashCause("H005", "human_error", "Dangerous overtaking", 0.80, factors=["road_visibility", "traffic"]),
        },
        "vehicle_failure": {
            "brake_failure": CrashCause("V001", "vehicle_failure", "Brake system failure", 0.90, factors=["maintenance", "age"]),
            "tire_failure": CrashCause("V002", "vehicle_failure", "Tire blowout/failure", 0.75, factors=["tire_condition", "load"]),
            "steering_failure": CrashCause("V003", "vehicle_failure", "Steering mechanism failure", 0.85, factors=["maintenance"]),
            "light_failure": CrashCause("V004", "vehicle_failure", "Lighting system failure", 0.60, factors=["maintenance", "weather"]),
        },
        "road_conditions": {
            "potholes": CrashCause("R001", "road_conditions", "Road surface damage", 0.65, factors=["maintenance", "traffic"]),
            "poor_markings": CrashCause("R002", "road_conditions", "Inadequate road markings", 0.55, factors=["maintenance", "night"]),
            "narrow_road": CrashCause("R003", "road_conditions", "Insufficient road width", 0.50, factors=["traffic_volume"]),
            "lack_of_barriers": CrashCause("R004", "road_conditions", "Missing safety barriers", 0.70, factors=["road_type", "elevation"]),
        },
        "environmental": {
            "heavy_rain": CrashCause("E001", "environmental", "Adverse weather - rain", 0.75, factors=["visibility", "road_surface"]),
            "fog": CrashCause("E002", "environmental", "Reduced visibility - fog", 0.80, factors=["time_of_day", "location"]),
            "glare": CrashCause("E003", "environmental", "Sun glare", 0.45, factors=["time_of_day"]),
            "flooding": CrashCause("E004", "environmental", "Water logging/flooding", 0.70, factors=["drainage", "rainfall"]),
        }
    }

    def __init__(self):
        self.analysis_history: List[CrashAnalysisResult] = []

    def analyze_incident(
        self,
        incident_id: str,
        incident_type: str,
        location_data: dict,
        weather_data: Optional[dict] = None,
        vehicle_data: Optional[dict] = None
    ) -> CrashAnalysisResult:
        
        location_risk = location_data.get("risk_score", 0.5)
        road_type = location_data.get("road_type", "unknown")
        time_of_day = location_data.get("hour", 12)
        
        candidate_causes = []
        
        if time_of_day >= 22 or time_of_day <= 5:
            candidate_causes.append(self.CAUSE_CATEGORIES["human_error"]["fatigue"])
            candidate_causes.append(self.CAUSE_CATEGORIES["environmental"]["fog"])
        
        if weather_data:
            if weather_data.get("rain_intensity", 0) > 0.5:
                candidate_causes.append(self.CAUSE_CATEGORIES["environmental"]["heavy_rain"])
            if weather_data.get("visibility", 10) < 2:
                candidate_causes.append(self.CAUSE_CATEGORIES["environmental"]["fog"])
        
        if vehicle_data:
            if vehicle_data.get("speed", 0) > 100:
                candidate_causes.append(self.CAUSE_CATEGORIES["human_error"]["speeding"])
            if not vehicle_data.get("maintained", True):
                candidate_causes.append(self.CAUSE_CATEGORIES["vehicle_failure"]["brake_failure"])
        
        if road_type in ["highway", "expressway"]:
            candidate_causes.append(self.CAUSE_CATEGORIES["human_error"]["speeding"])
        
        if not candidate_causes:
            candidate_causes = [
                self.CAUSE_CATEGORIES["human_error"]["speeding"],
                self.CAUSE_CATEGORIES["road_conditions"]["poor_markings"],
            ]
        
        primary = max(candidate_causes, key=lambda c: c.severity_weight)
        
        contributing = [c for c in candidate_causes if c != primary][:3]
        
        avg_severity = sum(c.severity_weight for c in contributing) / len(contributing) if contributing else primary.severity_weight
        risk_level = "critical" if avg_severity > 0.8 else "high" if avg_severity > 0.6 else "medium" if avg_severity > 0.4 else "low"
        
        recommendations = self._generate_recommendations(primary, contributing, location_data)
        
        road_rating = self._calculate_road_rating(location_risk, primary.severity_weight)
        
        weather_impact = self._calculate_weather_impact(weather_data)
        visibility_impact = self._calculate_visibility_impact(weather_data, time_of_day)
        
        result = CrashAnalysisResult(
            incident_id=incident_id,
            analysis_timestamp=datetime.now(),
            primary_cause=primary,
            contributing_factors=contributing,
            risk_level=risk_level,
            recommendations=recommendations,
            road_segment_rating=road_rating,
            weather_impact=weather_impact,
            visibility_impact=visibility_impact
        )
        
        self.analysis_history.append(result)
        return result

    def _generate_recommendations(self, primary: CrashCause, contributing: List[CrashCause], location: dict) -> List[str]:
        recommendations = []
        
        if primary.category == "human_error":
            recommendations.append(f"Increase enforcement for {primary.description}")
            recommendations.append("Deploy speed cameras in high-risk areas")
        
        if primary.category == "vehicle_failure":
            recommendations.append("Mandatory vehicle inspection checkpoints")
            recommendations.append("Public awareness on vehicle maintenance")
        
        if primary.category == "road_conditions":
            recommendations.append("Road maintenance priority for this segment")
            recommendations.append("Install additional warning signs")
        
        if primary.category == "environmental":
            recommendations.append("Install weather monitoring systems")
            recommendations.append("Variable message signs for weather alerts")
        
        for cause in contributing:
            if cause.category != primary.category:
                recommendations.append(f"Address secondary factor: {cause.description}")
        
        return recommendations[:5]

    def _calculate_road_rating(self, location_risk: float, cause_severity: float) -> int:
        combined_risk = (location_risk + cause_severity) / 2
        if combined_risk > 0.8:
            return 1
        elif combined_risk > 0.6:
            return 2
        elif combined_risk > 0.4:
            return 3
        elif combined_risk > 0.2:
            return 4
        return 5

    def _calculate_weather_impact(self, weather: Optional[dict]) -> float:
        if not weather:
            return 0.0
        rain = weather.get("rain_intensity", 0)
        wind = weather.get("wind_speed", 0)
        return min(1.0, (rain * 0.7 + wind * 0.01))

    def _calculate_visibility_impact(self, weather: Optional[dict], hour: int) -> float:
        if not weather:
            visibility = 10.0
        else:
            visibility = weather.get("visibility", 10)
        
        if hour >= 18 or hour <= 6:
            visibility *= 0.6
        
        return max(0, min(1.0, (10 - visibility) / 10))

    def get_risk_hotspots(self, min_severity: float = 0.5) -> List[dict]:
        if not self.analysis_history:
            return []
        
        cause_frequency = {}
        for analysis in self.analysis_history:
            cause = analysis.primary_cause.cause_id
            cause_frequency[cause] = cause_frequency.get(cause, 0) + 1
        
        hotspots = []
        for analysis in self.analysis_history:
            if analysis.primary_cause.severity_weight >= min_severity:
                hotspots.append({
                    "incident_id": analysis.incident_id,
                    "cause": analysis.primary_cause.description,
                    "severity": analysis.primary_cause.severity_weight,
                    "risk_level": analysis.risk_level,
                    "recommendations": analysis.recommendations
                })
        
        return sorted(hotspots, key=lambda x: x["severity"], reverse=True)[:20]

    def get_cause_statistics(self) -> Dict:
        if not self.analysis_history:
            return {}
        
        stats = {
            "total_analyzed": len(self.analysis_history),
            "by_category": {},
            "by_risk_level": {},
            "average_road_rating": 0,
        }
        
        for analysis in self.analysis_history:
            cat = analysis.primary_cause.category
            stats["by_category"][cat] = stats["by_category"].get(cat, 0) + 1
            
            risk = analysis.risk_level
            stats["by_risk_level"][risk] = stats["by_risk_level"].get(risk, 0) + 1
        
        if self.analysis_history:
            ratings = [a.road_segment_rating for a in self.analysis_history]
            stats["average_road_rating"] = sum(ratings) / len(ratings)
        
        return stats


crash_analyzer = CrashCauseAnalyzer()
