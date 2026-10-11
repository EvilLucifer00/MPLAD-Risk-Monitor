"""SQLAlchemy ORM models — full PostgreSQL schema with pgvector support."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime,
    ForeignKey, Index, BigInteger, JSON, Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR
from sqlalchemy.orm import DeclarativeBase, relationship

from config import get_settings

settings = get_settings()
EMBEDDING_DIM = settings.embedding_dimension


def utcnow():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


# ── Users ────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    last_active = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    preferences = Column(JSONB, default=dict)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")


# ── Conversations ────────────────────────────────────────────────────────────
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), default="New Conversation")
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    is_active = Column(Boolean, default=True)
    message_count = Column(Integer, default=0)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan",
                            order_by="Message.created_at")

    __table_args__ = (
        Index("ix_conversations_user_updated", "user_id", "updated_at"),
    )


# ── Messages ─────────────────────────────────────────────────────────────────
class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" | "assistant" | "system"
    content = Column(Text, nullable=False)
    citations = Column(JSONB, nullable=True)  # [{doc, page, chunk_id, text}]
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    feedback = relationship("Feedback", back_populates="message", uselist=False)

    __table_args__ = (
        Index("ix_messages_conv_created", "conversation_id", "created_at"),
    )


# ── Documents ────────────────────────────────────────────────────────────────
class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)
    file_path = Column(Text, nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # xxhash for dedup
    file_size = Column(BigInteger, nullable=False)
    total_pages = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=utcnow)
    status = Column(String(20), default="pending")  # pending|processing|ready|error
    error_message = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSONB, default=dict)
    current_version = Column(Integer, default=1)

    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False)
    file_path = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    change_summary = Column(Text, nullable=True)

    document = relationship("Document", back_populates="versions")

    __table_args__ = (
        Index("ix_docver_doc_version", "document_id", "version", unique=True),
    )


# ── Chunks ───────────────────────────────────────────────────────────────────
class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    parent_chunk_id = Column(UUID(as_uuid=True), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String(50), default="paragraph")  # heading|paragraph|table|list
    page_number = Column(Integer, nullable=True)
    section = Column(String(500), nullable=True)
    heading_hierarchy = Column(JSONB, nullable=True)  # ["Chapter 1", "Section 1.1"]
    token_count = Column(Integer, nullable=True)
    metadata_ = Column("metadata", JSONB, default=dict)
    search_vector = Column(TSVECTOR, nullable=True)  # for keyword search

    document = relationship("Document", back_populates="chunks")
    parent = relationship("Chunk", remote_side="Chunk.id", backref="children")

    __table_args__ = (
        Index("ix_chunks_document", "document_id"),
        Index("ix_chunks_parent", "parent_chunk_id"),
        Index("ix_chunks_search_vector", "search_vector", postgresql_using="gin"),
        Index("ix_chunks_section", "section"),
    )

# Pgvector index is created in migrations (requires the extension)


# ── Memories ─────────────────────────────────────────────────────────────────
class Memory(Base):
    __tablename__ = "memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    memory_type = Column(String(50), nullable=False)  # fact|preference|summary|context
    content = Column(Text, nullable=False)
    importance = Column(Float, default=0.5)
    source_conversation_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    last_accessed = Column(DateTime(timezone=True), default=utcnow)
    access_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="memories")

    __table_args__ = (
        Index("ix_memories_user_type", "user_id", "memory_type"),
        Index("ix_memories_importance", "importance"),
    )


# ── Feedback ─────────────────────────────────────────────────────────────────
class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), unique=True, nullable=False)
    rating = Column(Integer, nullable=True)  # 1-5 or thumbs: 1/-1
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    message = relationship("Message", back_populates="feedback")


# ── Retrieval Logs ───────────────────────────────────────────────────────────
class RetrievalLog(Base):
    __tablename__ = "retrieval_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), nullable=True)
    query = Column(Text, nullable=False)
    rewritten_query = Column(Text, nullable=True)
    retrieval_method = Column(String(50), nullable=True)  # semantic|keyword|hybrid
    chunks_retrieved = Column(Integer, default=0)
    chunks_after_rerank = Column(Integer, default=0)
    retrieval_quality_score = Column(Float, nullable=True)
    grounding_score = Column(Float, nullable=True)
    retry_count = Column(Integer, default=0)
    latency_ms = Column(Integer, nullable=True)
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        Index("ix_retlogs_conv", "conversation_id"),
        Index("ix_retlogs_created", "created_at"),
    )
