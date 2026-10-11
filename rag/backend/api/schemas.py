"""Pydantic schemas for API request/response models."""

from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None


class CitationSchema(BaseModel):
    chunk_id: str
    document_name: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    content_preview: str
    rerank_score: float = 0.0


class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    message_id: str
    citations: List[CitationSchema] = []
    retrieval_quality: str = "unknown"
    grounding_quality: str = "unknown"
    grounding_score: float = 0.0


# ── Conversations ────────────────────────────────────────────────────────────

class ConversationSchema(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationListResponse(BaseModel):
    conversations: List[ConversationSchema]


class MessageSchema(BaseModel):
    id: str
    role: str
    content: str
    citations: Optional[List[CitationSchema]] = None
    created_at: datetime


class ConversationDetailResponse(BaseModel):
    conversation: ConversationSchema
    messages: List[MessageSchema]


class CreateConversationRequest(BaseModel):
    title: str = "New Conversation"


class RenameConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


# ── Documents ────────────────────────────────────────────────────────────────

class DocumentSchema(BaseModel):
    id: str
    name: str
    file_type: str
    file_size: int
    total_pages: Optional[int] = None
    status: str
    uploaded_at: datetime
    current_version: int = 1
    error_message: Optional[str] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentSchema]



# ── Feedback ─────────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    message_id: str
    rating: int = Field(..., ge=-1, le=5)
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    message: str


# ── Memory / User Profile ───────────────────────────────────────────────────

class MemoryItemSchema(BaseModel):
    content: str
    importance: float = 0.5


class UserProfileResponse(BaseModel):
    user_id: str
    display_name: Optional[str] = None
    username: Optional[str] = None
    name: Optional[str] = None
    interests: List[MemoryItemSchema] = []
    facts: List[MemoryItemSchema] = []
    preferences: List[MemoryItemSchema] = []
    context: List[MemoryItemSchema] = []
    conversation_count: int = 0
    total_summaries: int = 0
    total_memories: int = 0


# ── Status ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    database: str
    llm_provider: str
    embedding_model: str
    reranker_model: str
    vector_store: str = "unknown"
