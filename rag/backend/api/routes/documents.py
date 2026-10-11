"""Document listing route (read-only).

Upload and deletion of documents is restricted to admin-only operations
via the CLI ingestion script (scripts/ingest.py). End users can only
query the knowledge base.
"""

from __future__ import annotations
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import DocumentSchema, DocumentListResponse
from database.connection import get_db
from database.models import Document

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=DocumentListResponse)
async def list_documents(db: AsyncSession = Depends(get_db)):
    """List all ingested documents in the knowledge base."""
    result = await db.execute(
        select(Document).order_by(Document.uploaded_at.desc())
    )
    docs = result.scalars().all()

    return DocumentListResponse(
        documents=[
            DocumentSchema(
                id=str(d.id),
                name=d.name,
                file_type=d.file_type,
                file_size=d.file_size,
                total_pages=d.total_pages,
                status=d.status,
                uploaded_at=d.uploaded_at,
                current_version=d.current_version,
                error_message=d.error_message,
            )
            for d in docs
        ]
    )


@router.get("/{document_id}", response_model=DocumentSchema)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """Get document details."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentSchema(
        id=str(doc.id),
        name=doc.name,
        file_type=doc.file_type,
        file_size=doc.file_size,
        total_pages=doc.total_pages,
        status=doc.status,
        uploaded_at=doc.uploaded_at,
        current_version=doc.current_version,
        error_message=doc.error_message,
    )
