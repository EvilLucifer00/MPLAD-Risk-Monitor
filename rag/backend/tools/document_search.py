"""Document search tool — searches MPLADS guideline documents via hybrid retrieval.

Available to ALL users (anonymous + authenticated).
This is the primary information source for the RAG agent.
"""

from __future__ import annotations
import logging
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from retrieval.hybrid import hybrid_search, RetrievedChunk
from reranking.reranker import reranker

logger = logging.getLogger(__name__)
settings = get_settings()


async def search_documents(
    query: str,
    db: AsyncSession,
    top_k: int | None = None,
    document_ids: List[str] | None = None,
) -> List[RetrievedChunk]:
    """Search ingested MPLADS documents using hybrid retrieval + reranking.

    Args:
        query: Search query text.
        db: Database session.
        top_k: Number of retrieval results (before reranking).
        document_ids: Optional filter by specific document IDs.

    Returns:
        List of reranked chunks sorted by relevance.
    """
    top_k = top_k or settings.retrieval_top_k

    # Phase 1: Hybrid retrieval (ChromaDB semantic + PG keyword)
    chunks = await hybrid_search(
        query=query,
        db=db,
        top_k=top_k,
        document_ids=document_ids,
    )

    if not chunks:
        logger.info("No documents found for query: '%s'", query[:80])
        return []

    # Phase 2: Reranking
    reranked = reranker.rerank(
        query=query,
        chunks=chunks,
        top_k=settings.rerank_top_k,
    )

    logger.info(
        "Document search: %d retrieved → %d reranked for: '%s'",
        len(chunks), len(reranked), query[:60],
    )
    return reranked
