"""Long-term memory manager — PostgreSQL-backed persistent memory with semantic retrieval.

Implements:
- Short-term conversation memory (recent messages)
- Conversation summaries (auto-generated when threshold reached)
- Important user facts/preferences extraction (name, interests, key info)
- User profile aggregation across all conversations
- Semantic memory retrieval using embeddings
"""

from __future__ import annotations
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import text, select, update, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database.models import Memory, Message, Conversation, User
from embeddings.encoder import encoder
from llm.provider import llm_client

logger = logging.getLogger(__name__)
settings = get_settings()


class MemoryManager:
    """Manages long-term memory for users across conversations."""

    # ── Short-Term Memory ────────────────────────────────────────────────

    async def get_conversation_messages(
        self,
        conversation_id: str,
        db: AsyncSession,
        limit: int | None = None,
    ) -> List[dict]:
        """Get recent messages from a conversation (short-term memory)."""
        limit = limit or settings.memory_max_short_term
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
        )
        messages = result.scalars().all()
        # Return in chronological order
        messages.reverse()
        return [
            {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
            for m in messages
        ]

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
            llm_output = await llm_client.generate(prompt, temperature=0.1, max_tokens=500)

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

                # Check for duplicate memories (avoid storing the same thing)
                existing = await db.execute(
                    select(Memory).where(
                        Memory.user_id == user_id,
                        Memory.memory_type == mem_type,
                        Memory.content == content,
                        Memory.is_active == True,
                    )
                )
                if existing.scalar_one_or_none():
                    continue  # Already stored

                memory = Memory(
                    user_id=user_id,
                    memory_type=mem_type,
                    content=content,
                    importance=importance,
                    source_conversation_id=conversation_id,
                )
                db.add(memory)

            await db.flush()
            logger.info("Extracted memories for user %s", user_id)

        except Exception as e:
            logger.warning("Memory extraction failed: %s", e)
            # Non-critical — don't fail the main flow



    # ── User Profile ─────────────────────────────────────────────────────

    async def get_user_profile(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> dict:
        """Build a user profile from all stored memories.

        Returns a structured profile with:
        - name: The user's name if known
        - interests: List of topics they're interested in
        - facts: Important facts about them
        - preferences: Their preferences
        - conversation_count: Total conversations
        - total_summaries: Number of conversation summaries
        """
        # Get user record
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()

        # Get all active memories grouped by type
        memories_result = await db.execute(
            select(Memory)
            .where(Memory.user_id == user_id, Memory.is_active == True)
            .order_by(desc(Memory.importance))
        )
        all_memories = memories_result.scalars().all()

        # Count conversations
        conv_count_result = await db.execute(
            select(func.count(Conversation.id)).where(Conversation.user_id == user_id)
        )
        conv_count = conv_count_result.scalar() or 0

        # Count summaries
        summary_count_result = await db.execute(
            select(func.count(Conversation.id)).where(
                Conversation.user_id == user_id,
                Conversation.summary.isnot(None),
            )
        )
        summary_count = summary_count_result.scalar() or 0

        # Group memories by type
        profile = {
            "user_id": str(user_id),
            "display_name": user.display_name if user else None,
            "username": user.username if user else None,
            "name": None,
            "interests": [],
            "facts": [],
            "preferences": [],
            "context": [],
            "conversation_count": conv_count,
            "total_summaries": summary_count,
            "total_memories": len(all_memories),
        }

        for mem in all_memories:
            if mem.memory_type == "name":
                profile["name"] = mem.content
            elif mem.memory_type == "interest":
                profile["interests"].append({
                    "content": mem.content,
                    "importance": mem.importance,
                })
            elif mem.memory_type == "fact":
                profile["facts"].append({
                    "content": mem.content,
                    "importance": mem.importance,
                })
            elif mem.memory_type == "preference":
                profile["preferences"].append({
                    "content": mem.content,
                    "importance": mem.importance,
                })
            elif mem.memory_type == "context":
                profile["context"].append({
                    "content": mem.content,
                    "importance": mem.importance,
                })
            elif mem.memory_type == "summary":
                pass  # Summaries are on conversations, not in profile list

        return profile

    # ── Conversation Summarization ───────────────────────────────────────

    async def summarize_conversation(
        self,
        conversation_id: str,
        db: AsyncSession,
    ) -> str | None:
        """Generate a summary of a conversation when it exceeds the threshold."""
        messages = await self.get_conversation_messages(
            conversation_id, db, limit=50
        )

        if len(messages) < settings.memory_summary_threshold:
            return None

        # Build conversation text
        conv_text = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

        prompt = f"""Summarize the following conversation concisely, capturing the key topics discussed, 
questions asked, and important information exchanged. Keep it under 200 words.

Conversation:
{conv_text[:3000]}

Summary:"""

        try:
            summary = await llm_client.generate(prompt, temperature=0.3, max_tokens=300)

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
                emb_vector = encoder.encode_query(summary)
                summary_memory = Memory(
                    user_id=str(conv.user_id),
                    memory_type="summary",
                    content=f"Conversation '{conv.title}': {summary}",
                    importance=0.6,
                    source_conversation_id=conversation_id,
                    embedding=emb_vector,
                )
                db.add(summary_memory)
                await db.flush()

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
        messages = await self.get_conversation_messages(
            conversation_id, db, limit=6
        )

        if not messages:
            return None

        # Use first few messages to generate title
        conv_preview = "\n".join(
            f"{m['role'].upper()}: {m['content'][:200]}" for m in messages[:4]
        )

        prompt = f"""Generate a short, descriptive title (5-8 words max) for this conversation.
The title should capture the main topic discussed.

Conversation:
{conv_preview}

Title (just the title, no quotes or extra text):"""

        try:
            title = await llm_client.generate(prompt, temperature=0.3, max_tokens=50)
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


# Module-level instance
memory_manager = MemoryManager()
