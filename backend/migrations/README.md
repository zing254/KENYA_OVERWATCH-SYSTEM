# Kenya Overwatch Database Migrations

## Directory Structure

This directory contains Alembic migrations for the Kenya Overwatch system.

## Initial Setup

To create initial migration:

```bash
alembic init migrations
```

## Creating Migrations

```bash
# Auto-generate migrations based on models
alembic revision --autogenerate -m "initial migration"

# Create empty migration
alembic revision -m "create users table"
```

## Running Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Downgrade one version
alembic downgrade -1

# Check current version
alembic current
```

## Migration Files

### 001_initial.py
- Users table
- Roles and permissions
- Sessions

### 002_cameras.py
- Cameras
- Camera locations
- Camera status

### 003_incidents.py
- Incidents
- Incident updates
- Incident attachments

### 004_evidence.py
- Evidence packages
- Evidence signatures
- Evidence reviews

### 005_alerts.py
- Alerts
- Alert acknowledgments

### 006_offences.py
- Traffic offences
- Offence reviews

## Notes

- All timestamps use UTC
- Foreign keys are properly indexed
- Soft deletes are used where needed
