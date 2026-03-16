Lean Local Dev DB Guide (PostgreSQL via Docker Compose)

- This doc describes how to bootstrap a local PostgreSQL-based dev DB using a lean setup so you can exercise migrations with a production-like stack without polluting your local environment.
- Prereqs: Docker, docker-compose, bash

1) Start the Postgres container
   docker compose -f docker-compose.dev.yml up -d postgres

2) Bootstrap the DB and apply migrations
   - Ensure the environment variable is set for the app to connect:
     export DATABASE_URL="postgresql://overwatch:overwatch@localhost:5432/overwatch"
   - Run migrations once:
     python backend/migrate.py
   - If you want to seed demo data in dev only, set INIT_DB=1 when starting the app (or run a separate seed script).

3) Verify
   - Query the database to confirm tables exist (psql or tooling)
   - Start backend with the DATABASE_URL env var and ensure endpoints work as expected

- Optional: stop the stack with `docker compose -f docker-compose.dev.yml down`
