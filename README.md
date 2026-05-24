# 🧠 Enterprise RAG Chatbot

> A **production-grade, multi-modal Retrieval-Augmented Generation (RAG)** chatbot platform that ingests PDFs, DOCX files, and images, indexes them using dense + sparse hybrid search, and answers questions with precise source citations — all powered by Groq's ultra-fast LLaMA 3.3 70B inference.

---

## 🖥️ Live Demo

| Service | URL |
|---|---|
| **Backend API** | `https://rag-chatbot-api.onrender.com` |
| **API Docs (Swagger)** | `https://rag-chatbot-api.onrender.com/docs` |
| **Frontend** | Deployed separately (Next.js) |

---

## ✨ Key Features

- **Multi-format document ingestion** — PDF (with table extraction), DOCX (with heading + table support), PNG/JPG/WEBP images (OCR via Tesseract), plain TXT/MD
- **Contextual Chunk Enrichment** — each chunk is enriched with 1-3 sentences of LLM-generated context (Anthropic-style), dramatically improving retrieval recall
- **Hybrid Retrieval (Dense + Sparse)** — Qdrant vector search (semantic) fused with BM25 keyword search using Reciprocal Rank Fusion (RRF)
- **LangGraph RAG Pipeline** — 4-node pipeline: Query Rewrite → Hybrid Retrieve → Relevance Grade → LLM Generate
- **Multi-document support** — index multiple documents across sessions; data persists across Render cold-starts via Qdrant Cloud
- **Source citations** — every answer lists the source filenames it was drawn from
- **CORS-enabled API** — browser upload requests work correctly from any frontend origin
- **Health & Status endpoints** — for monitoring, uptime checks, and Render warm-up
- **Graceful error handling** — every layer has try/except with logging; failures degrade gracefully rather than crashing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js + Tailwind)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Chat Panel  │  │ Vector Store │  │  Prompt Templates /    │ │
│  │  (messages,  │  │  Directory   │  │  API Integrations tabs │ │
│  │   sources)   │  │  (drag-drop) │  │                        │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘ │
└─────────┼────────────────┼─────────────────────────────────────┘
          │                │  HTTP (CORS enabled)
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI on Render)                      │
│                                                                   │
│   POST /upload                     POST /chat                     │
│   ┌─────────────────────────┐      ┌──────────────────────────┐  │
│   │ 1. Validate file type   │      │ 1. Validate question     │  │
│   │    & size (≤50 MB)      │      │ 2. Invoke LangGraph      │  │
│   │ 2. Parse document       │      │    pipeline              │  │
│   │    (PDF/DOCX/Image/TXT) │      └───────────┬──────────────┘  │
│   │ 3. Split into chunks    │                  │                  │
│   │ 4. Contextual enrichment│    ┌─────────────▼──────────────┐  │
│   │    (Groq LLaMA 3.3 70B) │    │     LangGraph Workflow     │  │
│   │ 5. Generate doc summary │    │  ┌─────────────────────┐   │  │
│   │ 6. Embed (HF BGE-large) │    │  │ 1. Rewrite Query    │   │  │
│   │ 7. Store in Qdrant Cloud│    │  │    (Groq LLM)       │   │  │
│   │ 8. Build BM25 index     │    │  ├─────────────────────┤   │  │
│   │ 9. Persist to SQLite    │    │  │ 2. Hybrid Retrieve  │   │  │
│   └─────────────────────────┘    │  │  (Qdrant + BM25)   │   │  │
│                                   │  │  RRF Fusion         │   │  │
│   GET /health  GET /status        │  ├─────────────────────┤   │  │
│                                   │  │ 3. Grade Documents  │   │  │
│                                   │  │    (Groq LLM)       │   │  │
│                                   │  ├─────────────────────┤   │  │
│                                   │  │ 4. Generate Answer  │   │  │
│                                   │  │    (Groq LLM)       │   │  │
│                                   │  └─────────────────────┘   │  │
│                                   └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                │
          ▼                ▼
 ┌────────────────┐   ┌───────────────────┐
 │  Qdrant Cloud  │   │  HuggingFace API  │
 │  (1024-dim     │   │  (BGE-large-en    │
 │   dense vecs)  │   │   embeddings)     │
 └────────────────┘   └───────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology | Purpose |
