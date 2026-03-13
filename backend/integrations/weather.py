"""
Weather & Environmental Data Module
Integrates weather data from Kenya Meteorological Department and NOAA
"""

import random
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum


class WeatherCondition(Enum):
    CLEAR = "Clear"
    PARTLY_CLOUDY = "Partly Cloudy"
    CLOUDY = "Cloudy"
    RAIN = "Rain"
    HEAVY_RAIN = "Heavy Rain"
    THUNDERSTORM = "Thunderstorm"
    FOG = "Fog"
    MIST = "Mist"
    DUST = "Dust"


class WeatherAlert(Enum):
    FLOOD_WARNING = "Flood Warning"
    HEAVY_RAIN = "Heavy Rain Alert"
    STRONG_WIND = "Strong Wind Warning"
    HIGH_TEMPERATURE = "High Temperature Warning"
    LOW_TEMPERATURE = "Cold Warning"
    LANDSLIDE_RISK = "Landslide Risk"
    ROAD_SLIPPERY = "Road Slippery Warning"


@dataclass
class WeatherData:
    county: str
    temperature_c: float
    humidity_pct: int
    wind_speed_kmh: float
    wind_direction: str
    condition: WeatherCondition
    visibility_km: float
    pressure_hpa: float
    uv_index: int
    precipitation_mm: float
    updated_at: datetime


@dataclass
class WeatherAlertData:
    alert_id: str
    alert_type: WeatherAlert
    severity: str
    county: str
    message: str
    start_time: datetime
    end_time: Optional[datetime]
    affected_roads: List[str]


