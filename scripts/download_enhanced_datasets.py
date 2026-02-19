#!/usr/bin/env python3
"""
Kenya Overwatch Enhanced Dataset Downloader
Downloads UVH-26, Kenya-specific datasets, and OSM data
"""

import os
import sys
import json
import subprocess
from pathlib import Path
import urllib.request
import zipfile
import tarfile
import shutil

# Configuration
PROJECT_ROOT = Path("/home/zingri/Desktop/HACKATHON/kenya-overwatch-production")
DATA_DIR = PROJECT_ROOT / "data"

# Enhanced directories
ENHANCED_DIR = DATA_DIR / "enhanced"
ENHANCED_DIR.mkdir(parents=True, exist_ok=True)

VEHICLES_DIR = ENHANCED_DIR / "vehicles"
KENYA_DIR = ENHANCED_DIR / "kenya"
CRIME_DIR = ENHANCED_DIR / "crime"
GEOSPATIAL_DIR = ENHANCED_DIR / "geospatial"

for d in [VEHICLES_DIR, KENYA_DIR, CRIME_DIR, GEOSPATIAL_DIR]:
    d.mkdir(parents=True, exist_ok=True)

def check_git():
    """Check if git is available"""
    try:
        subprocess.run(["git", "--version"], capture_output=True, check=True)
        return True
    except:
        return False

def check_wget():
    """Check if wget is available"""
    try:
        subprocess.run(["wget", "--version"], capture_output=True, check=True)
        return True
    except:
        return False

