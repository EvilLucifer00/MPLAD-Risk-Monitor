"""Admin batch document ingestion script.

This is the ONLY way to add documents to the MPLADS knowledge base.
End users cannot upload documents — only you (the admin) can, using this script.

Usage:
  # Ingest all PDFs from the default data/mplads_docs/ folder
  python scripts/ingest.py

  # Ingest all supported files from a custom directory
  python scripts/ingest.py path/to/folder/

  # Ingest a single file
  python scripts/ingest.py path/to/file.pdf
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from database.connection import async_session
from ingestion.pipeline import ingest_document


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".html", ".htm", ".csv", ".json"}

# Default directory where admin places MPLADS documents
DEFAULT_DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "mplads_docs")


async def ingest_directory(directory: str):
    """Ingest all supported documents from a directory."""
    dir_path = Path(directory)
    if not dir_path.exists():
        print(f"Error: Directory not found: {directory}")
        return

    files = sorted([
        f for f in dir_path.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    ])

    if not files:
        print(f"Error: No supported files found in: {directory}")
        print(f"   Supported: {SUPPORTED_EXTENSIONS}")
        return

    print(f"Found {len(files)} document(s) to ingest:")
    for f in files:
        print(f"   - {f.name}")
    print()

    success_count = 0
    skip_count = 0
    fail_count = 0

    async with async_session() as db:
        for i, file_path in enumerate(files, 1):
            print(f"[{i}/{len(files)}] Ingesting: {file_path.name}")
            try:
                doc = await ingest_document(str(file_path), db, original_name=file_path.name)
                await db.commit()
                if doc.status == "ready":
                    print(f"   Success: {doc.status} | Pages: {doc.total_pages}")
                    success_count += 1
                else:
                    # Duplicate or already ingested
                    print(f"   Skipped: Already ingested (duplicate detected)")
                    skip_count += 1
            except Exception as e:
                print(f"   Failed: {e}")
                await db.rollback()
                fail_count += 1
            print()

    print("=" * 50)
    print(f"Ingestion complete!")
    print(f"   Ingested: {success_count}")
    print(f"   Skipped (duplicates): {skip_count}")
    print(f"   Failed: {fail_count}")


async def ingest_single_file(file_path: str):
    """Ingest a single document file."""
    async with async_session() as db:
        print(f"Ingesting: {file_path}")
        doc = await ingest_document(file_path, db, original_name=Path(file_path).name)
        await db.commit()
        if doc.status == "ready":
            print(f"Success: {doc.status} | Pages: {doc.total_pages}")
        else:
            print(f"Skipped: Already ingested (duplicate detected)")


async def main():
    print("=" * 50)
    print("MPLADS Self-RAG — Admin Document Ingestion")
    print("=" * 50)
    print()

    if len(sys.argv) < 2:
        # Default: ingest from data/mplads_docs/
        default_dir = Path(DEFAULT_DOCS_DIR)
        if default_dir.exists():
            print(f"📂 Using default docs directory: {default_dir.resolve()}")
            print()
            await ingest_directory(str(default_dir))
        else:
            print(f"📂 Default docs directory not found: {default_dir.resolve()}")
            print(f"   Creating it now...")
            default_dir.mkdir(parents=True, exist_ok=True)
            print()
            print("📝 How to use:")
            print(f"   1. Place your MPLADS PDF files in: {default_dir.resolve()}")
            print(f"   2. Run this script again: python scripts/ingest.py")
            print()
            print("   Or specify a path directly:")
            print("   python scripts/ingest.py <directory_or_file>")
            print()
            print("   Examples:")
            print("   python scripts/ingest.py data/mplads_docs/")
            print("   python scripts/ingest.py data/mplads_docs/guidelines.pdf")
        return

    target = sys.argv[1]

    if os.path.isdir(target):
        await ingest_directory(target)
    elif os.path.isfile(target):
        await ingest_single_file(target)
    else:
        print(f"❌ Path not found: {target}")


if __name__ == "__main__":
    asyncio.run(main())
