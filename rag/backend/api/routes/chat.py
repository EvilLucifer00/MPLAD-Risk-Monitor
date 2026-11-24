"""Chat API route — the main RAG endpoint with guardrails, cache, and streaming support."""

from __future__ import annotations
import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import ChatRequest, ChatResponse, CitationSchema
from api.dependencies import get_db, get_current_user
from database.models import User, Conversation, Message, RetrievalLog, GuardrailLog
from graph.workflow import rag_workflow
from memory.manager import memory_manager
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/chat", tags=["Chat"])

DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


async def _ensure_user(user_id: str, db: AsyncSession) -> User:
    """Get or create a default user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(id=user_id, username=f"user_{user_id[:8]}", display_name="Default User")
        db.add(user)
        await db.flush()
    return user


async def _ensure_conversation(
    conversation_id: str | None,
    user_id: str,
    db: AsyncSession,
) -> Conversation:
    """Get existing conversation or create a new one."""
    if conversation_id:
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conv = result.scalar_one_or_none()
        if conv:
            return conv

    conv = Conversation(user_id=user_id, title="New Conversation")
    db.add(conv)
    await db.flush()
    return conv


async def _log_guardrail(
    direction: str,
    guardrail_name: str,
    passed: bool,
    blocked_reason: str | None,
    flags: list,
    user_message: str | None,
    user_id: str | None,
    conversation_id: str | None,
    db: AsyncSession,
):
    """Log guardrail results for audit."""
    try:
        log = GuardrailLog(
            direction=direction,
            guardrail_name=guardrail_name,
            passed=passed,
            blocked_reason=blocked_reason,
            user_message=user_message[:500] if user_message else None,
            flags=flags,
            user_id=str(user_id) if user_id else None,
            conversation_id=str(conversation_id) if conversation_id else None,
        )
        db.add(log)
        await db.flush()
    except Exception as e:
        logger.warning("Guardrail logging failed: %s", e)


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Process a chat message through the Self-RAG pipeline with guardrails and cache."""
    # Optional auth — get user from JWT if present
    current_user = await get_current_user(req)

    user_id = request.user_id or DEFAULT_USER_ID
    await _ensure_user(user_id, db)
    conversation = await _ensure_conversation(request.conversation_id, user_id, db)

    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    await db.flush()

    # Update conversation
    conversation.message_count += 1
    conversation.updated_at = datetime.now(timezone.utc)

    # Auto-set title from first message
    if conversation.message_count == 1:
        conversation.title = request.message[:100]

    # ── Run Self-RAG workflow ────────────────────────────────────────────
    initial_state = {
        "query": request.message,
        "user": current_user,  # None for anonymous, dict for MP/DM
        "user_id": str(user_id),
        "conversation_id": str(conversation.id),
        "db": db,
        "retrieval_retry_count": 0,
        "grounding_retry_count": 0,
    }

    try:
        final_state = await rag_workflow.ainvoke(initial_state)
    except Exception as e:
        logger.error("RAG workflow failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"RAG processing error: {str(e)}")

    # Extract final answer
    final = final_state.get("final_answer", {})
    answer_content = final.get("content", "I'm sorry, I couldn't process your request.")
    citations_data = final.get("citations", [])

    # Log guardrail results
    input_guard = final_state.get("input_guardrail_result")
    if input_guard:
        await _log_guardrail(
            "input", "all_input_guards", input_guard.passed,
            input_guard.blocked_reason, input_guard.flags,
            request.message, user_id, str(conversation.id), db,
        )

    output_guard = final_state.get("output_guardrail_result")
    if output_guard:
        await _log_guardrail(
            "output", "all_output_guards", output_guard.passed,
            output_guard.blocked_reason, output_guard.flags,
            None, user_id, str(conversation.id), db,
        )

    # Save assistant message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer_content,
        citations=citations_data,
    )
    db.add(assistant_msg)
    conversation.message_count += 1
    await db.flush()

    # Log retrieval metrics (skip for cache hits and blocked messages)
    if not final.get("cache_hit") and not final.get("blocked"):
        log_entry = RetrievalLog(
            conversation_id=conversation.id,
            query=request.message,
            rewritten_query=final_state.get("search_query"),
            retrieval_method="hybrid",
            chunks_retrieved=len(final_state.get("retrieved_chunks", [])),
            chunks_after_rerank=len(final_state.get("reranked_chunks", [])),
            retrieval_quality_score=final_state.get("quality_score", 0),
            grounding_score=final.get("grounding_score", 0),
            retry_count=final.get("retrieval_retry_count", 0),
            latency_ms=final.get("latency_ms", 0),
        )
        db.add(log_entry)
        await db.flush()

    # Auto-generate a better title after 2nd message (first exchange complete)
    if conversation.message_count == 2:
        try:
            await memory_manager.generate_conversation_title(
                str(conversation.id), db
            )
        except Exception as e:
            logger.warning("Auto-title generation failed: %s", e)

    # Auto-summarize when conversation gets long enough
    if conversation.message_count >= settings.memory_summary_threshold:
        try:
            await memory_manager.summarize_conversation(
                str(conversation.id), db
            )
        except Exception as e:
            logger.warning("Auto-summarization failed: %s", e)

    # Build response
    citations = [
        CitationSchema(
            chunk_id=c.get("chunk_id", ""),
            document_name=c.get("document_name", ""),
            page_number=c.get("page_number"),
            section=c.get("section"),
            content_preview=c.get("content_preview", ""),
            rerank_score=c.get("rerank_score", 0.0),
        )
        for c in citations_data
    ]

    return ChatResponse(
        message=answer_content,
        conversation_id=str(conversation.id),
        message_id=str(assistant_msg.id),
        citations=citations,
        retrieval_quality=final.get("retrieval_quality", "unknown"),
        grounding_quality=final.get("grounding_quality", "unknown"),
        grounding_score=final.get("grounding_score", 0.0),
    )


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    req: Request,
):
    """Streaming chat endpoint using Server-Sent Events with independent DB session lifecycle."""
    current_user = await get_current_user(req)
    user_id = request.user_id or DEFAULT_USER_ID

    async def event_stream():
        from database.connection import async_session
        async with async_session() as db:
            try:
                await _ensure_user(user_id, db)
                conversation = await _ensure_conversation(request.conversation_id, user_id, db)

                # Save user message
                user_msg = Message(conversation_id=conversation.id, role="user", content=request.message)
                db.add(user_msg)
                await db.flush()

                conversation.message_count += 1
                conversation.updated_at = datetime.now(timezone.utc)
                if conversation.message_count == 1:
                    conversation.title = request.message[:100]

                # Send status updates as the pipeline progresses
                yield f"data: {json.dumps({'type': 'status', 'step': 'starting'})}\n\n"

                initial_state = {
                    "query": request.message,
                    "user": current_user,
                    "user_id": str(user_id),
                    "conversation_id": str(conversation.id),
                    "db": db,
                    "retrieval_retry_count": 0,
                    "grounding_retry_count": 0,
                }

                steps_seen = set()
                final_state = None

                async for event in rag_workflow.astream(initial_state):
                    for node_name, node_state in event.items():
                        if node_name not in steps_seen:
                            steps_seen.add(node_name)
                            yield f"data: {json.dumps({'type': 'step', 'step': node_name})}\n\n"
                            yield f"data: {json.dumps({'type': 'status', 'step': node_name})}\n\n"
                        final_state = node_state

                if final_state is None:
                    final_state = initial_state

                final = final_state.get("final_answer", {})
                answer = final.get("content", "I couldn't process your request.")
                citations_data = final.get("citations", [])

                # Save assistant message
                assistant_msg = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=answer,
                    citations=citations_data,
                )
                db.add(assistant_msg)
                conversation.message_count += 1
                await db.commit()

                # Stream token and metadata for frontend
                yield f"data: {json.dumps({'type': 'token', 'token': answer})}\n\n"
                yield f"data: {json.dumps({'type': 'metadata', 'citations': citations_data, 'retrieval_quality': final.get('retrieval_quality', 'unknown'), 'grounding_quality': final.get('grounding_quality', 'unknown'), 'grounding_score': final.get('grounding_score', 0.0)})}\n\n"

                response_data = {
                    'type': 'answer',
                    'content': answer,
                    'message_id': str(assistant_msg.id),
                    'conversation_id': str(conversation.id),
                    'citations': citations_data,
                    'retrieval_quality': final.get('retrieval_quality', 'unknown'),
                    'grounding_quality': final.get('grounding_quality', 'unknown'),
                    'grounding_score': final.get('grounding_score', 0.0),
                    'cache_hit': final.get('cache_hit', False),
                }
                yield f"data: {json.dumps(response_data)}\n\n"

            except Exception as e:
                logger.error("Streaming RAG failed: %s", e, exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

            finally:
                yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
