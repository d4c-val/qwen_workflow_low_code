# ============================================
# QwenFlow - Multi-stage Docker Build
# ============================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY qwen-ui/package*.json ./
RUN npm ci --silent

# Copy source and build
COPY qwen-ui/ ./
RUN npm run build


# Stage 2: Production Image
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY main.py .

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./static

# Create startup script
RUN echo '#!/bin/sh\n\
if [ ! -f .env ] && [ -n "$DASHSCOPE_API_KEY" ]; then\n\
    echo "DASHSCOPE_API_KEY=$DASHSCOPE_API_KEY" > .env\n\
fi\n\
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}\n' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/docs')" || exit 1

# Start
CMD ["/app/start.sh"]

