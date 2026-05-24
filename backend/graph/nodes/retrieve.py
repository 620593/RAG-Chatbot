"""
Retrieval Node
================
Performs hybrid (dense + sparse) search against the indexed documents
and injects the results — including source file metadata — into the graph state.
"""

import logging
from backend.graph.state import GraphState
from backend.vectorstore.hybrid import hybrid_search

logger = logging.getLogger(__name__)

# Module-level globals are set by main.py after upload / on server startup.
# In a stateless / multi-worker deployment, replace these with a shared
# state store (Redis, DB, etc.).
global_qdrant = None
global_bm25 = None


def retrieve(state: GraphState) -> dict:
    """
    Retrieves relevant document chunks using hybrid (dense + sparse) search.

    Populates:
        documents:    List of retrieved text chunks.
        source_files: Unique source filenames of the retrieved chunks.
    """
    logger.info("--- NODE: RETRIEVE ---")
    question = state["question"]

    documents = hybrid_search(global_qdrant, global_bm25, question, k=5)

    doc_texts = [doc.page_content for doc in documents]

    # Extract unique filenames from document metadata
    source_files = list(
        dict.fromkeys(  # preserves insertion order while deduplicating
            doc.metadata.get("filename", doc.metadata.get("source", "Unknown Source"))
            for doc in documents
        )
    )

    logger.info(f"Retrieved {len(doc_texts)} chunks from sources: {source_files}")
    return {
        "documents": doc_texts,
        "source_files": source_files,
        "question": question,
    }
