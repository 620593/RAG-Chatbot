# Contextual RAG Backend

This is a production-grade Retrieval-Augmented Generation (RAG) backend built with **FastAPI**, **LangGraph**, and **Qdrant**. It provides a robust, asynchronous pipeline for processing documents and running contextual, multi-modal hybrid search queries.

## Architecture & Features

### 1. Advanced Ingestion Pipeline
- **Document Parsing**: Extracts text cleanly from uploaded documents (PDFs, DOCX, TXT) via PyMuPDF/pdfplumber/OCR.
- **Contextual Chunking**: Utilizes an Anthropic-style contextual chunking approach. It generates a document-level summary and appends contextual prefixes to each chunk, drastically improving vector retrieval accuracy.
- **BM25 Persistence**: Extracted chunks are stored locally using an SQLite database (`chunks.db`), ensuring that the BM25 keyword index is accurately restored across server restarts without losing data.

### 2. Hybrid Retrieval (Vector + Keyword)
- **Vector Store (Qdrant)**: Uses Qdrant Cloud for persistent, high-performance vector search.
- **Keyword Search (BM25)**: Implements an in-memory BM25 index that is persisted to SQLite on ingestion and reloaded on startup.
- **Embeddings**: Uses `BAAI/bge-large-en-v1.5` embeddings running efficiently via the **HuggingFace Inference API** to ensure zero memory overhead on deployment servers.

### 3. LLM Integration & Workflow
- **Groq Llama 3**: Powered by Groq's `llama-3.3-70b-versatile` model for lightning-fast inference and high-quality generation.
- **LangGraph Routing**: Orchestrates the logic through a controlled state-graph. It assesses the relevance of retrieved documents, generates answers, and guarantees precise citations without hallucination loops.

### 4. Cloud-Ready Deployment
- **Dockerized**: Fully containerized using a lightweight Python 3.11 image (`Dockerfile`).
- **Render.com Ready**: Includes a `render.yaml` configuration for seamless "Infrastructure as Code" deployment on Render's free tier. 
- **Stateless Operation**: Configured to safely rebuild indices from Qdrant Cloud and SQLite on frequent cloud spin-ups.

---

## Getting Started Locally

### 1. Install Dependencies
```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install requirements
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
GROQ_API_KEY=your_groq_api_key
HF_TOKEN=your_huggingface_token
QDRANT_URL=https://your-cluster-url.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
```
*(Note: To run vector search entirely in local memory for testing, leave `QDRANT_URL=:memory:` and `QDRANT_API_KEY` empty).*

### 3. Run the Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Access the Swagger documentation at `http://localhost:8000/docs`.

---

## API Endpoints

- `POST /upload`
  - Accepts a file (PDF, TXT, DOCX), extracts its text, applies contextual chunking, pushes vectors to Qdrant, and saves raw chunks to SQLite.
- `POST /chat`
  - Accepts a JSON payload `{"question": "your query"}`.
  - Queries the LangGraph workflow utilizing hybrid search and LLM generation.
  - Returns the answer and sources used.
