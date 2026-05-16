from typing import TypedDict

class GraphState(TypedDict):
    """
    Represents the state flowing through the LangGraph pipeline.

    Attributes:
        question: The user's query string.
        generation: The final LLM-generated answer.
        documents: List of retrieved document text chunks.
    """
    question: str
    generation: str
    documents: list[str]
