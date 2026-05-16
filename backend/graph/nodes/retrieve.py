from backend.graph.state import GraphState
from backend.vectorstore.hybrid import hybrid_search

# Global stores for demonstration; in prod, inject these or load dynamically
global_qdrant = None
global_bm25 = None

def retrieve(state: GraphState):
    """
    Retrieve documents

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): New key added to state, documents, that contains retrieved documents
    """
    print("---RETRIEVE---")
    question = state["question"]

    # Retrieval using Hybrid Search
    documents = hybrid_search(global_qdrant, global_bm25, question, k=4)
    
    # Extract page content for the next nodes
    doc_texts = [doc.page_content for doc in documents]
    
    return {"documents": doc_texts, "question": question}
