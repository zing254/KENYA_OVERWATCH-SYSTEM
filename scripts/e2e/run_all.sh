#!/usr/bin/env bash
set -euo pipefail

echo "[e2e] Starting lean end-to-end stack..."

# 1) Start lean Postgres dev container
echo "[e2e] Starting Postgres (dev)"
docker compose -f docker-compose.dev.yml up -d postgres

# 2) Wait for Postgres readiness
echo "[e2e] Waiting for Postgres to become ready..."
until docker exec kenya_overwatch_dev_postgres pg_isready -q; do
  sleep 1
done

# 3) Set DATABASE_URL and run migrations
export DATABASE_URL="postgresql://overwatch:overwatch@localhost:5432/overwatch"
echo "[e2e] DATABASE_URL=$DATABASE_URL"
python backend/migrate.py

# 4) Start backend (production entrypoint) in background
echo "[e2e] Launching FastAPI (backend)"
uvicorn backend.production_api:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 5) Start frontend (control_center) in background
echo "[e2e] Launching Frontend Control Center"
(cd frontend/control_center && npm install >/dev/null 2>&1 || true; npm run dev > /tmp/ow_cc_dev.log 2>&1) &
FRONTEND_PID=$!

# 6) Quick sanity checks against API
echo "[e2e] Waiting briefly for services to initialize..."
sleep 5
echo "[e2e] Health check:"
curl -s http://localhost:8000/api/health | head -n 5 || true
echo "\n[ e2e ] Dashboard stats:"
curl -s http://localhost:8000/api/dashboard/stats | head -n 5 || true

# 7) Summary
echo "[e2e] Frontend should be available at http://localhost:3000 (tail -f /tmp/ow_cc_dev.log to monitor)"

# 8) Do not exit; keep processes alive for manual QA
wait $BACKEND_PID $FRONTEND_PID
