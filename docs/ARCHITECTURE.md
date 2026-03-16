Kenya Overwatch Architecture (Lean End-to-End)

- Summary: A real-time road safety monitoring stack built on a FastAPI backend and a Next.js frontend, with a lean Postgres-based persistence layer and an Italian (no) heavy-lift branding layer inspired by Kenya.

- Service Map
  - api gateway (conceptual, optional) routes requests to backend microservices
  - backend/road_safety_api.py: FastAPI app with endpoints for incidents, violations, vehicles, drivers, dashboard metrics, analytics
  - backend/road_safety_engine.py: In-memory domain model and lightweight engine (seedable data for dev)
  - backend/database.py: SQLAlchemy ORM for core entities (User, Vehicle, Driver, Accident, Violation, Camera, Team, Alert, CitizenReport, AuditLog)
  - backend/migrate.py + alembic: Migrations for persistent storage (0001_initial.py)
  - backend/auth.py: Simple auth endpoints for demonstration; real deployment should swap to OAuth2/JWT
  - backend/notifications_sounds.py: Event-based sound/alert system; frontend handles playback
  - backend/logging_system.py, backend/cache.py: Basic logs and caching primitives

- Frontend Architecture (Control Center)
  - React/Next.js app with a Kenyan branding layer: KenyaHero, KenyaFlagBar, KenyaFooter
  - i18n: Lightweight EN/SW dictionary; LocaleProvider with a toggle
  - RoadSafetyDashboard: Cards, charts, and live-style components with lean data
  - Accessibility-conscious: color tokens and semantic sections; responsive design

- Data & Storage
  - Lean: Start with SQLite for local dev; migrate to PostgreSQL in prod
  - Migrations: Alembic handles schema changes; 0001_initial.py is the starting point

- Observability & Alerts (lean)
  - Logs stored in-memory (dev); can be extended to persistent logs in prod
  - Optional /metrics endpoint behind a feature flag (ENABLE_METRICS)

- Deploy & Operations (Lean Runbook)
  - Local dev: docker-compose.dev.yml spins PostgreSQL; migrations via backend/migrate.py
  - End-to-end runner: scripts/e2e/run_all.sh
  - CI: GitHub Actions runs code quality, tests, and migrations

- Security & RBAC (Plan for lean, incremental)
  - Minimal auth scaffolding for demo; plan to add OAuth2/JWT and role-based access later

- Data flow (high level)
  - Ingest incidents and violations via REST and (optionally) speed detector endpoints
  - Store in PostgreSQL via Alembic-managed migrations
  - Dashboard pulls from DB; analytics endpoints compute derived metrics
r+
Notes:
- This is a lean, launch-ready baseline. It is designed for a controlled environment and quick iteration. For production-scale usage, wire a robust auth system, instrument with OpenTelemetry, and ensure all endpoints are protected and rate-limited.
