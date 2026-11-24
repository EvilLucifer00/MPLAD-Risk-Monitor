"""LangGraph Self-RAG node functions — rebuilt with LLM Router, guardrails, cache, and dual-mode access.

Each node receives and returns the shared RAGState dict.
Nodes use the LLM Router for all LLM calls and support
both document and project data retrieval.
"""

from __future__ import annotations
import json
import logging
import time
from typing import List

from config import get_settings
from llm.router import llm_router, TaskType
from tools.document_search import search_documents
from tools.project_lookup import lookup_mp_projects, get_mp_dashboard_summary, format_projects_for_context
from memory.manager import memory_manager
from embeddings.encoder import encoder
from cache.semantic_cache import semantic_cache
from guardrails.input_guard import check_input
from guardrails.output_guard import check_output
from retrieval.hybrid import hybrid_search, RetrievedChunk
from reranking.reranker import reranker

logger = logging.getLogger(__name__)
settings = get_settings()


# ── Node: Input Guardrails ───────────────────────────────────────────────────

async def input_guardrails_node(state: dict) -> dict:
    """Run input guardrails on the user's message."""
    result = await check_input(state["query"])
    state["input_guardrail_result"] = result

    if not result.passed:
        # Short-circuit: set final answer to the block reason
        state["final_answer"] = {
            "content": result.blocked_reason or "Your message was blocked by our safety filters.",
            "citations": [],
            "retrieval_quality": "n/a",
            "grounding_quality": "n/a",
            "grounding_score": 0.0,
            "blocked": True,
            "block_flags": result.flags,
        }
        logger.info("Input guardrail blocked: %s", result.flags)

    # Use sanitized message (PII-redacted) if available
    if result.sanitized_message:
        state["query"] = result.sanitized_message

    return state


# ── Node: Cache Lookup ───────────────────────────────────────────────────────

async def cache_lookup_node(state: dict) -> dict:
    """Check semantic cache for a similar previous query."""
    db = state["db"]
    user = state.get("user")
    user_role = user.get("role", "anonymous") if user else "anonymous"
    user_id = user.get("id") if user else None

    # Compute query embedding (reused later for retrieval + cache storage)
    query_embedding = encoder.encode_query(state["query"])
    state["query_embedding"] = query_embedding

    cached = await semantic_cache.lookup(
        query=state["query"],
        query_embedding=query_embedding,
        db=db,
        user_role=user_role,
        user_id=user_id,
    )

    if cached:
        state["cache_hit"] = True
        state["final_answer"] = {
            "content": cached["answer_text"],
            "citations": cached.get("citations", []),
            "retrieval_quality": "cached",
            "grounding_quality": "cached",
            "grounding_score": cached.get("metadata", {}).get("grounding_score", 1.0),
            "cache_hit": True,
        }
        logger.info("Cache HIT — skipping RAG pipeline")
    else:
        state["cache_hit"] = False

    return state


# ── Node: Query Analysis ─────────────────────────────────────────────────────

async def query_analysis_node(state: dict) -> dict:
    """Analyze the user query for intent, entities, and data sources needed."""
    query = state["query"]
    user = state.get("user")
    is_authenticated = user is not None

    # Determine available data sources based on auth
    data_source_hint = ""
    if is_authenticated:
        data_source_hint = """
4. Whether this question is about the user's own project data (e.g., "my projects", "my funds", "my district") — mark as 'project_data'
5. Whether both document context AND project data are needed — mark as 'hybrid'"""

    prompt = f"""Analyze this query about MPLADS (Members of Parliament Local Area Development Scheme).
Determine:
1. The main intent (e.g., factual_lookup, procedure_question, eligibility_check, amount_query, general_info, project_status, dashboard)
2. Key entities mentioned (e.g., amounts, dates, procedures, eligibility criteria, project names)
3. Whether this requires document retrieval (yes/no)
{data_source_hint}

Query: {query}

Respond in JSON format:
{{"intent": "...", "entities": [...], "needs_retrieval": true/false, "search_query": "optimized search query", "data_sources": ["documents"]}}

data_sources can be: ["documents"], ["projects"], ["documents", "projects"]
Default to ["documents"] if unsure.

Only output the JSON, nothing else."""

    try:
        result = await llm_router.generate(
            TaskType.QUERY_ANALYSIS, prompt,
            temperature=0.1, max_tokens=300,
        )
        start = result.find("{")
        end = result.rfind("}") + 1
        if start >= 0 and end > start:
            analysis = json.loads(result[start:end])
        else:
            analysis = {"intent": "general", "entities": [], "needs_retrieval": True,
                        "search_query": query, "data_sources": ["documents"]}
    except Exception as e:
        logger.warning("Query analysis failed: %s", e)
        analysis = {"intent": "general", "entities": [], "needs_retrieval": True,
                    "search_query": query, "data_sources": ["documents"]}

    # Enforce auth: if project data requested but user is anonymous, restrict
    data_sources = analysis.get("data_sources", ["documents"])
    if "projects" in data_sources and not is_authenticated:
        data_sources = ["documents"]
        analysis["auth_redirect"] = True

    state["query_analysis"] = analysis
    state["search_query"] = analysis.get("search_query", query)
    state["needs_retrieval"] = analysis.get("needs_retrieval", True)
    state["data_sources"] = data_sources
    return state


