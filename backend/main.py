from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import shutil
import os

from backend.parsers.router import parse_document
from backend.chunking.splitter import split_text
from backend.chunking.contextualizer import process_chunks_contextually
from backend.chunking.doc_summarizer import generate_document_summary
from backend.vectorstore.qdrant_store import store_in_qdrant
from backend.vectorstore.bm25_store import build_bm25_retriever
import backend.graph.nodes.retrieve as retrieve_module
from backend.graph.workflow import app_graph
from backend.storage.chunk_store import save_chunks, load_chunks

app = FastAPI(title="Contextual RAG API")

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    """On server restart, reload BM25 from persisted chunks."""
    chunks = load_chunks()
    if chunks:
        retrieve_module.global_bm25 = build_bm25_retriever(chunks)
        print(f"Restored BM25 index with {len(chunks)} chunks from storage.")

@app.get("/", include_in_schema=False)
def root():
    """Redirect root to the API docs."""
    return RedirectResponse(url="/docs")


class QueryRequest(BaseModel):
    question: str

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Parses, context-chunks, and indexes an uploaded document."""
    file_location = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        full_text = parse_document(file_location)
        if not full_text.strip():
            raise ValueError("No text could be extracted from the uploaded file.")

        chunks = split_text(full_text)
        enriched_chunks = await process_chunks_contextually(chunks, full_text)

        # Generate and prepend a document-level summary as the first chunk
        # This ensures broad questions like "what is this about?" always get a good answer
        doc_summary = generate_document_summary(full_text)
        if doc_summary:
            enriched_chunks = [doc_summary] + enriched_chunks

        retrieve_module.global_qdrant = store_in_qdrant(enriched_chunks)
        retrieve_module.global_bm25 = build_bm25_retriever(enriched_chunks)
        save_chunks(enriched_chunks)

        return {"message": f"Successfully processed '{file.filename}' into {len(enriched_chunks)} chunks (including summary)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)

@app.post("/chat")
async def chat(request: QueryRequest):
    """Answers a question using the indexed documents via LangGraph."""
    if retrieve_module.global_qdrant is None:
        raise HTTPException(status_code=400, detail="No documents indexed yet. Please upload a document first.")

    inputs = {"question": request.question}
    result = app_graph.invoke(inputs)

    return {
        "answer": result.get("generation"),
        "sources": result.get("documents"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
