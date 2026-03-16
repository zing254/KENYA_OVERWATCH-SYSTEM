Kenya Overwatch - Deployment DB Guide

Overview:
- This project uses Alembic for migrations and SQLAlchemy models. During development you can use SQLite, but for production you should switch to PostgreSQL via the DATABASE_URL env variable.

Prerequisites:
- A PostgreSQL instance accessible from the deployment environment
- The DATABASE_URL env var in production should look like:
  postgresql://USER:PASSWORD@HOST:5432/overwatch
- The codebase ships Alembic migration scripts under alembic/

Steps to get migrations running in production:
1) Ensure the target DB exists and user has permissions.
2) Deploy with INIT_DB cleared (default) or explicitly set INIT_DB=1 to initialize and seed:
   - INIT_DB=1 python backend/migrate.py
   - This runs alembic upgrade head to apply migrations
3) If you want demo data in development, set INIT_DB=1 to seed using seed_demo_data().
4) Validate: check for tables in psql and run a small query, or curl health endpoints to ensure the app can access DB-backed models.

Notes:
- Do not call init_db() unconditionally in production; migrations should handle schema.
- Seeding in development should be idempotent; seed_demo_data() already guards against duplicates.
