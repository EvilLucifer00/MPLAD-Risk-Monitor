"""Local embedding encoder using Sentence Transformers (configurable model)."""

from __future__ import annotations
import logging
from typing import List
from sentence_transformers import SentenceTransformer
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmbeddingEncoder:
    """Singleton-style local embedding encoder.

    Uses BAAI/bge-base-en-v1.5 by default. The model is configurable via
    the EMBEDDING_MODEL environment variable.
    """

    _instance: EmbeddingEncoder | None = None
    _model: SentenceTransformer | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load(self):
        if self._model is None:
            logger.info("Loading embedding model: %s", settings.embedding_model)
            self._model = SentenceTransformer(
                settings.embedding_model,
                trust_remote_code=True,
            )
            logger.info(
                "Embedding model loaded — dimension: %d",
                self._model.get_sentence_embedding_dimension(),
            )

    def encode(self, texts: List[str], batch_size: int = 32, show_progress: bool = False) -> List[List[float]]:
        """Encode a list of texts into embedding vectors.

        For BGE models the recommended query prefix is "Represent this sentence: "
        but Sentence Transformers handles that via the model's config automatically
        when using encode().
        """
        self._load()
        embeddings = self._model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=show_progress,
            normalize_embeddings=True,  # cosine similarity = dot product
        )
        return embeddings.tolist()

    def encode_query(self, query: str) -> List[float]:
        """Encode a single query — BGE models benefit from a query prefix."""
        self._load()
        # BGE models recommend prepending "Represent this sentence: " for queries
        prefix = ""
        model_name = settings.embedding_model.lower()
        if "bge" in model_name:
            prefix = "Represent this sentence: "

        embedding = self._model.encode(
            prefix + query,
            normalize_embeddings=True,
        )
        return embedding.tolist()

    @property
    def dimension(self) -> int:
        self._load()
        return self._model.get_sentence_embedding_dimension()


# Module-level singleton
encoder = EmbeddingEncoder()
