#!/usr/bin/env python3
"""
Kenya Overwatch System Simulation Script
=======================================
This script simulates the entire Kenya Overwatch system by:
1. Creating mock incidents, violations, vehicles, drivers
2. Creating citizen reports
3. Simulating alerts and notifications
4. Simulating dispatch actions
5. Generating traffic violations
6. Simulating real-time events

Usage:
    python simulate_system.py [--api-url URL] [--interval SECONDS] [--duration SECONDS]
"""

import asyncio
import json
import random
import sys
import time
import uuid
from datetime import datetime, timedelta
from typing import Optional
import argparse

API_URL = "http://localhost:8001"

# Kenyan location data
KENYA_LOCATIONS = [
    {"name": "Nairobi-Mombasa Road, Athi River", "lat": -1.455, "lng": 37.065},
    {"name": "Nairobi CBD, Kenyatta Avenue", "lat": -1.286, "lng": 36.821},
    {"name": "Mombasa Road, Industrial Area", "lat": -1.317, "lng": 36.851},
    {"name": "Nairobi-Nakuru Highway, Ruiru", "lat": -1.148, "lng": 37.008},
    {"name": "Thika Road, Kasarani", "lat": -1.221, "lng": 36.896},
    {"name": "Mombasa Port Road", "lat": -4.043, "lng": 39.668},
    {"name": "Nairobi Westlands", "lat": -1.265, "lng": 36.795},
    {"name": "Kisumu-Oduk Road", "lat": -0.102, "lng": 34.761},
    {"name": "Eldoret-Webuye Road", "lat": 0.514, "lng": 35.270},
    {"name": "Nairobi-Malindi Highway, Mombasa", "lat": -3.678, "lng": 39.849},
]

VEHICLE_TYPES = ["saloon", "pickup", "truck", "bus", "motorcycle", "matatu"]
KENYAN_PLATE_PREFIXES = ["K", "KAA", "KAB", "KAC", "KAQ", "KB", "KC", "KD", "KE", "KG", "KH", "KJ", "KK", "KL", "KM", "KN", "KO", "KR", "KS", "KT", "KU", "KW", "KX", "KY", "KZ"]

INCIDENT_TYPES = ["accident", "overspeeding", "hazard", "road_damage", "pothole", "broken_traffic_light", "flooding"]
INCIDENT_DESCRIPTIONS = {
    "accident": [
        "Multiple vehicle collision - immediate response needed",
        "Head-on collision reported on highway",
        "Vehicle overturned blocking lane",
        "Pedestrian hit and run incident",
        "School zone accident - children involved"
    ],
    "overspeeding": [
        "Vehicle traveling at excessive speed",
        "Racing observed on main road",
        "Speeding matatu with passengers",
        "Truck exceeding speed limit",
        "Motorcycle weaving through traffic"
    ],
    "hazard": [
        "Fallen tree blocking road",
        "Oil spill on highway",
        "Abandoned vehicle on road",
        "Construction zone unmarked",
        "Livestock on roadway"
    ],
    "road_damage": [
        "Large pothole causing accidents",
        "Road collapse near intersection",
        "Bridge damage reported",
        "Manhole cover missing",
        "Road erosion after heavy rain"
    ],
    "pothole": [
        "Multiple potholes on main road",
        "Pothole causing vehicle damage",
        "Road surface deteriorating",
        "Uneven road surface hazard"
    ],
    "broken_traffic_light": [
        "Traffic light not working",
        "Signal timing incorrect",
        "All lights flashing red",
        "Pedestrian light malfunction"
    ],
    "flooding": [
        "Road flooded after heavy rain",
        "Water accumulation dangerous",
        "Drainage blocked causing flooding"
    ]
}

DRIVER_NAMES = [
    ("John", "Ochieng"), ("Mary", "Wanjiku"), ("Peter", "Otieno"), ("Grace", "Akinyi"),
    ("James", "Mwangi"), ("Faith", "Njeri"), ("David", "Kimani"), ("Sarah", "Kariuki"),
    ("Michael", "Kiplagat"), ("Elizabeth", "Chebet"), ("Daniel", "Kosgei"), ("Ann", "Jepkosgei"),
    ("Joseph", "Lagat"), ("Rose", "Chepngetich"), ("Stephen", "Korir"), ("Maryanne", "Chemutai"),
]

FIRST_AID_SUPPLIES = ["First aid kit", "Stretcher", "Oxygen cylinder", "Defibrillator", "Wheelchair", "Blankets", "Water", "Flashlight"]


