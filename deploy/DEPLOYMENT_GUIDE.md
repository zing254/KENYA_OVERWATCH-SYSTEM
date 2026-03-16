# 🇰🇪 Kenya Overwatch - Deployment Guide
## Free & Zero-Budget Deployment Options

---

## Option 1: Oracle Cloud Free Tier (RECOMMENDED)

**Why:** Always Free tier with 4 ARM cores, 24GB RAM, 200GB storage. Best for full deployment.

### Steps:

1. **Create Oracle Cloud Account**
   - Go to https://www.oracle.com/cloud/free/
   - Sign up (requires credit card for verification, no charges)
   - Select "Always Free" resources only

2. **Create Compute Instance**
   ```
   - Image: Ubuntu 22.04 (ARM)
   - Shape: VM.Standard.A1.Flex (Always Free)
   - Cores: 4
   - Memory: 24GB
   - Storage: 200GB boot volume
   ```

3. **Configure Security List**
   ```
   Ingress Rules:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3000 (Control Center)
   - Port 3001 (Responder App)
   - Port 3002 (Citizen Portal)
   - Port 8001 (API)
   ```

4. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@<instance-ip>
   ```

5. **Run Deployment Script**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/your-org/kenya-overwatch/main/deploy/oracle-cloud/setup.sh | bash
   ```
   
   Or manually:
   ```bash
   git clone https://github.com/your-org/kenya-overwatch-production.git
   cd kenya-overwatch-production
   chmod +x deploy/scripts/deploy.sh
   ./deploy/scripts/deploy.sh
   ```

6. **Verify Deployment**
   ```bash
   curl http://localhost:8001/api/health
   # Should return: {"status":"healthy",...}
   ```

---

## Option 2: Render.com (Easiest Setup)

**Why:** Free tier, auto-deploy from GitHub, easy setup. Services spin down after 15min inactivity.

### Steps:

1. **Fork/Clone this repository** to your GitHub account

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Deploy via Blueprint**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select `deploy/render/render.yaml`
   - Click "Apply"

4. **Set Environment Variables**
   ```
   JWT_SECRET = (auto-generated)
   OW_DEV_NO_AUTH = 0
   OVERWATCH_ENV = production
   ```

5. **Access Your App**
   - Backend: `https://kenya-overwatch-backend.onrender.com`
   - Dashboard: `https://kenya-overwatch-dashboard.onrender.com`

### Limitations (Free Tier):
- Services sleep after 15 min inactivity
- Database: 90 days, 1GB storage
- Build time: 500 min/month
- Bandwidth: 100GB/month

---

## Option 3: Railway.app (Developer Friendly)

**Why:** $5/month free credit, GitHub integration, easy scaling.

### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Add Services**
   - Backend: Will auto-detect Python
   - PostgreSQL: Add from template
   - Redis: Add from template

4. **Configure Environment Variables**
   ```
   DATABASE_URL = (auto-connected)
   REDIS_URL = (auto-connected)
   JWT_SECRET = (generate)
   OW_DEV_NO_AUTH = 0
   ```

---

## Option 4: Any Linux Server (Manual)

### Prerequisites:
- Ubuntu 20.04+ or Debian 11+
- 2GB+ RAM, 20GB+ storage
- Root/sudo access

### Steps:

1. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Install Docker Compose**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Deploy**
   ```bash
   git clone https://github.com/your-org/kenya-overwatch-production.git
   cd kenya-overwatch-production
   cp .env.example .env
   # Edit .env with your settings
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Setup SSL (Optional)**
   ```bash
   sudo apt install certbot
   sudo certbot certonly --standalone -d yourdomain.com
   # Update nginx.conf with SSL paths
   # Restart nginx: docker-compose restart nginx
   ```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | sqlite:///dev.db | PostgreSQL connection string |
| `REDIS_URL` | No | - | Redis connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT tokens |
| `OW_DEV_NO_AUTH` | No | 0 | Set to 1 to disable auth (dev only) |
| `OVERWATCH_ENV` | No | development | production/development |
| `API_PORT` | No | 8001 | Backend API port |
| `CORS_ORIGINS` | No | * | Allowed CORS origins |

---

## Post-Deployment Checklist

- [ ] Health check returns 200: `curl http://localhost:8001/api/health`
- [ ] Can login to dashboard
- [ ] Can create incident
- [ ] WebSocket connects
- [ ] Database migrations ran
- [ ] Admin user created
- [ ] SSL certificate installed (if production)
- [ ] Firewall rules configured
- [ ] Backup strategy in place

---

## Troubleshooting

### Container won't start
```bash
docker logs kenya-backend
```

### Database connection failed
```bash
docker exec -it kenya-postgres psql -U kenya_user -d kenya_overwatch
```

### Port already in use
```bash
sudo lsof -i :8001
sudo kill <PID>
```

### Reset everything
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

---

## Support

- API Docs: http://localhost:8001/docs
- Health Check: http://localhost:8001/api/health
- Logs: `docker-compose logs -f backend`

