"""Short-term memory — sliding-window conversation memory with token budgeting.

Replaces the old hardcoded [-4:] slice with a proper token-aware
sliding window that maximizes context within a token budget.
"""

from __future__ import annotations
import logging
from typing import List, Optional, Tuple

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database.models import Message, Conversation

logger = logging.getLogger(__name__)
settings = get_settings()


def _estimate_tokens(text: str) -> int:
    """Rough token estimation: ~4 chars per token for English text."""
    return max(1, len(text) // 4)


class ShortTermMemory:
    """Sliding-window conversation memory with token budgeting."""

    async def get_context(
        self,
        conversation_id: str,
        db: AsyncSession,
        max_tokens: int = 2000,
    ) -> Tuple[List[dict], Optional[str]]:
        """Get recent messages and summary within a token budget.

        Strategy:
        1. Load conversation summary (if exists) — costs ~100 tokens
        2. Load most recent messages in reverse chronological order
        3. Keep adding messages until token budget is exhausted
        4. Return in chronological order

        Args:
            conversation_id: UUID of the conversation.
            db: Database session.
            max_tokens: Maximum token budget for context.

        Returns:
            (recent_messages, conversation_summary)
        """
        # Get conversation summary
        conv_result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conv = conv_result.scalar_one_or_none()
        summary = conv.summary if conv else None

        # Account for summary tokens
        remaining_tokens = max_tokens
        if summary:
            summary_tokens = _estimate_tokens(summary)
            remaining_tokens -= summary_tokens

        # Load recent messages (reverse chronological)
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at))
            .limit(settings.memory_max_short_term)
        )
        all_messages = result.scalars().all()
        all_messages.reverse()  # Now chronological

        # Fill token budget from most recent messages backwards
        selected = []
        token_count = 0

        for msg in reversed(all_messages):
            msg_tokens = msg.token_count or _estimate_tokens(msg.content)
            if token_count + msg_tokens > remaining_tokens:
                break
            selected.append(msg)
            token_count += msg_tokens

        selected.reverse()  # Back to chronological order

        messages = [
            {
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in selected
        ]

        logger.debug(
            "STM: %d messages (%d tokens) + summary=%s for conv %s",
            len(messages), token_count, bool(summary), conversation_id[:8],
        )

        return messages, summary


# Module-level singleton
short_term_memory = ShortTermMemory()
