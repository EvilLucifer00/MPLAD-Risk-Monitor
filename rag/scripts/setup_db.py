"""Database setup script — run standalone to initialize the database."""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from database.migrations import run_migrations


async def main():
    print("=" * 50)
    print("MPLADS Self-RAG — Database Setup")
    print("=" * 50)
    await run_migrations()
    print("\nDone! You can now start the backend server.")


if __name__ == "__main__":
    asyncio.run(main())