# ── Node: Memory Retrieval ───────────────────────────────────────────────────

async def memory_retrieval_node(state: dict) -> dict:
    """Retrieve relevant long-term memories and recent conversation context."""
    db = state["db"]
    user_id = state.get("user_id")
    conversation_id = state.get("conversation_id")

    context = await memory_manager.get_full_context(
        query=state["query"],
        conversation_id=conversation_id,
        user_id=user_id,
        db=db,
    )

    state["conversation_context"] = context["conversation_context"]
    state["conversation_summary"] = context["conversation_summary"]
    state["memories"] = context["memories"]
    return state


# ── Node: Document Retrieval ─────────────────────────────────────────────────

async def document_retrieval_node(state: dict) -> dict:
    """Retrieve relevant document chunks via hybrid search + reranking."""
    db = state["db"]
    search_query = state.get("search_query", state["query"])

    start_time = time.time()
    reranked_chunks = await search_documents(query=search_query, db=db)
    elapsed_ms = int((time.time() - start_time) * 1000)

    state["retrieved_chunks"] = reranked_chunks  # Already reranked by search_documents
    state["reranked_chunks"] = reranked_chunks
    state["retrieval_latency_ms"] = elapsed_ms
    logger.info("Document retrieval: %d reranked chunks in %dms", len(reranked_chunks), elapsed_ms)

    # If hybrid routing was selected, also populate MP project data
    data_sources = state.get("data_sources", ["documents"])
    if "projects" in data_sources:
        state = await project_data_retrieval_node(state)

    return state


# ── Node: Project Data Retrieval ─────────────────────────────────────────────

async def project_data_retrieval_node(state: dict) -> dict:
    """Fetch the MP's project data from the main platform database."""
    user = state.get("user")
    if not user or user.get("role") not in ("mp", "dm"):
        state["project_data"] = None
        return state

    mp_id = user.get("id")
    query_analysis = state.get("query_analysis", {})
    intent = query_analysis.get("intent", "")

    try:
        if intent == "dashboard":
            # Get aggregated dashboard stats
            summary = await get_mp_dashboard_summary(mp_id)
            state["project_data"] = [summary]
        else:
            # Get project list with any detected filters
            projects = await lookup_mp_projects(
                mp_id=mp_id,
                status_filter=None,  # Could extract from query analysis
                limit=20,
            )
            state["project_data"] = projects
    except Exception as e:
        logger.error("Project data retrieval failed: %s", e)
        state["project_data"] = None

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
        rewritten = await llm_router.generate(
            TaskType.QUERY_REWRITE, prompt,
            temperature=0.5, max_tokens=150,
        )
        # Reasoning models may dump their thinking process — extract the last
        # clean sentence that looks like a query (no "We need to", etc.)
        cleaned = rewritten.strip().strip('"').strip("'")
        lines = [ln.strip().strip('"').strip("'") for ln in cleaned.splitlines() if ln.strip()]
        # Pick the last non-meta line, or fall back to first line
        query_line = lines[-1] if lines else cleaned
        # If it still contains reasoning preamble, just use the original query
        if len(query_line) > 200 or query_line.lower().startswith(("we need", "the user", "should be")):
            query_line = lines[0] if lines else state["query"]
        if len(query_line) > 200:
            query_line = query_line[:200]
        state["search_query"] = query_line
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
    project_data = state.get("project_data", None)
    user = state.get("user")
    query_analysis = state.get("query_analysis", {})

    # Build document context with source citations
    context_parts = []
    for i, chunk in enumerate(chunks):
        source_info = f"[Source: {chunk.document_name}"
        if chunk.page_number:
            source_info += f", Page {chunk.page_number}"
        if chunk.section:
            source_info += f", Section: {chunk.section}"
        source_info += "]"
        context_parts.append(f"--- Context {i + 1} {source_info} ---\n{chunk.content}")

    context_text = "\n\n".join(context_parts) if context_parts else "No relevant documents found."

    # Build project data context (MP-only)
    project_context = ""
    if project_data and user:
        project_context = f"\n\nMP's Project Data:\n{format_projects_for_context(project_data)}"

    # Build conversation history
    conv_history = ""
    if conversation_context or conversation_summary:
        conv_parts = []
        if conversation_summary:
            conv_parts.append(f"Previous Conversation Summary:\n{conversation_summary}")
        if conversation_context:
            conv_lines = [
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in conversation_context
            ]
            conv_parts.append("Recent Messages:\n" + "\n".join(conv_lines))
        conv_history = "\n\n" + "\n\n".join(conv_parts)

    # Build memory context
    memory_text = ""
    if memories:
        mem_lines = [m['content'] for m in memories]
        memory_text = f"\n\nUser Context from past conversations:\n" + ", ".join(mem_lines)

    # Auth-aware system instruction
    auth_note = ""
    if user and user.get("role") == "mp":
        auth_note = f"\nThe user is an authenticated MP: {user.get('mp_name', 'Unknown')} from {user.get('constituency', 'Unknown')} constituency."
    elif query_analysis.get("auth_redirect"):
        auth_note = "\nNote: The user asked about their project data but is not logged in. Politely suggest they log in to access personalized project information."

    prompt = f"""You are an expert assistant on MPLADS (Members of Parliament Local Area Development Scheme).

IMPORTANT RULES:
1. Answer ONLY based on the provided document context and project data below. Do NOT use your own knowledge about MPLADS.
2. If the documents do not contain enough information to answer, say: "Based on the available MPLADS documents, I don't have enough information to answer this question accurately."
3. ALWAYS cite your sources using the format [Source: document_name, Page X] when stating facts from documents.
4. NEVER invent MPLADS rules, amounts, dates, procedures, or statistics.
5. Be precise and specific in your answers.
{auth_note}{conv_history}{memory_text}

Document Context:
{context_text}
{project_context}

User Question: {query}

Provide a detailed, well-structured answer with proper citations:"""

    try:
        answer = await llm_router.generate(
            TaskType.GENERATE_ANSWER, prompt,
            temperature=0.2, max_tokens=1500,
        )
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


