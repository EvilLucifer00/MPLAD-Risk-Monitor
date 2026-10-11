"""LangGraph conditional edge functions for the Self-RAG workflow."""

from __future__ import annotations

MAX_RETRIEVAL_RETRIES = 2
MAX_GROUNDING_RETRIES = 1


def should_retrieve(state: dict) -> str:
    """After query analysis, decide whether to retrieve or answer directly."""
    if state.get("needs_retrieval", True):
        return "retrieve"
    return "generate"


def check_retrieval_quality(state: dict) -> str:
    """After retrieval quality check, decide whether to rewrite query or proceed."""
    quality = state.get("retrieval_quality", "poor")
    retry_count = state.get("retrieval_retry_count", 0)

    if quality in ("good", "moderate"):
        return "generate"

    if retry_count < MAX_RETRIEVAL_RETRIES:
        return "rewrite"

    # Max retries reached — proceed with what we have
    return "generate"


def check_grounding_quality(state: dict) -> str:
    """After grounding check, decide whether to retrieve more or finalize."""
    grounding = state.get("grounding_quality", "unknown")
    retry_count = state.get("grounding_retry_count", 0)

    if grounding in ("good", "moderate"):
        return "finalize"

    if retry_count < MAX_GROUNDING_RETRIES:
        return "retrieve_more"

    # Max retries — finalize with disclaimer
    return "finalize"
