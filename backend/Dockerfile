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
    cmake \
    pkg-config \
    libopencv-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libatlas-base-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download and compile AI models
RUN mkdir -p /app/models/yolo && \
    wget -O /app/models/yolo/yolov8n.pt https://github.com/ultralytics/ultralytics/releases/download/v8.0.196/yolov8n.pt && \
    wget -O /app/models/anpr/license_plate_recognition.pt https://github.com/openalpr/openalpr/releases/download/v2.3.1/license_plate_recognition.pt

# ==================== RUNTIME STAGE ====================
FROM python:3.11-slim as runtime

# Create non-root user for security
RUN groupadd -r overwatch && useradd -r -g overwatch overwatch

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libopencv-core4.5d \
    libavcodec58 \
    libavformat58 \
    libswscale5 \
    libv4l2 \
    libjpeg62 \
    libpng16-16 \
    libtiff5 \
    libatlas3-base \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set up application directory
WORKDIR /app

# Copy Python packages and application code
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/
COPY --from=builder /app/models/ /app/models/
COPY . /app/

# Create required directories with proper permissions
RUN mkdir -p /app/logs /app/evidence /app/audit /app/static && \
    chown -R overwatch:overwatch /app

# Set environment variables
ENV PATH=/usr/local/bin:$PATH
ENV PYTHONPATH=/app
ENV OVERWATCH_ENV=production
OVERWATCH_LOG_LEVEL=INFO
OVERWATCH_CONFIG_PATH=/app/config/production.yaml

# Expose ports
EXPOSE 8000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Switch to non-root user
USER overwatch

# Volume mounts for production
VOLUME ["/app/logs", "/app/evidence", "/app/audit", "/app/config"]

# Start command
CMD ["gunicorn", "production_api:app", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "--log-level", "info"]