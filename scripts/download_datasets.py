#!/usr/bin/env python3
"""
Kenya Overwatch Dataset Downloader
Downloads and prepares vehicle detection and license plate datasets
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
VEHICLES_DIR = DATA_DIR / "vehicles"
PLATES_DIR = DATA_DIR / "license_plates"
TRAINING_DIR = DATA_DIR / "training"
MODELS_DIR = DATA_DIR / "models"

# Create directories
for d in [VEHICLES_DIR, PLATES_DIR, TRAINING_DIR, MODELS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Dataset configurations
DATASETS = {
    "vehicle_type": {
        "name": "Vehicle Type Recognition",
        "source": "kaggle",
        "kaggle_dataset": "kaggleashwin/vehicle-type-recognition",
        "description": "Classify vehicles into car, truck, bus, motorcycle categories",
    },
    "license_plates_roboflow": {
        "name": "License Plates (Roboflow)",
        "source": "roboflow",
        "roboflow_dataset": "license-plates-us-eu",
        "workspace": "yolov8",
        "description": "Detect license plates in US and EU vehicles",
    },
    "ufpr_alpr": {
        "name": "UFPR-ALPR Dataset",
        "source": "github",
        "github_repo": "raysonlaroca/ufpr-alpr-dataset",
        "description": "License plate detection and OCR - 4,500 images",
    },
    "vehicle_10": {
        "name": "Vehicle-10 Dataset",
        "source": "github",
        "github_repo": "yjzhai-cs/Vehicle-10",
        "description": "36,000 vehicle images across 10 categories",
    }
}

def check_requirements():
    """Check if required tools are installed"""
    print("Checking requirements...")
    
    # Check for git
    try:
        subprocess.run(["git", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: git is required but not installed.")
        sys.exit(1)
    
    print("Requirements check complete (optional ML packages will be used if available).")

def download_vehicle_type_recognition():
    """Download vehicle type recognition dataset"""
    print("\n=== Downloading Vehicle Type Recognition Dataset ===")
    
    dataset_dir = VEHICLES_DIR / "type_recognition"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    # Create sample synthetic data since Kaggle requires auth
    # In production, use kaggle datasets download
    print(f"Dataset will be saved to: {dataset_dir}")
    print("Note: Kaggle dataset requires authentication.")
    print("Please run: kaggle datasets download -d kaggleashwin/vehicle-type-recognition -p {dataset_dir}")
    
    # Create a placeholder with structure
    categories = ["car", "truck", "bus", "motorcycle"]
    for cat in categories:
        (dataset_dir / cat).mkdir(exist_ok=True)
    
    # Create sample config
    config = {
        "dataset": "vehicle_type_recognition",
        "categories": categories,
        "num_classes": len(categories),
        "image_size": [224, 224],
        "source": "Kaggle"
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"Created dataset structure at {dataset_dir}")
    return dataset_dir

def download_license_plates_roboflow():
    """Download license plate dataset from Roboflow"""
    print("\n=== Downloading License Plates Dataset ===")
    
    dataset_dir = PLATES_DIR / "roboflow"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    # Try to download using roboflow CLI or create placeholder
    print(f"Dataset will be saved to: {dataset_dir}")
    print("To download from Roboflow:")
    print("1. Sign up at https://roboflow.com")
    print("2. Export the license-plates-us-eu dataset")
    print("3. Place the downloaded files in this directory")
    
    # Create YOLO format placeholder structure
    for split in ["train", "valid", "test"]:
        (dataset_dir / split / "images").mkdir(parents=True, exist_ok=True)
        (dataset_dir / split / "labels").mkdir(parents=True, exist_ok=True)
    
    # Create dataset config for YOLO
    config = {
        "dataset": "license_plates",
        "format": "yolo",
        "classes": ["license_plate"],
        "source": "Roboflow",
        "train_samples": 0,
        "valid_samples": 0,
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"Created dataset structure at {dataset_dir}")
    return dataset_dir

def download_ufpr_alpr():
    """Download UFPR-ALPR dataset from GitHub"""
    print("\n=== Downloading UFPR-ALPR Dataset ===")
    
    dataset_dir = PLATES_DIR / "ufpr_alpr"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    repo_url = "https://github.com/raysonlaroca/ufpr-alpr-dataset.git"
    
    print(f"Cloning UFPR-ALPR repository to {dataset_dir}...")
    try:
        # Clone the repo
        result = subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, str(dataset_dir)],
            capture_output=True,
            text=True,
            timeout=300
        )
        if result.returncode == 0:
            print("Successfully cloned UFPR-ALPR dataset!")
        else:
            print(f"Note: {result.stderr}")
            print("Manual download may be required.")
    except subprocess.TimeoutExpired:
        print("Clone timed out. Please download manually.")
    except Exception as e:
        print(f"Error: {e}")
    
    # Create dataset config
    config = {
        "dataset": "ufpr_alpr",
        "description": "UFPR-ALPR: License plate detection and recognition",
        "images": 4500,
        "annotations": "COCO and YOLO formats available",
        "source": "https://github.com/raysonlaroca/ufpr-alpr-dataset"
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    return dataset_dir

def download_vehicle_10():
    """Download Vehicle-10 dataset from GitHub"""
    print("\n=== Downloading Vehicle-10 Dataset ===")
    
    dataset_dir = VEHICLES_DIR / "vehicle_10"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    repo_url = "https://github.com/yjzhai-cs/Vehicle-10.git"
    
    print(f"Cloning Vehicle-10 repository to {dataset_dir}...")
    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, str(dataset_dir)],
            capture_output=True,
            text=True,
            timeout=300
        )
        if result.returncode == 0:
            print("Successfully cloned Vehicle-10 dataset!")
        else:
            print(f"Note: {result.stderr}")
    except Exception as e:
        print(f"Error: {e}")
        print("Manual download may be required.")
    
    config = {
        "dataset": "vehicle_10",
        "description": "Vehicle-10: 10 category vehicle classification",
        "categories": 10,
        "images": "~36,000",
        "source": "https://github.com/yjzhai-cs/Vehicle-10"
    }
    
    with open(dataset_dir / "dataset_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    return dataset_dir

def create_sample_data():
    """Create sample training data for initial testing"""
    print("\n=== Creating Sample Training Data ===")
    
    import cv2
    import numpy as np
    
    # Create synthetic vehicle images for testing
    sample_dir = TRAINING_DIR / "samples"
    sample_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate sample images
    np.random.seed(42)
    
    # Sample vehicle types
    vehicle_types = ["car", "truck", "bus", "motorcycle"]
    
    for vehicle_type in vehicle_types:
        type_dir = sample_dir / vehicle_type
        type_dir.mkdir(exist_ok=True)
        
        for i in range(10):  # 10 samples per type
            # Create a random colored image (simulating a vehicle)
            img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
            
            # Add some structure to make it look more like a vehicle
            # Draw a rectangle in the center
            x1, y1 = 50, 100
            x2, y2 = 174, 180
            color = (np.random.randint(50, 200), np.random.randint(50, 200), np.random.randint(50, 200))
            cv2.rectangle(img, (x1, y1), (x2, y2), color, -1)
            
            # Save image
            img_path = type_dir / f"{vehicle_type}_{i:03d}.jpg"
            cv2.imwrite(str(img_path), img)
    
    # Create sample license plate images
    plate_dir = sample_dir / "plates"
    plate_dir.mkdir(exist_ok=True)
    
    for i in range(20):
        # Create a simple license plate-like image
        img = np.ones((100, 300, 3), dtype=np.uint8) * 255
        
        # Add random "characters"
        for j in range(7):
            x = 20 + j * 40
            cv2.rectangle(img, (x, 30), (x + 25, 70), (0, 0, 0), -1)
        
        img_path = plate_dir / f"plate_{i:03d}.jpg"
        cv2.imwrite(str(img_path), img)
    
    print(f"Created sample training data at {sample_dir}")
    return sample_dir

def create_data_yaml():
    """Create YOLO data configuration file"""
    print("\n=== Creating YOLO Configuration ===")
    
    data_yaml = """
