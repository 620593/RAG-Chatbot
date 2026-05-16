from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from .embeddings import get_embeddings
from backend.config import settings
from langchain_core.documents import Document

def get_qdrant_client() -> QdrantClient:
    """Returns the Qdrant Client."""
    if settings.qdrant_url == ":memory:":
        return QdrantClient(location=":memory:")
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)

def store_in_qdrant(chunks: list[str], metadatas: list[dict] = None) -> QdrantVectorStore:
    """Creates a Qdrant collection and stores text chunks as vectors."""
    embeddings = get_embeddings()
    client = get_qdrant_client()
    
    docs = [
        Document(page_content=c, metadata=m or {})
        for c, m in zip(chunks, metadatas or [{}] * len(chunks))
    ]
    
    # Recreate collection to avoid stale data on re-upload
    try:
        client.delete_collection(settings.collection_name)
    except Exception:
        pass
    
    client.create_collection(
        collection_name=settings.collection_name,
        vectors_config=VectorParams(size=1024, distance=Distance.COSINE),  # bge-large-en-v1.5 is 1024-dim
    )
    
    vector_store = QdrantVectorStore(
        client=client,
        collection_name=settings.collection_name,
        embedding=embeddings,
    )
    vector_store.add_documents(docs)
    return vector_store

def search_qdrant(vector_store: QdrantVectorStore, query: str, k: int = 4) -> list[Document]:
    """Retrieves top k documents using dense vector similarity."""
    return vector_store.similarity_search(query, k=k)
