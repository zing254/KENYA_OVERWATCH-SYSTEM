#!/bin/bash
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
