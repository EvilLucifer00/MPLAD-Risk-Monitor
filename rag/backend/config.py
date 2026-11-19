"""Centralized configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "mplads_rag"
    postgres_user: str = "mplads"
    postgres_password: str = "mplads_secure_password_123"

    # Supabase (Main Platform — read-only for project data)
    supabase_url: str = ""
    supabase_key: str = ""

    # JWT (shared secret with main backend)
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"

    # LLM Providers — Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    gemini_model_heavy: str = "gemini-3.6-flash"

    # LLM Providers — Groq
    groq_api_key: str = ""
    groq_model_fast: str = "openai/gpt-oss-20b"
    groq_model_quality: str = "openai/gpt-oss-120b"

    # LLM Router
    llm_router_strategy: str = "cost_optimized"  # cost_optimized | quality_first | latency_first

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # Reranker
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # Retrieval
    retrieval_top_k: int = 20
    rerank_top_k: int = 5
    similarity_threshold: float = 0.3

    # Cache
    cache_enabled: bool = True
    cache_similarity_threshold: float = 0.92
    cache_ttl_hours: int = 24

    # Memory
    memory_max_short_term: int = 20
    memory_summary_threshold: int = 10

    # Guardrails
    guardrails_enabled: bool = True
    guardrails_max_input_length: int = 2000
    guardrails_block_pii: bool = True
    guardrails_grounding_threshold: float = 0.6

    # ChromaDB
    chroma_persist_dir: str = "./data/chroma_db"
    chroma_collection_name: str = "mplads_documents"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # Upload
    upload_dir: str = "./data/uploads"
    max_upload_size_mb: int = 50

    def model_post_init(self, __context):
        super().model_post_init(__context)
        p = Path(self.chroma_persist_dir)
        if not p.is_absolute():
            object.__setattr__(self, "chroma_persist_dir", str((ENV_PATH.parent / p).resolve()))
        up = Path(self.upload_dir)
        if not up.is_absolute():
            object.__setattr__(self, "upload_dir", str((ENV_PATH.parent / up).resolve()))

    @property
    def database_url(self) -> str:
        safe_pass = quote_plus(self.postgres_password)
        safe_user = quote_plus(self.postgres_user)
        return (
            f"postgresql+asyncpg://{safe_user}:{safe_pass}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def sync_database_url(self) -> str:
        safe_pass = quote_plus(self.postgres_password)
        safe_user = quote_plus(self.postgres_user)
        return (
            f"postgresql://{safe_user}:{safe_pass}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = {
        "env_file": str(ENV_PATH) if ENV_PATH.exists() else "../.env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
