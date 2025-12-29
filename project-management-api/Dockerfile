# syntax=docker/dockerfile:1
FROM python:3.11-slim AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

## DO NOT COPY CODE in dev; code is mounted by docker-compose

# Expose port (adjust if needed)
EXPOSE 8000

# Set environment variables for production
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Start the API (adjust if using different entrypoint)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
