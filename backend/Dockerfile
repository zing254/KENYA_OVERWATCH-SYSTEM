# Kenya Overwatch Production Dockerfile
# Multi-stage build for security and optimization

# ==================== BUILD STAGE ====================
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
WORKDIR /app
COPY requirements-docker.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements-docker.txt

# ==================== RUNTIME STAGE ====================
FROM python:3.11-slim as runtime

# Create non-root user for security
RUN groupadd -r overwatch && useradd -r -g overwatch overwatch

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up application directory
WORKDIR /app

# Copy Python packages and application code
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/
COPY . /app/

# Create required directories with proper permissions
RUN mkdir -p /app/logs /app/evidence /app/audit /app/static && \
    chown -R overwatch:overwatch /app

# Set environment variables
ENV PATH=/usr/local/bin:$PATH
ENV PYTHONPATH=/app
ENV OVERWATCH_ENV=production
ENV OVERWATCH_LOG_LEVEL=INFO
ENV OVERWATCH_CONFIG_PATH=/app/config/production.yaml

# Expose ports
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

# Switch to non-root user
USER overwatch

# Volume mounts for production
VOLUME ["/app/logs", "/app/evidence", "/app/audit", "/app/config"]

# Start command
CMD ["python", "-m", "uvicorn", "road_safety_api:app", "--host", "0.0.0.0", "--port", "8001", "--log-level", "info"]
