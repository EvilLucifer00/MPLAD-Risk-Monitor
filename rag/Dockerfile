FROM python:3.11-slim

# System deps for psycopg, asyncpg, and torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer caching)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy data (ChromaDB vectors + source docs)
COPY data/ ./data/

# Copy .env.example as fallback (real .env is set via env vars)
COPY .env.example ./.env.example

# Pre-download embedding & reranker models into the image
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('all-MiniLM-L6-v2'); \
SentenceTransformer('cross-encoder/ms-marco-MiniLM-L-6-v2'); \
print('Models cached.')"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

EXPOSE 8001

# Production server (no reload, 2 workers for t2.micro)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1", "--timeout-keep-alive", "120"]
