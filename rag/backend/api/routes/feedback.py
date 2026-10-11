"""Feedback routes for user ratings on answers."""

from __future__ import annotations
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import FeedbackRequest, FeedbackResponse
from database.connection import get_db
from database.models import Feedback, Message

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit feedback (thumbs up/down or rating) on an assistant message."""
    # Verify message exists
    result = await db.execute(select(Message).where(Message.id == request.message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check for existing feedback
    existing = await db.execute(
        select(Feedback).where(Feedback.message_id == request.message_id)
    )
    feedback = existing.scalar_one_or_none()

    if feedback:
        # Update existing
        feedback.rating = request.rating
        feedback.comment = request.comment
    else:
        # Create new
        feedback = Feedback(
            message_id=request.message_id,
            rating=request.rating,
            comment=request.comment,
        )
        db.add(feedback)

    await db.flush()

    return FeedbackResponse(
        id=str(feedback.id),
        message="Feedback submitted successfully",
    )
