#!/usr/bin/env python3
"""
Kenya Overwatch - Simple Mock API Server
Provides mock data for frontend development
"""
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import random
from datetime import datetime

app = FastAPI(title="Kenya Overwatch API")

# Mock data generators
def generate_incidents(count=10):
    roads = ["Kenyatta Avenue", "Mombasa Road", "Ngong Road", "University Road", "Westlands", "Kilimani"]
    types = ["traffic_violation", "theft", "accident", "suspicious_activity"]
    severities = ["low", "medium", "high", "critical"]
    statuses = ["active", "responding", "resolved"]
    
    incidents = []
    for i in range(count):
        incidents.append({
            "id": f"INC-{random.randint(1000, 9999)}",
            "type": random.choice(types),
            "title": f"Incident at {random.choice(roads)}",
            "location": random.choice(roads),
            "latitude": -1.2921 + random.uniform(-0.05, 0.05),
            "longitude": 36.8219 + random.uniform(-0.05, 0.05),
            "severity": random.choice(severities),
            "status": random.choice(statuses),
            "risk_score": round(random.uniform(0.1, 0.95), 2),
            "created_at": datetime.utcnow().isoformat(),
            "vehicle": {
                "plate": f"KAA {random.randint(100, 999)}{chr(65 + random.randint(0, 7))}",
                "make": random.choice(["Toyota", "Honda", "Nissan", "Mercedes", "BMW"]),
                "model": random.choice(["Corolla", "Civic", "Prado", "E-Class"]),
                "color": random.choice(["White", "Black", "Silver", "Blue", "Red"])
            } if random.random() > 0.3 else None
        })
    return incidents

def generate_cameras(count=8):
    cameras = []
    for i in range(count):
        cameras.append({
            "id": f"CAM-{random.randint(100, 999)}",
            "name": f"Camera {random.choice(['Nairobi Road', 'Westlands', 'Kilimani', 'Mombasa Road'])}",
            "location": random.choice(["Nairobi Road", "Westlands", "Kilimani", "Mombasa Road"]),
            "latitude": -1.2921 + random.uniform(-0.05, 0.05),
            "longitude": 36.8219 + random.uniform(-0.05, 0.05),
            "status": random.choice(["online", "online", "online", "offline"]),
            "type": random.choice(["fixed", "ptz", "speed"]),
            "detections_today": random.randint(0, 500)
        })
    return cameras

def generate_teams(count=8):
    teams = []
    types = [
        ("Traffic Police", "TP"),
        ("Rapid Response", "RR"),
        ("Medical Emergency", "ME"),
        ("Fire Department", "FD"),
        ("Security", "SG")
    ]
    statuses = ["available", "deployed", "en_route", "on_scene"]
    
    for i in range(count):
        name, abbrev = random.choice(types)
        teams.append({
            "id": str(random.randint(1, 100)),
            "name": f"{name} {abbrev}-{random.randint(1, 5)}",
            "type": abbrev.lower(),
            "status": random.choice(statuses),
            "latitude": -1.2921 + random.uniform(-0.03, 0.03),
            "longitude": 36.8219 + random.uniform(-0.03, 0.03),
            "members": random.randint(2, 10),
            "eta_minutes": random.randint(1, 30) if random.random() > 0.5 else None
        })
    return teams

def generate_alerts(count=5):
    alerts = []
    types = ["new_incident", "vehicle_of_interest", "speed_violation", "emergency"]
    severities = ["low", "medium", "high", "critical"]
    
    for i in range(count):
        alerts.append({
            "id": str(random.randint(1, 1000)),
            "type": random.choice(types),
            "title": random.choice(["Traffic Violation", "Vehicle of Interest", "Emergency Reported"]),
            "message": f"Alert at {random.choice(['Nairobi Road', 'Westlands', 'Kilimani'])}",
            "severity": random.choice(severities),
            "timestamp": datetime.utcnow().isoformat(),
            "acknowledged": random.random() > 0.5
        })
    return alerts

def generate_notifications(count=20):
    notifications = []
    types = ["incident", "alert", "team_update", "system"]
    for i in range(count):
        notifications.append({
            "id": str(random.randint(1, 10000)),
            "type": random.choice(types),
            "title": random.choice(["New Incident", "Team Dispatched", "Alert Generated"]),
            "message": f"Notification message {i+1}",
            "timestamp": datetime.utcnow().isoformat(),
            "read": random.random() > 0.6
        })
    return notifications

