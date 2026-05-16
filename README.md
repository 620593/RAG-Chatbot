<div align="center">
  <h1>Contextual RAG API</h1>
  <p>
    <strong>Production-Grade Retrieval-Augmented Generation Backend</strong>
  </p>
  <p>
    <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI"></a>
    <a href="https://python.langchain.com/"><img src="https://imgshields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain"></a>
    <a href="https://qdrant.tech/"><img src="https://img.shields.io/badge/Qdrant-FF5252?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant"></a>
    <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq"></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"></a>
  </p>
</div>

---

## 📖 Overview

This repository contains a high-performance, asynchronous, and scalable Retrieval-Augmented Generation (RAG) backend API. Designed with a **LangGraph-driven orchestration engine**, it enables advanced multi-modal document parsing, contextual chunking, and highly accurate hybrid retrieval using **Qdrant** (Vector) and **BM25** (Keyword) search. The generation layer leverages **Groq's Llama 3.3 70B** for ultra-fast, hallucination-resistant inference.

## ✨ Enterprise-Ready Features

- **Robust Ingestion Pipeline**: Extracts text from PDFs, DOCX, TXT, and Images via PyMuPDF, pdfplumber, and OCR integrations.
- **Anthropic-style Contextual Chunking**: Automatically generates document-level summaries and prefixes every chunk with contextual metadata to maximize retrieval fidelity.
- **Persistent Hybrid Search**: Combines Dense Vector Search (Qdrant Cloud via HuggingFace Inference API) with Sparse Keyword Search (BM25 persisted locally in SQLite).
- **LangGraph Orchestration**: Uses state-graph validation nodes to dynamically rewrite queries, grade document relevance, and prevent LLM hallucinations.
- **Zero-Footprint Embeddings**: Integrates with HuggingFace Endpoint Embeddings (`BAAI/bge-large-en-v1.5`), ensuring no local RAM exhaustion on constrained cloud servers.

## 📂 Project Structure

```text
├── backend/
│   ├── chunking/          # Contextual summarization & chunking logic
│   ├── graph/             # LangGraph state machine & reasoning nodes
│   ├── parsers/           # Multi-modal document ingestion routing
│   ├── storage/           # SQLite persistence for BM25 chunks
│   ├── vectorstore/       # Hybrid search logic (Qdrant + BM25 + Embeddings)
│   ├── config.py          # Pydantic Settings & Env management
│   ├── main.py            # FastAPI Application Entrypoint
│   └── requirements.txt   # Python Dependencies
├── Dockerfile             # Containerization specification
├── render.yaml            # Render Infrastructure-as-Code config
├── pyproject.toml         # Project metadata and tool configuration
└── README.md              # Project documentation
```

## ⚙️ Configuration & Environment

The application is configured using Environment Variables via `pydantic-settings`. Create a `.env` file in the `backend/` directory:

| Variable | Description | Required | Default / Example |
|---|---|---|---|
| `GROQ_API_KEY` | Your Groq Cloud API Key | **Yes** | `gsk_...` |
| `HF_TOKEN` | HuggingFace Access Token (Read) | **Yes** | `hf_...` |
| `QDRANT_URL` | Qdrant Cloud Cluster URL | No | `:memory:` (Local dev) |
| `QDRANT_API_KEY` | Qdrant Cloud API Key | No | `""` |
| `EMBEDDING_MODEL_NAME` | HuggingFace model path | No | `BAAI/bge-large-en-v1.5` |

*(Note: For local testing without a cloud vector database, you can leave `QDRANT_URL` out or set it to `:memory:`. Data will not persist across restarts).*

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Optional, but recommended for fast dependency resolution) or standard `pip`.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/620593/RAG-Chatbot.git
cd RAG-Chatbot

# Initialize a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Run the Server
Start the Uvicorn development server:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📡 API Reference

### 1. Ingest a Document
Upload a document to parse, contextually chunk, and index into the Qdrant and BM25 stores.
```bash
curl -X POST "http://localhost:8000/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf"
```

### 2. Query the Chatbot
Ask a question against the indexed documents.
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the main insights of the uploaded document?"}'
```

## 🐳 Deployment

This service is optimized for seamless deployment on standard cloud platforms like **Render.com**. 

### Deploying via Docker
Build and run the container locally or on any cloud orchestrator:
```bash
docker build -t rag-chatbot-api .
docker run -p 8000:8000 --env-file backend/.env rag-chatbot-api
```

### Deploying to Render
A `render.yaml` blueprint is included. Simply connect your GitHub repository to Render and it will automatically provision the environment using the Docker runtime. **Remember to populate the Environment Variables in the Render dashboard.**

## 🤝 Contributing
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License
Distributed under the MIT License.
