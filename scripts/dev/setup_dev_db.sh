#!/usr/bin/env bash
set -euo pipefail

# Lean local dev DB bootstrap: starts Postgres via docker-compose.dev.yml and runs migrations
ROOT_DIR=$(dirname -- "$0")/../..
DOCKER_COMPOSE_FILE="$ROOT_DIR/docker-compose.dev.yml"
DB_URL="postgresql://overwatch:overwatch@localhost:5432/overwatch"

echo "[dev] Ensuring Postgres is up..."
docker compose -f "$DOCKER_COMPOSE_FILE" up -d postgres

echo "[dev] Waiting for Postgres to become ready..."
for i in {1..60}; do
  if docker exec kenya_overwatch_dev_postgres pg_isready -q; then
    break
  fi
  sleep 1
done

export DATABASE_URL="$DB_URL"
echo "[dev] DATABASE_URL=$DATABASE_URL"

echo "[dev] Applying migrations..."
python "$ROOT_DIR/backend/migrate.py" || true

echo "[dev] Dev DB is ready. Run your app with the DATABASE_URL environment variable."
