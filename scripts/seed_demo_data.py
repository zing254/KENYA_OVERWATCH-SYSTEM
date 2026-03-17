#!/usr/bin/env python3
"""
Kenya Overwatch - Demo Data Seeder
Populates the system with realistic Kenyan road safety data
"""

import json
import uuid
import random
from datetime import datetime, timedelta

# Kenya-specific data
KENYAN_FIRST_NAMES = [
    "John", "Mary", "Peter", "Grace", "James", "Sarah", "Daniel", "Esther",
    "Joseph", "Catherine", "Samuel", "Mercy", "David", "Joyce", "Michael",
    "Ann", "George", "Margaret", "Francis", "Rose", "Patrick", "Jane",
    "Kevin", "Alice", "Brian", "Lucy", "Chris", "Ruth", "Eric", "Faith"
]

KENYAN_LAST_NAMES = [
    "Kamau", "Wanjiku", "Ochieng", "Akinyi", "Mwangi", "Njeri", "Odhiambo",
    "Adhiambo", "Kipchoge", "Chebet", "Maina", "Wambui", "Otieno", "Auma",
    "Kariuki", "Nyambura", "Onyango", "Atieno", "Njoroge", "Muthoni",
    "Mutua", "Wanza", "Omondi", "Awino", "Wafula", "Naliaka", "Simiyu",
    "Nekesa", "Were", "Nasimiyu"
]

PLATE_PREFIXES = ["KDA", "KDB", "KDC", "KDD", "KDE", "KDF", "KDG", "KDH", "KDJ", "KDK"]
STROKE_LETTERS = "ABCDEGHJKLMNPQRSTUVWXYZ"

def generate_kenyan_plate():
    prefix = random.choice(PLATE_PREFIXES)
    number = random.randint(1, 999)
    stroke = random.choice(STROKE_LETTERS)
    return f"{prefix} {number:03d}{stroke}"

def generate_phone():
    prefix = random.choice(["71", "72", "73", "74", "75", "76", "77", "78", "79"])
    return f"+254{prefix}{random.randint(1000000, 9999999)}"

# Nairobi locations with GPS coordinates
NAIROBI_LOCATIONS = [
    {"name": "Mombasa Road Junction", "lat": -1.3300, "lng": 36.9800, "road": "Mombasa Road (A109)"},
    {"name": "CBD - Kenyatta Avenue", "lat": -1.2833, "lng": 36.8197, "road": "Kenyatta Avenue"},
    {"name": "Thika Road - Roysambu", "lat": -1.2107, "lng": 36.8865, "road": "Thika Superhighway"},
    {"name": "Uhuru Highway", "lat": -1.2921, "lng": 36.8155, "road": "Uhuru Highway"},
    {"name": "Waiyaki Way - Westlands", "lat": -1.2634, "lng": 36.8090, "road": "Waiyaki Way"},
    {"name": "Langata Road - Bomas", "lat": -1.3556, "lng": 36.7664, "road": "Langata Road"},
    {"name": "Jogoo Road - Buru Buru", "lat": -1.2934, "lng": 36.8590, "road": "Jogoo Road"},
    {"name": "Ngong Road - Adams Arcade", "lat": -1.3012, "lng": 36.7801, "road": "Ngong Road"},
    {"name": "Outer Ring Road - Donholm", "lat": -1.2850, "lng": 36.8890, "road": "Outer Ring Road"},
    {"name": "Kasarani - Mwiki", "lat": -1.2100, "lng": 36.8900, "road": "Kasarani Road"},
    {"name": "Embakasi - Pipeline", "lat": -1.3100, "lng": 36.9000, "road": "Mombasa Road"},
    {"name": "Karen - Hardy", "lat": -1.3500, "lng": 36.7200, "road": "Karen Road"},
    {"name": "Kileleshwa - Valley Road", "lat": -1.2750, "lng": 36.7900, "road": "Valley Road"},
    {"name": "Eastleigh - 1st Avenue", "lat": -1.2700, "lng": 36.8500, "road": "Eastleigh First Avenue"},
    {"name": "South B - Hazina", "lat": -1.3100, "lng": 36.8300, "road": "Mombasa Road"},
]

