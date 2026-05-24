"""
Qdrant Vector Store
=====================
Manages all interactions with Qdrant Cloud (or in-memory for testing).

Key design decisions:
  - `store_in_qdrant`: On upload, adds new documents to the collection WITHOUT
    deleting existing data — supports multi-document indexing across sessions.
  - `get_qdrant_vector_store`: Returns a connected VectorStore pointing to the
    existing cloud collection. Used on server restart to restore state.
  - Collection is created on first upload if it doesn't exist.
  - Uses COSINE similarity with 1024-dim vectors (bge-large-en-v1.5).
"""

import logging
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from qdrant_client.http.exceptions import UnexpectedResponse

from .embeddings import get_embeddings
from backend.config import settings

logger = logging.getLogger(__name__)

_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """Returns (or creates) the singleton Qdrant client."""
    global _client
    if _client is None:
        if settings.qdrant_url and settings.qdrant_url != ":memory:":
            logger.info(f"Connecting to Qdrant Cloud: {settings.qdrant_url}")
            _client = QdrantClient(
                url=settings.qdrant_url,
                api_key=settings.qdrant_api_key,
                timeout=30,
            )
        else:
            logger.warning("QDRANT_URL not set — using in-memory Qdrant (data will not persist on restart).")
            _client = QdrantClient(location=":memory:")
    return _client


def _ensure_collection_exists(client: QdrantClient) -> None:
    """Creates the Qdrant collection if it doesn't already exist."""
    try:
        client.get_collection(settings.collection_name)
        logger.info(f"Qdrant collection '{settings.collection_name}' already exists.")
    except (UnexpectedResponse, Exception):
        logger.info(f"Creating Qdrant collection '{settings.collection_name}'...")
        client.create_collection(
            collection_name=settings.collection_name,
            vectors_config=VectorParams(
                size=1024,             # bge-large-en-v1.5 produces 1024-dim vectors
                distance=Distance.COSINE,
            ),
        )
        logger.info("Collection created.")


def get_qdrant_vector_store() -> QdrantVectorStore:
    """
    Returns a QdrantVectorStore connected to the existing (or newly-created)
    collection. Used on server startup to restore connection without re-indexing.
    """
    client = get_qdrant_client()
    _ensure_collection_exists(client)
    embeddings = get_embeddings()
    return QdrantVectorStore(
        client=client,
        collection_name=settings.collection_name,
        embedding=embeddings,
    )


def store_in_qdrant(
    chunks: list[str],
    metadatas: list[dict] | None = None,
    filename: str = "unknown",
) -> QdrantVectorStore:
    """
    Embeds and stores text chunks in Qdrant, APPENDING to the existing collection.

    This means multiple documents can be indexed across uploads — data is not
    wiped on each new file upload.

    Args:
        chunks: List of text strings to embed and store.
        metadatas: Optional list of metadata dicts (one per chunk).
        filename: Source filename — used to populate metadata if metadatas is None.

    Returns:
        The connected QdrantVectorStore instance.
    """
    client = get_qdrant_client()
    _ensure_collection_exists(client)
    embeddings = get_embeddings()

    if metadatas is None:
        metadatas = [{"filename": filename, "source": filename} for _ in chunks]

    docs = [
        Document(page_content=chunk, metadata=meta)
        for chunk, meta in zip(chunks, metadatas)
    ]

    vector_store = QdrantVectorStore(
        client=client,
        collection_name=settings.collection_name,
        embedding=embeddings,
    )

    logger.info(f"Adding {len(docs)} documents to Qdrant collection '{settings.collection_name}'...")
    vector_store.add_documents(docs)
    logger.info("Documents added to Qdrant.")

    return vector_store


def search_qdrant(
    vector_store: QdrantVectorStore,
    query: str,
    k: int = 5,
) -> list[Document]:
    """Retrieves the top-k most semantically similar documents for a query."""
    return vector_store.similarity_search(query, k=k)
