#!/usr/bin/env python3
"""
Kenya Overwatch - Full System Simulation Script
Simulates complete system capabilities with mock data, incidents, actions, and responses
"""

import asyncio
import random
import uuid
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
import sys
import os


class KenyaOverwatchSimulator:
    """Complete system simulator for Kenya Overwatch"""
    
    def __init__(self, speed_multiplier: int = 1):
        self.speed_multiplier = speed_multiplier
        self.running = False
        self.incidents = []
        self.vehicles = []
        self.cameras = []
        self.teams = []
        self.alerts = []
        
        self.kenyan_roads = [
            "Kenyatta Avenue", "Moi Avenue", "University Road", "Ngong Road",
            "Nairobi Road", "Mombasa Road", "Kiserian Road", "Kiambu Road",
            "Nakuru Road", "Eldoret Road", "Kisumu Road", "Mombasa Road",
            "Industrial Area", "Westlands", "Kilimani", "Karen", "Runda",
            "Gigiri", "Kileleshwa", "Lavington", "Eastleigh", "Kasarani"
        ]
        
        self.vehicle_models = {
            "saloon": ["Toyota Corolla", "Honda Civic", "Nissan Altima", "Mercedes E-Class", "BMW 3 Series"],
            "suv": ["Toyota Land Cruiser", "Toyota Prado", "Range Rover", "Lexus LX", "Ford Explorer"],
            "truck": ["Isuzu NPR", "Hino FC", "Fuso Canter", "Mercedes Actros"],
            "lorry": ["Scania R500", "Volvo FH", "MAN TGX", "DAF XF"],
            "trailer": ["Freightliner Cascadia", "Kenworth T680", "Peterbilt 579"],
            "bike": ["Yamaha DT", "Honda XR", "KTM Duke", "Bajaj Boxer"],
            "matatu": ["Toyota Hiace", "Nissan Urvan", "Ford Transit"]
        }
        
        self.offense_types = [
            "Speeding", "Red Light Violation", "Illegal Parking", "Wrong Way Driving",
            "No Helmet", "Overloading", "Driving Without License", "Expired Insurance",
            "Number Plate Violation", "Using Phone While Driving", "Dangerous Overtaking"
        ]
        
        self.kenyan_plates = [
            "KAA", "KAB", "KAC", "KAD", "KAE", "KAF", "KAG", "KAH", "KAI", "KAJ",
            "KBA", "KBB", "KBC", "KBD", "KBE", "KBF", "KBG", "KBH", "KBI", "KBJ",
            "KCA", "KCB", "KCC", "KCD", "KCE", "KCF", "KCG", "KCH", "KCI", "KCJ"
        ]
        
    def generate_kenyan_plate(self) -> str:
        """Generate a realistic Kenyan license plate"""
        prefix = random.choice(self.kenyan_plates)
        number = random.randint(100, 999)
        suffix = random.choice(["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"])
        return f"{prefix} {number}{suffix}"
    
    def generate_vehicle(self) -> Dict[str, Any]:
        """Generate a mock vehicle"""
        vehicle_type = random.choice(list(self.vehicle_models.keys()))
        model = random.choice(self.vehicle_models[vehicle_type])
        
        colors = ["White", "Black", "Silver", "Blue", "Red", "Green", "Brown", "Grey"]
        
        return {
            "id": str(uuid.uuid4()),
            "plate": self.generate_kenyan_plate(),
            "make": model.split()[0],
            "model": " ".join(model.split()[1:]) if len(model.split()) > 1 else "",
            "type": vehicle_type,
            "color": random.choice(colors),
            "speed": random.randint(40, 120) if vehicle_type != "bike" else random.randint(30, 80),
            "direction": random.choice(["N", "S", "E", "W"]),
            "lane": random.randint(1, 4)
        }
    
    def generate_camera(self) -> Dict[str, Any]:
        """Generate a mock camera"""
        base_lat = -1.2921  # Nairobi
        base_lon = 36.8219
        
        return {
            "id": f"CAM-{random.randint(100, 999)}",
            "name": f"Camera {random.choice(self.kenyan_roads)}",
            "location": random.choice(self.kenyan_roads),
            "latitude": base_lat + random.uniform(-0.05, 0.05),
            "longitude": base_lon + random.uniform(-0.05, 0.05),
            "status": random.choice(["online", "online", "online", "offline"]),
            "type": random.choice(["fixed", "ptz", "mobile-test", "speed", "traffic"]),
            "detections_today": random.randint(0, 500)
        }
    
    def generate_incident(self) -> Dict[str, Any]:
        """Generate a mock incident"""
        base_lat = -1.2921
        base_lon = 36.8219
        
        severity = random.choices(
            ["low", "medium", "high", "critical"],
            weights=[40, 30, 20, 10]
        )[0]
        
        offense = random.choice(self.offense_types)
        
        return {
            "id": f"INC-{uuid.uuid4().hex[:8].upper()}",
            "type": "traffic_violation" if random.random() > 0.3 else random.choice(["theft", "accident", "suspicious"]),
            "title": f"{offense} Detected",
            "description": f"{offense} at {random.choice(self.kenyan_roads)}",
            "location": random.choice(self.kenyan_roads),
            "latitude": base_lat + random.uniform(-0.05, 0.05),
            "longitude": base_lon + random.uniform(-0.05, 0.05),
            "severity": severity,
            "status": random.choice(["active", "responding", "resolved"]),
            "risk_score": random.uniform(0.1, 0.95),
            "vehicle": self.generate_vehicle() if random.random() > 0.3 else None,
            "timestamp": datetime.utcnow().isoformat(),
            "camera_id": f"CAM-{random.randint(100, 999)}",
            "evidence": {
                "has_photo": random.random() > 0.2,
                "has_video": random.random() > 0.5,
                "confidence": random.uniform(0.7, 0.99)
            }
        }
    
    def generate_team(self) -> Dict[str, Any]:
        """Generate a mock response team"""
        base_lat = -1.2921
        base_lon = 36.8219
        
        team_types = [
            ("Traffic Police", "TP", "police"),
            ("Rapid Response", "RR", "police"),
            ("Medical Emergency", "ME", "medical"),
            ("Fire Department", "FD", "fire"),
            ("Security", "SG", "security")
        ]
        
        name, abbrev, team_type = random.choice(team_types)
        
        return {
            "id": str(uuid.uuid4()),
            "name": f"{name} {abbrev}-{random.randint(1, 5)}",
            "type": team_type,
            "status": random.choice(["available", "deployed", "en_route", "on_scene"]),
            "latitude": base_lat + random.uniform(-0.03, 0.03),
            "longitude": base_lon + random.uniform(-0.03, 0.03),
            "contact": f"+2547{random.randint(0, 9)}{random.randint(10000000, 99999999)}",
            "members": random.randint(2, 10),
            "eta_minutes": random.randint(1, 30) if random.random() > 0.3 else None,
            "current_incident": f"INC-{uuid.uuid4().hex[:8].upper()}" if random.random() > 0.5 else None
        }
    
    def generate_alert(self) -> Dict[str, Any]:
        """Generate a mock alert"""
        severity = random.choice(["low", "medium", "high", "critical"])
        
        alert_types = [
            "new_incident",
            "vehicle_of_interest",
            "speed_violation",
            "traffic_jam",
            "weather_alert",
            "camera_offline",
            "team_dispatched",
            "emergency"
        ]
        
        return {
            "id": str(uuid.uuid4()),
            "type": random.choice(alert_types),
            "title": random.choice([
                "Traffic Violation Detected",
                "Vehicle of Interest Spotted",
                "Speed Alert",
                "Emergency Reported",
                "Camera Malfunction",
                "Team Deployed"
            ]),
            "message": f"Incident reported at {random.choice(self.kenyan_roads)}",
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
            "acknowledged": random.random() > 0.7,
            "location": random.choice(self.kenyan_roads)
        }
    
    async def simulate_detection(self):
        """Simulate vehicle detection at camera"""
        vehicle = self.generate_vehicle()
        camera = random.choice(self.cameras) if self.cameras else self.generate_camera()
        
        detection = {
            "id": str(uuid.uuid4()),
            "type": "vehicle",
            "vehicle": vehicle,
            "camera_id": camera["id"],
            "location": camera["location"],
            "latitude": camera["latitude"],
            "longitude": camera["longitude"],
            "timestamp": datetime.utcnow().isoformat(),
            "confidence": random.uniform(0.85, 0.99),
            "speed": vehicle["speed"],
            "offense": random.choice([None, None] + self.offense_types)
        }
        
        return detection
    
    async def simulate_incident_creation(self):
        """Simulate new incident creation"""
        incident = self.generate_incident()
        self.incidents.append(incident)
        
        alert = self.generate_alert()
        alert["incident_id"] = incident["id"]
        self.alerts.append(alert)
        
        return incident, alert
    
    async def simulate_team_dispatch(self, incident: Dict[str, Any]):
        """Simulate team being dispatched to incident"""
        available_teams = [t for t in self.teams if t["status"] == "available"]
        
        if available_teams:
            team = random.choice(available_teams)
            team["status"] = "en_route"
            team["current_incident"] = incident["id"]
            team["eta_minutes"] = random.randint(2, 15)
            
            return team
        
        return None
    
    async def simulate_team_movement(self, team: Dict[str, Any]):
        """Simulate team movement on map"""
        if team["status"] in ["en_route", "on_scene"]:
            team["latitude"] += random.uniform(-0.001, 0.001)
            team["longitude"] += random.uniform(-0.001, 0.001)
            
            if team["eta_minutes"]:
                team["eta_minutes"] = max(1, team["eta_minutes"] - 1)
            
            if team.get("eta_minutes") == 1 and team["status"] == "en_route":
                team["status"] = "on_scene"
        
        return team
    
    async def simulate_full_scenario(self):
        """Run a complete simulation scenario"""
        print("\n" + "="*60)
        print("🇰🇪 KENYA OVERWATCH - SYSTEM SIMULATION")
        print("="*60)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Speed: {self.speed_multiplier}x")
        print("="*60 + "\n")
        
        self.running = True
        
        print("📹 Initializing cameras...")
        for i in range(8):
            camera = self.generate_camera()
            self.cameras.append(camera)
            print(f"  ✓ {camera['id']}: {camera['name']} ({camera['status']})")
        
        print("\n🚨 Initializing response teams...")
        for i in range(6):
            team = self.generate_team()
            self.teams.append(team)
            print(f"  ✓ {team['name']}: {team['status']}")
        
        print("\n" + "-"*60)
        print("🎬 STARTING SIMULATION SCENARIOS")
        print("-"*60 + "\n")
        
        scenario_count = 0
        
        while self.running and scenario_count < 50:
            scenario_count += 1
            
            scenario = random.choice([
                "detection_only",
                "minor_incident", 
                "major_incident",
                "vehicle_of_interest",
                "multi_vehicle_accident"
            ])
            
            print(f"\n📍 SCENARIO {scenario_count}: {scenario.upper()}")
            print("-"*40)
            
            if scenario == "detection_only":
                detection = await self.simulate_detection()
                print(f"  📷 Camera: {detection['camera_id']}")
                print(f"  🚗 Vehicle: {detection['vehicle']['plate']} ({detection['vehicle']['make']} {detection['vehicle']['model']})")
                print(f"  ⚡ Speed: {detection['vehicle']['speed']} km/h")
                print(f"  📍 Location: {detection['location']}")
                if detection['offense']:
                    print(f"  ⚠️  Offense: {detection['offense']}")
                print(f"  ✅ Detection confidence: {detection['confidence']:.1%}")
                
            elif scenario == "minor_incident":
                incident, alert = await self.simulate_incident_creation()
                print(f"  🚨 Incident: {incident['title']}")
                print(f"  📍 Location: {incident['location']}")
                print(f"  ⚠️  Severity: {incident['severity']}")
                print(f"  📊 Risk Score: {incident['risk_score']:.2f}")
                print(f"  🔔 Alert Generated: {alert['type']}")
                
                if incident['vehicle']:
                    print(f"  🚗 Vehicle: {incident['vehicle']['plate']}")
                
                team = await self.simulate_team_dispatch(incident)
                if team:
                    print(f"  👮 Team Dispatched: {team['name']}")
                    print(f"  ⏱️  ETA: {team['eta_minutes']} minutes")
                    
            elif scenario == "major_incident":
                incident, alert = await self.simulate_incident_creation()
                incident['severity'] = 'critical'
                incident['risk_score'] = random.uniform(0.85, 0.99)
                
                print(f"  🚨 CRITICAL INCIDENT: {incident['title']}")
                print(f"  📍 Location: {incident['location']}")
                print(f"  🔴 Severity: CRITICAL")
                print(f"  📊 Risk Score: {incident['risk_score']:.2f}")
                print(f"  ⚠️  IMMEDIATE RESPONSE REQUIRED")
                
                for _ in range(2):
                    team = await self.simulate_team_dispatch(incident)
                    if team:
                        print(f"  👮 Team Dispatched: {team['name']}")
                        print(f"  ⏱️  ETA: {team['eta_minutes']} minutes")
                
            elif scenario == "vehicle_of_interest":
                flagged_plate = self.generate_kenyan_plate()
                print(f"  🔴 FLAGGED VEHICLE ALERT")
                print(f"  🚗 Plate: {flagged_plate}")
                print(f"  📍 Last seen: {random.choice(self.kenyan_roads)}")
                print(f"  ⚠️  Priority: HIGH")
                print(f"  👀 RE-IDENTIFICATION IN PROGRESS...")
                
                for i in range(3):
                    detection = await self.simulate_detection()
                    detection['vehicle']['plate'] = flagged_plate
                    print(f"    [{i+1}] Detected at {detection['camera_id']} - {detection['location']}")
                
                team = random.choice(self.teams)
                team['status'] = 'en_route'
                print(f"  👮 Nearest Team Dispatched: {team['name']}")
                
            elif scenario == "multi_vehicle_accident":
                print(f"  🚨 MULTI-VEHICLE ACCIDENT")
                print(f"  📍 Location: {random.choice(self.kenyan_roads)}")
                print(f"  🚗 Vehicles involved: {random.randint(2, 5)}")
                print(f"  👥 Injuries reported: {random.choice(['Yes', 'Unknown', 'No'])}")
                print(f"  🚑 Medical team dispatched")
                print(f"  🚓 Traffic police dispatched")
                print(f"  🚒 Fire department on standby")
            
            await asyncio.sleep(2 / self.speed_multiplier)
        
        print("\n" + "="*60)
        print("📊 SIMULATION SUMMARY")
        print("="*60)
        print(f"  Total Incidents: {len(self.incidents)}")
        print(f"  Total Alerts: {len(self.alerts)}")
        print(f"  Active Teams: {len([t for t in self.teams if t['status'] != 'available'])}")
        print(f"  Cameras Online: {len([c for c in self.cameras if c['status'] == 'online'])}")
        print("="*60)
        print("\n✅ Simulation Complete!")
    
    async def demo_mode(self):
        """Demo mode - quick overview of all features"""
        print("\n" + "="*60)
        print("🇰🇪 KENYA OVERWATCH - SYSTEM DEMO")
        print("="*60)
        
        print("\n📊 Loading analytics...")
        analytics = {
            "total_incidents_today": random.randint(50, 200),
            "active_incidents": random.randint(5, 20),
            "resolved_today": random.randint(30, 100),
            "camera_uptime": f"{random.uniform(95, 99.9):.1f}%",
            "avg_response_time": f"{random.uniform(3, 15):.1f} min",
            "teams_on_duty": random.randint(8, 15),
            "alerts_generated": random.randint(20, 100)
        }
        
        for key, value in analytics.items():
            print(f"  {key.replace('_', ' ').title()}: {value}")
        
        print("\n🚗 Top Offending Vehicle Types:")
        vehicle_stats = [
            ("Matatus", random.randint(20, 40)),
            ("Saloon Cars", random.randint(15, 35)),
            ("Motorcycles", random.randint(10, 25)),
            ("Trucks", random.randint(8, 20)),
            ("SUVs", random.randint(5, 15)),
        ]
        for vehicle, percent in vehicle_stats:
            bar = "█" * (percent // 5)
            print(f"  {vehicle:15} {bar} {percent}%")
        
        print("\n📍 Top Offense Locations:")
        for i, road in enumerate(random.sample(self.kenyan_roads, 5), 1):
            incidents = random.randint(5, 30)
            print(f"  {i}. {road}: {incidents} incidents")
        
        print("\n👥 Active Response Teams:")
        for team in self.teams[:6]:
            status_icon = "🟢" if team['status'] == 'available' else "🟡" if team['status'] == 'en_route' else "🔴"
            print(f"  {status_icon} {team['name']}: {team['status']}")
        
        print("\n" + "="*60)
        print("Demo complete! Run full simulation with: python scripts/simulation.py --full")
        print("="*60 + "\n")


async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Kenya Overwatch Simulation")
    parser.add_argument("--full", action="store_true", help="Run full simulation")
    parser.add_argument("--demo", action="store_true", help="Run demo mode")
    parser.add_argument("--speed", type=int, default=1, help="Speed multiplier")
    parser.add_argument("--scenarios", type=int, default=50, help="Number of scenarios")
    
    args = parser.parse_args()
    
    simulator = KenyaOverwatchSimulator(speed_multiplier=args.speed)
    
    for _ in range(8):
        simulator.cameras.append(simulator.generate_camera())
    
    for _ in range(6):
        simulator.teams.append(simulator.generate_team())
    
    if args.demo:
        await simulator.demo_mode()
    elif args.full:
        await simulator.simulate_full_scenario()
    else:
        print("Kenya Overwatch Simulation")
        print("Usage:")
        print("  python simulation.py --demo      # Quick demo")
        print("  python simulation.py --full     # Full simulation")
        print("  python simulation.py --full --speed 5  # Fast simulation")


if __name__ == "__main__":
    asyncio.run(main())
