"""LangGraph Self-RAG node functions.

Each node receives and returns the shared RAGState TypedDict.
Nodes use the unified LLM client (Gemini → Groq fallback)
and local models for embedding/reranking.
"""

from __future__ import annotations
import json
import logging
import time
from typing import List

from config import get_settings
from database.models import Conversation
from sqlalchemy import select
from llm.provider import llm_client
from retrieval.hybrid import hybrid_search, RetrievedChunk
from reranking.reranker import reranker
from memory.manager import memory_manager

logger = logging.getLogger(__name__)
settings = get_settings()


# ── Node: Query Analysis ─────────────────────────────────────────────────────

async def query_analysis_node(state: dict) -> dict:
    """Analyze the user query for intent, entities, and complexity."""
    query = state["query"]

    prompt = f"""Analyze this query about MPLADS (Members of Parliament Local Area Development Scheme).
Determine:
1. The main intent (e.g., factual_lookup, procedure_question, eligibility_check, amount_query, general_info)
2. Key entities mentioned (e.g., amounts, dates, procedures, eligibility criteria)
3. Whether this requires document retrieval (yes/no)

Query: {query}

Respond in JSON format:
{{"intent": "...", "entities": [...], "needs_retrieval": true/false, "search_query": "optimized search query"}}

Only output the JSON, nothing else."""

    try:
        result = await llm_client.generate(prompt, temperature=0.1, max_tokens=300)
        start = result.find("{")
        end = result.rfind("}") + 1
        if start >= 0 and end > start:
            analysis = json.loads(result[start:end])
        else:
            analysis = {"intent": "general", "entities": [], "needs_retrieval": True, "search_query": query}
    except Exception as e:
        logger.warning("Query analysis failed: %s", e)
        analysis = {"intent": "general", "entities": [], "needs_retrieval": True, "search_query": query}

    state["query_analysis"] = analysis
    state["search_query"] = analysis.get("search_query", query)
    state["needs_retrieval"] = analysis.get("needs_retrieval", True)
    return state


# ── Node: Memory Retrieval ───────────────────────────────────────────────────

async def memory_retrieval_node(state: dict) -> dict:
    """Retrieve relevant long-term memories and recent conversation context."""
    db = state["db"]
    user_id = state.get("user_id")
    conversation_id = state.get("conversation_id")

    # Get recent conversation messages and summary
    conversation_context = []
    conversation_summary = None
    if conversation_id:
        conversation_context = await memory_manager.get_conversation_messages(
            conversation_id, db, limit=6
        )
        conv = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
        conv_obj = conv.scalar_one_or_none()
        if conv_obj:
            conversation_summary = conv_obj.summary

    # Get relevant long-term memories from user profile ONLY for new conversations
    memories = []
    if user_id and not conversation_context:
        profile = await memory_manager.get_user_profile(user_id, db)
        if profile:
            for category in ["interests", "facts", "preferences"]:
                for item in profile.get(category, []):
                    memories.append({"content": item["content"]})

    state["conversation_context"] = conversation_context
    state["conversation_summary"] = conversation_summary
    state["memories"] = memories
    return state


# ── Node: Hybrid Retrieval ───────────────────────────────────────────────────

async def hybrid_retrieval_node(state: dict) -> dict:
    """Perform hybrid (semantic + keyword) retrieval from pgvector."""
    db = state["db"]
    search_query = state.get("search_query", state["query"])

    start_time = time.time()
    chunks = await hybrid_search(
        query=search_query,
        db=db,
        top_k=settings.retrieval_top_k,
    )
    elapsed_ms = int((time.time() - start_time) * 1000)

    state["retrieved_chunks"] = chunks
    state["retrieval_latency_ms"] = elapsed_ms
    logger.info("Retrieved %d chunks in %dms", len(chunks), elapsed_ms)
    return state


# ── Node: Reranking ──────────────────────────────────────────────────────────

async def reranking_node(state: dict) -> dict:
    """Rerank retrieved chunks using BGE cross-encoder."""
    chunks = state.get("retrieved_chunks", [])
    if not chunks:
        state["reranked_chunks"] = []
        return state

    reranked = reranker.rerank(
        query=state["query"],
        chunks=chunks,
        top_k=settings.rerank_top_k,
    )
    state["reranked_chunks"] = reranked
    return state


# ── Node: Retrieval Quality Check ────────────────────────────────────────────

