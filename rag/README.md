# MPLADS Self-RAG Chatbot

An advanced **Self-RAG (Self-Reflective Retrieval-Augmented Generation)** chatbot for **MPLADS (Members of Parliament Local Area Development Scheme)** documents. Powered by Gemini and Groq LLM APIs.

## ✨ Features

- **Self-RAG with LangGraph** — Adaptive workflow with retrieval quality checks, query rewriting, grounding verification, and retry loops
- **Advanced Semantic Chunking** — Hierarchical parent-child chunking preserving headings, sections, tables, and document structure
- **Hybrid Retrieval** — pgvector semantic search + PostgreSQL keyword (tsvector) search with Reciprocal Rank Fusion
- **BGE Cross-Encoder Reranking** — Local BAAI/bge-reranker-base for high-precision reranking
- **Gemini & Groq LLM** — Uses Gemini as primary and Groq as fallback, with automatic failover
- **Local Embeddings** — BAAI/bge-base-en-v1.5 via Sentence Transformers
- **Long-Term Memory** — PostgreSQL-backed semantic memory with selective extraction
- **Hallucination Prevention** — Grounding checks, citation enforcement, and disclaimers
- **Admin-Only Ingestion** — PDF, DOCX, TXT, HTML, CSV, JSON with duplicate detection and versioning (CLI only)
- **Chat-Only UI** — Users can only ask questions; no upload capability in the frontend
- **Streaming UI** — Real-time pipeline status and SSE response streaming

## 🏗 Architecture

```
Frontend (React + Vite)
    ↕ REST / SSE
Backend (FastAPI)
    ├── LangGraph Self-RAG Workflow
    │   ├── Query Analysis
    │   ├── Memory Retrieval
    │   ├── Hybrid Retrieval (pgvector + tsvector)
    │   ├── BGE Reranking
    │   ├── Quality Check → Query Rewrite loop
    │   ├── Answer Generation (Gemini / Groq)
    │   ├── Grounding Check → Retrieve More loop
    │   └── Memory Extraction
    ├── Document Ingestion Pipeline
    │   ├── Multi-format Extractors
    │   ├── Semantic Chunker
    │   └── Embedding Generator
    └── PostgreSQL + pgvector
```

## 📋 Prerequisites

1. **Python 3.10+**
2. **Node.js 18+** and npm
3. **PostgreSQL 16** with pgvector extension
4. **API Keys** — At least one of: [Gemini API Key](https://aistudio.google.com/apikey) or [Groq API Key](https://console.groq.com/keys)

## 🚀 Setup (Without Docker)

### Step 1: Install PostgreSQL + pgvector

1. Download PostgreSQL from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Install pgvector from [github.com/pgvector/pgvector/releases](https://github.com/pgvector/pgvector/releases)
3. Create the database:

```sql
-- Connect as superuser: psql -U postgres
CREATE USER mplads WITH PASSWORD 'mplads_secure_password_123' CREATEDB;
CREATE DATABASE mplads_rag OWNER mplads;
\c mplads_rag
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
GRANT ALL ON SCHEMA public TO mplads;
```

Or use the setup script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_postgres.ps1
```

### Step 2: Configure API Keys

Set at least one LLM API key in your `.env` file:
- `GEMINI_API_KEY` — Get from [Google AI Studio](https://aistudio.google.com/apikey)
- `GROQ_API_KEY` — Get from [Groq Console](https://console.groq.com/keys)

### Step 3: Configure

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local setup)
```

### Step 4: Start Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1    # Windows
pip install -r requirements.txt
python main.py
```

First startup downloads embedding (~400MB) and reranker (~1.1GB) models.

### Step 5: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### Step 6: Ingest MPLADS Documents (Admin Only)

```bash
# Place your MPLADS PDF files in the docs folder
# Then run the admin ingestion script
cd backend
python ../scripts/ingest.py ../data/mplads_docs/

# Or ingest a single file
python ../scripts/ingest.py ../data/mplads_docs/mplads_guidelines.pdf
```

### Step 7: Start Chatting

Open **http://localhost:5173** and ask questions about MPLADS!

## 📁 Project Structure

```
mplads-rag/
├── backend/
│   ├── api/routes/         # FastAPI endpoints (chat, documents read-only, conversations, feedback)
│   ├── ingestion/          # Extractors (PDF/DOCX/TXT/HTML/CSV/JSON) + semantic chunker
│   ├── retrieval/          # Hybrid search (pgvector + tsvector + RRF fusion)
│   ├── embeddings/         # BGE embedding encoder
│   ├── reranking/          # BGE cross-encoder reranker
│   ├── memory/             # Long-term memory manager
│   ├── graph/              # LangGraph Self-RAG workflow (nodes, edges, graph)
│   ├── database/           # SQLAlchemy models, migrations, connection
│   ├── config.py           # Pydantic settings from .env
│   └── main.py             # FastAPI entry point
├── data/
│   └── mplads_docs/        # Place MPLADS PDFs here for admin ingestion
├── frontend/
│   ├── src/components/     # ChatMessage, Sidebar
│   ├── src/services/       # API client
│   ├── src/App.jsx         # Main app component
│   └── src/index.css       # Design system
├── scripts/
│   └── ingest.py           # Admin-only CLI document ingestion
├── docker-compose.yml      # Optional: PostgreSQL via Docker
└── .env.example            # Configuration template
```

## 🗄 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `conversations` | Chat sessions with summaries |
| `messages` | Messages with citations (JSONB) |
| `documents` | Uploaded document metadata |
| `document_versions` | Version tracking |
| `chunks` | Semantic chunks with tsvector |
| `embeddings` | pgvector embeddings (HNSW index) |
| `memories` | Long-term semantic memories |
| `feedback` | User ratings |
| `retrieval_logs` | Performance metrics |

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | (empty) | Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model name |
| `GROQ_API_KEY` | (empty) | Groq API key |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Groq model name |
| `LLM_PROVIDER` | `auto` | Provider: `auto`, `gemini`, or `groq` |
| `EMBEDDING_MODEL` | `BAAI/bge-base-en-v1.5` | Embedding model |
| `RERANKER_MODEL` | `BAAI/bge-reranker-base` | Reranker model |
| `RETRIEVAL_TOP_K` | `20` | Chunks before reranking |
| `RERANK_TOP_K` | `5` | Chunks after reranking |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send message (sync) |
| `POST` | `/api/chat/stream` | Send message (SSE streaming) |
| `GET/DELETE` | `/api/conversations[/:id]` | Manage conversations |
| `GET` | `/api/documents[/:id]` | List/view documents (read-only) |
| `POST` | `/api/feedback` | Submit feedback |
| `GET` | `/api/health` | System health |

## 📝 License

MIT