def generate_dispatches(count=5):
    dispatches = []
    for i in range(count):
        dispatches.append({
            "id": f"DISP-{random.randint(1000, 9999)}",
            "incident_id": f"INC-{random.randint(1000, 9999)}",
            "team_id": str(random.randint(1, 100)),
            "team_name": f"Team {random.randint(1, 5)}",
            "status": random.choice(["pending", "en_route", "on_scene", "completed"]),
            "dispatched_at": datetime.utcnow().isoformat()
        })
    return dispatches

def generate_anpr_stats():
    return {
        "total_detections": random.randint(1000, 5000),
        "plates_today": random.randint(100, 500),
        "violations": random.randint(10, 100),
        "vehicles_tracked": random.randint(500, 2000)
    }

def generate_anpr_tracks(count=20):
    tracks = []
    for i in range(count):
        tracks.append({
            "id": f"TRK-{random.randint(1000, 9999)}",
            "plate": f"KAA {random.randint(100, 999)}{chr(65 + random.randint(0, 7))}",
            "make": random.choice(["Toyota", "Honda", "Nissan"]),
            "model": random.choice(["Corolla", "Civic", "Prado"]),
            "color": random.choice(["White", "Black", "Silver"]),
            "first_seen": datetime.utcnow().isoformat(),
            "last_seen": datetime.utcnow().isoformat(),
            "camera_count": random.randint(1, 5),
            "locations": [
                {"camera": f"CAM-{random.randint(100, 999)}", "time": datetime.utcnow().isoformat()}
                for _ in range(random.randint(1, 3))
            ]
        })
    return tracks

def generate_plates(count: int = 50) -> List[Dict[str, Any]]:
    plates = []
    for i in range(count):
        plates.append({
            "id": random.randint(1, 10000),
            "plate": f"KAA {random.randint(100, 999)}{chr(65 + random.randint(0, 7))}",
            "make": random.choice(["Toyota", "Honda", "Nissan", "Mercedes", "BMW", "Ford"]),
            "model": random.choice(["Corolla", "Civic", "Prado", "E-Class", "3 Series"]),
            "color": random.choice(["White", "Black", "Silver", "Blue", "Red"]),
            "timestamp": datetime.utcnow().isoformat(),
            "camera": f"CAM-{random.randint(100, 999)}",
            "confidence": round(random.uniform(0.8, 0.99), 2),
            "violation": random.choice([None, "Speeding", "Red Light", "No Insurance"])
        })
    return plates

def generate_citizen_reports(count=10):
    reports = []
    types = ["emergency", "crime", "accident", "suspicious", "traffic"]
    for i in range(count):
        reports.append({
            "id": f"CR-{random.randint(1000, 9999)}",
            "type": random.choice(types),
            "description": f"Citizen report {i+1}",
            "location": random.choice(["Kenyatta Avenue", "Mombasa Road", "Ngong Road"]),
            "latitude": -1.2921 + random.uniform(-0.05, 0.05),
            "longitude": 36.8219 + random.uniform(-0.05, 0.05),
            "status": random.choice(["pending", "investigating", "resolved"]),
            "created_at": datetime.utcnow().isoformat(),
            "citizen_name": f"Citizen {i+1}",
            "contact": f"+2547{random.randint(10000000, 99999999)}"
        })
    return reports

def generate_statistics():
    return {
        "incidents_today": random.randint(50, 200),
        "incidents_week": random.randint(300, 1000),
        "incidents_month": random.randint(1000, 5000),
        "resolution_rate": round(random.uniform(0.7, 0.95), 2),
        "avg_response_time": round(random.uniform(5, 15), 1),
        "top_locations": [
            {"location": "Kenyatta Avenue", "count": random.randint(10, 50)},
            {"location": "Mombasa Road", "count": random.randint(10, 50)},
            {"location": "Ngong Road", "count": random.randint(10, 50)}
        ]
    }

def generate_trends(period="week"):
    trends = []
    days = 7 if period == "week" else 30
    for i in range(days):
        trends.append({
            "date": f"2024-01-{i+1:02d}",
            "incidents": random.randint(10, 100),
            "violations": random.randint(5, 50),
            "resolved": random.randint(5, 80)
        })
    return trends

# API Routes
@app.get("/")
def root():
    return {"message": "Kenya Overwatch API", "version": "1.0.0"}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "services": {
            "ai_pipeline": "operational",
            "risk_engine": "operational",
            "database": "mock_data",
            "alert_system": "operational"
        }
    }

