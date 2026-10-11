"""Migrate existing embeddings from PostgreSQL to ChromaDB.

Run this once after adding ChromaDB to populate it with existing data:
    python scripts/migrate_to_chroma.py
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy import text
from database.connection import async_session
from vectorstore.chroma_store import chroma_store


async def main():
    print("=" * 50)
    print("Migrating PostgreSQL embeddings -> ChromaDB")
    print("=" * 50)
    print()

    async with async_session() as db:
        # Fetch all chunks with their embeddings and document info
        sql = """
            SELECT
                c.id AS chunk_id,
                c.document_id,
                c.content,
                c.content_type,
                c.page_number,
                c.section,
                c.heading_hierarchy,
                c.chunk_index,
                d.name AS document_name,
                e.vector
            FROM chunks c
            JOIN documents d ON d.id = c.document_id
            JOIN embeddings e ON e.chunk_id = c.id
            WHERE d.status = 'ready'
            ORDER BY d.name, c.chunk_index
        """

        result = await db.execute(text(sql))
        rows = result.fetchall()

        if not rows:
            print("No chunks found in PostgreSQL. Nothing to migrate.")
            print("Run 'python scripts/ingest.py' first to ingest documents.")
            return

        print(f"Found {len(rows)} chunks to migrate.")
        print()

        # Prepare data for ChromaDB upsert
        chunk_ids = []
        contents = []
        embeddings = []
        metadatas = []

        for row in rows:
            chunk_ids.append(str(row.chunk_id))
            contents.append(row.content)
            embeddings.append(list(row.vector))
            metadatas.append({
                "document_id": str(row.document_id),
                "document_name": row.document_name,
                "page_number": row.page_number or 0,
                "section": row.section or "",
                "content_type": row.content_type or "paragraph",
                "heading_hierarchy": str(row.heading_hierarchy or []),
                "chunk_index": row.chunk_index or 0,
            })

        # Upsert into ChromaDB
        print("Upserting into ChromaDB...")
        count = chroma_store.upsert_chunks(chunk_ids, contents, embeddings, metadatas)
        print(f"✅ Successfully migrated {count} chunks to ChromaDB!")
        print(f"   ChromaDB collection now has {chroma_store.count} documents.")


if __name__ == "__main__":
    asyncio.run(main())