def download_uvh26():
    """Download UVH-26 dataset from HuggingFace"""
    print("\n=== Downloading UVH-26 Traffic Dataset ===")
    
    dataset_dir = VEHICLES_DIR / "uvh26"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    # Try to clone the HuggingFace dataset repo
    # UVH-26 is available at https://huggingface.co/datasets/aimiisc/UVH-26
    hf_urls = [
        "https://huggingface.co/datasets/aimiisc/UVH-26/resolve/main/uvh26-train.zip",
        "https://huggingface.co/datasets/aimiisc/UVH-26/resolve/main/uvh26-validation.zip",
    ]
    
    # Create dataset config
    config = {
        "dataset": "UVH-26",
        "description": "Indian Urban Vehicle Dataset - highly relevant for Kenya traffic",
        "source": "HuggingFace - aimiisc/UVH-26",
        "classes": [
            "two_wheeler", "auto_rickshaw", "car", "bus", "truck",
            "light_commercial_vehicle", "animal", "other"
        ],
        "num_images": 26646,
        "bounding_boxes": 1800000,
        "note": "Download manually from HuggingFace for full dataset",
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    # Create README with download instructions
    readme = """# UVH-26 Dataset for Kenya Overwatch

## Why UVH-26 is Perfect for Kenya Overwatch

- **26,646 high-resolution traffic images** from real CCTV cameras
- **1.8 million bounding boxes** across 14 vehicle classes
- Includes two-wheelers (similar to Kenya's boda-bodas)
- Includes auto-rickshaws (similar to Kenya's tuk-tuks)
- Pre-trained YOLOv11 models available
- **License:** CC BY 4.0 (fully open)

## Download Instructions

1. Visit: https://huggingface.co/datasets/aimiisc/UVH-26
2. Download the dataset files
3. Extract to: data/enhanced/vehicles/uvh26/

## Classes Available

- Two-wheelers (boda-boda equivalent)
- Auto-rickshaws (tuk-tuk equivalent)
- Cars
- Buses
- Trucks
- Light commercial vehicles
- Animals
- And more...

## Integration

The dataset classes map well to Kenya traffic:
- two_wheeler → motorcycle/boda-boda
- auto_rickshaw → tuk-tuk
- car → private vehicle
- bus → public transport
- truck → commercial vehicle
"""
    
    with open(dataset_dir / "README.md", "w") as f:
        f.write(readme)
    
    print(f"Created UVH-26 structure at {dataset_dir}")
    print("Note: Download full dataset from HuggingFace manually")
    return dataset_dir

def download_kenya_road_surface():
    """Download Kenya Road Surface Type Dataset"""
    print("\n=== Downloading Kenya Road Surface Dataset ===")
    
    dataset_dir = KENYA_DIR / "road_surface"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    # Create config
    config = {
        "dataset": "Kenya Road Surface Type",
        "description": "1,267,818 road segments classified as paved/unpaved",
        "source": "Scientific Data - Springer Nature",
        "accuracy": ">94% F1 score",
        "num_segments": 1267818,
        "classes": ["paved", "unpaved"],
        "note": "Request access from Nature Scientific Data",
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    readme = """# Kenya Road Surface Dataset

## Overview

- **1,267,818 road segments** across all of Kenya
- Classified as paved or unpaved
- Created using OpenStreetMap + Google Satellite imagery
- **Accuracy:** >94% F1 score
- **License:** Open access

## Use Cases

1. **Infrastructure Monitoring** - Identify unpaved roads
2. **Risk Assessment** - Paved roads have different risk profiles
3. **Emergency Response Planning** - Know which routes are accessible

## Access

Download from: https://www.nature.com/articles/s41597-024-03158-7
"""
    
    with open(dataset_dir / "README.md", "w") as f:
        f.write(readme)
    
    print(f"Created Kenya Road Surface structure at {dataset_dir}")
    return dataset_dir

def download_kenya_accidents():
    """Download Kenya Accidents Analysis Repository"""
    print("\n=== Downloading Kenya Accidents Dataset ===")
    
    dataset_dir = KENYA_DIR / "accidents"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    # Try to clone from GitHub
    repo_url = "https://github.com/Geoffrey7/Kenya-Accidents-Analysis.git"
    
    if check_git():
        print(f"Cloning Kenya Accidents repository...")
        try:
            result = subprocess.run(
                ["git", "clone", "--depth", "1", repo_url, str(dataset_dir)],
                capture_output=True,
                text=True,
                timeout=120
            )
            if result.returncode == 0:
                print("Successfully cloned Kenya Accidents dataset!")
            else:
                print(f"Note: {result.stderr}")
        except Exception as e:
            print(f"Clone failed: {e}")
    
    # Create config
    config = {
        "dataset": "Kenya Accidents Analysis",
        "description": "Historical accident data analysis 2012-2023",
        "source": "GitHub - Geoffrey7/Kenya-Accidents-Analysis",
        "temporal_coverage": "2012-2023",
        "contents": [
            "Historical accident data",
            "Temporal patterns",
            "Jupyter notebooks for EDA",
            "Visualization code"
        ],
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    return dataset_dir

def download_osm_kenya():
    """Download OpenStreetMap Kenya data"""
    print("\n=== Downloading OpenStreetMap Kenya ===")
    
    dataset_dir = GEOSPATIAL_DIR / "osm_kenya"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    # PBF download URL
    pbf_url = "https://download.geofabrik.de/africa/kenya-latest.osm.pbf"
    pbf_file = dataset_dir / "kenya-latest.osm.pbf"
    
    print(f"Downloading Kenya OSM PBF data (this may take a few minutes)...")
    print(f"URL: {pbf_url}")
    
    # Try to download with wget or curl
    try:
        if check_wget():
            result = subprocess.run(
                ["wget", "-O", str(pbf_file), pbf_url],
                capture_output=True,
                text=True,
                timeout=600
            )
        else:
            result = subprocess.run(
                ["curl", "-L", "-o", str(pbf_file), pbf_url],
                capture_output=True,
                text=True,
                timeout=600
            )
        
        if pbf_file.exists() and pbf_file.stat().st_size > 1000000:
            print(f"Downloaded OSM data: {pbf_file.stat().st_size / (1024*1024):.1f} MB")
        else:
            print("Download may have failed, creating placeholder...")
    except Exception as e:
        print(f"Download failed: {e}")
        print("Creating placeholder for manual download...")
    
    # Create config
    config = {
        "dataset": "OpenStreetMap Kenya",
        "description": "Complete road network and POI data for Kenya",
        "source": "Geofabrik",
        "format": "PBF (Protocolbuffer Binary Format)",
        "expected_size_mb": 322,
        "contents": [
            "Complete road network",
            "Points of interest",
            "Administrative boundaries",
            "Building footprints"
        ],
        "download_url": pbf_url,
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    readme = """# OpenStreetMap Kenya Data

## Format: PBF (.osm.pbf)

PBF is the recommended format for Kenya Overwatch because:
- **Smaller file size** (322 MB vs 880 MB for Shapefile)
- **Faster processing** - optimized for spatial queries
- **Complete data** - includes all OSM metadata
- **Python support** - works with osmium, osmnx, geopandas

## How to Use

### 1. Extract Roads
```python
import osmium
import osmnx as ox

# Load road network
G = ox.graph_from_file('kenya-latest.osm.pbf', network_type='drive')
```

### 2. Find Nearest Road
```python
# Given a detection location, find nearest road
nearest_road = ox.nearest_edges(G, lon, lat)
```

### 3. Get Points of Interest
```python
# Find police stations, hospitals, schools
# These are priority monitoring locations
```

## Manual Download

If automatic download fails, download from:
https://download.geofabrik.de/africa/kenya.html

Select: **Kenya** → **osm.pbf**
"""
    
    with open(dataset_dir / "README.md", "w") as f:
        f.write(readme)
    
    print(f"Created OSM Kenya structure at {dataset_dir}")
    return dataset_dir

def download_crxk_crime():
    """Download CRxK Crime Re-enacted Dataset"""
    print("\n=== Downloading CRxK Crime Dataset ===")
    
    dataset_dir = CRIME_DIR / "crxk"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    # Create config
    config = {
        "dataset": "CRxK Crime Re-enacted",
        "description": "2,054,013 frames of re-enacted crimes for security monitoring",
        "source": "Nature Scientific Reports",
        "num_frames": 2054013,
        "crime_categories": [
            "assault", "robbery", "swooning", "kidnapping", 
            "burglary", "theft", "vandalism", "fraud"
        ],
        "features": [
            "Multi-view surveillance footage",
            "Normal scenarios (5 seconds before crime)",
            "Pre and post incident frames"
        ],
        "note": "Request access from Nature Scientific Data",
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    readme = """# CRxK Crime Detection Dataset

## Overview

- **2,054,013 frames** of re-enacted crimes
- **13 crime categories** including:
  - Assault
  - Robbery
  - Swooning
  - Kidnapping
  - Burglary
  - Theft
  - Vandalism
  - Fraud

## Features

1. **Multi-view surveillance** - Different camera angles
2. **Pre-incident frames** - 5 seconds before crime
3. **Post-incident frames** - Aftermath captured
4. **Normal scenarios** - Baseline for comparison

## Use Cases

1. Train crime detection models
2. Anomaly detection in surveillance
3. Threat assessment algorithms
4. Response time optimization

## Access

Download from: https://www.nature.com/articles/s41598-025-15058-w
"""
    
    with open(dataset_dir / "README.md", "w") as f:
        f.write(readme)
    
    print(f"Created CRxK structure at {dataset_dir}")
    return dataset_dir

def create_integration_config():
    """Create main integration configuration"""
    print("\n=== Creating Integration Configuration ===")
    
    config = {
        "project": "Kenya Overwatch AI",
        "version": "1.0.0",
        "datasets": {
            "vehicle_detection": {
                "primary": "UVH-26",
                "fallback": "Vehicle-10",
                "classes_mapping": {
                    "two_wheeler": "motorcycle",
                    "auto_rickshaw": "tuktuk",
                    "car": "car",
                    "bus": "bus",
                    "truck": "truck",
                    "light_commercial_vehicle": "van"
                }
            },
            "kenya_specific": {
                "road_surface": "Kenya Road Surface",
                "accidents": "Kenya Accidents 2012-2023"
            },
            "geospatial": {
                "osm": "OpenStreetMap Kenya PBF",
                "note": "Use osmium/osmnx for processing"
            },
            "crime_detection": {
                "primary": "CRxK",
                "alternative": "MSV-PG"
            }
        },
        "model_pipeline": {
            "step1": "Vehicle detection (UVH-26 based)",
            "step2": "License plate detection (UFPR-ALPR)",
            "step3": "Risk assessment (Kenya accidents data)",
            "step4": "Geospatial context (OSM Kenya)"
        }
    }
    
    config_path = ENHANCED_DIR / "integration_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"Created integration config at {config_path}")
    return config_path

def main():
    print("=" * 60)
    print("Kenya Overwatch Enhanced Dataset Downloader")
    print("=" * 60)
    
    # Download datasets
    try:
        download_uvh26()
    except Exception as e:
        print(f"UVH-26: {e}")
    
    try:
        download_kenya_road_surface()
    except Exception as e:
        print(f"Road Surface: {e}")
    
    try:
        download_kenya_accidents()
    except Exception as e:
        print(f"Accidents: {e}")
    
    try:
        download_osm_kenya()
    except Exception as e:
        print(f"OSM Kenya: {e}")
    
    try:
        download_crxk_crime()
    except Exception as e:
        print(f"CRxK: {e}")
    
    # Create integration config
    create_integration_config()
    
    # Summary
    print("\n" + "=" * 60)
    print("Download Summary")
    print("=" * 60)
    print(f"Enhanced data directory: {ENHANCED_DIR}")
    print("\nDatasets configured:")
    print("  - UVH-26 (vehicle detection)")
    print("  - Kenya Road Surface")
    print("  - Kenya Accidents")
    print("  - OSM Kenya PBF")
    print("  - CRxK (crime detection)")
    print("\nNote: Some datasets require manual download from source URLs.")

if __name__ == "__main__":
    main()
