#!/bin/bash
# Kenya Overwatch Development Mode

set -e

echo "=========================================="
echo "  Kenya Overwatch - Development Mode"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check .env
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}Creating .env from template...${NC}"
    cp backend/.env.example backend/.env
fi

# Start backend
echo -e "${GREEN}Starting Backend API...${NC}"
cd backend
python production_api.py &
BACKEND_PID=$!

cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo -e "${GREEN}Starting Frontend...${NC}"
cd frontend/control_center
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo -e "${GREEN}Services Started:${NC}"
echo -e "  Backend API: ${YELLOW}http://localhost:8000${NC}"
echo -e "  API Docs:    ${YELLOW}http://localhost:8000/docs${NC}"
echo -e "  Frontend:    ${YELLOW}http://localhost:3000${NC}"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for either process
wait