# Kenya Overwatch Dataset Configuration
# YOLO Format

# Dataset paths
path: /home/zingri/Desktop/HACKATHON/kenya-overwatch-production/data
train: training/samples/vehicle_type/car
train: training/samples/vehicle_type/truck
train: training/samples/vehicle_type/bus
train: training/samples/vehicle_type/motorcycle

# Number of classes
nc: 4

# Class names
names:
  0: car
  1: truck
  2: bus
  3: motorcycle
"""
    
    yaml_path = TRAINING_DIR / "data.yaml"
    with open(yaml_path, "w") as f:
        f.write(data_yaml)
    
    print(f"Created YOLO config at {yaml_path}")

def create_download_script():
    """Create a manual download script for datasets that need authentication"""
    print("\n=== Creating Manual Download Script ===")
    
    script = """#!/bin/bash
# Kenya Overwatch Dataset Manual Download Script
# Run this script to download datasets that require authentication

echo "=== Kenya Overwatch Dataset Download Script ==="

# Create data directories
mkdir -p data/vehicles/kaggle
mkdir -p data/license_plates/roboflow

echo ""
echo "1. Vehicle Type Recognition (Kaggle)"
echo "   URL: https://www.kaggle.com/datasets/kaggleashwin/vehicle-type-recognition"
echo "   Download the ZIP file and extract to: data/vehicles/kaggle/"
echo ""
echo "   Or use Kaggle CLI:"
echo "   kaggle datasets download -d kaggleashwin/vehicle-type-recognition -p data/vehicles/kaggle/ --unzip"
echo ""

