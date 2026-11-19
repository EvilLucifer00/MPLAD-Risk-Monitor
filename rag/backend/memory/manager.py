"""Memory manager — orchestrates Short-Term Memory (STM) + Long-Term Memory (LTM).

Replaces the old monolithic MemoryManager with a clean orchestrator that
delegates to the new STM and LTM subsystems.
"""

from __future__ import annotations
import json
import logging
from typing import List, Optional, Tuple

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database.models import Conversation, Memory
from memory.short_term import short_term_memory
from memory.long_term import long_term_memory
from llm.router import llm_router, TaskType

logger = logging.getLogger(__name__)
settings = get_settings()


class MemoryManager:
    """Orchestrates STM + LTM for the RAG pipeline."""

    # ── Combined Context Retrieval ───────────────────────────────────────

    async def get_full_context(
        self,
        query: str,
        conversation_id: str | None,
        user_id: str | None,
        db: AsyncSession,
        max_stm_tokens: int = 2000,
    ) -> dict:
        """Get combined context from STM and LTM.

        Returns:
            Dict with conversation_context, conversation_summary, and memories.
        """
        conversation_context = []
        conversation_summary = None
        memories = []

        # STM: Recent messages + summary
        if conversation_id:
            conversation_context, conversation_summary = await short_term_memory.get_context(
                conversation_id, db, max_tokens=max_stm_tokens,
            )

        # LTM: Semantically relevant past memories (on EVERY turn, not just turn #1)
        if user_id:
            memories = await long_term_memory.retrieve_relevant(
                query=query, user_id=user_id, db=db, top_k=5,
            )

        return {
            "conversation_context": conversation_context,
            "conversation_summary": conversation_summary,
            "memories": memories,
        }

    # ── Memory Extraction ────────────────────────────────────────────────

    async def extract_and_store_memories(
        self,
        user_id: str,
        conversation_id: str,
        user_message: str,
        assistant_response: str,
        db: AsyncSession,
    ):
        """Use the LLM to decide if there's important information worth remembering.

        Extracts:
        - User's name (if mentioned)
        - Areas of interest / frequently asked topics
        - Important preferences or context
        - Key facts about the user
        """
        prompt = f"""Analyze the following conversation exchange and extract any important information worth remembering about the user. 
Focus on:
1. The user's NAME if they introduce themselves or mention it
2. Their INTERESTS or FIELDS they frequently ask about
3. Important PREFERENCES or personal details
4. Any KEY CONTEXT that would help personalize future interactions

Only extract genuinely useful facts — do NOT remember trivial chat or the actual Q&A content about MPLADS.

User message: {user_message}
Assistant response: {assistant_response}

If there is important information, respond with a JSON array of objects:
[{{"type": "name|interest|preference|fact|context", "content": "the information to remember", "importance": 0.0-1.0}}]

Types:
- "name": The user's actual name (importance should be 0.9+)
- "interest": Topics/fields the user is interested in (e.g., "interested in fund allocation procedures")
- "preference": How the user likes to interact (e.g., "prefers detailed explanations")
- "fact": A factual detail about the user (e.g., "works as a district collector")
- "context": Situational context (e.g., "preparing a report on MPLADS utilization")

If nothing is worth remembering, respond with: []

Only output the JSON array, nothing else."""

        try:
            llm_output = await llm_router.generate(
                TaskType.MEMORY_EXTRACTION, prompt,
                temperature=0.1, max_tokens=500,
            )

            # Parse memories
            start = llm_output.find("[")
            end = llm_output.rfind("]") + 1
            if start >= 0 and end > start:
                memories_data = json.loads(llm_output[start:end])
            else:
                return  # Nothing to remember

            for mem in memories_data:
                if not isinstance(mem, dict) or "content" not in mem:
                    continue

                content = mem["content"]
                mem_type = mem.get("type", "fact")
                importance = float(mem.get("importance", 0.5))

                if importance < 0.3:
                    continue  # Skip low-importance memories

                await long_term_memory.store_memory(
                    user_id=user_id,
                    content=content,
                    memory_type=mem_type,
                    importance=importance,
                    db=db,
                    source_conversation_id=conversation_id,
                )

            logger.info("Extracted memories for user %s", user_id[:8])

        except Exception as e:
            logger.warning("Memory extraction failed: %s", e)
            # Non-critical — don't fail the main flow

    # ── Conversation Summarization ───────────────────────────────────────

    async def summarize_conversation(
        self,
        conversation_id: str,
        db: AsyncSession,
    ) -> str | None:
        """Generate a summary of a conversation when it exceeds the threshold."""
        # Get recent messages via STM
        messages, _ = await short_term_memory.get_context(
            conversation_id, db, max_tokens=4000,
        )

        if len(messages) < settings.memory_summary_threshold:
            return None

        conv_text = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

        prompt = f"""Summarize the following conversation concisely, capturing the key topics discussed, 
questions asked, and important information exchanged. Keep it under 200 words.

Conversation:
{conv_text[:3000]}

Summary:"""

        try:
            summary = await llm_router.generate(
                TaskType.CONVERSATION_SUMMARY, prompt,
                temperature=0.3, max_tokens=300,
            )

            # Store summary on the conversation
            await db.execute(
                update(Conversation)
                .where(Conversation.id == conversation_id)
                .values(summary=summary)
            )
            await db.flush()

            # Also store as a long-term memory
            conv_result = await db.execute(
                select(Conversation).where(Conversation.id == conversation_id)
            )
            conv = conv_result.scalar_one_or_none()
            if conv:
                await long_term_memory.store_memory(
                    user_id=str(conv.user_id),
                    content=f"Conversation '{conv.title}': {summary}",
                    memory_type="summary",
                    importance=0.6,
                    db=db,
                    source_conversation_id=conversation_id,
                )

            return summary

        except Exception as e:
            logger.warning("Conversation summarization failed: %s", e)
            return None

    # ── Generate Conversation Title ──────────────────────────────────────

    async def generate_conversation_title(
        self,
        conversation_id: str,
        db: AsyncSession,
    ) -> str | None:
        """Auto-generate a descriptive title for a conversation based on its content."""
        messages, _ = await short_term_memory.get_context(
            conversation_id, db, max_tokens=1000,
        )

        if not messages:
            return None

        conv_preview = "\n".join(
            f"{m['role'].upper()}: {m['content'][:200]}" for m in messages[:4]
        )

        prompt = f"""Generate a short, descriptive title (5-8 words max) for this conversation.
The title should capture the main topic discussed.

Conversation:
{conv_preview}

Title (just the title, no quotes or extra text):"""

        try:
            title = await llm_router.generate(
                TaskType.TITLE_GENERATION, prompt,
                temperature=0.3, max_tokens=50,
            )
            title = title.strip().strip('"').strip("'")[:100]

            await db.execute(
                update(Conversation)
                .where(Conversation.id == conversation_id)
                .values(title=title)
            )
            await db.flush()
            return title

        except Exception as e:
            logger.warning("Title generation failed: %s", e)
            return None

    # ── User Profile ─────────────────────────────────────────────────────

    async def get_user_profile(self, user_id: str, db: AsyncSession) -> dict:
        """Delegate to LTM's user profile builder."""
        return await long_term_memory.get_user_profile(user_id, db)


# Module-level instance
memory_manager = MemoryManager()
