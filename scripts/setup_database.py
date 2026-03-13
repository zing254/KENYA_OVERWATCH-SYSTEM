"""
Kenya Overwatch Database Setup Script
Creates all tables and seeds initial data
"""

import os
import sys
from datetime import datetime, timedelta, timezone
import uuid
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, SessionLocal, Base
from backend.database import User, Vehicle, Driver, Accident, Violation, Camera, Team, Alert
from backend.database_models import RoadSegment
from backend.enums import UserRole, UserStatus, VehicleType, SeverityLevel, IncidentStatus, ViolationStatus, AccidentType, CauseType
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

def seed_users():
    """Seed initial users"""
    print("Seeding users...")
    db = SessionLocal()
    
    users_data = [
        {"username": "admin", "email": "admin@ntsa.go.ke", "password": "Admin@123", "first_name": "System", "last_name": "Administrator", "role": "admin", "badge_number": "NTSA001", "station": "Headquarters"},
        {"username": "officer1", "email": "officer1@ntsa.go.ke", "password": "Officer@123", "first_name": "John", "last_name": "Doe", "role": "officer", "badge_number": "OFF001", "station": "Nairobi Central"},
        {"username": "dispatcher1", "email": "dispatcher1@ntsa.go.ke", "password": "Dispatch@123", "first_name": "Jane", "last_name": "Smith", "role": "dispatcher", "badge_number": "DSP001", "station": "Nairobi Central"},
        {"username": "viewer1", "email": "viewer1@ntsa.go.ke", "password": "Viewer@123", "first_name": "Bob", "last_name": "Wilson", "role": "viewer", "badge_number": None, "station": "Mombasa"},
    ]
    
    for user_data in users_data:
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing:
            user = User(
                id=str(uuid.uuid4())[:12],
                username=user_data["username"],
                email=user_data["email"],
                password_hash=pwd_context.hash(user_data["password"]),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                role=user_data["role"],
                badge_number=user_data["badge_number"],
                station=user_data["station"],
                status="active",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
    
    db.commit()
    db.close()
    print(f"Seeded {len(users_data)} users!")

def seed_vehicles():
    """Seed initial vehicles"""
    print("Seeding vehicles...")
    db = SessionLocal()
    
    vehicles_data = [
        {"plate_number": "KAA001A", "vehicle_type": "saloon", "make": "Toyota", "model": "Corolla", "year": 2020, "color": "Silver", "owner_name": "John Doe", "owner_id": "12345678", "insurance_status": "valid", "inspection_status": "valid"},
        {"plate_number": "KBB002B", "vehicle_type": "matatu", "make": "Toyota", "model": "Hiace", "year": 2019, "color": "White", "owner_name": "Jane Smith", "owner_id": "23456789", "insurance_status": "valid", "inspection_status": "valid"},
        {"plate_number": "KCC003C", "vehicle_type": "lorry", "make": "Isuzu", "model": "NPR", "year": 2018, "color": "Blue", "owner_name": "Transport Ltd", "owner_id": "34567890", "insurance_status": "valid", "inspection_status": "valid"},
        {"plate_number": "KDD004D", "vehicle_type": "bus", "make": "Mitsubishi", "model": "Rosa", "year": 2021, "color": "Yellow", "owner_name": "Bus Co", "owner_id": "45678901", "insurance_status": "expired", "inspection_status": "valid"},
        {"plate_number": "KEE005E", "vehicle_type": "motorcycle", "make": "Honda", "model": "CBR", "year": 2022, "color": "Red", "owner_name": "Mike Brown", "owner_id": "56789012", "insurance_status": "valid", "inspection_status": "valid"},
    ]
    
    for v_data in vehicles_data:
        existing = db.query(Vehicle).filter(Vehicle.plate_number == v_data["plate_number"]).first()
        if not existing:
            vehicle = Vehicle(
                id=str(uuid.uuid4())[:12],
                plate_number=v_data["plate_number"],
                vehicle_type=v_data["vehicle_type"],
                make=v_data["make"],
                model=v_data["model"],
                year=v_data["year"],
                color=v_data["color"],
                owner_name=v_data["owner_name"],
                owner_id=v_data["owner_id"],
                insurance_status=v_data["insurance_status"],
                inspection_status=v_data["inspection_status"],
                license_expiry=datetime.now(timezone.utc) + timedelta(days=365),
                license_category="B",
                points=12,
                violations_count=0,
                created_at=datetime.now(timezone.utc)
            )
            db.add(vehicle)
    
    db.commit()
    db.close()
    print(f"Seeded {len(vehicles_data)} vehicles!")

def seed_cameras():
    """Seed initial cameras"""
    print("Seeding cameras...")
    db = SessionLocal()
    
    cameras_data = [
        {"id": "CAM001", "name": "Mombasa Road Speed Cam", "location": "Mombasa Road Junction", "road_name": "Mombasa Road (A109)", "lat": -1.3300, "lng": 36.9800, "camera_type": "speed", "speed_limit": 100},
        {"id": "CAM002", "name": "Thika Road Speed Cam", "location": "Thika Superhighway", "road_name": "Thika Superhighway", "lat": -1.0800, "lng": 37.1000, "camera_type": "speed", "speed_limit": 80},
        {"id": "CAM003", "name": "CBD Red Light Cam", "location": "Kenyatta Avenue", "road_name": "Kenyatta Avenue", "lat": -1.2864, "lng": 36.8232, "camera_type": "red_light", "speed_limit": 50},
        {"id": "CAM004", "name": "Expressway ANPR", "location": "Nairobi Expressway", "road_name": "Nairobi Expressway", "lat": -1.3200, "lng": 36.8900, "camera_type": "ANPR", "speed_limit": 80},
        {"id": "CAM005", "name": "Nakuru Highway Cam", "location": "Nakuru Town", "road_name": "Nakuru-Eldoret Road", "lat": -0.3031, "lng": 36.0800, "camera_type": "surveillance", "speed_limit": 100},
    ]
    
    for c_data in cameras_data:
        existing = db.query(Camera).filter(Camera.id == c_data["id"]).first()
        if not existing:
            camera = Camera(
                id=c_data["id"],
                name=c_data["name"],
                location=c_data["location"],
                road_name=c_data["road_name"],
                latitude=c_data["lat"],
                longitude=c_data["lng"],
                camera_type=c_data["camera_type"],
                status="online",
                speed_limit=c_data["speed_limit"],
                is_recording=True,
                last_update=datetime.now(timezone.utc)
            )
            db.add(camera)
    
    db.commit()
    db.close()
    print(f"Seeded {len(cameras_data)} cameras!")

def seed_teams():
    """Seed initial response teams"""
    print("Seeding teams...")
    db = SessionLocal()
    
    teams_data = [
        {"id": "TEAM001", "name": "Nairobi Response Unit 1", "team_type": "police", "base_location": "Nairobi Central", "members": 4, "lat": -1.2921, "lng": 36.8219, "phone": "+254700000001"},
        {"id": "TEAM002", "name": "Ambulance Unit 1", "team_type": "ambulance", "base_location": "Nairobi Central", "members": 2, "lat": -1.2921, "lng": 36.8219, "phone": "+254700000002"},
        {"id": "TEAM003", "name": "Fire Unit 1", "team_type": "fire", "base_location": "Industrial Area", "members": 6, "lat": -1.3100, "lng": 36.8500, "phone": "+254700000003"},
        {"id": "TEAM004", "name": "Mombasa Response Unit", "team_type": "police", "base_location": "Mombasa Central", "members": 4, "lat": -4.0435, "lng": 39.6682, "phone": "+254700000004"},
        {"id": "TEAM005", "name": "Nakuru Response Unit", "team_type": "traffic", "base_location": "Nakuru Town", "members": 3, "lat": -0.3031, "lng": 36.0800, "phone": "+254700000005"},
    ]
    
    for t_data in teams_data:
        existing = db.query(Team).filter(Team.id == t_data["id"]).first()
        if not existing:
            team = Team(
                id=t_data["id"],
                name=t_data["name"],
                team_type=t_data["team_type"],
                status="available",
                base_location=t_data["base_location"],
                members=t_data["members"],
                latitude=t_data["lat"],
                longitude=t_data["lng"],
                phone=t_data["phone"]
            )
            db.add(team)
    
    db.commit()
    db.close()
    print(f"Seeded {len(teams_data)} teams!")

def seed_road_segments():
    """Seed road segments"""
    print("Seeding road segments...")
    db = SessionLocal()
    
    roads_data = [
        {"name": "Mombasa Road (A109)", "category": "highway", "limit": 100, "start_lat": -1.3300, "start_lng": 36.9800, "end_lat": -1.4500, "end_lng": 37.0500, "traffic": 15000},
        {"name": "Nairobi Expressway", "category": "highway", "limit": 80, "start_lat": -1.3200, "start_lng": 36.8300, "end_lat": -1.2700, "end_lng": 36.9200, "traffic": 25000},
        {"name": "Thika Superhighway", "category": "highway", "limit": 80, "start_lat": -1.0334, "start_lng": 37.0692, "end_lat": -1.1500, "end_lng": 37.2000, "traffic": 18000},
        {"name": "Kenyatta Avenue", "category": "urban", "limit": 50, "start_lat": -1.2921, "start_lng": 36.8219, "end_lat": -1.2864, "end_lng": 36.8232, "traffic": 8000},
        {"name": "Ngong Road", "category": "arterial", "limit": 60, "start_lat": -1.2931, "start_lng": 36.8219, "end_lat": -1.3267, "end_lng": 36.7850, "traffic": 12000},
    ]
    
    for r_data in roads_data:
        existing = db.query(RoadSegment).filter(RoadSegment.name == r_data["name"]).first()
        if not existing:
            segment = RoadSegment(
                id=str(uuid.uuid4())[:12],
                name=r_data["name"],
                category=r_data["category"],
                speed_limit=r_data["limit"],
                start_latitude=r_data["start_lat"],
                start_longitude=r_data["start_lng"],
                end_latitude=r_data["end_lat"],
                end_longitude=r_data["end_lng"],
                average_daily_traffic=r_data["traffic"],
                accidents_30d=random.randint(5, 30),
                accidents_90d=random.randint(15, 60),
                risk_level=random.choice(["low", "medium", "high"]),
                risk_score=round(random.uniform(0.3, 0.9), 2)
            )
            db.add(segment)
    
    db.commit()
    db.close()
    print(f"Seeded {len(roads_data)} road segments!")

def seed_alerts():
    """Seed sample alerts"""
    print("Seeding alerts...")
    db = SessionLocal()
    
    alerts_data = [
        {"title": "High Speed Detected", "message": "Vehicle KAA001A detected at 120 km/h on Mombasa Road", "severity": "high", "alert_type": "speeding", "location": "Mombasa Road Junction"},
        {"title": "Accident Reported", "message": "Rear-end collision reported on Thika Superhighway", "severity": "critical", "alert_type": "accident", "location": "Thika Road"},
        {"title": "Red Light Violation", "message": "Vehicle KBB002B ran red light at CBD intersection", "severity": "medium", "alert_type": "red_light", "location": "Kenyatta Avenue"},
    ]
    
    for a_data in alerts_data:
        alert = Alert(
            id=str(uuid.uuid4())[:12],
            title=a_data["title"],
            message=a_data["message"],
            severity=a_data["severity"],
            alert_type=a_data["alert_type"],
            location=a_data["location"],
            status="new",
            created_at=datetime.now(timezone.utc)
        )
        db.add(alert)
    
    db.commit()
    db.close()
    print(f"Seeded {len(alerts_data)} alerts!")

def run_full_setup():
    """Run complete database setup"""
    print("=" * 50)
    print("Kenya Overwatch Database Setup")
    print("=" * 50)
    
    create_tables()
    seed_users()
    seed_vehicles()
    seed_cameras()
    seed_teams()
    seed_road_segments()
    seed_alerts()
    
    print("=" * 50)
    print("Database setup complete!")
    print("=" * 50)
    print("\nDefault users:")
    print("  admin / Admin@123 (Admin)")
    print("  officer1 / Officer@123 (Officer)")
    print("  dispatcher1 / Dispatch@123 (Dispatcher)")
    print("  viewer1 / Viewer@123 (Viewer)")

if __name__ == "__main__":
    run_full_setup()
