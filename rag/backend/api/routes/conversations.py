"""Conversation management routes — list, get, rename, delete, and user profile."""

from __future__ import annotations
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import (
    ConversationSchema,
    ConversationListResponse,
    ConversationDetailResponse,
    MessageSchema,
    CitationSchema,
    CreateConversationRequest,
    RenameConversationRequest,
    UserProfileResponse,
    MemoryItemSchema,
)
from database.connection import get_db
from database.models import Conversation, Message
from memory.manager import memory_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations", tags=["Conversations"])

DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    user_id: str = DEFAULT_USER_ID,
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for a user."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(desc(Conversation.updated_at))
    )
    convs = result.scalars().all()

    return ConversationListResponse(
        conversations=[
            ConversationSchema(
                id=str(c.id),
                title=c.title,
                summary=c.summary,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=c.message_count,
            )
            for c in convs
        ]
    )


@router.post("", response_model=ConversationSchema)
async def create_conversation(
    request: CreateConversationRequest,
    user_id: str = DEFAULT_USER_ID,
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation."""
    conv = Conversation(user_id=user_id, title=request.title)
    db.add(conv)
    await db.flush()
    return ConversationSchema(
        id=str(conv.id),
        title=conv.title,
        summary=conv.summary,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=conv.message_count,
    )


@router.get("/user/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get the user's memory profile — aggregated from all conversations."""
    profile = await memory_manager.get_user_profile(user_id, db)

    return UserProfileResponse(
        user_id=profile["user_id"],
        display_name=profile.get("display_name"),
        username=profile.get("username"),
        name=profile.get("name"),
        interests=[
            MemoryItemSchema(content=i["content"], importance=i["importance"])
            for i in profile.get("interests", [])
        ],
        facts=[
            MemoryItemSchema(content=f["content"], importance=f["importance"])
            for f in profile.get("facts", [])
        ],
        preferences=[
            MemoryItemSchema(content=p["content"], importance=p["importance"])
            for p in profile.get("preferences", [])
        ],
        context=[
            MemoryItemSchema(content=c["content"], importance=c["importance"])
            for c in profile.get("context", [])
        ],
        conversation_count=profile.get("conversation_count", 0),
        total_summaries=profile.get("total_summaries", 0),
        total_memories=profile.get("total_memories", 0),
    )


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    """Get conversation with all messages."""
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = msg_result.scalars().all()

    return ConversationDetailResponse(
        conversation=ConversationSchema(
            id=str(conv.id),
            title=conv.title,
            summary=conv.summary,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=conv.message_count,
        ),
        messages=[
            MessageSchema(
                id=str(m.id),
                role=m.role,
                content=m.content,
                citations=[
                    CitationSchema(**c) for c in (m.citations or [])
                ] if m.citations else None,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.patch("/{conversation_id}/rename")
async def rename_conversation(
    conversation_id: str,
    request: RenameConversationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Rename a conversation."""
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.title = request.title
    await db.flush()
    return {
        "message": "Conversation renamed",
        "id": str(conv.id),
        "title": conv.title,
    }


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a conversation and all its messages."""
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conv)
    await db.flush()
    return {"message": "Conversation deleted"}

