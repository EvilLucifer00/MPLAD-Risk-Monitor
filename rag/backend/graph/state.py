"""RAGState — TypedDict definition for the LangGraph workflow state."""

from __future__ import annotations
from typing import TypedDict, Optional, List

from sqlalchemy.ext.asyncio import AsyncSession

from guardrails.schemas import GuardrailResult, OutputGuardrailResult
from retrieval.hybrid import RetrievedChunk


class RAGState(TypedDict, total=False):
    """Full state for the Self-RAG LangGraph workflow.

    All fields are optional (total=False) so the state can be
    incrementally built by nodes.
    """
    # ── Input ────────────────────────────────────────────────────────────
    query: str
    user: dict | None              # None = anonymous, dict = MP/DM claims
    conversation_id: str | None
    user_id: str | None            # RAG-internal user ID
    db: AsyncSession

    # ── Query Analysis ───────────────────────────────────────────────────
    query_analysis: dict
    search_query: str
    needs_retrieval: bool
    data_sources: list[str]        # ['documents', 'projects']

    # ── Memory ───────────────────────────────────────────────────────────
    conversation_context: list[dict]
    conversation_summary: str | None
    memories: list[dict]

    # ── Retrieval ────────────────────────────────────────────────────────
    retrieved_chunks: list
    reranked_chunks: list
    project_data: list[dict] | None
    retrieval_latency_ms: int

    # ── Generation ───────────────────────────────────────────────────────
    answer: str
    citations: list[dict]

    # ── Quality ──────────────────────────────────────────────────────────
    retrieval_quality: str
    quality_score: float
    grounding_score: float
    grounding_quality: str
    grounding_issues: str

    # ── Guardrails ───────────────────────────────────────────────────────
    input_guardrail_result: GuardrailResult
    output_guardrail_result: OutputGuardrailResult

    # ── Counters ─────────────────────────────────────────────────────────
    retrieval_retry_count: int
    grounding_retry_count: int

    # ── Cache ────────────────────────────────────────────────────────────
    query_embedding: list[float]
    cache_hit: bool

    # ── Output ───────────────────────────────────────────────────────────
    final_answer: dict