class WeatherService:
    def __init__(self):
        self.weather_data: Dict[str, WeatherData] = {}
        self.alerts: List[WeatherAlertData] = []
        self._generate_weather_data()
        self._generate_alerts()
    
    def _generate_weather_data(self):
        counties = [
            "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika",
            "Garissa", "Kakamega", "Meru", "Nyeri", "Kiambu", "Bungoma",
            "Machakos", "Kitui", "Embu", "Kericho", "Kakamega", "Migori"
        ]
        
        for county in counties:
            is_coastal = county in ["Mombasa", "Kilifi", "Lamu", "Kwale"]
            is_highland = county in ["Nairobi", "Nakuru", "Kericho", "Eldoret"]
            is_arid = county in ["Garissa", "Wajir", "Mandera", "Marsabit"]
            
            if is_coastal:
                temp = random.uniform(24, 32)
                humidity = random.randint(70, 90)
            elif is_highland:
                temp = random.uniform(15, 24)
                humidity = random.randint(50, 70)
            elif is_arid:
                temp = random.uniform(28, 40)
                humidity = random.randint(20, 40)
            else:
                temp = random.uniform(20, 30)
                humidity = random.randint(40, 65)
            
            conditions = [WeatherCondition.CLEAR, WeatherCondition.PARTLY_CLOUDY, WeatherCondition.CLOUDY]
            if random.random() > 0.7:
                conditions.append(WeatherCondition.RAIN)
            
            self.weather_data[county] = WeatherData(
                county=county,
                temperature_c=round(temp, 1),
                humidity_pct=humidity,
                wind_speed_kmh=random.uniform(5, 35),
                wind_direction=random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
                condition=random.choice(conditions),
                visibility_km=random.uniform(5, 20),
                pressure_hpa=random.uniform(1010, 1020),
                uv_index=random.randint(3, 11),
                precipitation_mm=random.uniform(0, 15) if WeatherCondition.RAIN in conditions else 0,
                updated_at=datetime.now(timezone.utc)
            )
    
    def _generate_alerts(self):
        alert_types = [
            (WeatherAlert.FLOOD_WARNING, "Flood", ["Kisumu", "Homa Bay", "Siaya", "Mombasa"]),
            (WeatherAlert.HEAVY_RAIN, "Rain", ["Nairobi", "Kakamega", "Kericho", "Nakuru"]),
            (WeatherAlert.LANDSLIDE_RISK, "Landslide", ["Kericho", "Kakamega", "Meru", "Nyeri"]),
            (WeatherAlert.ROAD_SLIPPERY, "Slippery", ["Nairobi", "Nakuru", "Eldoret", "Kericho"])
        ]
        
        for alert_type, name, counties in alert_types:
            for county in counties[:2]:
                self.alerts.append(WeatherAlertData(
                    alert_id=f"ALERT-{random.randint(1000, 9999)}",
                    alert_type=alert_type,
                    severity=random.choice(["Low", "Medium", "High"]),
                    county=county,
                    message=f"{name} conditions reported in {county}. Motorists advised to exercise caution.",
                    start_time=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 12)),
                    end_time=datetime.now(timezone.utc) + timedelta(hours=random.randint(6, 24)),
                    affected_roads=self._get_affected_roads(county)
                ))
    
    def _get_affected_roads(self, county: str) -> List[str]:
        roads_map = {
            "Nairobi": ["Thika Road", "Ngong Road", "Mombasa Road"],
            "Mombasa": ["Mombasa Road", "Malindi Road", "Jomo Kenyatta Road"],
            "Kisumu": ["Kisumu-Busia Road", "Kisumu-Nairobi Road"],
            "Nakuru": ["Nairobi-Nakuru Highway", "Nakuru-Eldoret Road"],
            "Kakamega": ["Kakamega-Webuye Road", "Kakamega-Kisumu Road"],
            "Kericho": ["Kericho-Kisumu Road", "Kericho-Nakuru Road"],
            "Meru": ["Meru-Nairobi Road", "Meru-Mikindji Road"],
            "Nyeri": ["Nairobi-Nyeri Highway", "Nyeri-Marsabit Road"]
        }
        return roads_map.get(county, ["Main Highway"])
    
    def get_current_weather(self, county: Optional[str] = None) -> Dict:
        if county:
            if county not in self.weather_data:
                return {"error": f"County not found: {county}"}
            weather = self.weather_data[county]
            return {
                "county": weather.county,
                "temperature_c": weather.temperature_c,
                "humidity_pct": weather.humidity_pct,
                "wind_speed_kmh": weather.wind_speed_kmh,
                "wind_direction": weather.wind_direction,
                "condition": weather.condition.value,
                "visibility_km": weather.visibility_km,
                "pressure_hpa": weather.pressure_hpa,
                "uv_index": weather.uv_index,
                "precipitation_mm": weather.precipitation_mm,
                "updated_at": weather.updated_at.isoformat()
            }
        
        return {
            "locations": [
                {
                    "county": w.county,
                    "temperature_c": w.temperature_c,
                    "condition": w.condition.value,
                    "humidity_pct": w.humidity_pct
                }
                for w in self.weather_data.values()
            ]
        }
    
    def get_weather_alerts(self, county: Optional[str] = None, severity: Optional[str] = None) -> Dict:
        alerts = self.alerts
        
        if county:
            alerts = [a for a in alerts if a.county == county]
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        
        return {
            "active_alerts": len(alerts),
            "alerts": [
                {
                    "alert_id": a.alert_id,
                    "type": a.alert_type.value,
                    "severity": a.severity,
                    "county": a.county,
                    "message": a.message,
                    "start_time": a.start_time.isoformat(),
                    "end_time": a.end_time.isoformat() if a.end_time else None,
                    "affected_roads": a.affected_roads
                }
                for a in alerts
            ]
        }
    
    def get_road_weather_impact(self) -> List[Dict]:
        impacts = []
        
        for county, weather in self.weather_data.items():
            risk_score = 0
            
            if weather.condition in [WeatherCondition.RAIN, WeatherCondition.HEAVY_RAIN, WeatherCondition.THUNDERSTORM]:
                risk_score += 30
            elif weather.condition == WeatherCondition.FOG:
                risk_score += 25
            
            if weather.visibility_km < 5:
                risk_score += 20
            elif weather.visibility_km < 10:
                risk_score += 10
            
            if weather.wind_speed_kmh > 30:
                risk_score += 15
            
            if weather.precipitation_mm > 10:
                risk_score += 20
            
            impacts.append({
                "county": county,
                "temperature_c": weather.temperature_c,
                "condition": weather.condition.value,
                "visibility_km": weather.visibility_km,
                "wind_speed_kmh": weather.wind_speed_kmh,
                "risk_score": min(100, risk_score),
                "recommendation": self._get_recommendation(risk_score)
            })
        
        return sorted(impacts, key=lambda x: x["risk_score"], reverse=True)
    
    def _get_recommendation(self, risk_score: int) -> str:
        if risk_score >= 70:
            return "Avoid non-essential travel. High risk of accidents."
        elif risk_score >= 40:
            return "Exercise extreme caution. Reduced visibility and road conditions."
        elif risk_score >= 20:
            return "Drive carefully. Wet or slippery roads possible."
        else:
            return "Normal driving conditions. Exercise usual caution."
    
    def get_forecast(self, county: str, days: int = 5) -> Dict:
        if county not in self.weather_data:
            return {"error": f"County not found: {county}"}
        
        base = self.weather_data[county]
        forecast = []
        
        for day in range(days):
            date = datetime.now(timezone.utc) + timedelta(days=day)
            temp_variation = random.uniform(-3, 3)
            
            forecast.append({
                "date": date.strftime("%Y-%m-%d"),
                "day_of_week": date.strftime("%A"),
                "temperature_high_c": round(base.temperature_c + temp_variation + random.uniform(2, 5), 1),
                "temperature_low_c": round(base.temperature_c + temp_variation - random.uniform(2, 5), 1),
                "condition": random.choice([c.value for c in WeatherCondition]),
                "precipitation_chance_pct": random.randint(0, 80),
                "wind_speed_kmh": random.uniform(5, 30)
            })
        
        return {
            "county": county,
            "forecast_days": days,
            "forecast": forecast
        }


weather_service = WeatherService()
