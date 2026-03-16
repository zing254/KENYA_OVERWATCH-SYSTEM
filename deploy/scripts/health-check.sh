#!/bin/bash
# Kenya Overwatch - Health Check & Monitoring Script
# Can be run as a cron job or standalone

set -e

# Configuration
API_URL="${API_URL:-http://localhost:8001}"
CONTROL_URL="${CONTROL_URL:-http://localhost:3000}"
CITIZEN_URL="${CITIZEN_URL:-http://localhost:3002}"
RESPONDER_URL="${RESPONDER_URL:-http://localhost:3001}"
LOG_FILE="${LOG_FILE:-/var/log/kenya-overwatch/health.log}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

check_service() {
    local name=$1
    local url=$2
    local start=$(date +%s%N)
    
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    end=$(date +%s%N)
    latency=$(( (end - start) / 1000000 ))
    
    if [ "$status" = "200" ]; then
        echo "${GREEN}✓${NC} $name: ${GREEN}UP${NC} (${latency}ms)"
        echo "$(date -Iseconds) OK $name $latency ms" >> "$LOG_FILE"
        return 0
    else
        echo "${RED}✗${NC} $name: ${RED}DOWN${NC} (status: $status)"
        echo "$(date -Iseconds) FAIL $name status=$status" >> "$LOG_FILE"
        return 1
    fi
}

echo "================================================"
echo "  Kenya Overwatch - Health Check"
echo "  $(date)"
echo "================================================"
echo ""

FAILURES=0

check_service "Backend API     " "$API_URL/api/health" || ((FAILURES++))
check_service "Control Center  " "$CONTROL_URL" || ((FAILURES++))
check_service "Citizen Portal  " "$CITIZEN_URL" || ((FAILURES++))
check_service "Responder App   " "$RESPONDER_URL" || ((FAILURES++))

# Check Docker containers
echo ""
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep kenya || echo "  No containers running"

# Check disk space
echo ""
echo "Disk Usage:"
df -h / | tail -1 | awk '{print "  Root: " $5 " used"}'

# Check memory
echo ""
echo "Memory Usage:"
free -h | grep Mem | awk '{print "  RAM: " $3 "/" $2 " used"}'

echo ""
echo "================================================"
if [ $FAILURES -eq 0 ]; then
    echo "  ${GREEN}✓ ALL SERVICES HEALTHY${NC}"
else
    echo "  ${RED}✗ $FAILURES SERVICE(S) DOWN${NC}"
fi
echo "================================================"
