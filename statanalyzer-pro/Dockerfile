FROM node:20-alpine AS frontend

WORKDIR /app

# Copy package.json first (package-lock.json is optional)
COPY frontend/package.json ./

# Copy all frontend files
COPY frontend/ ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Build production bundle
RUN npm run build

# Backend stage
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Backend code
COPY backend/main.py .

# Copy built frontend
COPY --from=frontend /app/dist ./static

# Expose and run
EXPOSE 7860
HEALTHCHECK CMD curl -f http://localhost:7860/api/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