async def retrieval_quality_check_node(state: dict) -> dict:
    """Check if retrieved chunks are relevant enough to answer the query."""
    chunks = state.get("reranked_chunks", [])

    if not chunks:
        state["retrieval_quality"] = "poor"
        state["quality_score"] = 0.0
        return state

    # Use rerank scores as a proxy for relevance
    top_score = chunks[0].rerank_score if chunks else 0.0
    avg_score = sum(c.rerank_score for c in chunks) / len(chunks) if chunks else 0.0

    # Quality thresholds
    if top_score > 0.5 and avg_score > 0.1:
        quality = "good"
    elif top_score > 0.2:
        quality = "moderate"
    else:
        quality = "poor"

    state["retrieval_quality"] = quality
    state["quality_score"] = top_score
    logger.info("Retrieval quality: %s (top=%.3f, avg=%.3f)", quality, top_score, avg_score)
    return state


# ── Node: Query Rewrite ──────────────────────────────────────────────────────

async def query_rewrite_node(state: dict) -> dict:
    """Rewrite the query to improve retrieval when quality is poor."""
    retry_count = state.get("retrieval_retry_count", 0)
    state["retrieval_retry_count"] = retry_count + 1

    prompt = f"""The following query about MPLADS did not retrieve good results. 
Rewrite it to be more specific and use different keywords while preserving the original intent.

Original query: {state['query']}
Previous search query: {state.get('search_query', state['query'])}

Provide ONLY the rewritten query, nothing else."""

    try:
        rewritten = await llm_client.generate(prompt, temperature=0.5, max_tokens=100)
        state["search_query"] = rewritten.strip().strip('"').strip("'")
        logger.info("Query rewritten: '%s' → '%s'", state["query"], state["search_query"])
    except Exception as e:
        logger.warning("Query rewrite failed: %s", e)

    return state


# ── Node: Generate Answer ────────────────────────────────────────────────────

async def generate_answer_node(state: dict) -> dict:
    """Generate an answer using the LLM with retrieved context and citations."""
    chunks = state.get("reranked_chunks", [])
    query = state["query"]
    conversation_context = state.get("conversation_context", [])
    conversation_summary = state.get("conversation_summary", None)
    memories = state.get("memories", [])

    # Build context with source citations
    context_parts = []
    for i, chunk in enumerate(chunks):
        source_info = f"[Source: {chunk.document_name}"
        if chunk.page_number:
            source_info += f", Page {chunk.page_number}"
        if chunk.section:
            source_info += f", Section: {chunk.section}"
        source_info += f"]"
        context_parts.append(f"--- Context {i + 1} {source_info} ---\n{chunk.content}")

    context_text = "\n\n".join(context_parts) if context_parts else "No relevant documents found."

    # Build conversation history
    conv_history = ""
    if conversation_context or conversation_summary:
        conv_parts = []
        if conversation_summary:
            conv_parts.append(f"Previous Conversation Summary:\n{conversation_summary}")
        if conversation_context:
            conv_lines = []
            for msg in conversation_context[-4:]:
                conv_lines.append(f"{msg['role'].upper()}: {msg['content']}")
            conv_parts.append("Recent Messages:\n" + "\n".join(conv_lines))
        conv_history = "\n\n" + "\n\n".join(conv_parts)

    # Build memory context
    memory_text = ""
    if memories:
        mem_lines = [m['content'] for m in memories]
        memory_text = f"\n\nUser Context from past conversations:\n" + ", ".join(mem_lines)

    prompt = f"""You are an expert assistant on MPLADS (Members of Parliament Local Area Development Scheme).

IMPORTANT RULES:
1. Answer ONLY based on the provided document context below. Do NOT use your own knowledge about MPLADS.
2. If the documents do not contain enough information to answer, say: "Based on the available MPLADS documents, I don't have enough information to answer this question accurately."
3. ALWAYS cite your sources using the format [Source: document_name, Page X] when stating facts.
4. NEVER invent MPLADS rules, amounts, dates, procedures, or statistics.
5. Be precise and specific in your answers.
{conv_history}{memory_text}

Document Context:
{context_text}

User Question: {query}

Provide a detailed, well-structured answer with proper citations:"""

    try:
        answer = await llm_client.generate(prompt, temperature=0.2, max_tokens=1500)
    except Exception as e:
        logger.error("Answer generation failed: %s", e)
        answer = "I'm sorry, I encountered an error generating a response. Please try again."

    # Extract citation information
    citations = []
    for chunk in chunks:
        citations.append({
            "chunk_id": chunk.chunk_id,
            "document_name": chunk.document_name,
            "page_number": chunk.page_number,
            "section": chunk.section,
            "content_preview": chunk.content[:200],
            "rerank_score": chunk.rerank_score,
        })

    state["answer"] = answer
    state["citations"] = citations
    return state


