"""Hybrid retrieval — combines ChromaDB semantic search with PostgreSQL keyword (tsvector) search.

ChromaDB handles the dense vector (semantic) search, while PostgreSQL
performs sparse keyword matching via tsvector. Results are fused
using Reciprocal Rank Fusion (RRF).
"""

from __future__ import annotations
import logging
from dataclasses import dataclass, field
from typing import List, Optional
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from vectorstore.chroma_store import chroma_store

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class RetrievedChunk:
    """A chunk returned from retrieval with scores and metadata."""
    chunk_id: str
    document_id: str
    content: str
    content_type: str
    page_number: Optional[int]
    section: Optional[str]
    heading_hierarchy: list
    document_name: str
    semantic_score: float = 0.0
    keyword_score: float = 0.0
    combined_score: float = 0.0
    rerank_score: float = 0.0
    metadata: dict = field(default_factory=dict)


async def semantic_search(
    query: str,
    db: AsyncSession,
    top_k: int | None = None,
    document_ids: List[str] | None = None,
) -> List[RetrievedChunk]:
    """Vector similarity search using ChromaDB."""
    top_k = top_k or settings.retrieval_top_k

    results = chroma_store.semantic_search(
        query=query,
        top_k=top_k,
        document_ids=document_ids,
    )

    chunks = []
    for r in results:
        chunks.append(RetrievedChunk(
            chunk_id=r["chunk_id"],
            document_id=r["document_id"],
            content=r["content"],
            content_type=r["content_type"],
            page_number=r.get("page_number") or None,
            section=r.get("section") or None,
            heading_hierarchy=eval(r.get("heading_hierarchy", "[]")) if isinstance(r.get("heading_hierarchy"), str) else r.get("heading_hierarchy", []),
            document_name=r["document_name"],
            semantic_score=float(r["similarity"]),
        ))

    logger.info("ChromaDB semantic search: %d results for query", len(chunks))
    return chunks


async def keyword_search(
    query: str,
    db: AsyncSession,
    top_k: int | None = None,
    document_ids: List[str] | None = None,
) -> List[RetrievedChunk]:
    """Full-text keyword search using PostgreSQL tsvector/tsquery."""
    top_k = top_k or settings.retrieval_top_k

    doc_filter = ""
    params = {"query": query, "top_k": top_k}

    if document_ids:
        placeholders = ", ".join(f":doc_{i}" for i in range(len(document_ids)))
        doc_filter = f"AND c.document_id IN ({placeholders})"
        for i, did in enumerate(document_ids):
            params[f"doc_{i}"] = did

    sql = f"""
        SELECT
            c.id AS chunk_id,
            c.document_id,
            c.content,
            c.content_type,
            c.page_number,
            c.section,
            c.heading_hierarchy,
            d.name AS document_name,
            ts_rank_cd(c.search_vector, plainto_tsquery('english', :query)) AS rank
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.search_vector @@ plainto_tsquery('english', :query)
          AND d.status = 'ready'
          {doc_filter}
        ORDER BY rank DESC
        LIMIT :top_k
    """

    result = await db.execute(text(sql), params)
    rows = result.fetchall()

    chunks = []
    for row in rows:
        chunks.append(RetrievedChunk(
            chunk_id=str(row.chunk_id),
            document_id=str(row.document_id),
            content=row.content,
            content_type=row.content_type,
            page_number=row.page_number,
            section=row.section,
            heading_hierarchy=row.heading_hierarchy or [],
            document_name=row.document_name,
            keyword_score=float(row.rank),
        ))

    return chunks


async def hybrid_search(
    query: str,
    db: AsyncSession,
    top_k: int | None = None,
    document_ids: List[str] | None = None,
    semantic_weight: float = 0.7,
    keyword_weight: float = 0.3,
) -> List[RetrievedChunk]:
    """Hybrid retrieval combining semantic and keyword search with RRF fusion."""
    top_k = top_k or settings.retrieval_top_k
    fetch_k = top_k * 2  # fetch more to allow merge

    # Run both searches
    semantic_results = await semantic_search(query, db, top_k=fetch_k, document_ids=document_ids)
    keyword_results = await keyword_search(query, db, top_k=fetch_k, document_ids=document_ids)

    # Reciprocal Rank Fusion (RRF)
    rrf_k = 60  # standard RRF constant
    scores: dict[str, float] = {}
    chunk_map: dict[str, RetrievedChunk] = {}

    for rank, chunk in enumerate(semantic_results):
        rrf_score = semantic_weight / (rrf_k + rank + 1)
        scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0) + rrf_score
        if chunk.chunk_id not in chunk_map:
            chunk_map[chunk.chunk_id] = chunk

    for rank, chunk in enumerate(keyword_results):
        rrf_score = keyword_weight / (rrf_k + rank + 1)
        scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0) + rrf_score
        if chunk.chunk_id not in chunk_map:
            chunk_map[chunk.chunk_id] = chunk
        else:
            # Merge keyword score into existing
            chunk_map[chunk.chunk_id].keyword_score = chunk.keyword_score

    # Sort by combined RRF score
    sorted_ids = sorted(scores.keys(), key=lambda cid: scores[cid], reverse=True)[:top_k]

    results = []
    for cid in sorted_ids:
        chunk = chunk_map[cid]
        chunk.combined_score = scores[cid]
        results.append(chunk)

    logger.info(
        "Hybrid search: %d semantic + %d keyword → %d merged results",
        len(semantic_results), len(keyword_results), len(results),
    )
    return results
