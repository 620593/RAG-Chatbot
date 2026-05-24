"""
Contextual RAG API — Production-Ready FastAPI Application
=========================================================
Endpoints:
  GET  /          → redirect to /docs
  GET  /health    → health check (for Render cold-start ping & frontend status)
  GET  /status    → index statistics (document count, chunk count)
  POST /upload    → parse, context-chunk, and index a document
  POST /chat      → answer a question via LangGraph RAG pipeline
"""

import os
import shutil
import logging
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.parsers.router import parse_document
from backend.chunking.splitter import split_text
from backend.chunking.contextualizer import process_chunks_contextually
from backend.chunking.doc_summarizer import generate_document_summary
from backend.vectorstore.qdrant_store import store_in_qdrant, get_qdrant_vector_store
from backend.vectorstore.bm25_store import build_bm25_retriever
import backend.graph.nodes.retrieve as retrieve_module
from backend.graph.workflow import app_graph
from backend.storage.chunk_store import save_chunks, load_chunks_with_metadata
from backend.config import settings

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("rag-api")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Enterprise RAG API",
    description="Production-grade Retrieval-Augmented Generation (RAG) backend powering contextual document Q&A.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — Critical: without this, browser upload requests are blocked
# ---------------------------------------------------------------------------
# Reads CORS_ORIGINS env var (comma-separated list). Defaults to "*" for dev.
raw_origins = os.environ.get("CORS_ORIGINS", "*")
if raw_origins == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE_BYTES = settings.max_upload_size_mb * 1024 * 1024

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"}

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    question: str


class UploadResponse(BaseModel):
    message: str
    filename: str
    chunks_indexed: int
    summary_preview: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    processing_time_ms: int


class StatusResponse(BaseModel):
    ready: bool
    documents_indexed: int
    chunks_indexed: int
    qdrant_connected: bool
    bm25_ready: bool


# ---------------------------------------------------------------------------
# Startup — restore indexes from persistent storage
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    """
    On server start / Render cold-start:
    1. Try to reconnect to the existing Qdrant Cloud collection.
    2. Rebuild BM25 from persisted SQLite chunks.
    """
    logger.info("Server starting — restoring indexes...")

    # Step 1: Reconnect Qdrant from cloud
    try:
        vs = get_qdrant_vector_store()
        retrieve_module.global_qdrant = vs
        logger.info("✓ Qdrant vector store connection restored from cloud collection.")
    except Exception as e:
        logger.warning(f"Could not reconnect to Qdrant on startup (collection may not exist yet): {e}")

    # Step 2: Rebuild BM25 from SQLite
    try:
        saved = load_chunks_with_metadata()
        if saved:
            chunk_texts = [item["text"] for item in saved]
            retrieve_module.global_bm25 = build_bm25_retriever(chunk_texts)
            logger.info(f"✓ BM25 rebuilt with {len(chunk_texts)} chunks from persistent storage.")
    except Exception as e:
        logger.warning(f"Could not restore BM25 index on startup: {e}")

    logger.info("Startup complete.")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["System"])
def health_check():
    """
    Lightweight health probe for monitoring and Render cold-start warm-up.
    Always returns 200 so the frontend can rely on it for connectivity checks.
    """
    return {
        "status": "healthy",
        "service": "Enterprise RAG API",
        "version": "2.0.0",
        "qdrant_url": settings.qdrant_url,
        "embedding_model": settings.embedding_model_name,
        "llm_model": settings.groq_model_name,
    }


@app.get("/status", response_model=StatusResponse, tags=["System"])
def get_status():
    """Returns current indexing and readiness state."""
    from backend.storage.chunk_store import load_chunks_with_metadata as lcm
    saved = lcm()
    return StatusResponse(
        ready=retrieve_module.global_qdrant is not None,
        documents_indexed=len(set(item.get("filename", "") for item in saved)),
        chunks_indexed=len(saved),
        qdrant_connected=retrieve_module.global_qdrant is not None,
        bm25_ready=retrieve_module.global_bm25 is not None,
    )


