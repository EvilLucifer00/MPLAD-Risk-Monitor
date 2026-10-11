"""MPLADS Self-RAG Chatbot — FastAPI application entry point."""

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

    # Run database migrations
    try:
        await run_migrations()
        logger.info("✅ Database ready")
    except Exception as e:
        logger.error("❌ Database migration failed: %s", e)

    # Preload embedding model (so first request isn't slow)
    try:
        from embeddings.encoder import encoder
        _ = encoder.dimension
        logger.info("✅ Embedding model loaded")
    except Exception as e:
        logger.warning("⚠️  Embedding model preload failed: %s", e)

    # Preload reranker
    try:
        from reranking.reranker import reranker
        reranker._load()
        logger.info("✅ Reranker model loaded")
    except Exception as e:
        logger.warning("⚠️  Reranker model preload failed: %s", e)

    # Initialize ChromaDB vector store
    try:
        from vectorstore.chroma_store import chroma_store
        _ = chroma_store.collection
        logger.info("✅ ChromaDB initialized — %d documents in collection", chroma_store.count)
    except Exception as e:
        logger.warning("⚠️  ChromaDB initialization failed: %s", e)

    # Check LLM Provider
    try:
        from llm.provider import llm_client
        provider = await llm_client._get_provider()
        logger.info("✅ LLM provider initialized: %s", provider.value)
    except Exception as e:
        logger.warning("⚠️  LLM provider initialization failed: %s", e)

    yield  # App runs

    logger.info("👋 Shutting down MPLADS Self-RAG Chatbot...")


# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="MPLADS Self-RAG Chatbot",
    description=(
        "An advanced RAG chatbot for Members of Parliament Local Area Development Scheme "
        "(MPLADS) documents. Uses Self-RAG with LangGraph, hybrid retrieval, "
        "BGE reranking, and LLM via Gemini/Groq."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    # Check LLM Provider
    try:
        from llm.provider import llm_client
        provider = await llm_client._get_provider()
        llm_status = provider.value
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
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True,
    )
