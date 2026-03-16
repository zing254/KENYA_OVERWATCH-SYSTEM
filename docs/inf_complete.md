# Kenya Overwatch System - Infrastructure Configuration Guide
## Complete Setup & Configuration Manual

---

## 1. Prerequisites

### System Requirements
- **OS**: Ubuntu 22.04+ / Debian 11+ / macOS 12+ / Windows 11 with WSL2
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB minimum
- **Network**: Stable internet connection

### Required Software
- Docker & Docker Compose
- Node.js 18+ and npm 9+
- Python 3.11+
- Git

---

## 2. Installation Steps

### 2.1 Clone Repository
```bash
git clone https://github.com/your-org/kenya-overwatch-production.git
cd kenya-overwatch-production
```

### 2.2 Environment Configuration
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/control_center/.env.local.example frontend/control_center/.env.local
```

### 2.3 Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2.4 Frontend Setup
```bash
cd frontend/control_center
npm install
```

---

## 3. Database Configuration

### 3.1 SQLite (Development)
Default configuration - no setup required.

### 3.2 PostgreSQL (Production)
```bash
# Using Docker
docker run -d \
  --name kenya-overwatch-db \
  -e POSTGRES_USER=kenya_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=kenya_overwatch \
  -p 5432:5432 \
  postgres:15-alpine
```

Update `backend/.env`:
```env
DATABASE_URL=postgresql://kenya_user:your_secure_password@localhost:5432/kenya_overwatch
```

### 3.3 Redis Setup
```bash
# Using Docker
docker run -d \
  --name kenya-overwatch-redis \
  -p 6379:6379 \
  redis:7-alpine
```

---

## 4. Running the System

### 4.1 Development Mode
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python -m uvicorn road_safety_api:app --reload --host 0.0.0.0 --port 8001

# Terminal 2: Control Center
cd frontend/control_center
npm run dev

# Terminal 3: Citizen Portal
cd frontend/taifaroad
npm run dev  # Port 3002

# Terminal 4: Responder App
cd frontend/taifa_guard
npm run dev  # Port 3001
```

### 4.2 Docker Mode
```bash
docker-compose up -d
```

---

## 5. Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend/control_center
npm test
```

---

## 6. Deployment

### 6.1 Docker Deployment
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 6.2 Manual Deployment
1. Set up PostgreSQL and Redis
2. Configure environment variables
3. Run migrations: `python migrate.py`
4. Start backend: `uvicorn road_safety_api:app --host 0.0.0.0 --port 8001`
5. Build and serve frontend

---

## 7. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | sqlite:///./dev.db |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `JWT_SECRET` | Secret key for JWT tokens | (required) |
| `OW_DEV_NO_AUTH` | Skip auth in development | 0 |
| `API_PORT` | Backend API port | 8001 |
| `CORS_ORIGINS` | Allowed CORS origins | * |

---

## 8. Ports Reference

| Service | Port |
|---------|------|
| Backend API | 8001 |
| Control Center | 3000 |
| Citizen Portal | 3002 |
| Responder App | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## 9. Troubleshooting

### Server won't start
- Check if port is in use: `lsof -i :8001`
- Verify Python version: `python --version`
- Check dependencies: `pip list`

### Database connection failed
- Verify DATABASE_URL in .env
- Check PostgreSQL is running: `docker ps`
- Test connection: `psql $DATABASE_URL`

### Frontend build fails
- Clear cache: `rm -rf .next node_modules && npm install`
- Check Node version: `node --version`
- Verify TypeScript: `npx tsc --noEmit`

---

## 10. Security Notes

- Change default JWT_SECRET in production
- Use strong database passwords
- Enable HTTPS in production
- Configure firewall rules
- Keep dependencies updated
- Enable rate limiting
- Review RBAC settings

