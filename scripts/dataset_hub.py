#!/usr/bin/env python3
"""
Kenya Overwatch Dataset Integration Hub
Connects all datasets and provides unified access
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

PROJECT_ROOT = Path("/home/zingri/Desktop/HACKATHON/kenya-overwatch-production")
DATA_DIR = PROJECT_ROOT / "data"


class DatasetHub:
    """Central hub for all Kenya Overwatch datasets"""
    
    def __init__(self):
        self.datasets = {}
        self.integration_status = {}
        self._scan_all_datasets()
    
    def _scan_all_datasets(self):
        """Scan all available datasets"""
        print("=" * 60)
        print("Scanning Kenya Overwatch Datasets...")
        print("=" * 60)
        
        # Enhanced datasets
        enhanced_dir = DATA_DIR / "enhanced"
        if enhanced_dir.exists():
            self._scan_directory(enhanced_dir, "enhanced")
        
        # Training data
        training_dir = DATA_DIR / "training"
        if training_dir.exists():
            self._scan_directory(training_dir, "training")
        
        # Models
        models_dir = DATA_DIR / "models"
        if models_dir.exists():
            self._scan_directory(models_dir, "models")
        
        print(f"\nTotal datasets found: {len(self.datasets)}")
    
    def _scan_directory(self, directory: Path, category: str):
        """Scan a directory for datasets"""
        for item in directory.rglob("*"):
            if item.is_file() and item.suffix == ".json":
                config_path = item.parent / "dataset_config.json"
                if config_path.exists():
                    try:
                        with open(config_path) as f:
                            config = json.load(f)
                            dataset_name = config.get("dataset", item.parent.name)
                            self.datasets[dataset_name] = {
                                "path": str(item.parent),
                                "category": category,
                                "config": config,
                                "status": "available"
                            }
                            print(f"  ✓ {dataset_name} ({category})")
                    except:
                        pass
    
    def get_dataset(self, name: str) -> Optional[Dict]:
        """Get a specific dataset"""
        return self.datasets.get(name)
    
    def get_all_datasets(self) -> Dict[str, Dict]:
        """Get all datasets"""
        return self.datasets
    
    def get_integration_summary(self) -> Dict:
        """Get integration status summary"""
        summary = {
            "timestamp": datetime.now().isoformat(),
            "total_datasets": len(self.datasets),
            "categories": {},
            "datasets": []
        }
        
        for name, data in self.datasets.items():
            cat = data.get("category", "unknown")
            summary["categories"][cat] = summary["categories"].get(cat, 0) + 1
            summary["datasets"].append({
                "name": name,
                "category": cat,
                "status": data.get("status", "unknown"),
                "path": data.get("path", "")
            })
        
        return summary
    
    def load_geospatial_data(self) -> Dict:
        """Load all geospatial data"""
        result = {
            "osm": None,
            "pois": None,
            "accidents": None
        }
        
        processed_dir = DATA_DIR / "enhanced" / "geospatial" / "processed"
        
        # Load OSM summary
        osm_path = processed_dir / "osm_summary.json"
        if osm_path.exists():
            with open(osm_path) as f:
                result["osm"] = json.load(f)
        
        # Load POIs
        poi_path = processed_dir / "kenya_poi_map.json"
        if poi_path.exists():
            with open(poi_path) as f:
                result["pois"] = json.load(f)
        
        # Load accident summary
        accident_path = processed_dir / "accident_data_summary.json"
        if accident_path.exists():
            with open(accident_path) as f:
                result["accidents"] = json.load(f)
        
        return result
    
    def load_vehicle_datasets(self) -> Dict:
        """Load vehicle detection datasets"""
        result = {}
        
        vehicles_dir = DATA_DIR / "enhanced" / "vehicles"
        if not vehicles_dir.exists():
            return result
        
        for dataset_path in vehicles_dir.iterdir():
            if dataset_path.is_dir():
                config_file = dataset_path / "dataset_config.json"
                if config_file.exists():
                    with open(config_file) as f:
                        result[dataset_path.name] = json.load(f)
        
        return result
    
    def load_training_data(self) -> Dict:
        """Load training data info"""
        result = {
            "samples": {},
            "data_yaml": None
        }
        
        training_dir = DATA_DIR / "training"
        samples_dir = training_dir / "samples"
        
        if samples_dir.exists():
            for class_dir in samples_dir.iterdir():
                if class_dir.is_dir():
                    images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png"))
                    result["samples"][class_dir.name] = len(images)
        
        yaml_path = training_dir / "data.yaml"
        if yaml_path.exists():
            with open(yaml_path) as f:
                result["data_yaml"] = f.read()
        
        return result
    
    def get_risk_model_config(self) -> Dict:
        """Get risk assessment model configuration"""
        models_dir = DATA_DIR / "models"
        config_path = models_dir / "model_config.json"
        
        if config_path.exists():
            with open(config_path) as f:
                return json.load(f)
        
        return {
            "status": "not_trained",
            "message": "Run scripts/train_models.py to train models"
        }


class DataPipeline:
    """Data processing pipeline connecting all sources"""
    
    def __init__(self, hub: DatasetHub):
        self.hub = hub
        self.cache = {}
    
    def get_complete_profile(self, location: Dict) -> Dict:
        """Get complete data profile for a location"""
        lat = location.get("lat", 0)
        lng = location.get("lng", 0)
        
        profile = {
            "location": location,
            "geospatial": {},
            "risk_factors": {},
            "nearest_pois": [],
            "road_info": {}
        }
        
        # Get geospatial context
        geo_data = self.hub.load_geospatial_data()
        
        if geo_data.get("pois"):
            profile["poi_categories"] = list(geo_data["pois"].keys())
        
        if geo_data.get("accidents"):
            profile["accident_analysis"] = geo_data["accidents"].get("use_cases", [])
        
        # Estimate risk based on location type
        profile["risk_factors"] = {
            "base_risk": self._estimate_base_risk(lat, lng),
            "time_of_day": datetime.now().hour,
            "day_of_week": datetime.now().weekday()
        }
        
        return profile
    
    def _estimate_base_risk(self, lat: float, lng: float) -> float:
        """Estimate base risk for location"""
        # Nairobi CBD is higher risk
        if -1.32 < lat < -1.26 and 36.75 < lng < 36.85:
            return 0.65
        # Major cities have moderate risk
        elif lat < 0 and 34 < lng < 42:
            return 0.45
        else:
            return 0.30
    
    def connect_all(self) -> Dict:
        """Connect all datasets and return unified view"""
        print("\n" + "=" * 60)
        print("Connecting All Datasets...")
        print("=" * 60)
        
        connection_result = {
            "timestamp": datetime.now().isoformat(),
            "datasets": {},
            "pipeline_status": "connected",
            "errors": []
        }
        
        # Test each dataset
        try:
            connection_result["datasets"]["geospatial"] = {
                "status": "connected",
                "data": self.hub.load_geospatial_data()
            }
        except Exception as e:
            connection_result["datasets"]["geospatial"] = {"status": "error", "error": str(e)}
            connection_result["errors"].append(str(e))
        
        try:
            connection_result["datasets"]["vehicles"] = {
                "status": "connected",
                "data": self.hub.load_vehicle_datasets()
            }
        except Exception as e:
            connection_result["datasets"]["vehicles"] = {"status": "error", "error": str(e)}
            connection_result["errors"].append(str(e))
        
        try:
            connection_result["datasets"]["training"] = {
                "status": "connected",
                "data": self.hub.load_training_data()
            }
        except Exception as e:
            connection_result["datasets"]["training"] = {"status": "error", "error": str(e)}
            connection_result["errors"].append(str(e))
        
        try:
            connection_result["datasets"]["models"] = {
                "status": "connected",
                "config": self.hub.get_risk_model_config()
            }
        except Exception as e:
            connection_result["datasets"]["models"] = {"status": "error", "error": str(e)}
            connection_result["errors"].append(str(e))
        
        connection_result["pipeline_status"] = "error" if connection_result["errors"] else "connected"
        
        return connection_result


def main():
    print("=" * 60)
    print("KENYA OVERWATCH DATASET INTEGRATION HUB")
    print("=" * 60)
    
    # Initialize hub
    hub = DatasetHub()
    
    # Get integration summary
    summary = hub.get_integration_summary()
    print("\n" + "=" * 60)
    print("INTEGRATION SUMMARY")
    print("=" * 60)
    print(f"Total datasets: {summary['total_datasets']}")
    print(f"Categories: {summary['categories']}")
    
    # Initialize pipeline
    pipeline = DataPipeline(hub)
    
    # Connect all datasets
    result = pipeline.connect_all()
    
    print("\n" + "=" * 60)
    print("CONNECTION STATUS")
    print("=" * 60)
    
    for dataset_name, status in result["datasets"].items():
        status_str = status.get("status", "unknown")
        print(f"  {dataset_name}: {status_str}")
    
    if result["errors"]:
        print(f"\nErrors: {len(result['errors'])}")
        for err in result["errors"]:
            print(f"  - {err}")
    else:
        print("\n✓ All datasets connected successfully!")
    
    # Test location profile
    print("\n" + "=" * 60)
    print("TEST: Location Profile Generation")
    print("=" * 60)
    
    test_locations = [
        {"lat": -1.2864, "lng": 36.8232, "name": "Nairobi CBD"},
        {"lat": -1.0446, "lng": 37.0652, "name": "Nakuru"},
        {"lat": -4.0435, "lng": 39.6682, "name": "Mombasa"}
    ]
    
    for loc in test_locations:
        profile = pipeline.get_complete_profile(loc)
        print(f"\n{loc['name']}:")
        print(f"  Base Risk: {profile['risk_factors'].get('base_risk', 'N/A')}")
        print(f"  POI Categories: {len(profile.get('poi_categories', []))}")
    
    print("\n" + "=" * 60)
    print("INTEGRATION COMPLETE!")
    print("=" * 60)
    
    # Save integration report
    report_path = DATA_DIR / "integration_report.json"
    with open(report_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nReport saved to: {report_path}")
    
    return result


if __name__ == "__main__":
    main()
