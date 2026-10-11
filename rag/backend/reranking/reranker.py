"""Local BGE cross-encoder reranker using Sentence Transformers."""

from __future__ import annotations
import logging
from typing import List

from sentence_transformers import CrossEncoder

from config import get_settings
from retrieval.hybrid import RetrievedChunk

logger = logging.getLogger(__name__)
settings = get_settings()


class Reranker:
    """Singleton BGE cross-encoder reranker.

    Uses BAAI/bge-reranker-base by default — a lightweight, free,
    cross-encoder model that scores (query, passage) relevance.
    """

    _instance: Reranker | None = None
    _model: CrossEncoder | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load(self):
        if self._model is None:
            logger.info("Loading reranker model: %s", settings.reranker_model)
            self._model = CrossEncoder(
                settings.reranker_model,
                max_length=512,
                trust_remote_code=True,
            )
            logger.info("Reranker model loaded.")

    def rerank(
        self,
        query: str,
        chunks: List[RetrievedChunk],
        top_k: int | None = None,
    ) -> List[RetrievedChunk]:
        """Rerank chunks by cross-encoder relevance score.

        Args:
            query: The user's query.
            chunks: Chunks from hybrid retrieval.
            top_k: Number of top chunks to return after reranking.

        Returns:
            Reranked and trimmed list of chunks.
        """
        if not chunks:
            return []

        self._load()
        top_k = top_k or settings.rerank_top_k

        # Create (query, passage) pairs for the cross-encoder
        pairs = [(query, chunk.content) for chunk in chunks]
        scores = self._model.predict(pairs, show_progress_bar=False)

        # Assign rerank scores
        for chunk, score in zip(chunks, scores):
            chunk.rerank_score = float(score)

        # Sort by rerank score descending
        chunks.sort(key=lambda c: c.rerank_score, reverse=True)

        reranked = chunks[:top_k]
        logger.info(
            "Reranked %d → %d chunks. Top score: %.4f",
            len(chunks), len(reranked),
            reranked[0].rerank_score if reranked else 0,
        )
        return reranked


# Module-level singleton
reranker = Reranker()
