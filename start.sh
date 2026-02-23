#!/bin/bash
# Kenya Overwatch Production Startup Script

set -e

echo "=========================================="
echo "  Kenya Overwatch - Production System"
echo "=========================================="

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "Creating .env from template..."
    cp backend/.env.example backend/.env
    echo "Please update backend/.env with your configuration!"
fi

# Start services with Docker Compose
echo ""
echo "Starting Docker services..."
docker compose up -d postgres redis

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
sleep 5

# Run database migrations
echo "Running database migrations..."
cd backend
python -m alembic upgrade head || echo "Migrations skipped (database may not be ready)"

# Start the API server
echo ""
echo "Starting API server..."
echo "API available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""

python production_api.py
