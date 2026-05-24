"""
BM25 Sparse Retriever
=======================
Builds and queries a BM25 sparse keyword retriever.
BM25 excels at exact keyword matching — it complements the dense semantic
search provided by Qdrant/embeddings (hybrid retrieval strategy).
"""

import logging
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def build_bm25_retriever(
    chunks: list[str],
    metadatas: list[dict] | None = None,
    k: int = 5,
) -> BM25Retriever:
    """
    Builds a BM25 retriever from text chunks.

    Args:
        chunks: List of text strings.
        metadatas: Optional list of metadata dicts (one per chunk).
        k: Number of top documents to retrieve per query.

    Returns:
        A configured BM25Retriever instance.
    """
    if not chunks:
        raise ValueError("Cannot build BM25 retriever from an empty chunk list.")

    if metadatas is None:
        metadatas = [{} for _ in chunks]

    docs = [
        Document(page_content=chunk, metadata=meta)
        for chunk, meta in zip(chunks, metadatas)
    ]

    retriever = BM25Retriever.from_documents(docs)
    retriever.k = k
    logger.info(f"BM25 retriever built with {len(docs)} documents (k={k}).")
    return retriever


def search_bm25(retriever: BM25Retriever | None, query: str) -> list[Document]:
    """
    Retrieves documents using BM25 lexical search.

    Returns an empty list if the retriever is not initialised.
    """
    if retriever is None:
        logger.warning("BM25 retriever is not initialised. Returning empty results.")
        return []
    return retriever.invoke(query)