# ── Node: Grounding Check ───────────────────────────────────────────────────

async def grounding_check_node(state: dict) -> dict:
    """Check if the generated answer is faithfully grounded in the retrieved context."""
    answer = state.get("answer", "")
    chunks = state.get("reranked_chunks", [])

    if not chunks or not answer:
        state["grounding_quality"] = "unknown"
        state["grounding_score"] = 0.0
        return state

    context_text = "\n\n".join(c.content for c in chunks[:3])

    prompt = f"""You are a fact-checking judge. Evaluate whether the following answer is faithfully grounded in the provided context.

Context:
{context_text[:2000]}

Answer:
{answer[:1500]}

Rate the grounding on a scale of 1-5:
1 = Answer contains claims not in the context (hallucinated)
2 = Answer partially supported, some unverified claims
3 = Answer mostly supported but vague
4 = Answer well supported by context
5 = Answer perfectly grounded in context

Respond with ONLY a JSON object: {{"score": N, "issues": "brief description of any issues"}}"""

    try:
        result = await llm_client.generate(prompt, temperature=0.1, max_tokens=200)
        start = result.find("{")
        end = result.rfind("}") + 1
        if start >= 0 and end > start:
            check = json.loads(result[start:end])
            score = int(check.get("score", 3))
            issues = check.get("issues", "")
        else:
            score = 3
            issues = ""
    except Exception as e:
        logger.warning("Grounding check failed: %s", e)
        score = 3
        issues = ""

    state["grounding_score"] = score / 5.0
    state["grounding_issues"] = issues

    if score >= 4:
        state["grounding_quality"] = "good"
    elif score >= 3:
        state["grounding_quality"] = "moderate"
    else:
        state["grounding_quality"] = "poor"

    logger.info("Grounding quality: %s (score=%d/5)", state["grounding_quality"], score)
    return state


# ── Node: Retrieve More Context ─────────────────────────────────────────────

async def retrieve_more_context_node(state: dict) -> dict:
    """Retrieve additional context when grounding is poor."""
    grounding_retry = state.get("grounding_retry_count", 0)
    state["grounding_retry_count"] = grounding_retry + 1

    db = state["db"]
    # Broaden the search
    additional = await hybrid_search(
        query=state["query"],
        db=db,
        top_k=settings.retrieval_top_k * 2,
    )

    # Merge with existing, removing duplicates
    existing_ids = {c.chunk_id for c in state.get("reranked_chunks", [])}
    new_chunks = [c for c in additional if c.chunk_id not in existing_ids]

    if new_chunks:
        all_chunks = state.get("reranked_chunks", []) + new_chunks[:5]
        # Re-rerank
        all_chunks = reranker.rerank(state["query"], all_chunks, top_k=settings.rerank_top_k + 2)
        state["reranked_chunks"] = all_chunks

    logger.info("Retrieved %d additional chunks for grounding improvement", len(new_chunks))
    return state


# ── Node: Final Answer ──────────────────────────────────────────────────────

async def final_answer_node(state: dict) -> dict:
    """Prepare the final answer with citations and metadata."""
    grounding_quality = state.get("grounding_quality", "unknown")

    # Add disclaimer if grounding is poor
    if grounding_quality == "poor":
        disclaimer = (
            "\n\n⚠️ **Note**: This response may not be fully supported by the available "
            "MPLADS documents. Please verify the information independently."
        )
        state["answer"] = state.get("answer", "") + disclaimer

    state["final_answer"] = {
        "content": state.get("answer", ""),
        "citations": state.get("citations", []),
        "retrieval_quality": state.get("retrieval_quality", "unknown"),
        "grounding_quality": grounding_quality,
        "grounding_score": state.get("grounding_score", 0.0),
        "retrieval_retry_count": state.get("retrieval_retry_count", 0),
        "grounding_retry_count": state.get("grounding_retry_count", 0),
        "latency_ms": state.get("retrieval_latency_ms", 0),
        "llm_provider": llm_client.active_provider_name,
    }
    return state


# ── Node: Memory Extraction ─────────────────────────────────────────────────

async def memory_extraction_node(state: dict) -> dict:
    """Extract and store important information from this exchange."""
    db = state["db"]
    user_id = state.get("user_id")
    conversation_id = state.get("conversation_id")

    if user_id and conversation_id:
        await memory_manager.extract_and_store_memories(
            user_id=user_id,
            conversation_id=conversation_id,
            user_message=state["query"],
            assistant_response=state.get("answer", ""),
            db=db,
        )

    return state
