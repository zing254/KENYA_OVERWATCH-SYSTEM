# Kenya Overwatch Development Guide

## Project Structure
```
kenya-overwatch-production/
├── backend/              # FastAPI backend
│   ├── production_api.py # Main API
│   ├── ai/              # AI modules
│   ├── alerting/        # Alert system
│   ├── risk_engine/     # Risk assessment
│   └── offence_engine/  # Offence detection
├── frontend/
│   ├── control_center/  # Main dashboard
│   ├── mobile_officer/  # Officer app
│   ├── citizen_portal/  # Public portal
│   └── ai_training/    # AI training UI
└── scripts/             # Utility scripts
```

## Development Workflow

### 1. Creating Issues
- Use issue templates for bugs and features
- Assign labels appropriately
- Link related issues

### 2. Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `enhance/description` - Improvements
- `docs/description` - Documentation

### 3. Pull Requests
- Create PRs from feature branches to `develop`
- PRs to `main` require review and passing tests
- Fill out PR template completely
- Link related issues

### 4. Code Standards
- Python: PEP 8, max line length 120
- TypeScript: ESLint rules
- Use meaningful variable names
- Comment complex logic

### 5. Testing
- Backend: `pytest tests/ -v`
- Frontend: `npm test`
- Run linting before committing

## Running the Project

### Backend
```bash
cd backend
python production_api.py
```

### Frontend
```bash
cd frontend/control_center
npm run dev
```

## API Endpoints
- See `API_DOCS.md` for full documentation
- Swagger UI: `http://localhost:8000/docs`

## Environment Variables
See `.env.example` files in each component