@app.get("/api/dashboard/stats")
def get_stats():
    return {
        "total_incidents": random.randint(100, 500),
        "active_incidents": random.randint(5, 30),
        "resolved_today": random.randint(20, 100),
        "cameras_online": random.randint(5, 10),
        "total_cameras": 12,
        "response_teams": random.randint(8, 15),
        "avg_response_time": round(random.uniform(5, 15), 1)
    }

@app.get("/api/incidents")
def get_incidents(status: Optional[str] = None):
    incidents = generate_incidents(10)
    if status:
        incidents = [i for i in incidents if i["status"] == status]
    return incidents

@app.get("/api/cameras")
def get_cameras():
    return generate_cameras(8)

@app.get("/api/teams")
def get_teams():
    return {"teams": generate_teams(8)}

@app.get("/api/alerts")
def get_alerts(acknowledged: Optional[str] = None):
    alerts = generate_alerts(5)
    if acknowledged == "false":
        alerts = [a for a in alerts if not a["acknowledged"]]
    return alerts

@app.get("/api/dispatch")
def get_dispatches():
    return {"dispatches": generate_dispatches(5)}

@app.post("/api/teams/{team_id}/dispatch")
def dispatch_team(team_id: str, incident_id: Optional[str] = None):
    return {
        "success": True,
        "dispatch_id": f"DISP-{random.randint(1000, 9999)}",
        "team_id": team_id,
        "incident_id": incident_id,
        "status": "dispatched"
    }

@app.get("/api/map/markers")
def get_map_markers():
    incidents = generate_incidents(5)
    cameras = generate_cameras(5)
    teams = generate_teams(5)
    
    markers = []
    for i in incidents:
        markers.append({
            "id": i["id"],
            "position": [i["latitude"], i["longitude"]],
            "type": "incident",
            "title": i["title"],
            "severity": i["severity"]
        })
    for c in cameras:
        markers.append({
            "id": c["id"],
            "position": [c["latitude"], c["longitude"]],
            "type": "camera",
            "title": c["name"],
            "status": c["status"]
        })
    for t in teams:
        markers.append({
            "id": t["id"],
            "position": [t["latitude"], t["longitude"]],
            "type": "team",
            "title": t["name"],
            "status": t["status"]
        })
    
    return markers

@app.get("/api/notifications")
def get_notifications(limit: int = 20):
    return generate_notifications(limit)

@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    return {"success": True, "notification_id": notification_id}

@app.post("/api/notifications/read-all")
def mark_all_notifications_read():
    return {"success": True}

@app.get("/api/statistics/trends")
def get_trends(period: str = "week"):
    return generate_trends(period)

@app.get("/api/statistics/summary")
def get_statistics_summary():
    return generate_statistics()

@app.get("/api/anpr/statistics")
def get_anpr_stats():
    return generate_anpr_stats()

@app.get("/api/anpr/tracks")
def get_anpr_tracks():
    return {"tracks": generate_anpr_tracks(20)}

@app.get("/api/anpr/plates")
def get_plates(limit: int = 50):
    return {"plates": generate_plates(limit)}

@app.get("/api/analytics/trends")
def get_analytics_trends(period: str = "week", metric: str = "incidents"):
    return generate_trends(period)

@app.get("/api/export/{report_type}")
def export_report(report_type: str, format: str = "json", limit: int = 1000):
    return {
        "success": True,
        "report_type": report_type,
        "format": format,
        "count": limit,
        "data": generate_incidents(min(limit, 10))
    }

@app.get("/api/citizen/reports")
def get_citizen_reports():
    return generate_citizen_reports(10)

@app.post("/api/citizen/reports")
def submit_citizen_report(report: dict):
    return {
        "success": True,
        "report_id": f"CR-{random.randint(1000, 9999)}",
        "status": "submitted"
    }

@app.get("/api/offences/new")
def get_new_offences():
    return {
        "offences": [
            {
                "id": random.randint(1000, 9999),
                "type": random.choice(["Speeding", "Red Light", "Illegal Parking"]),
                "plate": f"KAA {random.randint(100, 999)}{chr(65 + random.randint(0, 7))}",
                "camera": f"CAM-{random.randint(100, 999)}",
                "timestamp": datetime.utcnow().isoformat(),
                "fine": random.randint(500, 5000)
            }
            for _ in range(5)
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