# ── Node: Output Guardrails ──────────────────────────────────────────────────

async def output_guardrails_node(state: dict) -> dict:
    """Run output guardrails on the generated answer."""
    chunks = state.get("reranked_chunks", [])
    result = await check_output(
        answer=state.get("answer", ""),
        chunks=chunks,
        query=state["query"],
    )
    state["output_guardrail_result"] = result
    state["grounding_score"] = result.grounding_score
    state["grounding_quality"] = (
        "good" if result.grounding_score >= 0.8
        else "moderate" if result.grounding_score >= 0.6
        else "poor"
    )

    # Use sanitized answer
    if result.sanitized_answer:
        state["answer"] = result.sanitized_answer

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
        all_chunks = reranker.rerank(state["query"], all_chunks, top_k=settings.rerank_top_k + 2)
        state["reranked_chunks"] = all_chunks

    logger.info("Retrieved %d additional chunks for grounding improvement", len(new_chunks))
    return state


# ── Node: Final Answer ──────────────────────────────────────────────────────

async def final_answer_node(state: dict) -> dict:
    """Prepare the final answer with citations and metadata."""
    state["final_answer"] = {
        "content": state.get("answer", ""),
        "citations": state.get("citations", []),
        "retrieval_quality": state.get("retrieval_quality", "unknown"),
        "grounding_quality": state.get("grounding_quality", "unknown"),
        "grounding_score": state.get("grounding_score", 0.0),
        "retrieval_retry_count": state.get("retrieval_retry_count", 0),
        "grounding_retry_count": state.get("grounding_retry_count", 0),
        "latency_ms": state.get("retrieval_latency_ms", 0),
        "data_sources": state.get("data_sources", ["documents"]),
    }
    return state


# ── Node: Memory Extraction ─────────────────────────────────────────────────

async def memory_extraction_node(state: dict) -> dict:
    """Extract and store important information from this exchange (non-blocking for anonymous)."""
    user = state.get("user")
    # For anonymous users, skip LLM memory extraction entirely to save latency
    if not user:
        return state

    db = state["db"]
    user_id = state.get("user_id")
    conversation_id = state.get("conversation_id")

    if user_id and conversation_id:
        try:
            await memory_manager.extract_and_store_memories(
                user_id=user_id,
                conversation_id=conversation_id,
                user_message=state["query"],
                assistant_response=state.get("answer", ""),
                db=db,
            )
        except Exception as e:
            logger.warning("Memory extraction failed: %s", e)

    return state


# ── Node: Cache Store ────────────────────────────────────────────────────────

async def cache_store_node(state: dict) -> dict:
    """Store the query/answer pair in semantic cache for future reuse."""
    db = state["db"]
    user = state.get("user")
    user_role = user.get("role", "anonymous") if user else "anonymous"
    user_id = user.get("id") if user else None
    query_embedding = state.get("query_embedding")

    if not query_embedding:
        return state

    final = state.get("final_answer", {})
    grounding_score = final.get("grounding_score", 0.0)

    # Only cache good-quality answers
    if grounding_score >= 0.6:
        await semantic_cache.store(
            query=state["query"],
            query_embedding=query_embedding,
            answer=final.get("content", ""),
            citations=final.get("citations"),
            metadata={
                "grounding_score": grounding_score,
                "retrieval_quality": final.get("retrieval_quality"),
                "data_sources": final.get("data_sources", ["documents"]),
            },
            db=db,
            user_role=user_role,
            user_id=user_id,
        )

    return state