# Vehicle makes common in Kenya
VEHICLE_MAKES = [
    ("Toyota", ["Corolla", "Premio", "Axio", "Probox", "Harrier", "Land Cruiser", "Hilux"]),
    ("Nissan", ["Note", "X-Trail", "Navara", "Sunny"]),
    ("Mazda", ["Demio", "Axela", "CX-5"]),
    ("Subaru", ["Forester", "Outback", "Impreza"]),
    ("Isuzu", ["D-Max", "NPR", "FRR"]),
    ("Honda", ["Fit", "CR-V", "Civic"]),
    ("Volkswagen", ["Golf", "Polo", "Tiguan"]),
    ("Mercedes-Benz", ["C-Class", "E-Class", "Sprinter"]),
    ("BMW", ["3 Series", "X5"]),
]

COLORS = ["White", "Black", "Silver", "Grey", "Blue", "Red", "Green", "Brown"]

def generate_vehicle():
    make, models = random.choice(VEHICLE_MAKES)
    model = random.choice(models)
    return {
        "plate_number": generate_kenyan_plate(),
        "vehicle_type": random.choice(["car", "truck", "bus", "motorcycle"]),
        "make": make,
        "model": model,
        "year": random.randint(2010, 2024),
        "color": random.choice(COLORS),
        "owner_name": f"{random.choice(KENYAN_FIRST_NAMES)} {random.choice(KENYAN_LAST_NAMES)}"
    }

def generate_driver():
    return {
        "license_number": f"DL{random.randint(100000, 999999)}",
        "name": f"{random.choice(KENYAN_FIRST_NAMES)} {random.choice(KENYAN_LAST_NAMES)}",
        "phone": generate_phone(),
        "date_of_birth": f"{random.randint(1970, 2000)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
        "status": random.choice(["active", "active", "active", "suspended"]),
        "total_violations": random.randint(0, 5)
    }

def generate_incident():
    loc = random.choice(NAIROBI_LOCATIONS)
    types = ["accident", "speeding", "road_hazard", "flooding", "reckless"]
    severities = ["low", "medium", "high", "critical"]
    return {
        "id": f"INC-{uuid.uuid4().hex[:8].upper()}",
        "type": random.choice(types),
        "location": loc["name"],
        "road_name": loc["road"],
        "latitude": loc["lat"],
        "longitude": loc["lng"],
        "severity": random.choice(severities),
        "status": random.choice(["pending", "investigating", "resolved"]),
        "description": f"Incident reported at {loc['name']}",
        "created_at": (datetime.now() - timedelta(hours=random.randint(0, 72))).isoformat()
    }

def seed_database():
    """Seed the database with demo data"""
    print("=" * 60)
    print("  Kenya Overwatch - Demo Data Seeder")
    print("=" * 60)
    print()
    
    # Generate data
    vehicles = [generate_vehicle() for _ in range(20)]
    drivers = [generate_driver() for _ in range(15)]
    incidents = [generate_incident() for _ in range(30)]
    
    print(f"Generated: {len(vehicles)} vehicles, {len(drivers)} drivers, {len(incidents)} incidents")
    
    # Save to JSON for import
    demo_data = {
        "generated_at": datetime.now().isoformat(),
        "vehicles": vehicles,
        "drivers": drivers,
        "incidents": incidents,
        "statistics": {
            "total_vehicles": len(vehicles),
            "total_drivers": len(drivers),
            "total_incidents": len(incidents),
            "active_incidents": len([i for i in incidents if i["status"] != "resolved"]),
            "critical_incidents": len([i for i in incidents if i["severity"] == "critical"]),
        }
    }
    
    with open("demo_data.json", "w") as f:
        json.dump(demo_data, f, indent=2)
    
    print()
    print("Demo data saved to: demo_data.json")
    print("Upload via: curl -X POST -F 'file=@demo_data.json' http://localhost:8001/api/admin/import")
    print()
    print("=" * 60)

if __name__ == "__main__":
    seed_database()
