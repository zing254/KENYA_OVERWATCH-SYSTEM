#!/usr/bin/env python3
"""
Kenya Overwatch OSM Data Processor
Process OpenStreetMap Kenya PBF data for use in the system
"""

import os
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path("/home/zingri/Desktop/HACKATHON/kenya-overwatch-production")
OSM_DIR = PROJECT_ROOT / "data" / "enhanced" / "geospatial" / "osm_kenya"
OUTPUT_DIR = PROJECT_ROOT / "data" / "enhanced" / "geospatial" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def install_osmium():
    """Install required packages"""
    logger.info("Checking for osmium...")
    try:
        import osmium
        return True
    except ImportError:
        logger.info("Installing osmium...")
        try:
            import subprocess
            subprocess.run(["pip", "install", "osmium", "--break-system-packages"], check=True)
            return True
        except:
            return False

def process_osm_roads():
    """Extract road network from OSM data"""
    logger.info("Processing OSM road data...")
    
    pbf_file = OSM_DIR / "kenya-latest.osm.pbf"
    
    if not pbf_file.exists():
        logger.error(f"PBF file not found: {pbf_file}")
        return False
    
    logger.info(f"Processing {pbf_file}...")
    logger.info(f"File size: {pbf_file.stat().st_size / (1024*1024):.1f} MB")
    
    # Check if osmium is available
    if not install_osmium():
        logger.warning("Osmium not available, creating summary from file only")
        
        # Create basic summary
        summary = {
            "dataset": "OpenStreetMap Kenya",
            "file_size_mb": round(pbf_file.stat().st_size / (1024*1024), 1),
            "file_path": str(pbf_file),
            "status": "ready_for_processing",
            "road_types": {
                "motorway": "Highway/motorway",
                "primary": "Primary roads",
                "secondary": "Secondary roads",
                "tertiary": "Tertiary roads",
                "residential": "Residential roads",
                "unclassified": "Unclassified roads"
            },
            "processing_needed": True,
            "processing_instructions": {
                "python": "Use osmium or osmnx to process",
                "example": "import osmnx as ox; G = ox.graph_from_file('kenya-latest.osm.pbf')"
            }
        }
        
        with open(OUTPUT_DIR / "osm_summary.json", "w") as f:
            json.dump(summary, f, indent=2)
        
        return True
    
    # Try to process with osmium
    try:
        import osmium
        import shapely.wkb as shapely_wkb
        from shapely.geometry import LineString, Point
        
        class RoadHandler(osmium.SimpleHandler):
            def __init__(self):
                super().__init__()
                self.roads = []
                self.pois = []
                self.highway_counts = {}
            
            def way(self, w):
                if 'highway' in w.tags:
                    highway = w.tags['highway']
                    self.highway_counts[highway] = self.highway_counts.get(highway, 0) + 1
                    
                    # Get nodes for geometry
                    try:
                        nodes = list(w.nodes)
                        if len(nodes) >= 2:
                            coords = [(n.lon, n.lat) for n in nodes]
                            if len(coords) >= 2:
                                self.roads.append({
                                    'id': w.id,
                                    'highway': highway,
                                    'name': w.tags.get('name', ''),
                                    'lanes': w.tags.get('lanes', '1'),
                                    'maxspeed': w.tags.get('maxspeed', 'unknown'),
                                    'coords_count': len(coords)
                                })
                    except:
                        pass
            
            def node(self, n):
                # Extract POIs
                if 'amenity' in n.tags:
                    amenity = n.tags['amenity']
                    if amenity in ['police', 'hospital', 'school', 'fire_station', 'bank']:
                        self.pois.append({
                            'id': n.id,
                            'type': amenity,
                            'name': n.tags.get('name', ''),
                            'location': {'lat': n.location.lat, 'lon': n.location.lon}
                        })
        
        logger.info("Extracting roads and POIs...")
        handler = RoadHandler()
        
        # Apply to PBF file
        try:
            handler.apply_file(str(pbf_file))
        except Exception as e:
            logger.warning(f"Full processing failed: {e}")
            # Create summary from available info
            summary = {
                "dataset": "OpenStreetMap Kenya",
                "file_size_mb": round(pbf_file.stat().st_size / (1024*1024), 1),
                "status": "processing_limited",
                "note": "Full extraction requires more memory"
            }
            with open(OUTPUT_DIR / "osm_summary.json", "w") as f:
                json.dump(summary, f, indent=2)
            return True
        
        # Save results
        logger.info(f"Found {len(handler.roads)} roads")
        logger.info(f"Found {len(handler.pois)} POIs")
        
        # Highway stats
        highway_stats = dict(sorted(handler.highway_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # Save summary
        summary = {
            "dataset": "OpenStreetMap Kenya",
            "total_roads": len(handler.roads),
            "total_pois": len(handler.pois),
            "highway_types": highway_stats,
            "file_size_mb": round(pbf_file.stat().st_size / (1024*1024), 1),
            "status": "processed"
        }
        
        with open(OUTPUT_DIR / "osm_summary.json", "w") as f:
            json.dump(summary, f, indent=2)
        
        # Save POIs
        if handler.pois:
            with open(OUTPUT_DIR / "pois.json", "w") as f:
                json.dump(handler.pois[:1000], f, indent=2)  # Limit to first 1000
        
        logger.info(f"OSM processing complete! Summary saved to {OUTPUT_DIR}")
        return True
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        return False

def create_kenya_poi_map():
    """Create a map of important POIs in Kenya for the system"""
    logger.info("Creating Kenya POI reference map...")
    
    # Key locations for Kenya Overwatch
    poi_map = {
        "police_stations": {
            "description": "Police stations across Kenya",
            "sources": ["OSM Kenya", "National Police Service Kenya"],
            "count_estimate": 1000,
            "importance": "Critical for emergency response"
        },
        "hospitals": {
            "description": "Hospitals and medical facilities",
            "sources": ["OSM Kenya", "Ministry of Health"],
            "count_estimate": 500,
            "importance": "Emergency medical response"
        },
        "fire_stations": {
            "description": "Fire and rescue stations",
            "sources": ["OSM Kenya", "Nairobi Fire Brigade"],
            "count_estimate": 100,
            "importance": "Fire and disaster response"
        },
        "schools": {
            "description": "Educational institutions",
            "sources": ["OSM Kenya", "Ministry of Education"],
            "count_estimate": 30000,
            "importance": "Zone monitoring for child safety"
        },
        "banks": {
            "description": "Banks and financial institutions",
            "sources": ["OSM Kenya", "Central Bank of Kenya"],
            "count_estimate": 3000,
            "importance": "High-security zone monitoring"
        }
    }
    
    with open(OUTPUT_DIR / "kenya_poi_map.json", "w") as f:
        json.dump(poi_map, f, indent=2)
    
    logger.info(f"Created POI map at {OUTPUT_DIR}")
    return poi_map

def analyze_accident_data():
    """Analyze Kenya accident data if available"""
    logger.info("Checking accident data...")
    
    accidents_dir = PROJECT_ROOT / "data" / "enhanced" / "kenya" / "accidents"
    
    # Check what's available
    if not accidents_dir.exists():
        logger.warning("Accident data directory not found")
        return None
    
    # Check for notebooks/data
    files = list(accidents_dir.glob("*"))
    logger.info(f"Found {len(files)} files in accidents directory")
    
    # Create summary
    summary = {
        "dataset": "Kenya Accidents Analysis",
        "directory": str(accidents_dir),
        "files": [f.name for f in files if f.is_file()],
        "analysis_available": len([f for f in files if f.suffix in ['.ipynb', '.csv', '.json']]) > 0,
        "use_cases": [
            "Temporal pattern analysis",
            "Hotspot identification",
            "Risk factor modeling",
            "Response time optimization"
        ]
    }
    
    with open(OUTPUT_DIR / "accident_data_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    
    return summary

def main():
    logger.info("=" * 60)
    logger.info("Kenya Overwatch OSM & Data Processor")
    logger.info("=" * 60)
    
    # Process OSM data
    process_osm_roads()
    
    # Create POI map
    create_kenya_poi_map()
    
    # Analyze accident data
    analyze_accident_data()
    
    logger.info("=" * 60)
    logger.info("Processing Complete!")
    logger.info("=" * 60)
    
    # Print summary
    print(f"\nProcessed data saved to: {OUTPUT_DIR}")
    print("\nFiles created:")
    for f in OUTPUT_DIR.glob("*"):
        print(f"  - {f.name}")

if __name__ == "__main__":
    main()
