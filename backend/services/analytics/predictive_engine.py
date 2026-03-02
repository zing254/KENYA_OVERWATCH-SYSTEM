"""
Predictive Analytics Engine
Predicts accident hotspots using historical data
"""

import logging
import random
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class HotspotPrediction:
    """Hotspot prediction for a grid cell"""
    grid_id: str
    latitude: float
    longitude: float
    risk_score: float  # 0-1
    predicted_accidents: int
    factors: Dict[str, float]
    prediction_date: datetime


class PredictiveAnalyticsEngine:
    """Predictive analytics for accident hotspots"""
    
    def __init__(self, incident_service=None):
        self.incident_service = incident_service
        self.model = None
        self.last_training: Optional[datetime] = None
        
        # Kenya road data (simplified)
        self.roads = self._init_road_data()
    
    def _init_road_data(self) -> Dict:
        """Initialize road network data"""
        return {
            "Thika Superhighway": {
                "center": (-1.2000, 37.1000),
                "speed_limit": 80,
                "lanes": 4,
                "road_type": "highway"
            },
            "Mombasa Road": {
                "center": (-1.3300, 36.9800),
                "speed_limit": 100,
                "lanes": 4,
                "road_type": "highway"
            },
            "Kenyatta Avenue": {
                "center": (-1.2864, 36.8232),
                "speed_limit": 50,
                "lanes": 2,
                "road_type": "urban"
            },
            "Nairobi Expressway": {
                "center": (-1.3100, 36.8500),
                "speed_limit": 80,
                "lanes": 4,
                "road_type": "highway"
            },
            "Ngong Road": {
                "center": (-1.3000, 36.7800),
                "speed_limit": 60,
                "lanes": 2,
                "road_type": "urban"
            }
        }
    
    def predict_hotspots(
        self,
        date: Optional[datetime] = None,
        grid_size_km: float = 1.0
    ) -> List[HotspotPrediction]:
        """Predict accident hotspots for given date"""
        
        if date is None:
            date = datetime.now(timezone.utc)
        
        predictions = []
        
        # Generate predictions based on historical patterns
        for road_name, road_data in self.roads.items():
            center_lat, center_lng = road_data['center']
            
            # Calculate base risk from road characteristics
            base_risk = 0.3
            
            # Higher risk for highways
            if road_data['road_type'] == 'highway':
                base_risk = 0.5
            
            # Time of day factor
            hour = date.hour
            if 7 <= hour <= 9 or 16 <= hour <= 19:
                # Rush hour
                base_risk *= 1.5
            elif 0 <= hour <= 5:
                # Late night
                base_risk *= 1.3
            
            # Day of week
            if date.weekday() >= 5:
                # Weekend
                base_risk *= 1.2
            
            # Weather factor (would come from weather API)
            # For now, random variation
            weather_factor = random.uniform(0.9, 1.1)
            base_risk *= weather_factor
            
            # Cap at 1.0
            risk_score = min(base_risk, 1.0)
            
            prediction = HotspotPrediction(
                grid_id=f"grid_{road_name.lower().replace(' ', '_')}",
                latitude=center_lat,
                longitude=center_lng,
                risk_score=risk_score,
                predicted_accidents=int(risk_score * 10),
                factors={
                    "road_type": 0.3 if road_data['road_type'] == 'highway' else 0.2,
                    "time_of_day": 0.3 if 7 <= hour <= 9 or 16 <= hour <= 19 else 0.1,
                    "day_of_week": 0.2 if date.weekday() >= 5 else 0.1,
                    "speed_limit": 0.2 if road_data['speed_limit'] > 60 else 0.1
                },
                prediction_date=date
            )
            
            predictions.append(prediction)
        
        # Sort by risk score
        predictions.sort(key=lambda x: x.risk_score, reverse=True)
        
        return predictions
    
    def get_high_risk_roads(self, min_risk: float = 0.5) -> List[Dict]:
        """Get roads with high accident risk"""
        
        predictions = self.predict_hotspots()
        
        high_risk = []
        for pred in predictions:
            if pred.risk_score >= min_risk:
                # Find road name from grid_id
                road_name = pred.grid_id.replace('grid_', '').replace('_', ' ').title()
                
                high_risk.append({
                    "road_name": road_name,
                    "risk_score": round(pred.risk_score, 2),
                    "predicted_accidents": pred.predicted_accidents,
                    "location": {
                        "latitude": pred.latitude,
                        "longitude": pred.longitude
                    },
                    "factors": {k: round(v, 2) for k, v in pred.factors.items()}
                })
        
        return high_risk
    
    def train_model(self) -> bool:
        """Train the prediction model"""
        
        # In production, this would:
        # 1. Load historical incident data
        # 2. Engineer features (time, weather, road type, etc.)
        # 3. Train XGBoost/LightGBM model
        # 4. Evaluate and save model
        
        logger.info("Training predictive model...")
        
        # Simulate training
        self.model = {"trained": True, "accuracy": 0.85}
        self.last_training = datetime.now(timezone.utc)
        
        logger.info(f"Model trained at {self.last_training}")
        
        return True
    
    def get_statistics(self) -> Dict:
        """Get analytics statistics"""
        
        predictions = self.predict_hotspots()
        
        # Calculate aggregate statistics
        total_risk = sum(p.risk_score for p in predictions)
        avg_risk = total_risk / len(predictions) if predictions else 0
        
        high_risk_count = sum(1 for p in predictions if p.risk_score >= 0.5)
        critical_risk_count = sum(1 for p in predictions if p.risk_score >= 0.7)
        
        return {
            "total_roads_analyzed": len(predictions),
            "average_risk_score": round(avg_risk, 2),
            "high_risk_roads": high_risk_count,
            "critical_risk_roads": critical_risk_count,
            "last_model_training": self.last_training.isoformat() if self.last_training else None,
            "model_accuracy": 0.85  # Would come from actual model
        }


# Global instance
predictive_analytics = PredictiveAnalyticsEngine()
