# Kenya Overwatch Production Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements first for better caching
COPY backend/requirements.txt /app/requirements.txt

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code
COPY backend/ /app/backend/
COPY ai/ /app/ai/
COPY data/ /app/data/

# Create necessary directories
RUN mkdir -p /app/static/evidence_attachments \
    /app/logs \
    /app/cache

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV API_HOST=0.0.0.0
ENV API_PORT=8000
ENV WORKERS=4

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/health')" || exit 1

# Run with multiple workers
CMD ["python", "-m", "uvicorn", "backend.production_api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
