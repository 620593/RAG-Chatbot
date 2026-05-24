"""
Query Rewriter Node
=====================
Rewrites the user's raw question into an optimised retrieval query.

Motivation: User questions are often conversational and imprecise.
The vector store responds best to keyword-rich, specific queries.
This node transforms the raw question into a better search query
without changing its semantic intent.
"""

import logging
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from backend.config import settings
from backend.graph.state import GraphState

logger = logging.getLogger(__name__)

_llm: ChatGroq | None = None

_REWRITE_PROMPT = PromptTemplate(
    template="""You are a precision search query optimizer for a document retrieval system.
Rewrite the user's question into an optimal keyword-rich search query that will retrieve the most relevant chunks from a vector store.

Rules:
- Extract all key entities, concepts, proper nouns, and technical terms.
- For broad questions (e.g., "what is this about?", "summarize"), output descriptive keywords like "introduction overview summary main topic purpose".
- For specific questions, focus on the core technical or factual keywords.
- Output ONLY the rewritten query — no explanation, no punctuation, no quotes.
- Keep the query concise (under 15 words).

Original Question: {question}
Optimized Search Query:""",
    input_variables=["question"],
)


def _get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model=settings.groq_model_name,
            api_key=settings.groq_api_key,
            temperature=0,
        )
    return _llm


def rewrite_query(state: GraphState) -> dict:
    """
    Rewrites the user's question into a retrieval-optimised search query.

    Falls back to the original question if the LLM call fails so the
    pipeline can continue even with Groq API issues.
    """
    logger.info("--- NODE: REWRITE QUERY ---")
    question = state["question"]

    try:
        llm = _get_llm()
        chain = _REWRITE_PROMPT | llm | StrOutputParser()
        rewritten = chain.invoke({"question": question}).strip()

        if rewritten:
            logger.info(f"  Original:  '{question}'")
            logger.info(f"  Rewritten: '{rewritten}'")
            return {"question": rewritten}
        else:
            logger.warning("Query rewriter returned empty string — using original question.")
            return {"question": question}

    except Exception as e:
        logger.warning(f"Query rewrite failed (using original): {e}")
        return {"question": question}
