"""LangGraph Self-RAG workflow — the main orchestration graph.

Implements the adaptive retrieval-augmented generation pipeline with:
- Query analysis → Memory → Hybrid retrieval → Reranking → Quality check
- Query rewrite loop (max 2 retries)
- Answer generation → Grounding check
- More context retrieval loop (max 1 retry)
- Memory extraction
"""

from __future__ import annotations
import logging

from langgraph.graph import StateGraph, END

from graph.nodes import (
    query_analysis_node,
    memory_retrieval_node,
    hybrid_retrieval_node,
    reranking_node,
    retrieval_quality_check_node,
    query_rewrite_node,
    generate_answer_node,
    grounding_check_node,
    retrieve_more_context_node,
    final_answer_node,
    memory_extraction_node,
)
from graph.edges import (
    should_retrieve,
    check_retrieval_quality,
    check_grounding_quality,
)

logger = logging.getLogger(__name__)


def build_rag_graph() -> StateGraph:
    """Build and compile the Self-RAG LangGraph workflow.

    Graph flow:
        query_analysis
            ↓ (conditional: retrieve or generate)
        memory_retrieval
            ↓
        hybrid_retrieval
            ↓
        reranking
            ↓
        retrieval_quality_check
            ↓ (conditional: generate or rewrite)
        [query_rewrite → hybrid_retrieval → reranking → quality_check] (loop max 2)
            ↓
        generate_answer
            ↓
        grounding_check
            ↓ (conditional: finalize or retrieve_more)
        [retrieve_more → generate_answer → grounding_check] (loop max 1)
            ↓
        final_answer
            ↓
        memory_extraction
            ↓
        END
    """
    # Define graph with dict state
    graph = StateGraph(dict)

    # ── Add nodes ────────────────────────────────────────────────────────
    graph.add_node("query_analysis", query_analysis_node)
    graph.add_node("memory_retrieval", memory_retrieval_node)
    graph.add_node("hybrid_retrieval", hybrid_retrieval_node)
    graph.add_node("reranking", reranking_node)
    graph.add_node("retrieval_quality_check", retrieval_quality_check_node)
    graph.add_node("query_rewrite", query_rewrite_node)
    graph.add_node("generate_answer", generate_answer_node)
    graph.add_node("grounding_check", grounding_check_node)
    graph.add_node("retrieve_more", retrieve_more_context_node)
    graph.add_node("final_answer", final_answer_node)
    graph.add_node("memory_extraction", memory_extraction_node)

    # ── Set entry point ──────────────────────────────────────────────────
    graph.set_entry_point("query_analysis")

    # ── Add edges ────────────────────────────────────────────────────────

    # After query analysis: decide if retrieval is needed
    graph.add_conditional_edges(
        "query_analysis",
        should_retrieve,
        {
            "retrieve": "memory_retrieval",
            "generate": "generate_answer",
        },
    )

    # Linear flow: memory → retrieval → rerank → quality check
    graph.add_edge("memory_retrieval", "hybrid_retrieval")
    graph.add_edge("hybrid_retrieval", "reranking")
    graph.add_edge("reranking", "retrieval_quality_check")

    # After quality check: proceed or rewrite
    graph.add_conditional_edges(
        "retrieval_quality_check",
        check_retrieval_quality,
        {
            "generate": "generate_answer",
            "rewrite": "query_rewrite",
        },
    )

    # Query rewrite loops back to retrieval
    graph.add_edge("query_rewrite", "hybrid_retrieval")

    # After answer generation: check grounding
    graph.add_edge("generate_answer", "grounding_check")

    # After grounding check: finalize or retrieve more
    graph.add_conditional_edges(
        "grounding_check",
        check_grounding_quality,
        {
            "finalize": "final_answer",
            "retrieve_more": "retrieve_more",
        },
    )

    # Retrieve more loops back to generate
    graph.add_edge("retrieve_more", "generate_answer")

    # Final answer → memory extraction → END
    graph.add_edge("final_answer", "memory_extraction")
    graph.add_edge("memory_extraction", END)

    # ── Compile ──────────────────────────────────────────────────────────
    compiled = graph.compile()
    logger.info("Self-RAG LangGraph workflow compiled successfully.")
    return compiled


# Compile graph once at module level
rag_workflow = build_rag_graph()
