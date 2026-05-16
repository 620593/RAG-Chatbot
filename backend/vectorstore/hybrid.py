from langchain_core.documents import Document
from .qdrant_store import search_qdrant
from .bm25_store import search_bm25

def hybrid_search(qdrant_store, bm25_retriever, query: str, k: int = 4) -> list[Document]:
    """Performs a hybrid search combining Qdrant dense vectors and BM25 sparse vectors."""
    dense_results = search_qdrant(qdrant_store, query, k=k) if qdrant_store else []
    sparse_results = search_bm25(bm25_retriever, query) if bm25_retriever else []
    
    # Simple reciprocal rank fusion (RRF) or deduplication
    doc_map = {}
    
    # Weight dense slightly higher or just simple deduplication for now
    for rank, doc in enumerate(dense_results):
        if doc.page_content not in doc_map:
            doc_map[doc.page_content] = doc
            
    for rank, doc in enumerate(sparse_results):
        if doc.page_content not in doc_map:
            doc_map[doc.page_content] = doc
            
    # Return top K unique results
    return list(doc_map.values())[:k]