echo "2. License Plates (Roboflow)"
echo "   URL: https://public.roboflow.com/object-detection/license-plates-us-eu"
echo "   Export as YOLO format and extract to: data/license_plates/roboflow/"
echo ""

echo "3. UFPR-ALPR (already downloaded if git clone succeeded)"
echo ""

echo "4. Vehicle-10 (already downloaded if git clone succeeded)"
echo ""

echo "=== Download Complete ==="
"""
    
    script_path = DATA_DIR / "download_datasets.sh"
    with open(script_path, "w") as f:
        f.write(script)
    
    os.chmod(script_path, 0o755)
    print(f"Created download script at {script_path}")

def main():
    print("=" * 60)
    print("Kenya Overwatch Dataset Downloader")
    print("=" * 60)
    
    # Check requirements
    check_requirements()
    
    # Download datasets (where possible)
    try:
        download_vehicle_type_recognition()
    except Exception as e:
        print(f"Vehicle type download: {e}")
    
    try:
        download_license_plates_roboflow()
    except Exception as e:
        print(f"License plates download: {e}")
    
    try:
        download_ufpr_alpr()
    except Exception as e:
        print(f"UFPR-ALPR download: {e}")
    
    try:
        download_vehicle_10()
    except Exception as e:
        print(f"Vehicle-10 download: {e}")
    
    # Create sample data for testing
    create_sample_data()
    
    # Create configuration
    create_data_yaml()
    create_download_script()
    
    # Summary
    print("\n" + "=" * 60)
    print("Download Summary")
    print("=" * 60)
    print(f"Vehicles directory: {VEHICLES_DIR}")
    print(f"License plates directory: {PLATES_DIR}")
    print(f"Training directory: {TRAINING_DIR}")
    print(f"Models directory: {MODELS_DIR}")
    print("\nDatasets downloaded! Some may require manual authentication.")
    print("Run ./download_datasets.sh for manual download instructions.")

if __name__ == "__main__":
    main()