|---|---|---|
| **API Framework** | [FastAPI](https://fastapi.tiangolo.com/) | High-performance async REST API |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | Production-grade ASGI runtime |
| **LLM** | [Groq](https://groq.com/) + LLaMA 3.3 70B | Ultra-fast inference for query rewriting, grading & generation |
| **Orchestration** | [LangGraph](https://langchain-ai.github.io/langgraph/) | Stateful multi-node RAG pipeline with typed state |
| **LangChain** | [LangChain](https://langchain.com/) | Prompts, chains, document abstractions |
| **Embeddings** | [HuggingFace](https://huggingface.co/) / BAAI/bge-large-en-v1.5 | 1024-dimensional dense vectors |
| **Vector Store** | [Qdrant Cloud](https://qdrant.tech/) | Cloud-hosted dense vector search (COSINE similarity) |
| **Sparse Search** | [BM25 (rank-bm25)](https://github.com/dorianbrown/rank_bm25) | Lexical keyword-based retrieval |
| **Hybrid Fusion** | Reciprocal Rank Fusion (RRF) | Fuses dense + sparse results into a single ranking |
| **PDF Parser** | [pdfplumber](https://github.com/jsvine/pdfplumber) + [PyMuPDF](https://pymupdf.readthedocs.io/) | Table-aware primary + layout-aware fallback |
| **DOCX Parser** | [python-docx](https://python-docx.readthedocs.io/) | Paragraphs, headings, and tables |
| **Image OCR** | [Pillow](https://pillow.readthedocs.io/) + [Tesseract](https://github.com/tesseract-ocr/tesseract) | Image preprocessing + OCR text extraction |
| **Config** | [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) | Typed, env-var-driven configuration |
| **Persistence** | SQLite | BM25 chunk restoration across server restarts |
| **Deployment** | [Render](https://render.com/) (Docker) | Cloud hosting |

### Frontend
| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) | React framework with App Router |
| **Language** | TypeScript | Type-safe frontend code |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first responsive design |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Smooth UI transitions |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent icon set |
| **State** | React Context API | Cross-component state for chat, documents, tabs |
| **Persistence** | localStorage | Chat history + indexed document list across reloads |

---

## 📡 API Reference

### `GET /health`
Lightweight health probe. Always returns 200.

```json
{
  "status": "healthy",
  "service": "Enterprise RAG API",
  "version": "2.0.0",
  "qdrant_url": "https://...",
  "embedding_model": "BAAI/bge-large-en-v1.5",
  "llm_model": "llama-3.3-70b-versatile"
}
```

---

### `GET /status`
Current indexing and system readiness state.

```json
{
  "ready": true,
  "documents_indexed": 3,
  "chunks_indexed": 142,
  "qdrant_connected": true,
  "bm25_ready": true
}
```

---

### `POST /upload`
Upload and index a document.

**Request:** `multipart/form-data` with field `file`

**Supported types:** `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.png`, `.jpg`, `.jpeg`, `.webp`

**Max size:** 50 MB (configurable)

**Response:**
```json
{
  "message": "Successfully indexed 'report.pdf' into 47 enriched chunks.",
  "filename": "report.pdf",
  "chunks_indexed": 47,
  "summary_preview": "[DOCUMENT SUMMARY] This financial report covers..."
}
```

**Error responses:**
- `415 Unsupported Media Type` — file type not allowed
- `413 Request Entity Too Large` — file exceeds size limit
- `500 Internal Server Error` — parsing or indexing failure

---

### `POST /chat`
Query the indexed documents.

**Request:**
```json
{
  "question": "What were the total revenues in Q3?"
}
```

**Response:**
```json
{
  "answer": "## Q3 Revenue Summary\n\nBased on the indexed financial report...",
  "sources": ["report.pdf", "appendix.docx"],
  "processing_time_ms": 2341
}
```

**Error responses:**
- `400 Bad Request` — no documents indexed yet
- `422 Unprocessable Entity` — empty question
- `500 Internal Server Error` — pipeline failure

---

## 🔄 How the RAG Pipeline Works

### Upload Flow

```
Upload File
    │
    ▼
[1] Validate (type + size)
    │
    ▼
[2] Parse → extract plain text
    │  PDF:   pdfplumber (tables) → PyMuPDF (fallback)
    │  DOCX:  python-docx (paragraphs + headings + tables)
    │  Image: Pillow preprocess → Tesseract OCR
    │  TXT:   direct read
    ▼
[3] Split → RecursiveCharacterTextSplitter
    │  chunk_size=1000, overlap=150
    ▼
[4] Contextual Enrichment (Groq LLaMA 3.3 70B)
    │  Each chunk → LLM generates 1-3 sentence context
    │  Context prepended to chunk ("contextual RAG")
    │  Batches of 3 with rate-limit backoff
    ▼
[5] Document Summary (Groq LLaMA 3.3 70B)
    │  Generates 4-6 sentence overview of entire document
    │  Stored as first "chunk" with [DOCUMENT SUMMARY] tag
    ▼
[6] Embed (HuggingFace BGE-large-en-v1.5 API)
    │  Each chunk → 1024-dimensional float vector
    ▼
[7] Store in Qdrant Cloud
    │  COSINE similarity, appending to existing collection
    │  (multi-document indexing — does NOT wipe previous data)
    ▼
[8] Build BM25 Index (in-memory)
    ▼
[9] Persist chunks + metadata to SQLite
    │  (for BM25 reconstruction on server restart)
    ▼
Return UploadResponse with chunk count + summary preview
```

### Query Flow

```
User Question
    │
    ▼
[LangGraph Node 1] — Query Rewrite
    │  Raw question → keyword-optimized search query
    │  (Groq LLaMA 3.3 70B, temperature=0)
    ▼
[LangGraph Node 2] — Hybrid Retrieve
    │  Qdrant dense search (top-5 by COSINE similarity)
    │    +
    │  BM25 sparse search (top-5 by keyword score)
    │    ↓
    │  Reciprocal Rank Fusion → single ranked list (top-5)
    │  Source filenames extracted from metadata
    ▼
[LangGraph Node 3] — Grade Documents
    │  Each chunk evaluated by LLM: relevant? (yes/no)
    │  Irrelevant chunks filtered out
    │  Fallback: all chunks kept if ALL graded out
    ▼
[LangGraph Node 4] — Generate Answer
    │  Graded chunks formatted as context
    │  Groq LLaMA 3.3 70B generates markdown-formatted answer
    │  Cites information from context
    ▼
Return ChatResponse { answer, sources, processing_time_ms }
```

---

## 🚀 Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed locally (for image parsing)
- Accounts for: [Groq](https://console.groq.com/), [HuggingFace](https://huggingface.co/), [Qdrant Cloud](https://cloud.qdrant.io/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/rag-chatbot.git
cd rag-chatbot
```

### 2. Backend setup

```bash
# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp .env.template backend/.env
# Edit backend/.env and fill in your API keys
```

### 3. Run the backend

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Visit: `http://localhost:8000/docs` to explore the interactive API.

### 4. Frontend setup

```bash
cd frontend

# Install Node dependencies
npm install

# Create frontend environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

Visit: `http://localhost:3000`

---

## ☁️ Deployment (Render)

### Backend

1. **Connect your GitHub repo** to Render.
2. Create a new **Web Service** → select **Docker** runtime.
3. Render will auto-detect the `Dockerfile` at the root.
4. Set the following **Environment Variables** in the Render dashboard:

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Groq Cloud API key |
| `HF_TOKEN` | ✅ | HuggingFace token (Inference permissions) |
| `QDRANT_URL` | ✅ | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | ✅ | Qdrant API key |
| `CORS_ORIGINS` | ✅ | Frontend URL (e.g. `https://your-app.vercel.app`) |
| `CONTEXTUAL_CHUNKING_ENABLED` | ⬜ | `true` (default) |
| `CHUNK_SIZE` | ⬜ | `1000` (default) |
| `MAX_UPLOAD_SIZE_MB` | ⬜ | `50` (default) |

### Frontend (Vercel)

1. **Import your repo** to Vercel.
2. Set root directory to `frontend/`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` → your Render backend URL

### Free-Tier Considerations

> Render's free tier **sleeps after 15 minutes of inactivity**. The frontend pings `/health` on load to wake it up. Expect a 30-60 second cold-start on first request.

To minimize cold-start pain:
- Use [UptimeRobot](https://uptimerobot.com/) to ping `/health` every 10 minutes.
- Or upgrade to Render's Starter plan ($7/month) for always-on.

---

## 📁 Project Structure

```
rag-chatbot/
├── Dockerfile                    # Multi-stage Docker build (includes Tesseract)
├── render.yaml                   # Render deployment configuration
├── .env.template                 # Environment variables reference
├── .gitignore
├── README.md
│
├── backend/
│   ├── main.py                   # FastAPI app, CORS, routes, startup
│   ├── config.py                 # Pydantic settings (env vars)
│   ├── requirements.txt          # Python dependencies (pinned versions)
│   ├── .env                      # Local environment (gitignored)
│   │
│   ├── parsers/
│   │   ├── router.py             # Extension-based parser dispatcher
│   │   ├── pdf_parser.py         # pdfplumber + PyMuPDF (dual-strategy)
│   │   ├── docx_parser.py        # python-docx (paragraphs + tables)
│   │   └── image_parser.py       # Tesseract OCR with Pillow preprocessing
│   │
│   ├── chunking/
│   │   ├── splitter.py           # RecursiveCharacterTextSplitter
│   │   ├── contextualizer.py     # LLM-based contextual enrichment (with retries)
│   │   └── doc_summarizer.py     # Document-level summary generation
│   │
│   ├── vectorstore/
│   │   ├── embeddings.py         # Singleton HuggingFace BGE embeddings
│   │   ├── qdrant_store.py       # Qdrant Cloud: store, retrieve, reconnect
│   │   ├── bm25_store.py         # BM25 sparse retriever
│   │   └── hybrid.py             # RRF fusion of dense + sparse results
│   │
│   ├── graph/
│   │   ├── state.py              # LangGraph GraphState TypedDict
│   │   ├── workflow.py           # LangGraph pipeline assembly
│   │   └── nodes/
│   │       ├── query_rewriter.py # Node 1: optimise search query
│   │       ├── retrieve.py       # Node 2: hybrid search + metadata
│   │       ├── grade.py          # Node 3: relevance filtering
│   │       └── generate.py       # Node 4: LLM answer generation
│   │
│   └── storage/
│       └── chunk_store.py        # SQLite persistence for BM25 reconstruction
│
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx        # Root layout with ChatProvider
    │   │   ├── page.tsx          # Main multi-tab workspace
    │   │   └── globals.css       # Global styles
    │   ├── components/
    │   │   ├── Sidebar.tsx       # Navigation + chat history
    │   │   ├── Shimmer.tsx       # Skeleton loading components
    │   │   └── FeatureCard.tsx   # Feature showcase cards
    │   └── context/
    │       └── ChatContext.tsx   # Global state (chats, documents, API calls)
```

---

## ⚙️ Configuration Reference

All settings can be controlled via environment variables:

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | — | **Required.** Groq API key for LLM inference |
| `GROQ_MODEL_NAME` | `llama-3.3-70b-versatile` | Groq model to use |
| `HF_TOKEN` | — | **Required.** HuggingFace inference token |
| `EMBEDDING_MODEL_NAME` | `BAAI/bge-large-en-v1.5` | Embedding model |
| `QDRANT_URL` | — | **Required.** Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | — | **Required.** Qdrant API key |
| `COLLECTION_NAME` | `rag_collection` | Qdrant collection name |
| `CORS_ORIGINS` | `*` | Allowed frontend origins (comma-separated) |
| `CONTEXTUAL_CHUNKING_ENABLED` | `true` | Toggle LLM-based chunk enrichment |
| `CHUNK_SIZE` | `1000` | Characters per text chunk |
| `CHUNK_OVERLAP` | `150` | Overlap between consecutive chunks |
| `CHUNKING_RATE_LIMIT_DELAY` | `2.0` | Seconds to wait between enrichment batches |
| `GROQ_MAX_RETRIES` | `4` | Retries on Groq API rate-limit errors |
| `MAX_UPLOAD_SIZE_MB` | `50` | Maximum file upload size |

---

## 🔒 Security Notes

- **Never commit** your `backend/.env` file to Git — it's in `.gitignore`.
- Set `CORS_ORIGINS` to your exact frontend URL in production (not `*`).
- Rotate API keys regularly via your Groq / HuggingFace / Qdrant dashboards.
- The `/upload` endpoint validates file type and size before processing.

---

## 🐛 Troubleshooting

### Upload fails from the browser
- **Cause:** CORS not configured. Set `CORS_ORIGINS=*` (development) or your frontend URL.
- **Fix:** Ensure the backend is running and `CORS_ORIGINS` env var is set.

### "No extractable text found"
- **Cause:** The PDF is scanned (image-based) and Tesseract isn't installed on the server.
- **Fix:** Ensure the Docker image includes `tesseract-ocr` (it does by default in our Dockerfile).

### Groq rate-limit errors during upload
- **Cause:** Large documents with many chunks exceed Groq's free TPM limit.
- **Fix:** Set `CONTEXTUAL_CHUNKING_ENABLED=false` for faster (but less accurate) indexing, or upgrade your Groq plan.

### Qdrant connection fails on startup
- **Cause:** `QDRANT_URL` not set or incorrect.
- **Fix:** Verify the URL and API key in your Qdrant Cloud dashboard.

### "No documents indexed yet" on chat
- **Cause:** Server restarted and Qdrant reconnection failed, or no files were uploaded yet.
- **Fix:** Upload a document via the Vector Store tab, or check `/health` and `/status` endpoints.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgements

- [Anthropic Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — inspiration for the contextual chunking technique
- [LangChain](https://langchain.com/) & [LangGraph](https://langchain-ai.github.io/langgraph/) — RAG orchestration
- [Groq](https://groq.com/) — blazing fast LLM inference
- [Qdrant](https://qdrant.tech/) — production vector database
- [HuggingFace](https://huggingface.co/) — open-source embedding models
