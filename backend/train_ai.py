#!/usr/bin/env python3
"""
Kenya Overwatch AI Training Pipeline
Trains YOLO models using the provided datasets
"""

import os
import sys
import subprocess
import json
from pathlib import Path

# Dataset paths
BASE_DIR = Path(__file__).parent.parent / "data"
TRAIN_DIR = BASE_DIR / "training"
ENHANCED_DIR = BASE_DIR / "enhanced"

# Training configuration
CONFIG = {
    "model": "yolov8n.pt",  # nano for speed, can use yolov8s/m/l for better accuracy
    "epochs": 100,
    "imgsz": 640,
    "batch": 16,
    "data": str(TRAIN_DIR / "data.yaml"),
    "project": "runs/train",
    "name": "kenya_overwatch",
    "patience": 10,
    "save_period": 10,
    "device": "0",  # GPU, use "cpu" if no GPU
    "workers": 8,
    "optimizer": "AdamW",
    "lr0": 0.001,
    "lrf": 0.01,
    "momentum": 0.937,
    "weight_decay": 0.0005,
}

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import ultralytics
        print(f"✓ Ultralytics YOLO installed: {ultralytics.__version__}")
    except ImportError:
        print("Installing ultralytics...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "ultralytics"])
    
    try:
        import torch
        print(f"✓ PyTorch installed: {torch.__version__}")
        if torch.cuda.is_available():
            print(f"✓ CUDA available: {torch.cuda.get_device_name(0)}")
    except ImportError:
        print("Installing torch...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "torch"])

def prepare_datasets():
    """Prepare and validate datasets"""
    print("\n📁 Preparing datasets...")
    
    datasets = {
        "training/samples": ["car", "truck", "bus", "motorcycle", "plates"],
        "enhanced/kenya/accidents": [],
        "enhanced/kenya/crashes_ma3route": [],
        "enhanced/vehicles": [],
    }
    
    total_images = 0
    for path, subdirs in datasets.items():
        full_path = BASE_DIR / path
        if full_path.exists():
            if subdirs:
                for subdir in subdirs:
                    sub_path = full_path / subdir
                    if sub_path.exists():
                        images = list(sub_path.glob("*.jpg")) + list(sub_path.glob("*.png"))
                        print(f"  ✓ {path}/{subdir}: {len(images)} images")
                        total_images += len(images)
            else:
                images = list(full_path.glob("*.jpg")) + list(full_path.glob("*.png"))
                print(f"  ✓ {path}: {len(images)} images")
                total_images += len(images)
    
    print(f"\nTotal images available: {total_images}")
    return total_images

def train_model(model_type="vehicle"):
    """Train YOLO model"""
    print(f"\n🚀 Training {model_type} detection model...")
    
    if model_type == "vehicle":
        # Update config for vehicle detection
        train_config = CONFIG.copy()
        train_config["data"] = str(TRAIN_DIR / "data.yaml")
        
        # Create data.yaml if not exists
        data_yaml = TRAIN_DIR / "data.yaml"
        if not data_yaml.exists():
            data_yaml.write_text("""
# Kenya Overwatch Dataset
path: /home/zingri/Desktop/HACKATHON/kenya-overwatch-production/data
train: training/samples/car
train: training/samples/truck
train: training/samples/bus
train: training/samples/motorcycle
train: training/samples/plates

nc: 5
names:
  0: car
  1: truck
  2: bus
  3: motorcycle
  4: license_plate
""")
    
    # Run training
    cmd = [
        "yolo", "detect.train",
        f"model={train_config['model']}",
        f"epochs={train_config['epochs']}",
        f"imgsz={train_config['imgsz']}",
        f"batch={train_config['batch']}",
        f"data={train_config['data']}",
        f"project={train_config['project']}",
        f"name={train_config['name']}",
        f"device={train_config['device']}",
    ]
    
    print(f"Running: {' '.join(cmd)}")
    
    try:
        subprocess.run(cmd, check=True)
        print(f"✓ Training complete! Model saved to runs/train/kenya_overwatch")
    except subprocess.CalledProcessError as e:
        print(f"✗ Training failed: {e}")
    except FileNotFoundError:
        print("⚠ YOLO CLI not found. Using Python API instead...")
        train_with_python_api()

def train_with_python_api():
    """Train using Python API"""
    try:
        from ultralytics import YOLO
        
        print("Loading base model...")
        model = YOLO(CONFIG["model"])
        
        print("Starting training...")
        results = model.train(
            data=str(CONFIG["data"]),
            epochs=CONFIG["epochs"],
            imgsz=CONFIG["imgsz"],
            batch=CONFIG["batch"],
            project=CONFIG["project"],
            name=CONFIG["name"],
            device=CONFIG["device"],
            verbose=True,
        )
        
        print(f"✓ Training complete!")
        print(f"Model saved to: {results.save_dir}")
        
    except Exception as e:
        print(f"✗ Training failed: {e}")

def test_model(model_path="runs/train/kenya_overwatch/weights/best.pt"):
    """Test trained model"""
    print(f"\n🧪 Testing model: {model_path}")
    
    if not Path(model_path).exists():
        print(f"⚠ Model not found at {model_path}")
        return
    
    try:
        from ultralytics import YOLO
        model = YOLO(model_path)
        
        # Test on sample images
        test_images = list((BASE_DIR / "training/samples/car").glob("*.jpg"))[:5]
        
        for img in test_images:
            results = model(img)
            print(f"  ✓ {img.name}: {len(results[0].boxes)} detections")
            
    except Exception as e:
        print(f"✗ Testing failed: {e}")

def export_model(model_path="runs/train/kenya_overwatch/weights/best.pt", format="onnx"):
    """Export model to different formats"""
    print(f"\n📤 Exporting model to {format}...")
    
    try:
        from ultralytics import YOLO
        model = YOLO(model_path)
        
        exported = model.export(format=format)
        print(f"✓ Model exported to: {exported}")
        
    except Exception as e:
        print(f"✗ Export failed: {e}")

def main():
    print("=" * 50)
    print("Kenya Overwatch AI Training Pipeline")
    print("=" * 50)
    
    # Check dependencies
    check_dependencies()
    
    # Prepare datasets
    total_images = prepare_datasets()
    
    if total_images < 10:
        print("⚠ Not enough training images. Please add more data.")
        return
    
    # Train model
    print("\n" + "=" * 50)
    train_model("vehicle")
    
    # Test model
    print("\n" + "=" * 50)
    test_model()
    
    print("\n" + "=" * 50)
    print("✅ Training pipeline complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()
