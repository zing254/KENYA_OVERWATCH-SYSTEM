# Kenya Overwatch Deployment Guide

## Overview
This guide covers deploying the Kenya Overwatch system to production.

## Prerequisites
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Nginx (for reverse proxy)
- 4GB RAM minimum
- 50GB storage

## Quick Start (Development)

### 1. Clone Repository
```bash
git clone https://github.com/zing254/KENYA_OVERWATCH-SYSTEM.git
cd KENYA_OVERWATCH-SYSTEM
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit .env with your settings
```

### 3. Start with Docker Compose
```bash
docker-compose up -d
```

### 4. Access Services
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Control Center: http://localhost:3000
- Mobile Officer: http://localhost:3002
- Citizen Portal: http://localhost:3003

## Production Deployment

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configure Environment
```bash
# Create production .env file
cat > backend/.env << 'EOF'
OVERWATCH_ENV=production
DEBUG=false
DATABASE_URL=postgresql://user:password@db:5432/kenya_overwatch
REDIS_URL=redis://redis:6379/0
API_SECRET_KEY=your-secure-secret-key-min-32-chars
LOG_LEVEL=info
EOF
```

### 3. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d kenya-overwatch.go.ke
```

### 4. Build & Deploy
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### 5. Verify Deployment
```bash
# Check health
curl http://localhost:8000/api/health

# Check logs
docker-compose logs -f backend
```

## Service URLs (Production)
- https://kenya-overwatch.go.ke - Citizen Portal
- https://kenya-overwatch.go.ke/control/ - Control Center
- https://kenya-overwatch.go.ke/mobile/ - Mobile Officer
- https://kenya-overwatch.go.ke/docs - API Documentation

## Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Check Resources
```bash
docker stats
```

## Backup & Restore

### Backup Database
```bash
docker-compose exec -T postgres pg_dump -U overwatch overwatch_db > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U overwatch overwatch_db < backup.sql
```

## Troubleshooting

### Check Service Health
```bash
curl http://localhost:8000/api/health
```

### Restart Service
```bash
docker-compose restart backend
```

### Rebuild After Code Changes
```bash
docker-compose build backend
docker-compose up -d backend
```

## Security Checklist
- [ ] Change default API_SECRET_KEY
- [ ] Configure database credentials
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall (only ports 80, 443)
- [ ] Enable fail2ban
- [ ] Set up log rotation
- [ ] Configure backups

## Support
For issues, contact: support@kenyaoverwatch.go.ke
