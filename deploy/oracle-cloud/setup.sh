#!/bin/bash
# Kenya Overwatch - Oracle Cloud Free Tier Deployment
# This script sets up the complete system on an Oracle Cloud Always Free instance
#
# Requirements:
# - Oracle Cloud Always Free account (https://www.oracle.com/cloud/free/)
# - Ubuntu 22.04 ARM instance (4 cores, 24GB RAM - Always Free)
# - Open ports: 22, 80, 443, 3000, 3001, 3002, 8001

set -e

echo "================================================"
echo "  Kenya Overwatch - Oracle Cloud Deployment"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/kenya-overwatch"
REPO_URL="${1:-https://github.com/your-org/kenya-overwatch-production.git}"
BRANCH="${2:-main}"

echo ""
echo "${YELLOW}Step 1: System Update${NC}"
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

echo ""
echo "${YELLOW}Step 2: Install Docker${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "${GREEN}✓ Docker installed${NC}"
else
    echo "${GREEN}✓ Docker already installed${NC}"
fi

echo ""
echo "${YELLOW}Step 3: Install Docker Compose${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "${GREEN}✓ Docker Compose installed${NC}"
else
    echo "${GREEN}✓ Docker Compose already installed${NC}"
fi

echo ""
echo "${YELLOW}Step 4: Install Git${NC}"
if ! command -v git &> /dev/null; then
    sudo apt-get install -y -qq git
    echo "${GREEN}✓ Git installed${NC}"
else
    echo "${GREEN}✓ Git already installed${NC}"
fi

echo ""
echo "${YELLOW}Step 5: Clone Repository${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo "${GREEN}✓ Project directory exists, pulling latest${NC}"
    cd "$PROJECT_DIR"
    git pull origin "$BRANCH" || true
else
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown $USER:$USER "$PROJECT_DIR"
    git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    echo "${GREEN}✓ Repository cloned${NC}"
fi

echo ""
echo "${YELLOW}Step 6: Configure Environment${NC}"
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cat > "$PROJECT_DIR/.env" << 'ENVEOF'
# Kenya Overwatch Production Configuration
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
OW_DEV_NO_AUTH=0
OVERWATCH_ENV=production
ENVEOF
    echo "${GREEN}✓ Environment configured${NC}"
else
    echo "${GREEN}✓ Environment already configured${NC}"
fi

echo ""
echo "${YELLOW}Step 7: Build and Start Services${NC}"
cd "$PROJECT_DIR"
docker-compose -f docker-compose.prod.yml build --parallel
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "${YELLOW}Step 8: Wait for Services${NC}"
sleep 30

echo ""
echo "${YELLOW}Step 9: Run Database Migrations${NC}"
docker exec kenya-backend python migrate.py || true

echo ""
echo "${YELLOW}Step 10: Create Admin User${NC}"
docker exec kenya-backend python -c "
from auth import create_user
try:
    create_user('admin', 'Admin@2024!', 'admin')
    print('Admin user created')
except:
    print('Admin user may already exist')
" || true

echo ""
echo "================================================"
echo "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo "================================================"
echo ""
echo "Services:"
echo "  - Backend API:      http://$(hostname -I | awk '{print $1}'):8001"
echo "  - Control Center:   http://$(hostname -I | awk '{print $1}'):3000"
echo "  - Citizen Portal:   http://$(hostname -I | awk '{print $1}'):3002"
echo "  - Responder App:    http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "API Docs: http://$(hostname -I | awk '{print $1}'):8001/docs"
echo ""
echo "Health Check: curl http://localhost:8001/api/health"
echo ""
