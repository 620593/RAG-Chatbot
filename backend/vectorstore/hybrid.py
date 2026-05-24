"""
Hybrid Search (Dense + Sparse Fusion)
=======================================
Combines Qdrant dense vector search (semantic) with BM25 sparse search (keyword)
using Reciprocal Rank Fusion (RRF) to produce a single ranked list of documents.

Why Hybrid?
  - Dense search understands meaning and synonyms but can miss exact terms.
  - BM25 excels at exact keyword matches but ignores semantics.
  - RRF fusion gives the best of both, consistently outperforming either alone.

RRF Formula:
  score(d) = Σ 1 / (k + rank(d, list_i))
  where k=60 is a smoothing constant.
"""

import logging
from langchain_core.documents import Document
from .qdrant_store import search_qdrant
from .bm25_store import search_bm25

logger = logging.getLogger(__name__)

_RRF_K = 60  # Standard RRF smoothing constant


def _reciprocal_rank_fusion(
    lists: list[list[Document]],
    k: int = _RRF_K,
) -> list[Document]:
    """
    Fuses multiple ranked document lists using Reciprocal Rank Fusion.

    Args:
        lists: Multiple ordered lists of documents (e.g., from dense + sparse search).
        k: Smoothing constant (default 60).

    Returns:
        Re-ranked list of unique documents, highest RRF score first.
    """
    scores: dict[str, float] = {}
    doc_map: dict[str, Document] = {}

    for ranked_list in lists:
        for rank, doc in enumerate(ranked_list):
            key = doc.page_content  # Use content as deduplication key
            rrf_score = 1.0 / (k + rank + 1)
            scores[key] = scores.get(key, 0.0) + rrf_score
            if key not in doc_map:
                doc_map[key] = doc

    # Sort by descending RRF score
    sorted_keys = sorted(scores, key=lambda k: scores[k], reverse=True)
    return [doc_map[k] for k in sorted_keys]


def hybrid_search(
    qdrant_store,
    bm25_retriever,
    query: str,
    k: int = 5,
) -> list[Document]:
    """
    Performs hybrid search combining Qdrant dense vectors and BM25 sparse search.

    Falls back gracefully if one of the retrievers is unavailable.

    Args:
        qdrant_store: QdrantVectorStore instance (may be None).
        bm25_retriever: BM25Retriever instance (may be None).
        query: User query string.
        k: Number of results to return after fusion.

    Returns:
        Top-k fused and re-ranked Document list.
    """
    lists: list[list[Document]] = []

    if qdrant_store is not None:
        try:
            dense = search_qdrant(qdrant_store, query, k=k)
            logger.debug(f"Dense search returned {len(dense)} docs.")
            lists.append(dense)
        except Exception as e:
            logger.warning(f"Dense (Qdrant) search failed: {e}")

    if bm25_retriever is not None:
        try:
            sparse = search_bm25(bm25_retriever, query)
            logger.debug(f"Sparse (BM25) search returned {len(sparse)} docs.")
            lists.append(sparse)
        except Exception as e:
            logger.warning(f"Sparse (BM25) search failed: {e}")

    if not lists:
        logger.warning("Both dense and sparse retrievers unavailable — returning empty results.")
        return []

    fused = _reciprocal_rank_fusion(lists)
    logger.info(f"Hybrid search: {len(fused)} unique results after RRF fusion, returning top {k}.")
    return fused[:k]
