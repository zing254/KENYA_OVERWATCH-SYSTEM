# Kenya NTSA Road Safety Overwatch System

<p align="center">
  <img src="https://img.shields.io/badge/NTSA-Road%20Safety-brightgreen" alt="Kenya Road Safety">
  <img src="https://img.shields.io/badge/python-3.11+-blue" alt="Python">
  <img src="https://img.shields.io/badge/typescript-5.0+-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/fastapi-0.104+-orange" alt="FastAPI">
  <img src="https://img.shields.io/badge/nextjs-14+-black" alt="Next.js">
</p>

A production-grade AI-powered road safety monitoring and traffic violation management system designed for the National Transport and Safety Authority (NTSA) Kenya.

## Features

- Real-time AI-powered accident detection
- Speed detection and enforcement
- Traffic violation management
- Accident hotspot analysis
- Emergency response dispatch
- Revenue collection tracking
- Road segment risk scoring
- Driver and vehicle management

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- WebSocket

### Frontend
- TypeScript
- Next.js 14
- React
- Tailwind CSS
- Recharts

## Quick Start

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python road_safety_api.py

# Frontend
cd frontend/control_center
npm install
npm run dev
```

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Get road safety statistics
- `GET /api/dashboard/summary` - Get dashboard summary

### Accidents
- `GET /api/accidents` - List all accidents
- `GET /api/accidents/{id}` - Get accident details
- `POST /api/accidents` - Report new accident
- `GET /api/accidents/hotspots` - Get accident hotspots

### Violations
- `GET /api/violations` - List all violations
- `GET /api/violations/{id}` - Get violation details
- `POST /api/violations` - Record new violation
- `POST /api/violations/{id}/review` - Review violation
- `POST /api/violations/{id}/pay` - Pay violation fine
- `GET /api/violations/stats/revenue` - Get revenue statistics

### Vehicles & Drivers
- `GET /api/vehicles/{plate_number}` - Get vehicle details
- `GET /api/vehicles/{plate_number}/violations` - Get vehicle violations
- `GET /api/drivers/{license_number}` - Get driver details

### Speed Detection
- `POST /api/speed/detect` - Detect speed and record violation
- `GET /api/speed/detections` - List speed detections

### Roads
- `GET /api/roads` - List all roads
- `GET /api/roads/segments` - List road segments
- `GET /api/roads/{road_name}/stats` - Get road statistics

### Analytics
- `GET /api/analytics/trends` - Get incident trends
- `GET /api/analytics/accidents/by-type` - Accidents by type
- `GET /api/analytics/accidents/by-cause` - Accidents by cause
- `GET /api/analytics/violations/by-type` - Violations by type

### Enums
- `GET /api/enums/accident-types` - List accident types
- `GET /api/enums/cause-types` - List cause types
- `GET /api/enums/severity-levels` - List severity levels
- `GET /api/enums/vehicle-types` - List vehicle types

### WebSocket
- `WS /ws/{client_id}` - Real-time updates

## Architecture

```
kenya-overwatch-production/
├── backend/
│   ├── road_safety_engine.py     # Core road safety logic
│   ├── road_safety_api.py        # FastAPI endpoints
│   ├── offence_engine/           # Traffic violation engine
│   ├── risk_engine/              # Risk assessment
│   └── ai/                       # AI detection modules
├── frontend/
│   └── control_center/
│       ├── components/
│       │   └── RoadSafetyDashboard.tsx
│       └── pages/
│           └── index.tsx
├── docs/
└── README.md
```

## Supported Violations

- Speeding
- Drunk Driving
- Red Light Jumping
- Wrong Way Driving
- Reckless Driving
- Illegal Parking
- Using Phone While Driving
- Overloading
- Overtaking Violations
- Driving While Fatigued

## Supported Accident Types

- Head-on Collision
- Rear-end Collision
- Side Impact
- Rollover
- Hit Pedestrian
- Hit Animal
- Object Strike
- Single Vehicle
- Multi Vehicle
- Parked Vehicle

## Configuration

Environment variables can be configured in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `API_PORT` - API server port (default: 8001)
- `JWT_SECRET` - Authentication secret

## Documentation

- [API Documentation](API_DOCS.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY_POLICY.md)

## License

Proprietary - National Transport and Safety Authority Kenya
