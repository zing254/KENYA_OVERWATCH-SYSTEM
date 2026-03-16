#!/bin/bash
# Kenya Overwatch - Production Readiness Verification
# Run this before deploying to production

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "  🇰🇪 Kenya Overwatch - Production Readiness Check"
echo "================================================"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
    local name=$1
    local result=$2
    
    if [ "$result" = "0" ]; then
        echo "${GREEN}✓${NC} $name"
        ((CHECKS_PASSED++))
    else
        echo "${RED}✗${NC} $name"
        ((CHECKS_FAILED++))
    fi
}

# 1. Check Python version
echo "1. Environment Checks:"
python3 --version | grep -q "3.11\|3.12" && check "Python 3.11+" 0 || check "Python 3.11+" 1
command -v node &> /dev/null && check "Node.js installed" 0 || check "Node.js installed" 1
command -v docker &> /dev/null && check "Docker installed" 0 || check "Docker installed" 1
command -v git &> /dev/null && check "Git installed" 0 || check "Git installed" 1
echo ""

# 2. Check backend tests
echo "2. Backend Tests:"
cd /home/zingri/Desktop/HH/kenya-overwatch-production
python -m pytest backend/tests/ -q --tb=no 2>&1 | grep -q "106 passed" && check "All 106 backend tests pass" 0 || check "Backend tests" 1
echo ""

# 3. Check frontend tests
echo "3. Frontend Tests:"
cd frontend/control_center
npm test --silent 2>&1 | grep -q "32 passed" && check "All 32 frontend tests pass" 0 || check "Frontend tests" 1
cd ../..
echo ""

# 4. Check critical files exist
echo "4. Critical Files:"
[ -f "backend/road_safety_api.py" ] && check "Main API file" 0 || check "Main API file" 1
[ -f "backend/road_safety_engine.py" ] && check "Engine file" 0 || check "Engine file" 1
[ -f "backend/psv_routes.py" ] && check "PSV routes" 0 || check "PSV routes" 1
[ -f "backend/kenyan_plates.py" ] && check "Kenyan plates" 0 || check "Kenyan plates" 1
[ -f "backend/ai_dispatch.py" ] && check "AI dispatch" 0 || check "AI dispatch" 1
[ -f "deploy/scripts/deploy.sh" ] && check "Deployment script" 0 || check "Deployment script" 1
[ -f "docker-compose.prod.yml" ] && check "Production Docker Compose" 0 || check "Production Docker Compose" 1
echo ""

# 5. Check API endpoints (if server is running)
echo "5. API Endpoints (if server running):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/health 2>/dev/null | grep -q "200" && check "Health endpoint" 0 || check "Health endpoint (server not running)" 1
echo ""

echo "================================================"
echo "  RESULTS: ${CHECKS_PASSED} passed, ${CHECKS_FAILED} failed"
echo "================================================"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo "${GREEN}✅ SYSTEM IS PRODUCTION READY${NC}"
else
    echo "${YELLOW}⚠️  Some checks failed - review before deploying${NC}"
fi
