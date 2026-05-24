"""
LangGraph State Definition
============================
Defines the typed state object that flows through each node of the RAG pipeline.
"""

from typing import TypedDict


class GraphState(TypedDict):
    """
    State object passed between nodes in the LangGraph RAG pipeline.

    Attributes:
        question:     The (potentially rewritten) user query string.
        generation:   The final LLM-generated answer.
        documents:    List of retrieved document text chunks.
        source_files: Unique list of source filenames contributing to the answer.
    """
    question: str
    generation: str
    documents: list[str]
    source_files: list[str]
