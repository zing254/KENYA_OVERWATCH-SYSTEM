#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DATABASE_URL = "sqlite:///./kenya_overwatch.db"

ACCOUNTS = {
    "control_center": [
        {"username": "admin", "email": "admin@kenyaoverwatch.go.ke", "password": "Admin@2024!", "role": "admin"},
        {"username": "supervisor", "email": "supervisor@kenyaoverwatch.go.ke", "password": "Super@2024!", "role": "supervisor"},
        {"username": "operator", "email": "operator@kenyaoverwatch.go.ke", "password": "Oper@2024!", "role": "operator"},
        {"username": "analyst", "email": "analyst@kenyaoverwatch.go.ke", "password": "Analyst@2024!", "role": "analyst"},
    ],
    "response_teams": [
        {"username": "TP-TEAM-A", "email": "tp.team.a@kenyaoverwatch.go.ke", "password": "Traffic@2024!", "role": "responder", "team_data": {"name": "Traffic Police Alpha", "type": "police", "contact": "+254700001001", "members": 8, "location": "Nairobi CBD"}},
        {"username": "TP-TEAM-B", "email": "tp.team.b@kenyaoverwatch.go.ke", "password": "Traffic@2024!", "role": "responder", "team_data": {"name": "Traffic Police Bravo", "type": "police", "contact": "+254700001002", "members": 8, "location": "Westlands"}},
        {"username": "RR-TEAM-A", "email": "rr.team.a@kenyaoverwatch.go.ke", "password": "Rapid@2024!", "role": "responder", "team_data": {"name": "Rapid Response Unit", "type": "police", "contact": "+254700002001", "members": 12, "location": "Kilimani"}},
        {"username": "ME-TEAM-A", "email": "me.team.a@kenyaoverwatch.go.ke", "password": "Medical@2024!", "role": "responder", "team_data": {"name": "Medical Emergency Response", "type": "medical", "contact": "+254700003001", "members": 6, "location": "Kenyatta Hospital"}},
        {"username": "FD-TEAM-A", "email": "fd.team.a@kenyaoverwatch.go.ke", "password": "Fire@2024!", "role": "responder", "team_data": {"name": "Fire Department Unit", "type": "fire", "contact": "+254700004001", "members": 10, "location": "Industrial Area"}},
        {"username": "SG-TEAM-A", "email": "sg.team.a@kenyaoverwatch.go.ke", "password": "Security@2024!", "role": "responder", "team_data": {"name": "Private Security Team", "type": "security", "contact": "+254700005001", "members": 4, "location": "Gigiri"}},
        {"username": "KPS-TEAM-A", "email": "kps.team.a@kenyaoverwatch.go.ke", "password": "Kps@2024!", "role": "responder", "team_data": {"name": "Kenya Police Service Command", "type": "police", "contact": "+254700006001", "members": 20, "location": "Police HQ"}},
        {"username": "CW-TEAM-A", "email": "cw.team.a@kenyaoverwatch.go.ke", "password": "Watch@2024!", "role": "responder", "team_data": {"name": "Community Watch Group", "type": "security", "contact": "+254700007001", "members": 15, "location": "Kasarani"}},
    ],
    "citizens": [
        {"email": "john.doe@gmail.com", "password": "Citizen@2024!", "name": "John Doe", "phone": "+254700111222", "google_id": "google_john_123", "vehicles": [{"plate": "KAA 001A", "make": "Toyota", "model": "Corolla", "color": "Silver", "year": 2020}]},
        {"email": "jane.smith@gmail.com", "password": "Citizen@2024!", "name": "Jane Smith", "phone": "+254700333444", "google_id": "google_jane_456", "vehicles": [{"plate": "KBB 002B", "make": "Honda", "model": "Civic", "color": "Blue", "year": 2022}]},
        {"email": "mike.johnson@gmail.com", "password": "Citizen@2024!", "name": "Mike Johnson", "phone": "+254700555666", "google_id": "google_mike_789", "vehicles": [{"plate": "KDD 004D", "make": "Mercedes", "model": "E-Class", "color": "Black", "year": 2023}]},
    ]
}

def setup_user_accounts():
    from app.models.database import Base, User, ResponseTeam, Citizen, CitizenVehicle
    db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'kenya_overwatch.db')
    engine = create_engine(f'sqlite:///{db_path}')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    print("\n" + "="*60)
    print("KENYA OVERWATCH - ACCOUNT SETUP")
    print("="*60 + "\n")
    
    for user_data in ACCOUNTS["control_center"]:
        existing = session.query(User).filter_by(username=user_data["username"]).first()
        if not existing:
            new_user = User(
                id=uuid.uuid4(),
                username=user_data["username"],
                email=user_data["email"],
                password_hash=pwd_context.hash(user_data["password"]),
                role=user_data["role"],
                permissions={"all": True} if user_data["role"] == "admin" else {"read": True},
                active=True
            )
            session.add(new_user)
            print(f"  ✓ Created: {user_data['username']} ({user_data['role']})")
        else:
            print(f"  - Already exists: {user_data['username']}")
    
    for team_data in ACCOUNTS["response_teams"]:
        existing = session.query(User).filter_by(username=team_data["username"]).first()
        if not existing:
            new_user = User(
                id=uuid.uuid4(),
                username=team_data["username"],
                email=team_data["email"],
                password_hash=pwd_context.hash(team_data["password"]),
                role=team_data["role"],
                permissions={"dispatch": True, "respond": True},
                active=True
            )
            session.add(new_user)
            session.flush()
            team = ResponseTeam(
                id=uuid.uuid4(),
                name=team_data["team_data"]["name"],
                type=team_data["team_data"]["type"],
                contact=team_data["team_data"]["contact"],
                members=team_data["team_data"]["members"],
                location=team_data["team_data"]["location"],
                status="available",
                equipment={"radio": True, "vehicle": True}
            )
            session.add(team)
            print(f"  ✓ Created: {team_data['username']} - {team_data['team_data']['name']}")
    
    for citizen_data in ACCOUNTS["citizens"]:
        existing = session.query(Citizen).filter_by(email=citizen_data["email"]).first()
        if not existing:
            citizen = Citizen(
                id=uuid.uuid4(),
                google_id=citizen_data.get("google_id"),
                email=citizen_data["email"],
                name=citizen_data["name"],
                phone=citizen_data.get("phone"),
                notifications_enabled=True,
                email_verified=True
            )
            session.add(citizen)
            session.flush()
            for v in citizen_data.get("vehicles", []):
                vehicle = CitizenVehicle(
                    id=uuid.uuid4(),
                    citizen_id=citizen.id,
                    plate_number=v["plate"],
                    make=v["make"],
                    model=v["model"],
                    color=v["color"],
                    year=v.get("year"),
                    notifications_enabled=True
                )
                session.add(vehicle)
            print(f"  ✓ Created: {citizen_data['email']}")
    
    session.commit()
    print("\n" + "="*60)
    print("ACCOUNT SETUP COMPLETE")
    print("="*60)
    print("\n--- CONTROL CENTER ---")
    for u in ACCOUNTS["control_center"]:
        print(f"  {u['role'].upper()}: {u['username']} / {u['password']}")
    print("\n--- RESPONSE TEAMS ---")
    for t in ACCOUNTS["response_teams"]:
        print(f"  {t['username']} / {t['password']}")
    print("\n--- CITIZENS ---")
    for c in ACCOUNTS["citizens"]:
        print(f"  {c['email']} / {c['password']}")
    print("="*60)
    session.close()

if __name__ == "__main__":
    setup_user_accounts()
