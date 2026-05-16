from langgraph.graph import StateGraph, END
from backend.graph.state import GraphState
from backend.graph.nodes.query_rewriter import rewrite_query
from backend.graph.nodes.retrieve import retrieve
from backend.graph.nodes.grade import grade_documents
from backend.graph.nodes.generate import generate

def build_workflow():
    """Builds and compiles the LangGraph workflow."""
    workflow = StateGraph(GraphState)

    # Define the nodes
    workflow.add_node("rewrite_query", rewrite_query)
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("grade_documents", grade_documents)
    workflow.add_node("generate", generate)

    # Build graph: Rewrite → Retrieve → Grade → Generate
    workflow.set_entry_point("rewrite_query")
    workflow.add_edge("rewrite_query", "retrieve")
    workflow.add_edge("retrieve", "grade_documents")
    workflow.add_edge("grade_documents", "generate")
    workflow.add_edge("generate", END)

    return workflow.compile()

app_graph = build_workflow()
