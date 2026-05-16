from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document

def build_bm25_retriever(chunks: list[str], metadatas: list[dict] = None) -> BM25Retriever:
    """Builds a BM25 retriever from the provided chunks."""
    docs = [Document(page_content=c, metadata=m or {}) for c, m in zip(chunks, metadatas or [{}]*len(chunks))]
    retriever = BM25Retriever.from_documents(docs)
    retriever.k = 4
    return retriever

def search_bm25(retriever: BM25Retriever, query: str) -> list[Document]:
    """Retrieves documents using BM25 lexical search."""
    if not retriever:
        return []
    return retriever.invoke(query)
