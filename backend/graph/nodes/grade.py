"""
Relevance Grading Node
========================
Filters retrieved chunks for relevance to the user's question.
Uses the LLM as a binary relevance classifier.

Design notes:
  - Uses temperature=0 for deterministic, consistent grading.
  - Lenient policy: grades "yes" if a document is from the same knowledge domain,
    even if it doesn't directly answer the question.
  - Fallback: if ALL documents are graded out, returns the originals anyway
    so the generator can still produce a best-effort answer.
  - source_files list is passed through unchanged (we don't filter filenames
    here to avoid over-filtering multi-document results).
"""

import logging
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from backend.config import settings
from backend.graph.state import GraphState

logger = logging.getLogger(__name__)

_llm: ChatGroq | None = None

_GRADE_PROMPT = PromptTemplate(
    template="""You are a precise document relevance grader.
Your task: decide if the following retrieved document is useful for answering the user's question.

Be LENIENT — grade 'yes' if the document:
  - Directly answers the question
  - Provides useful background or context for the answer
  - Contains related entities, data, or terminology

Only grade 'no' if the document is completely unrelated to the question.

Retrieved Document:
{document}

User Question: {question}

Output exactly one word — either 'yes' or 'no':""",
    input_variables=["document", "question"],
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


def grade_documents(state: GraphState) -> dict:
    """
    Filters retrieved documents by relevance to the user's question.

    Passes all source_files through regardless of individual chunk grading
    to preserve attribution even when some chunks are filtered.
    """
    logger.info("--- NODE: GRADE DOCUMENTS ---")
    question = state["question"]
    documents = state["documents"]
    source_files = state.get("source_files", [])

    if not documents:
        logger.warning("No documents to grade — skipping grading step.")
        return {"documents": [], "source_files": source_files, "question": question}

    llm = _get_llm()
    grader_chain = _GRADE_PROMPT | llm

    filtered = []
    for doc in documents:
        try:
            response = grader_chain.invoke({"question": question, "document": doc})
            verdict = response.content.lower().strip()
            if verdict.startswith("yes"):
                logger.debug("  Chunk graded: RELEVANT")
                filtered.append(doc)
            else:
                logger.debug("  Chunk graded: NOT RELEVANT")
        except Exception as e:
            logger.warning(f"Grading failed for a chunk (keeping it): {e}")
            filtered.append(doc)  # Keep on error to avoid silent data loss

    if not filtered and documents:
        logger.info("All chunks graded out — using originals as fallback.")
        filtered = documents

    logger.info(f"Grading complete: {len(filtered)}/{len(documents)} chunks passed.")
    return {"documents": filtered, "source_files": source_files, "question": question}
