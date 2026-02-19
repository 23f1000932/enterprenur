# Use Python as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy the application code
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || echo "No requirements.txt found"

# Expose port (if needed)
EXPOSE 8000

# Default command
CMD ["python", "-m", "http.server", "8000"]
