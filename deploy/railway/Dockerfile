# Railway deployment Dockerfile for Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements-minimal.txt .
RUN pip install --no-cache-dir -r requirements-minimal.txt

# Copy application
COPY backend/ .

# Expose port (Railway assigns $PORT)
EXPOSE $PORT

# Start application
CMD python -m uvicorn road_safety_api:app --host 0.0.0.0 --port $PORT
