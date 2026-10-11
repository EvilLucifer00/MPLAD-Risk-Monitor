"""Document ingestion pipeline — orchestrates extraction, chunking, embedding, and storage.

Stores embeddings in both PostgreSQL (pgvector) and ChromaDB for
hybrid retrieval. ChromaDB provides fast semantic search while
PostgreSQL handles keyword search via tsvector.
"""

from __future__ import annotations
import logging
import os
import uuid
from pathlib import Path

import xxhash
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database.models import Document, DocumentVersion, Chunk
from embeddings.encoder import encoder
from ingestion.extractors import extract_document
from ingestion.chunker import SemanticChunker
from vectorstore.chroma_store import chroma_store

logger = logging.getLogger(__name__)
settings = get_settings()


def _compute_file_hash(file_path: str) -> str:
    """Compute xxhash of file for duplicate detection."""
    h = xxhash.xxh64()
    with open(file_path, "rb") as f:
        while True:
            block = f.read(8192)
            if not block:
                break
            h.update(block)
    return h.hexdigest()


async def ingest_document(
    file_path: str,
    db: AsyncSession,
    original_name: str | None = None,
) -> Document:
    """Full ingestion pipeline: extract → chunk → embed → store.

    Args:
        file_path: Path to the uploaded file on disk.
        db: Async database session.
        original_name: Original filename (for display).

    Returns:
        The created Document record.
    """
    path = Path(file_path)
    name = original_name or path.name
    file_hash = _compute_file_hash(file_path)
    file_size = path.stat().st_size

    # ── Duplicate detection ──────────────────────────────────────────────
    existing = await db.execute(
        select(Document).where(Document.file_hash == file_hash)
    )
    existing_doc = existing.scalar_one_or_none()

    if existing_doc:
        logger.info("Duplicate detected: %s (hash=%s). Skipping.", name, file_hash)
        return existing_doc

    # ── Create document record ───────────────────────────────────────────
    doc = Document(
        name=name,
        file_type=path.suffix.lower().lstrip("."),
        file_path=str(path.resolve()),
        file_hash=file_hash,
        file_size=file_size,
        status="processing",
    )
    db.add(doc)
    await db.flush()

    # Create version 1
    version = DocumentVersion(
        document_id=doc.id,
        version=1,
        file_hash=file_hash,
        file_path=str(path.resolve()),
        change_summary="Initial upload",
    )
    db.add(version)

    try:
        # ── Extract ──────────────────────────────────────────────────────
        logger.info("Extracting document: %s", name)
        extracted = extract_document(file_path)
        doc.total_pages = extracted.total_pages

        # ── Chunk ────────────────────────────────────────────────────────
        logger.info("Chunking document: %s", name)
        chunker = SemanticChunker()
        chunk_data_list = chunker.chunk_document(extracted)

        if not chunk_data_list:
            doc.status = "error"
            doc.error_message = "No content could be extracted from document"
            await db.flush()
            return doc

        # ── Create chunk records ─────────────────────────────────────────
        chunk_id_map: dict[str, uuid.UUID] = {}  # temp_id → db_id
        chunk_records: list[Chunk] = []

        for cd in chunk_data_list:
            db_chunk_id = uuid.uuid4()
            chunk_id_map[cd.chunk_id] = db_chunk_id

            chunk_record = Chunk(
                id=db_chunk_id,
                document_id=doc.id,
                chunk_index=cd.chunk_index,
                content=cd.content,
                content_type=cd.content_type,
                page_number=cd.page_number,
                section=cd.section,
                heading_hierarchy=cd.heading_hierarchy,
                token_count=cd.token_count,
                metadata_=cd.metadata,
            )
            chunk_records.append(chunk_record)

        # Set parent references
        for i, cd in enumerate(chunk_data_list):
            if cd.parent_chunk_id and cd.parent_chunk_id in chunk_id_map:
                chunk_records[i].parent_chunk_id = chunk_id_map[cd.parent_chunk_id]

        db.add_all(chunk_records)
        await db.flush()

        # ── Update tsvector for keyword search ───────────────────────────
        for cr in chunk_records:
            await db.execute(
                text(
                    "UPDATE chunks SET search_vector = to_tsvector('english', :content) "
                    "WHERE id = :chunk_id"
                ),
                {"content": cr.content, "chunk_id": str(cr.id)},
            )

        # ── Generate embeddings ──────────────────────────────────────────
        logger.info("Generating embeddings for %d chunks...", len(chunk_records))
        texts = [cr.content for cr in chunk_records]
        vectors = encoder.encode(texts, batch_size=32, show_progress=True)

        # ── Store in ChromaDB ────────────────────────────────────────────
        logger.info("Storing %d chunks in ChromaDB...", len(chunk_records))
        chroma_ids = [str(cr.id) for cr in chunk_records]
        chroma_contents = texts
        chroma_metadatas = [
            {
                "document_id": str(doc.id),
                "document_name": name,
                "page_number": cr.page_number or 0,
                "section": cr.section or "",
                "content_type": cr.content_type or "paragraph",
                "heading_hierarchy": str(cr.heading_hierarchy or []),
                "chunk_index": cr.chunk_index,
            }
            for cr in chunk_records
        ]
        chroma_store.upsert_chunks(chroma_ids, chroma_contents, vectors, chroma_metadatas)

        # ── Finalize ─────────────────────────────────────────────────────
        doc.status = "ready"
        await db.flush()
        logger.info(
            "✅ Ingested '%s': %d pages, %d chunks, %d embeddings (ChromaDB + pgvector)",
            name, doc.total_pages, len(chunk_records), len(embedding_records),
        )

    except Exception as e:
        logger.error("Ingestion failed for %s: %s", name, e, exc_info=True)
        doc.status = "error"
        doc.error_message = str(e)
        await db.flush()
        raise

    return doc