@app.post("/upload", response_model=UploadResponse, tags=["Ingestion"])
async def upload_file(file: UploadFile = File(...)):
    """
    Full ingestion pipeline:
    1. Validate file type and size
    2. Parse text from PDF / DOCX / image / TXT
    3. Contextually chunk using LLM-enrichment (Groq)
    4. Embed with HuggingFace BGE model → store in Qdrant Cloud
    5. Build BM25 sparse index in memory
    6. Persist chunks to SQLite for BM25 restoration on restart
    """
    filename = file.filename or "unknown"
    suffix = Path(filename).suffix.lower()

    # --- Validation ---
    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    # Read content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb} MB.",
        )

    # Save to disk
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(f"File saved: {file_path} ({len(content) / 1024:.1f} KB)")

    try:
        # --- Parse ---
        logger.info(f"Parsing {filename}...")
        full_text = parse_document(str(file_path))
        if not full_text.strip():
            raise ValueError(
                f"No extractable text found in '{filename}'. "
                "If this is a scanned PDF, ensure Tesseract OCR is installed on the server."
            )

        # --- Chunk ---
        logger.info(f"Splitting text into chunks...")
        chunks = split_text(full_text)
        logger.info(f"Created {len(chunks)} raw chunks")

        # --- Contextualise ---
        logger.info("Enriching chunks with contextual summaries...")
        enriched_chunks = await process_chunks_contextually(chunks, full_text)

        # --- Document-level summary ---
        logger.info("Generating document-level summary...")
        doc_summary = generate_document_summary(full_text)
        if doc_summary:
            enriched_chunks = [doc_summary] + enriched_chunks

        total_chunks = len(enriched_chunks)
        logger.info(f"Total enriched chunks (incl. summary): {total_chunks}")

        # --- Build metadata for every chunk ---
        metadatas = [{"filename": filename, "source": filename} for _ in enriched_chunks]

        # --- Store in Qdrant ---
        logger.info("Storing in Qdrant...")
        vector_store = store_in_qdrant(enriched_chunks, metadatas=metadatas, filename=filename)
        retrieve_module.global_qdrant = vector_store

        # --- Build BM25 ---
        logger.info("Building BM25 index...")
        retrieve_module.global_bm25 = build_bm25_retriever(enriched_chunks, metadatas=metadatas)

        # --- Persist to SQLite ---
        logger.info("Persisting chunks to SQLite...")
        save_chunks(enriched_chunks, metadatas=metadatas, filename=filename)

        summary_preview = doc_summary[:200].replace("\n", " ") if doc_summary else enriched_chunks[0][:200]

        logger.info(f"Upload pipeline complete for '{filename}'.")
        return UploadResponse(
            message=f"Successfully indexed '{filename}' into {total_chunks} enriched chunks.",
            filename=filename,
            chunks_indexed=total_chunks,
            summary_preview=summary_preview,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload pipeline failed for '{filename}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if file_path.exists():
            file_path.unlink()


@app.post("/chat", response_model=ChatResponse, tags=["Query"])
async def chat(request: QueryRequest):
    """
    RAG query pipeline via LangGraph:
    Rewrite Query → Hybrid Retrieval → Relevance Grading → LLM Generation
    """
    if not request.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty.")

    if retrieve_module.global_qdrant is None and retrieve_module.global_bm25 is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "No documents are indexed yet. Please upload at least one document "
                "(PDF, DOCX, or image) before querying the chatbot."
            ),
        )

    start_ms = int(time.time() * 1000)

    try:
        inputs = {"question": request.question}
        result = app_graph.invoke(inputs)

        answer = result.get("generation", "No answer generated.")
        raw_sources = result.get("documents", [])

        # Extract unique source filenames from document metadata
        source_filenames = result.get("source_files", [])
        if not source_filenames:
            # Fallback: truncate raw chunks to preview snippets
            source_filenames = [f"Chunk {i+1}: {s[:120]}..." for i, s in enumerate(raw_sources[:3])]

        elapsed_ms = int(time.time() * 1000) - start_ms
        logger.info(f"Chat query answered in {elapsed_ms}ms")

        return ChatResponse(
            answer=answer,
            sources=source_filenames,
            processing_time_ms=elapsed_ms,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
