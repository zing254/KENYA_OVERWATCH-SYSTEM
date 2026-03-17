#!/bin/bash
# Kenya Overwatch - One-Command Setup Script
# Sets up everything needed for development or production

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "============================================"
echo "  🇰🇪 Kenya Overwatch - Setup Script"
echo "============================================"
echo ""

# Check prerequisites
echo "${YELLOW}Checking prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo "${RED}Python 3 is required but not installed${NC}"
    exit 1
fi
echo "${GREEN}✓${NC} Python $(python3 --version | grep -oP '\d+\.\d+')"

if ! command -v node &> /dev/null; then
    echo "${RED}Node.js is required but not installed${NC}"
    exit 1
fi
echo "${GREEN}✓${NC} Node.js $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "${RED}npm is required but not installed${NC}"
    exit 1
fi
echo "${GREEN}✓${NC} npm $(npm --version)"

echo ""

# Setup backend
echo "${YELLOW}Setting up backend...${NC}"
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "${GREEN}✓${NC} Virtual environment created"
fi
source venv/bin/activate
pip install -q -r requirements-minimal.txt 2>/dev/null || pip install -r requirements-minimal.txt
echo "${GREEN}✓${NC} Backend dependencies installed"

# Setup environment
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "${GREEN}✓${NC} Environment file created"
fi

cd ..

# Setup frontend
echo "${YELLOW}Setting up Control Center...${NC}"
cd frontend/control_center
if [ ! -d "node_modules" ]; then
    npm install --silent 2>/dev/null || npm install
fi
echo "${GREEN}✓${NC} Control Center ready"
cd ../..

echo ""
echo "============================================"
echo "${GREEN}  Setup Complete!${NC}"
echo "============================================"
echo ""
echo "To start the system:"
echo ""
echo "  Backend:        cd backend && source venv/bin/activate && python -m uvicorn road_safety_api:app --port 8001"
echo "  Control Center: cd frontend/control_center && npm run dev"
echo "  Citizen Portal: cd frontend/taifaroad && npm run dev -- -p 3002"
echo "  Responder App:  cd frontend/taifa_guard && npm run dev -- -p 3001"
echo ""
echo "Or use Docker:"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "URLs:"
echo "  Backend:       http://localhost:8001"
echo "  API Docs:      http://localhost:8001/docs"
echo "  Control Center: http://localhost:3000"
echo "  Citizen Portal: http://localhost:3002"
echo "  Responder App:  http://localhost:3001"
echo ""
