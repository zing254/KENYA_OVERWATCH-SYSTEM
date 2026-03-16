# Kenya Overwatch System

AI-powered road safety monitoring and traffic violation management system for the National Transport and Safety Authority (NTSA) Kenya.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements-minimal.txt
python -m uvicorn road_safety_api:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend/control_center
npm install && npm run dev
```

- Dashboard: http://localhost:3000
- API: http://localhost:8001
- API Docs: http://localhost:8001/docs

## Architecture

```
backend/
  road_safety_api.py     # Main API (200+ endpoints)
  road_safety_engine.py  # Core domain logic
  auth.py                # Authentication & RBAC
  enums.py               # Shared enums
  models.py              # Pydantic request/response models
  security_middleware.py # CORS, rate limiting, RBAC
  tests/                 # 88 passing tests

frontend/control_center/ # Next.js 14 dashboard
```

## Testing

```bash
cd /path/to/repo
python -m pytest backend/tests/ -v
```

## License

Proprietary - National Transport and Safety Authority Kenya
