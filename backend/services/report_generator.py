"""
County Report Generation Module
Generates comprehensive reports for all 47 Kenyan counties
"""

import random
from datetime import datetime, timezone
from typing import Dict, List, Optional
from dataclasses import dataclass

from ..county_data import KENYA_COUNTIES, CountyRegion
from ..services.county_analytics import county_analytics


@dataclass
class CountyReport:
    county_name: str
    report_date: str
    report_type: str
    period: str
    sections: Dict


class ReportGenerator:
    def __init__(self):
        self.report_templates = {
            "comprehensive": self._generate_comprehensive,
            "executive": self._generate_executive,
            "hazard": self._generate_hazard,
            "infrastructure": self._generate_infrastructure,
            "weather_impact": self._generate_weather_impact,
            "traffic": self._generate_traffic
        }
    
    def generate_report(
        self,
        county_name: str,
        report_type: str = "comprehensive",
        period: str = "month"
    ) -> Dict:
        if report_type not in self.report_templates:
            raise ValueError(f"Unknown report type: {report_type}")
        
        return self.report_templates[report_type](county_name, period)
    
    def generate_all_counties_report(self, report_type: str = "executive", period: str = "month") -> Dict:
        reports = []
        for county in KENYA_COUNTIES:
            reports.append({
                "county": county.name,
                "region": county.region.value,
                "report": self.generate_report(county.name, report_type, period)
            })
        
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "report_type": report_type,
            "period": period,
            "total_counties": len(reports),
            "reports": reports
        }
    
    def _generate_comprehensive(self, county_name: str, period: str) -> Dict:
        stats = county_analytics.get_county_stats(county_name, period)
        historical = county_analytics.get_historical_trends(county_name)
        
        return {
            "title": f"Comprehensive Road Safety Report - {county_name}",
            "sections": {
                "summary": {
                    "total_accidents": stats.total_accidents,
                    "total_violations": stats.total_violations,
                    "fatalities": stats.fatalities,
                    "injuries": stats.injuries,
                    "risk_score": stats.risk_score,
                    "trend": stats.trend
                },
                "incident_breakdown": stats.incident_types,
                "severity_distribution": stats.severity_breakdown,
                "top_roads": stats.top_roads,
                "monthly_trend": stats.monthly_data,
                "historical_analysis": historical,
                "recommendations": self._generate_recommendations(stats.risk_score, stats.trend)
            }
        }
    
    def _generate_executive(self, county_name: str, period: str) -> Dict:
        stats = county_analytics.get_county_stats(county_name, period)
        
        return {
            "title": f"Executive Summary - {county_name}",
            "key_metrics": {
                "risk_level": "High" if stats.risk_score >= 60 else "Medium" if stats.risk_score >= 40 else "Low",
                "risk_score": stats.risk_score,
                "total_incidents": stats.total_accidents + stats.total_violations,
                "fatalities": stats.fatalities,
                "trend": stats.trend
            },
            "highlights": [
                f"Risk score of {stats.risk_score} places {county_name} in {'high' if stats.risk_score >= 60 else 'medium'} risk category",
                f"{stats.total_accidents} accidents and {stats.total_violations} violations recorded",
                f"{stats.fatalities} fatalities and {stats.injuries} injuries reported",
                f"Trend is {stats.trend} compared to previous period"
            ],
            "action_items": self._get_action_items(stats.risk_score, stats.trend)
        }
    
    def _generate_hazard(self, county_name: str, period: str) -> Dict:
        from ..satellite.data_sources import satellite_source
        
        hazards = satellite_source.get_hazard_detections(county=county_name)
        
        return {
            "title": f"Hazard Analysis Report - {county_name}",
            "satellite_hazards": {
                "total": len(hazards),
                "by_type": self._count_by_field(hazards, "hazard_type"),
                "by_severity": self._count_by_field(hazards, "severity"),
                "details": hazards[:10]
            },
            "weather_hazards": county_analytics.get_weather_impact(),
            "risk_areas": county_analytics.get_hazard_hotspots(county_name)
        }
    
    def _generate_infrastructure(self, county_name: str, period: str) -> Dict:
        infra = county_analytics.get_infrastructure_analysis()
        county_infra = [r for r in infra["road_quality"] if r["county"] == county_name]
        
        return {
            "title": f"Infrastructure Report - {county_name}",
            "road_quality": county_infra[0] if county_infra else {},
            "summary": infra["summary"],
            "recommendations": self._generate_infrastructure_recommendations(county_infra[0] if county_infra else {})
        }
    
    def _generate_weather_impact(self, county_name: str, period: str) -> Dict:
        weather = county_analytics.get_weather_impact()
        county_weather = [w for w in weather if w["county"] == county_name]
        
        return {
            "title": f"Weather Impact Report - {county_name}",
            "weather_conditions": county_weather[0] if county_weather else {},
            "seasonal_warnings": [w for w in weather if w["seasonal_warning"]],
            "recommendations": self._get_weather_recommendations(county_weather[0] if county_weather else {})
        }
    
    def _generate_traffic(self, county_name: str, period: str) -> Dict:
        congestion = county_analytics.get_traffic_congestion_index()
        county_congestion = [c for c in congestion if c["county"] == county_name]
        
        return {
            "title": f"Traffic Analysis Report - {county_name}",
            "congestion_data": county_congestion[0] if county_congestion else {},
            "top_congested": congestion[:5],
            "recommendations": self._get_traffic_recommendations(county_congestion[0] if county_congestion else {})
        }
    
    def _count_by_field(self, items: List[Dict], field: str) -> Dict:
        counts = {}
        for item in items:
            key = item.get(field, "Unknown")
            counts[key] = counts.get(key, 0) + 1
        return counts
    
    def _generate_recommendations(self, risk_score: float, trend: str) -> List[str]:
        recommendations = []
        
        if risk_score >= 70:
            recommendations.append("URGENT: Immediate intervention required. Consider road safety audit.")
            recommendations.append("Increase enforcement presence in high-risk areas.")
        elif risk_score >= 50:
            recommendations.append("Implement targeted safety improvements in accident-prone areas.")
            recommendations.append("Review and update speed limits where necessary.")
        
        if trend == "increasing":
            recommendations.append("Investigate causes of increasing trend.")
        
        recommendations.append("Conduct public awareness campaigns on road safety.")
        recommendations.append("Ensure emergency response readiness.")
        
        return recommendations
    
    def _get_action_items(self, risk_score: float, trend: str) -> List[str]:
        items = []
        
        if risk_score >= 70:
            items.append("🚨 Deploy additional traffic enforcement units")
            items.append("🚨 Install temporary warning signs in high-risk areas")
            items.append("🚨 Coordinate with emergency services for rapid response")
        elif risk_score >= 40:
            items.append("📋 Review road marking and signage")
            items.append("📋 Schedule routine road maintenance")
        
        items.append("📊 Continue monitoring and data collection")
        
        return items
    
    def _generate_infrastructure_recommendations(self, infra: Dict) -> List[str]:
        recs = []
        
        if infra.get("paved_roads_pct", 100) < 50:
            recs.append("Prioritize road paving projects")
        
        if infra.get("maintained_roads_pct", 100) < 60:
            recs.append("Increase road maintenance frequency")
        
        if infra.get("blackspots", 0) > 5:
            recs.append("Conduct safety audits at identified blackspots")
        
        return recs
    
    def _get_weather_recommendations(self, weather: Dict) -> List[str]:
        recs = []
        
        if weather.get("flood_risk") == "High":
            recs.append("Install flood warning systems")
            recs.append("Ensure drainage maintenance")
        
        if weather.get("fog_visibility") == "High":
            recs.append("Install fog warning signs")
        
        return recs
    
    def _get_traffic_recommendations(self, traffic: Dict) -> List[str]:
        recs = []
        
        if traffic.get("congestion_index", 0) > 70:
            recs.append("Implement traffic management solutions")
            recs.append("Consider peak hour restrictions")
        
        if not traffic.get("alternative_routes_available"):
            recs.append("Develop alternative route options")
        
        return recs


report_generator = ReportGenerator()
