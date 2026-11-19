"""LangGraph Self-RAG workflow — the main orchestration graph.

Rebuilt with:
- Input guardrails (short-circuit on block)
- Semantic cache (short-circuit on hit)
- Dual-mode data source routing (documents, projects, hybrid)
- Output guardrails (grounding, hallucination, factuality, safety)
- Cache store (save good answers)
- Memory extraction with embeddings

Graph flow:
    input_guardrails
        ↓ (pass / blocked → END)
    cache_lookup
        ↓ (miss / hit → END)
    query_analysis
        ↓ (conditional: retrieve or generate)
    memory_retrieval
        ↓ (conditional: documents_only / projects_only / hybrid)
    [document_retrieval]
    [project_data_retrieval]
        ↓
    retrieval_quality_check
        ↓ (conditional: generate or rewrite)
    [query_rewrite → document_retrieval → quality_check] (loop max 2)
        ↓
    generate_answer
        ↓
    output_guardrails
        ↓ (conditional: finalize or retrieve_more)
    [retrieve_more → generate → output_guardrails] (loop max 1)
        ↓
    final_answer
        ↓
    memory_extraction
        ↓
    cache_store
        ↓
    END
"""

from __future__ import annotations
import logging

from langgraph.graph import StateGraph, END

from graph.nodes import (
    input_guardrails_node,
    cache_lookup_node,
    query_analysis_node,
    memory_retrieval_node,
    document_retrieval_node,
    project_data_retrieval_node,
    retrieval_quality_check_node,
    query_rewrite_node,
    generate_answer_node,
    output_guardrails_node,
    retrieve_more_context_node,
    final_answer_node,
    memory_extraction_node,
    cache_store_node,
)
from graph.edges import (
    check_input_guardrail,
    check_cache,
    should_retrieve,
    route_data_sources,
    check_retrieval_quality,
    check_output_guardrails,
)

logger = logging.getLogger(__name__)


def build_rag_graph() -> StateGraph:
    """Build and compile the Self-RAG LangGraph workflow."""
    graph = StateGraph(dict)

    # ── Add nodes ────────────────────────────────────────────────────────
    graph.add_node("input_guardrails", input_guardrails_node)
    graph.add_node("cache_lookup", cache_lookup_node)
    graph.add_node("query_analysis", query_analysis_node)
    graph.add_node("memory_retrieval", memory_retrieval_node)
    graph.add_node("document_retrieval", document_retrieval_node)
    graph.add_node("project_data_retrieval", project_data_retrieval_node)
    graph.add_node("retrieval_quality_check", retrieval_quality_check_node)
    graph.add_node("query_rewrite", query_rewrite_node)
    graph.add_node("generate_answer", generate_answer_node)
    graph.add_node("output_guardrails", output_guardrails_node)
    graph.add_node("retrieve_more", retrieve_more_context_node)
    graph.add_node("final_answer", final_answer_node)
    graph.add_node("memory_extraction", memory_extraction_node)
    graph.add_node("cache_store", cache_store_node)

    # ── Set entry point ──────────────────────────────────────────────────
    graph.set_entry_point("input_guardrails")

    # ── Add edges ────────────────────────────────────────────────────────

    # Input guardrails → proceed or short-circuit
    graph.add_conditional_edges(
        "input_guardrails",
        check_input_guardrail,
        {
            "proceed": "cache_lookup",
            "blocked": END,  # final_answer already set by node
        },
    )

    # Cache lookup → hit (skip pipeline) or miss (continue)
    graph.add_conditional_edges(
        "cache_lookup",
        check_cache,
        {
            "cache_hit": END,  # final_answer already set by node
            "cache_miss": "query_analysis",
        },
    )

    # Query analysis → retrieve or generate directly
    graph.add_conditional_edges(
        "query_analysis",
        should_retrieve,
        {
            "retrieve": "memory_retrieval",
            "generate": "generate_answer",
        },
    )

    # Memory retrieval → route to data sources
    graph.add_conditional_edges(
        "memory_retrieval",
        route_data_sources,
        {
            "documents_only": "document_retrieval",
            "projects_only": "project_data_retrieval",
            "hybrid": "document_retrieval",  # Documents first, then projects
        },
    )

    # Document retrieval → quality check
    graph.add_edge("document_retrieval", "retrieval_quality_check")

    # Project data retrieval → generate (project queries skip quality check)
    graph.add_edge("project_data_retrieval", "generate_answer")

    # Retrieval quality check → generate or rewrite
    graph.add_conditional_edges(
        "retrieval_quality_check",
        check_retrieval_quality,
        {
            "generate": "generate_answer",
            "rewrite": "query_rewrite",
        },
    )

    # Query rewrite loops back to document retrieval
    graph.add_edge("query_rewrite", "document_retrieval")

    # Generate answer → output guardrails
    graph.add_edge("generate_answer", "output_guardrails")

    # Output guardrails → finalize or retrieve more
    graph.add_conditional_edges(
        "output_guardrails",
        check_output_guardrails,
        {
            "finalize": "final_answer",
            "retrieve_more": "retrieve_more",
        },
    )

    # Retrieve more → generate again
    graph.add_edge("retrieve_more", "generate_answer")

    # Final answer → memory extraction → cache store → END
    graph.add_edge("final_answer", "memory_extraction")
    graph.add_edge("memory_extraction", "cache_store")
    graph.add_edge("cache_store", END)

    # ── Compile ──────────────────────────────────────────────────────────
    compiled = graph.compile()
    logger.info("Self-RAG LangGraph workflow compiled successfully.")
    return compiled


# Compile graph once at module level
rag_workflow = build_rag_graph()
