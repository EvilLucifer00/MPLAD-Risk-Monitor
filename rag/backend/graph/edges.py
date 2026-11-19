"""LangGraph conditional edge functions for the Self-RAG workflow.

Updated to support:
- Input guardrail short-circuit
- Cache hit short-circuit
- Dual-mode data source routing (documents vs projects vs hybrid)
- Output guardrail-driven grounding retry
"""

from __future__ import annotations

MAX_RETRIEVAL_RETRIES = 2
MAX_GROUNDING_RETRIES = 1


def check_input_guardrail(state: dict) -> str:
    """After input guardrails, decide whether to proceed or short-circuit."""
    result = state.get("input_guardrail_result")
    if result and not result.passed:
        return "blocked"  # Jump straight to END (final_answer already set)
    return "proceed"


def check_cache(state: dict) -> str:
    """After cache lookup, decide whether to use cached answer or continue pipeline."""
    if state.get("cache_hit", False):
        return "cache_hit"  # Jump to END (final_answer already set)
    return "cache_miss"


def should_retrieve(state: dict) -> str:
    """After query analysis, decide whether to retrieve or answer directly."""
    if state.get("needs_retrieval", True):
        return "retrieve"
    return "generate"


def route_data_sources(state: dict) -> str:
    """After memory retrieval, route to the appropriate data source(s)."""
    data_sources = state.get("data_sources", ["documents"])

    if "projects" in data_sources and "documents" in data_sources:
        return "hybrid"  # Both document + project retrieval
    elif "projects" in data_sources:
        return "projects_only"
    else:
        return "documents_only"


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


def check_output_guardrails(state: dict) -> str:
    """After output guardrails, decide whether to finalize or retrieve more."""
    result = state.get("output_guardrail_result")
    grounding_quality = state.get("grounding_quality", "unknown")
    retry_count = state.get("grounding_retry_count", 0)

    if grounding_quality in ("good", "moderate"):
        return "finalize"

    if retry_count < MAX_GROUNDING_RETRIES:
        return "retrieve_more"

    # Max retries — finalize with disclaimer (already added by output guardrails)
    return "finalize"
