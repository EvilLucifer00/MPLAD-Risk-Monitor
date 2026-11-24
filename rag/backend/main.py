"""MPLADS Self-RAG Chatbot — FastAPI application entry point.

Production-grade agentic RAG system with:
- LLM Router (Gemini + Groq) for cost optimization
- Input & Output guardrails (PII, injection, grounding, hallucination)
- Semantic cache (pgvector) for repeated queries
- Dual-mode access (anonymous=docs only, MP/DM=docs + project data)
- Token-budgeted short-term memory + semantic long-term memory
"""

import logging
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database.migrations import run_migrations
from api.schemas import HealthResponse
from api.routes.chat import router as chat_router
from api.routes.documents import router as documents_router
from api.routes.conversations import router as conversations_router
from api.routes.feedback import router as feedback_router
from middleware.rate_limiter import RateLimitMiddleware, ConcurrencyThrottleMiddleware

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: run migrations, preload models. Shutdown: cleanup."""
    logger.info("🚀 Starting MPLADS Self-RAG Chatbot...")

    # Run database migrations (creates pgvector extension, tables, indexes)
    try:
        await run_migrations()
        logger.info("✅ Database ready (pgvector + tables + HNSW indexes)")
    except Exception as e:
        logger.error("❌ Database migration failed: %s", e)

    # Preload embedding model (so first request isn't slow)
    try:
        from embeddings.encoder import encoder
        _ = encoder.dimension
        logger.info("✅ Embedding model loaded: %s (dim=%d)", settings.embedding_model, encoder.dimension)
    except Exception as e:
        logger.warning("⚠️  Embedding model preload failed: %s", e)

    # Preload reranker
    try:
        from reranking.reranker import reranker
        reranker._load()
        logger.info("✅ Reranker model loaded: %s", settings.reranker_model)
    except Exception as e:
        logger.warning("⚠️  Reranker model preload failed: %s", e)

    # Initialize ChromaDB vector store
    try:
        from vectorstore.chroma_store import chroma_store
        _ = chroma_store.collection
        logger.info("✅ ChromaDB initialized — %d documents in collection", chroma_store.count)
    except Exception as e:
        logger.warning("⚠️  ChromaDB initialization failed: %s", e)

    # Initialize LLM Router
    try:
        from llm.router import llm_router
        logger.info("✅ LLM Router initialized (strategy=%s)", llm_router.strategy)
        if settings.gemini_api_key:
            logger.info("   Gemini: %s / %s", settings.gemini_model, settings.gemini_model_heavy)
        if settings.groq_api_key:
            logger.info("   Groq: %s / %s", settings.groq_model_fast, settings.groq_model_quality)
    except Exception as e:
        logger.warning("⚠️  LLM Router initialization failed: %s", e)

    # Log guardrails and cache status
    logger.info("🛡️  Guardrails: %s", "ENABLED" if settings.guardrails_enabled else "DISABLED")
    logger.info("💾 Semantic Cache: %s (threshold=%.2f, TTL=%dh)",
                "ENABLED" if settings.cache_enabled else "DISABLED",
                settings.cache_similarity_threshold,
                settings.cache_ttl_hours)

    # Log auth status
    if settings.jwt_secret:
        logger.info("🔑 JWT auth: CONFIGURED (dual-mode access enabled)")
    else:
        logger.info("🔑 JWT auth: NOT CONFIGURED (anonymous-only mode)")

    yield  # App runs

    logger.info("👋 Shutting down MPLADS Self-RAG Chatbot...")


# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="MPLADS Self-RAG Chatbot",
    description=(
        "An advanced RAG chatbot for Members of Parliament Local Area Development Scheme "
        "(MPLADS) documents. Uses Self-RAG with LangGraph, hybrid retrieval, "
        "BGE reranking, LLM Router (Gemini/Groq), semantic cache, "
        "input/output guardrails, and dual-mode access (public + MP-authenticated)."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
allowed_origins = [
    settings.frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://mplad-risk-monitor.vercel.app",
]
# Remove empty strings and duplicates
allowed_origins = list(set(o for o in allowed_origins if o))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Protect resource-constrained hardware with concurrency queue & per-IP rate limiting
# Outer middleware: Rate limiting (20 req/s burst, 10 req/s sustained)
app.add_middleware(RateLimitMiddleware, rate=10.0, burst=20)
# Inner middleware: Support up to 5 concurrent LLM pipelines simultaneously
app.add_middleware(ConcurrencyThrottleMiddleware, max_concurrent=5, queue_timeout=120.0)

# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(chat_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """System health check."""
    db_status = "unknown"

    # Check DB
    try:
        from database.connection import engine
        from sqlalchemy import text as sa_text
        async with engine.connect() as conn:
            await conn.execute(sa_text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    # Check LLM Router
    try:
        from llm.router import llm_router
        llm_status = f"router ({llm_router.strategy})"
        providers = []
        if settings.gemini_api_key:
            providers.append("gemini")
        if settings.groq_api_key:
            providers.append("groq")
        llm_status += f" [{'+'.join(providers)}]"
    except Exception:
        llm_status = "disconnected"

    # Check ChromaDB
    try:
        from vectorstore.chroma_store import chroma_store
        chroma_count = chroma_store.count
        vector_store_status = f"chromadb ({chroma_count} chunks)"
    except Exception:
        vector_store_status = "disconnected"

    return HealthResponse(
        status="ok" if db_status == "connected" and llm_status != "disconnected" else "degraded",
        database=db_status,
        llm_provider=llm_status,
        embedding_model=settings.embedding_model,
        reranker_model=settings.reranker_model,
        vector_store=vector_store_status,
    )


# ── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    is_dev = os.environ.get("ENV", "development") == "development"
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=is_dev,
    )