async def reingest_document(
    document_id: str,
    new_file_path: str,
    db: AsyncSession,
) -> Document:
    """Re-ingest a document (new version) — deletes old chunks/embeddings and re-processes."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise ValueError(f"Document {document_id} not found")

    new_hash = _compute_file_hash(new_file_path)

    # Delete old chunks from ChromaDB
    chroma_store.delete_by_document(document_id)

    # Delete old chunks from PostgreSQL (cascades to embeddings)
    await db.execute(text("DELETE FROM chunks WHERE document_id = :doc_id"), {"doc_id": document_id})

    # Update version
    doc.current_version += 1
    doc.file_hash = new_hash
    doc.file_path = str(Path(new_file_path).resolve())
    doc.file_size = Path(new_file_path).stat().st_size

    new_version = DocumentVersion(
        document_id=doc.id,
        version=doc.current_version,
        file_hash=new_hash,
        file_path=str(Path(new_file_path).resolve()),
        change_summary="Document updated",
    )
    db.add(new_version)
    await db.flush()

    # Re-run ingestion steps (extract, chunk, embed)
    # Reuse the main pipeline logic by temporarily setting the doc back to processing
    doc.status = "processing"
    await db.flush()

    extracted = extract_document(new_file_path)
    doc.total_pages = extracted.total_pages

    chunker = SemanticChunker()
    chunk_data_list = chunker.chunk_document(extracted)

    chunk_records = []
    chunk_id_map = {}

    for cd in chunk_data_list:
        db_id = uuid.uuid4()
        chunk_id_map[cd.chunk_id] = db_id
        chunk_records.append(Chunk(
            id=db_id,
            document_id=doc.id,
            chunk_index=cd.chunk_index,
            content=cd.content,
            content_type=cd.content_type,
            page_number=cd.page_number,
            section=cd.section,
            heading_hierarchy=cd.heading_hierarchy,
            token_count=cd.token_count,
            metadata_=cd.metadata,
        ))

    for i, cd in enumerate(chunk_data_list):
        if cd.parent_chunk_id and cd.parent_chunk_id in chunk_id_map:
            chunk_records[i].parent_chunk_id = chunk_id_map[cd.parent_chunk_id]

    db.add_all(chunk_records)
    await db.flush()

    for cr in chunk_records:
        await db.execute(
            text(
                "UPDATE chunks SET search_vector = to_tsvector('english', :content) "
                "WHERE id = :chunk_id"
            ),
            {"content": cr.content, "chunk_id": str(cr.id)},
        )

    texts = [cr.content for cr in chunk_records]
    vectors = encoder.encode(texts, batch_size=32, show_progress=True)

    for cr, vec in zip(chunk_records, vectors):
        db.add(Embedding(chunk_id=cr.id, vector=vec, model_name=settings.embedding_model))

    # Store in ChromaDB
    chroma_ids = [str(cr.id) for cr in chunk_records]
    chroma_metadatas = [
        {
            "document_id": str(doc.id),
            "document_name": doc.name,
            "page_number": cr.page_number or 0,
            "section": cr.section or "",
            "content_type": cr.content_type or "paragraph",
            "heading_hierarchy": str(cr.heading_hierarchy or []),
            "chunk_index": cr.chunk_index,
        }
        for cr in chunk_records
    ]
    chroma_store.upsert_chunks(chroma_ids, texts, vectors, chroma_metadatas)

    doc.status = "ready"
    await db.flush()
    logger.info("✅ Re-ingested '%s' as version %d (ChromaDB + pgvector)", doc.name, doc.current_version)
    return doc
