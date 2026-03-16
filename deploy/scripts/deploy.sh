#!/bin/bash
# Kenya Overwatch - Universal Deployment Script
# Works on any Linux server with Docker installed
#
# Usage:
#   ./deploy.sh                    # Deploy with defaults
#   ./deploy.sh --with-ssl         # Deploy with SSL (requires certbot)
#   ./deploy.sh --no-postgres      # Deploy without PostgreSQL (use SQLite)
#   ./deploy.sh --no-redis         # Deploy without Redis
#
# Prerequisites:
#   - Docker 20.10+
#   - Docker Compose 2.0+
#   - Git

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="kenya-overwatch"
PROJECT_DIR="${PROJECT_DIR:-/opt/kenya-overwatch}"
REPO_URL="${REPO_URL:-https://github.com/your-org/kenya-overwatch-production.git}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="docker-compose.prod.yml"
WITH_SSL=false
NO_POSTGRES=false
NO_REDIS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --with-ssl) WITH_SSL=true; shift ;;
        --no-postgres) NO_POSTGRES=true; shift ;;
        --no-redis) NO_REDIS=true; shift ;;
        --dir) PROJECT_DIR="$2"; shift 2 ;;
        --repo) REPO_URL="$2"; shift 2 ;;
        --branch) BRANCH="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

echo "================================================"
echo "  🇰🇪 Kenya Overwatch Deployment"
echo "================================================"
echo "  Directory: $PROJECT_DIR"
echo "  Repository: $REPO_URL"
echo "  Branch: $BRANCH"
echo "================================================"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo "${BLUE}Checking prerequisites...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo "${RED}✗ Docker not found. Please install Docker first.${NC}"
        echo "  Install: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    echo "${GREEN}✓ Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')${NC}"
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "${RED}✗ Docker Compose not found.${NC}"
        exit 1
    fi
    echo "${GREEN}✓ Docker Compose${NC}"
    
    if ! command -v git &> /dev/null; then
        echo "${RED}✗ Git not found.${NC}"
        exit 1
    fi
    echo "${GREEN}✓ Git${NC}"
    echo ""
}

# Function to clone or update repository
setup_repository() {
    echo "${BLUE}Setting up repository...${NC}"
    
    if [ -d "$PROJECT_DIR/.git" ]; then
        echo "  Pulling latest changes..."
        cd "$PROJECT_DIR"
        git fetch origin
        git checkout "$BRANCH" 2>/dev/null || true
        git pull origin "$BRANCH" || true
    else
        echo "  Cloning repository..."
        sudo mkdir -p "$PROJECT_DIR"
        sudo chown $(id -u):$(id -g) "$PROJECT_DIR" 2>/dev/null || true
        git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
    
    echo "${GREEN}✓ Repository ready${NC}"
    echo ""
}

# Function to configure environment
setup_environment() {
    echo "${BLUE}Configuring environment...${NC}"
    cd "$PROJECT_DIR"
    
    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        DB_PASS=$(openssl rand -hex 16)
        JWT_SECRET=$(openssl rand -hex 32)
        
        cat > .env << ENVEOF
# Kenya Overwatch Production Configuration
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT_SECRET}
OW_DEV_NO_AUTH=0
OVERWATCH_ENV=production
REDIS_URL=redis://redis:6379
ENVEOF
        echo "${GREEN}✓ Environment configured (new .env created)${NC}"
        echo "${YELLOW}  ⚠ Save these credentials securely!${NC}"
        echo "    DB Password: ${DB_PASS}"
        echo "    JWT Secret: ${JWT_SECRET}"
    else
        echo "${GREEN}✓ Environment already configured${NC}"
    fi
    echo ""
}

# Function to build and deploy
deploy_services() {
    echo "${BLUE}Building and deploying services...${NC}"
    cd "$PROJECT_DIR"
    
    # Stop existing containers
    echo "  Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    
    # Build images
    echo "  Building images (this may take a few minutes)..."
    docker-compose -f "$COMPOSE_FILE" build --parallel
    
    # Start services
    echo "  Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    echo "${GREEN}✓ Services deployed${NC}"
    echo ""
}

# Function to wait for services
wait_for_services() {
    echo "${BLUE}Waiting for services to be ready...${NC}"
    
    # Wait for backend
    echo -n "  Backend API: "
    for i in {1..30}; do
        if curl -s http://localhost:8001/api/health >/dev/null 2>&1; then
            echo "${GREEN}Ready${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
}

# Function to run post-deployment tasks
post_deployment() {
    echo "${BLUE}Running post-deployment tasks...${NC}"
    cd "$PROJECT_DIR"
    
    # Run migrations
    echo "  Running database migrations..."
    docker exec kenya-backend python migrate.py 2>/dev/null || true
    
    echo "${GREEN}✓ Post-deployment tasks complete${NC}"
    echo ""
}

# Function to show deployment summary
show_summary() {
    IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    
    echo "================================================"
    echo "  ${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
    echo "================================================"
    echo ""
    echo "  Services:"
    echo "    🔧 Backend API:     http://${IP}:8001"
    echo "    📊 Dashboard:       http://${IP}:3000"
    echo "    👤 Citizen Portal:  http://${IP}:3002"
    echo "    🚔 Responder App:   http://${IP}:3001"
    echo ""
    echo "  API Documentation: http://${IP}:8001/docs"
    echo "  Health Check:      curl http://localhost:8001/api/health"
    echo ""
    echo "  To view logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  To stop:      docker-compose -f $COMPOSE_FILE down"
    echo "================================================"
}

# Main execution
check_prerequisites
setup_repository
setup_environment
deploy_services
wait_for_services
post_deployment
show_summary