class SystemSimulator:
    def __init__(self, api_url: str):
        self.api_url = api_url
        self.session_count = 0
        self.stats = {
            "incidents_created": 0,
            "violations_created": 0,
            "vehicles_registered": 0,
            "drivers_registered": 0,
            "citizen_reports": 0,
            "alerts_generated": 0,
            "teams_dispatched": 0,
        }
    
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = f"[{timestamp}] {level}:"
        print(f"{prefix} {message}")
    
    async def create_incident(self, incident_type: str = None) -> dict:
        """Create a new incident"""
        incident_type = incident_type or random.choice(INCIDENT_TYPES)
        location = random.choice(KENYA_LOCATIONS)
        
        # Adjust location slightly for variety
        lat = location["lat"] + random.uniform(-0.01, 0.01)
        lng = location["lng"] + random.uniform(-0.01, 0.01)
        
        descriptions = INCIDENT_DESCRIPTIONS.get(incident_type, ["Generic incident"])
        description = random.choice(descriptions)
        
        data = {
            "title": f"{incident_type.replace('_', ' ').title()} - {location['name']}",
            "description": description,
            "incident_type": incident_type,
            "severity": random.choice(["low", "medium", "high", "critical"]),
            "location": location["name"],
            "latitude": lat,
            "longitude": lng
        }
        
        try:
            import requests
            response = requests.post(f"{self.api_url}/api/incidents", data=data, timeout=5)
            if response.status_code in [200, 201]:
                self.stats["incidents_created"] += 1
                return response.json()
        except Exception as e:
            self.log(f"Failed to create incident: {e}", "ERROR")
        return {}
    
    async def create_violation(self) -> dict:
        """Create a traffic violation"""
        location = random.choice(KENYA_LOCATIONS)
        prefix = random.choice(KENYAN_PLATE_PREFIXES)
        plate = f"{prefix}{random.randint(100, 999)}"
        speed_limit = random.choice([50, 60, 80, 100])
        speed_detected = speed_limit + random.randint(20, 60)
        
        data = {
            "violation_type": random.choice(["overspeeding", "red_light", "wrong_lane", "no_plate", "overloading"]),
            "vehicle_plate": plate,
            "speed_detected": speed_detected,
            "speed_limit": speed_limit,
            "location": location["name"],
            "latitude": location["lat"],
            "longitude": location["lng"]
        }
        
        try:
            import requests
            response = requests.post(f"{self.api_url}/api/violations", data=data, timeout=5)
            if response.status_code in [200, 201]:
                self.stats["violations_created"] += 1
                return response.json()
        except Exception as e:
            self.log(f"Failed to create violation: {e}", "ERROR")
        return {}
    
    async def register_vehicle(self) -> dict:
        """Register a new vehicle"""
        prefix = random.choice(KENYAN_PLATE_PREFIXES)
        plate = f"{prefix}{random.randint(100, 999)}"
        
        data = {
            "plate_number": plate,
            "vehicle_type": random.choice(VEHICLE_TYPES),
            "make": random.choice(["Toyota", "Nissan", "Mercedes", "BMW", "Honda", "Ford", "Hyundai", "Kia"]),
            "model": random.choice(["Corolla", "Civic", "Vitz", "Premio", "X-Trail", "C200", "3 Series", "Sportage"]),
            "year": random.randint(2015, 2024),
            "color": random.choice(["Silver", "White", "Black", "Blue", "Red", "Green", "Brown"]),
            "owner_name": f"{random.choice(['John', 'Mary', 'Peter', 'Grace', 'James'])} {random.choice(['Ochieng', 'Wanjiku', 'Otieno', 'Akinyi', 'Mwangi'])}"
        }
        
        try:
            import requests
            response = requests.post(f"{self.api_url}/api/vehicles", data=data, timeout=5)
            if response.status_code in [200, 201]:
                self.stats["vehicles_registered"] += 1
                return response.json()
        except Exception as e:
            self.log(f"Failed to register vehicle: {e}", "ERROR")
        return {}
    
    async def register_driver(self) -> dict:
        """Register a new driver"""
        first_name, last_name = random.choice(DRIVER_NAMES)
        
        data = {
            "license_number": f"DL{random.randint(100000, 999999)}",
            "first_name": first_name,
            "last_name": last_name,
            "phone": f"+254{random.randint(700000000, 799999999)}",
            "email": f"{first_name.lower()}.{last_name.lower()}@email.com",
            "date_of_birth": f"{random.randint(1970, 2000)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        }
        
        try:
            import requests
            response = requests.post(f"{self.api_url}/api/drivers", data=data, timeout=5)
            if response.status_code in [200, 201]:
                self.stats["drivers_registered"] += 1
                return response.json()
        except Exception as e:
            self.log(f"Failed to register driver: {e}", "ERROR")
        return {}
    
    async def create_citizen_report(self) -> dict:
        """Create a citizen report"""
        first_name, last_name = random.choice(DRIVER_NAMES)
        location = random.choice(KENYA_LOCATIONS)
        
        data = {
            "report_type": random.choice(INCIDENT_TYPES),
            "description": random.choice(INCIDENT_DESCRIPTIONS.get("accident", ["Report description"])),
            "location": location["name"],
            "latitude": location["lat"] + random.uniform(-0.01, 0.01),
            "longitude": location["lng"] + random.uniform(-0.01, 0.01),
            "first_name": first_name,
            "last_name": last_name,
            "phone_number": f"+254{random.randint(700000000, 799999999)}",
            "anonymous": random.choice([True, False]),
            "attachments": []
        }
        
        try:
            import requests
            response = requests.post(f"{self.api_url}/api/citizen/reports", json=data, timeout=5)
            if response.status_code in [200, 201]:
                self.stats["citizen_reports"] += 1
                return response.json()
        except Exception as e:
            self.log(f"Failed to create citizen report: {e}", "ERROR")
        return {}
    
    async def create_alert(self) -> dict:
        """Create an alert"""
        data = {
            "title": f"Alert: {random.choice(INCIDENT_TYPES).replace('_', ' ').title()}",
            "message": "Automated alert generated by system simulation",
            "severity": random.choice(["low", "medium", "high", "critical"]),
            "alert_type": random.choice(["road", "weather", "system", "emergency"]),
            "location": random.choice(KENYA_LOCATIONS)["name"]
        }
        
        try:
            import requests
            response = requests.post(f"{self.api_url}/api/alerts", json=data, timeout=5)
            if response.status_code in [200, 201]:
                self.stats["alerts_generated"] += 1
                return response.json()
        except Exception as e:
            self.log(f"Failed to create alert: {e}", "ERROR")
        return {}
    
    async def dispatch_team(self) -> dict:
        """Simulate team dispatch"""
        data = {
            "name": f"Response Team {random.randint(1, 20)}",
            "team_type": random.choice(["medical", "police", "fire", "rescue"]),
            "base": random.choice(KENYA_LOCATIONS)["name"],
            "members": random.randint(3, 8)
        }
        
        try:
            import requests
            response = requests.post(f"{self.api_url}/api/teams", data=data, timeout=5)
            if response.status_code in [200, 201]:
                self.stats["teams_dispatched"] += 1
                return response.json()
        except Exception as e:
            self.log(f"Failed to dispatch team: {e}", "ERROR")
        return {}
    
    async def get_system_stats(self) -> dict:
        """Get current system statistics"""
        try:
            import requests
            response = requests.get(f"{self.api_url}/api/dashboard/stats", timeout=5)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            self.log(f"Failed to get stats: {e}", "ERROR")
        return {}
    
    async def run_simulation(self, interval: int = 5, duration: int = 60):
        """Run the main simulation loop"""
        self.log(f"Starting Kenya Overwatch System Simulation")
        self.log(f"API URL: {self.api_url}")
        self.log(f"Interval: {interval}s, Duration: {duration}s")
        print("-" * 60)
        
        # Initial data population
        self.log("Creating initial data population...")
        
        # Create some vehicles
        for _ in range(5):
            await self.register_vehicle()
        
        # Create some drivers
        for _ in range(5):
            await self.register_driver()
        
        # Create some incidents
        for _ in range(3):
            await self.create_incident()
        
        # Create some citizen reports
        for _ in range(3):
            await self.create_citizen_report()
        
        # Create some alerts
        for _ in range(2):
            await self.create_alert()
        
        print("-" * 60)
        
        start_time = time.time()
        iteration = 0
        
        while time.time() - start_time < duration:
            iteration += 1
            self.log(f"\n--- Iteration {iteration} ---")
            
            # Random actions based on probability
            action = random.choices(
                ["incident", "violation", "citizen_report", "alert", "dispatch", "stats"],
                weights=[0.2, 0.25, 0.2, 0.15, 0.1, 0.1],
                k=1
            )[0]
            
            if action == "incident":
                await self.create_incident()
                self.log("Created new incident")
                
            elif action == "violation":
                await self.create_violation()
                self.log("Created traffic violation")
                
            elif action == "citizen_report":
                await self.create_citizen_report()
                self.log("Created citizen report")
                
            elif action == "alert":
                await self.create_alert()
                self.log("Generated alert")
                
            elif action == "dispatch":
                await self.dispatch_team()
                self.log("Dispatched response team")
                
            elif action == "stats":
                stats = await self.get_system_stats()
                self.log(f"System stats: {json.dumps(stats, indent=2)[:200]}...")
            
            # Print current stats
            print(f"\n📊 Current Statistics:")
            print(f"   Incidents: {self.stats['incidents_created']}")
            print(f"   Violations: {self.stats['violations_created']}")
            print(f"   Vehicles: {self.stats['vehicles_registered']}")
            print(f"   Drivers: {self.stats['drivers_registered']}")
            print(f"   Citizen Reports: {self.stats['citizen_reports']}")
            print(f"   Alerts: {self.stats['alerts_generated']}")
            print(f"   Teams: {self.stats['teams_dispatched']}")
            
            # Wait for next iteration
            await asyncio.sleep(interval)
        
        print("\n" + "=" * 60)
        self.log("Simulation completed!")
        self.log(f"Total statistics:")
        for key, value in self.stats.items():
            self.log(f"  {key}: {value}")
        print("=" * 60)


async def main():
    parser = argparse.ArgumentParser(description="Kenya Overwatch System Simulator")
    parser.add_argument("--api-url", default="http://localhost:8001", help="API base URL")
    parser.add_argument("--interval", type=int, default=5, help="Interval between actions (seconds)")
    parser.add_argument("--duration", type=int, default=60, help="Total duration (seconds)")
    
    args = parser.parse_args()
    
    simulator = SystemSimulator(args.api_url)
    await simulator.run_simulation(args.interval, args.duration)


if __name__ == "__main__":
    asyncio.run(main())
