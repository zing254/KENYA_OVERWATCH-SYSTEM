# Kenya Overwatch Production Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code
COPY backend/ /app/backend/
COPY ai/ /app/ai/
COPY data/ /app/data/

# Create static directory for evidence
RUN mkdir -p /app/static/evidence_attachments

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV API_HOST=0.0.0.0
ENV API_PORT=8000

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "uvicorn", "backend.production_api:app", "--host", "0.0.0.0", "--port", "8000"]
