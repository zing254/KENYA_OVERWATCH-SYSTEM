# Kenya Overwatch - System Documentation

## Overview

Kenya Overwatch is a comprehensive, AI-powered road safety monitoring and emergency response system for Kenya. The system integrates real-time video surveillance, automatic incident detection, and coordinated emergency response to reduce road accidents and improve response times.

## System Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript 5, Tailwind CSS |
| Backend | Python 3.11+, FastAPI, SQLAlchemy |
| Database | PostgreSQL with PostGIS |
| AI/ML | OpenCV, YOLOv8 (configurable) |
| Real-time | WebSocket, Socket.IO |
| Maps | Leaflet, OpenStreetMap |

### Components

1. **Control Center** (Port 3000)
   - Main dashboard for operators
   - Real-time incident monitoring
   - Dispatch management
   - Analytics and reporting

2. **Citizen Portal - TaifaRoad** (Port 3002)
   - Incident reporting
   - Safety alerts
   - Emergency contacts

3. **Responder App - Taifa Guard** (Port 3001)
   - Mobile app for police, ambulance, fire
   - Dispatch notifications
   - GPS tracking
   - Incident status updates

4. **Backend API** (Port 8001)
   - RESTful API
   - Authentication (JWT)
   - Incident management
   - Dispatch coordination

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (optional for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
python road_safety_api.py
```

### Frontend Setup

```bash
# Control Center
cd frontend/control_center
npm install
npm run dev

# Citizen Portal (separate terminal)
cd frontend/ulinnzi_112
npm install
npm run dev

# Responder App (separate terminal)
cd frontend/taifa_guard
npm install
npm run dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d
```

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/summary` | Dashboard summary |
| GET | `/api/accidents` | List accidents |
| POST | `/api/accidents` | Create accident |
| GET | `/api/violations` | List violations |
| POST | `/api/violations` | Create violation |

### Incidents & Dispatch (v1/services)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/services/incidents` | List incidents |
| POST | `/api/v1/services/incidents` | Create incident |
| GET | `/api/v1/services/incidents/{id}` | Get incident |
| PATCH | `/api/v1/services/incidents/{id}/status` | Update status |
| GET | `/api/v1/services/responders` | List responders |
| POST | `/api/v1/services/responders` | Register responder |
| POST | `/api/v1/services/dispatch` | Create dispatch |

### Other Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cameras` | List cameras |
| GET | `/api/teams` | List teams |
| GET | `/api/alerts` | List alerts |
| GET | `/api/v1/services/analytics/predictions` | Risk predictions |

## Incident Types

- `accident` - Road accident
- `overspeeding` - Speeding violation
- `lane_violation` - Lane discipline violation
- `dangerous_overtaking` - Dangerous overtaking
- `breakdown` - Vehicle breakdown
- `hazard` - Road hazard
- `red_light_violation` - Red light violation

## Severity Levels

- `low` - Minor incident
- `medium` - Moderate incident
- `high` - Serious incident
- `critical` - Life-threatening incident

## Dispatch Requirements

| Incident Type | Required Responders | Optional |
|---------------|---------------------|----------|
| accident | ambulance, police, fire | - |
| overspeeding | police | - |
| lane_violation | police | - |
| dangerous_overtaking | police | - |
| breakdown | police | tow_truck |
| hazard | police | maintenance |

## Kenyan Roads Data

The system includes pre-configured Kenyan roads:

- Mombasa Road (A109) - Highway, 100 km/h
- Nairobi Expressway - Highway, 80 km/h
- Thika Superhighway - Highway, 80 km/h
- Ngong Road - Arterial, 60 km/h
- Kenyatta Avenue - Urban, 50 km/h

## Accident Hotspots

Pre-configured high-risk areas:
- Mombasa Road Junction (-1.3300, 36.9800)
- Nairobi CBD Roundabout (-1.2864, 36.8232)
- Thika Road (-1.0800, 37.1000)
- Nakuru Town (-0.3031, 36.0800)

## Security

### Authentication
- JWT-based authentication
- Role-based access control (Admin, Dispatcher, Officer, Viewer)

### Default Users
| Username | Password | Role |
|----------|----------|------|
| admin | DevSetup@2024 | Admin |
| dispatcher | DevSetup@2024 | Dispatcher |
| officer | DevSetup@2024 | Officer |
| viewer | DevSetup@2024 | Viewer |

**Important**: Change default passwords in production!

## Environment Variables

### Backend
```
JWT_SECRET_KEY=your-secret-key
OVERWATCH_ENV=development
DATABASE_URL=postgresql://...
```

### Frontend
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Development

### Running Tests

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend/control_center
npm test
```

### Building for Production

```bash
# Frontend
cd frontend/control_center
npm run build

# Backend
cd backend
pip install -r requirements.txt
gunicorn road_safety_api:app -w 4
```

## Support

For issues and contributions, please refer to:
- CONTRIBUTING.md
- SECURITY.md

## License

Copyright 2024 Kenya National Transport and Safety Authority. All rights reserved.
