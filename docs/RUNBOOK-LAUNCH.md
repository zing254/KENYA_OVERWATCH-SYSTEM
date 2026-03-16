Kenya Overwatch - Launch Runbook (Lean)

- Prerequisites: Node.js 18+, Python 3.11+, Postgres ready (prod or dev), environment variables:
  - DATABASE_URL for DB connection
  - OW_DEV_NO_AUTH for development (optional)
  - ENABLE_METRICS (optional)

- Steps to launch in dev/local:
  1) Start Postgres (dev): docker compose -f docker-compose.dev.yml up -d postgres
  2) Migrate DB: export DATABASE_URL=postgresql://overwatch:overwatch@localhost:5432/overwatch; python backend/migrate.py
  3) Run backend: uvicorn backend.production_api:app --host 0.0.0.0 --port 8000 --reload
  4) Run frontend: (cd frontend/control_center; npm install; npm run dev)
  5) Smoke checks: http://localhost:8000/api/health and /api/dashboard/stats; visit UI at http://localhost:3000
  6) Optional: Run lean end-to-end runner: bash scripts/e2e/run_all.sh

- Production readout:
  - Ensure RBAC is enforced for mutating endpoints; validate with a test user
  - Validate branding across landing and dashboard
  - Validate metrics endpoint if enabled
