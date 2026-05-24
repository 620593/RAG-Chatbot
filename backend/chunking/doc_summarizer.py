"""
Document-Level Summarizer
===========================
Generates a high-quality summary of the entire document using the LLM.
This summary is prepended as the first "chunk" in the vector index so that
broad questions like "What is this document about?" always retrieve relevant context.
"""

import logging
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from backend.config import settings

logger = logging.getLogger(__name__)

_llm: ChatGroq | None = None

_SUMMARIZE_PROMPT = PromptTemplate(
    template="""You are a document analyst. Carefully read the following document text and write a
comprehensive 4-6 sentence summary that clearly identifies:

1. The **type of document** (e.g., research paper, financial report, contract, user manual, invoice)
2. The **key entities** involved (people, organizations, products, dates)
3. The **main purpose or objective** of the document
4. The **most important facts, data points, or conclusions**
5. Any **action items, recommendations, or next steps** mentioned

Document Text (first 8,000 characters):
{document}

Summary:""",
    input_variables=["document"],
)

# Maximum characters to send for summarisation
_MAX_CHARS = 8_000


def get_llm() -> ChatGroq:
    """Returns a lazily-initialised ChatGroq instance."""
    global _llm
    if _llm is None:
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured. Cannot generate document summary.")
        _llm = ChatGroq(
            model=settings.groq_model_name,
            api_key=settings.groq_api_key,
            temperature=0,
        )
    return _llm


def generate_document_summary(full_text: str) -> str:
    """
    Generates a document-level summary and returns it as a tagged chunk string.

    Returns an empty string if summarisation fails, so the caller can proceed
    without the summary rather than crashing the entire upload pipeline.
    """
    logger.info("Generating document-level summary...")

    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set — skipping document summary.")
        return ""

    try:
        llm = get_llm()
        chain = _SUMMARIZE_PROMPT | llm | StrOutputParser()
        summary = chain.invoke({"document": full_text[:_MAX_CHARS]})
        summary = summary.strip()

        if not summary:
            logger.warning("LLM returned an empty summary — skipping.")
            return ""

        logger.info("Document summary generated successfully.")
        # Tag it so retrieval can identify this chunk as a high-value overview
        return f"[DOCUMENT SUMMARY]\n{summary}"

    except Exception as e:
        logger.error(f"Document summary generation failed: {e}")
        return ""
