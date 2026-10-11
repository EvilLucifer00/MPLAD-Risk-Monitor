"""Centralized configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "mplads_rag"
    postgres_user: str = "mplads"
    postgres_password: str = "mplads_secure_password_123"

    # LLM Provider: "auto" (tries gemini, then groq), "gemini", or "groq"
    llm_provider: str = "auto"

    # Gemini (fallback)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Groq (fallback)
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # Reranker
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # Retrieval
    retrieval_top_k: int = 20
    rerank_top_k: int = 5
    similarity_threshold: float = 0.3

    # Memory
    memory_max_short_term: int = 20
    memory_summary_threshold: int = 10

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

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def sync_database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = {
        "env_file": "../.env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
