"""
Contextual Chunk Enrichment (Anthropic-style)
===============================================
For each chunk, the LLM is prompted to generate a brief (1-3 sentence) contextual
summary that situates the chunk within the broader document. This context is prepended
to the chunk text, dramatically improving retrieval relevance.

Reference: Anthropic "Contextual Retrieval" technique.

Robustness features:
  - Exponential backoff retries on Groq rate-limit (429) and server errors (503)
  - Configurable batch size to respect TPM limits
  - Graceful fallback: original chunk returned if enrichment fails
  - Can be disabled entirely via CONTEXTUAL_CHUNKING_ENABLED=false env var
"""

import asyncio
import logging
import time

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from backend.config import settings

logger = logging.getLogger(__name__)

_CONTEXT_PROMPT = PromptTemplate(
    template="""You are an expert at providing concise context for text snippets from documents.
Given the full document and a specific chunk, write 1-3 sentences that:
1. Identify what section or topic this chunk belongs to
2. Explain how it relates to the overall document
3. Add any key entities or terms the chunk references implicitly

Full Document (first 12,000 characters):
{full_document}

Chunk to contextualise:
{chunk}

Context (1-3 sentences only, no preamble):""",
    input_variables=["full_document", "chunk"],
)

# Maximum characters of the full document to send as context window
_MAX_DOC_CONTEXT_CHARS = 12_000


async def _enrich_chunk_with_retry(
    chunk: str,
    full_document: str,
    llm: ChatGroq,
    max_retries: int = None,
) -> str:
    """
    Enriches a single chunk with LLM-generated context, with exponential backoff.

    Returns the enriched chunk (context prepended) or the original chunk on failure.
    """
    max_retries = max_retries or settings.groq_max_retries
    chain = _CONTEXT_PROMPT | llm

    for attempt in range(1, max_retries + 1):
        try:
            response = await chain.ainvoke({
                "full_document": full_document[:_MAX_DOC_CONTEXT_CHARS],
                "chunk": chunk,
            })
            context = response.content.strip()
            if context:
                return f"{context}\n\n{chunk}"
            return chunk

        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = "429" in error_str or "rate limit" in error_str
            is_server_error = "503" in error_str or "500" in error_str

            if (is_rate_limit or is_server_error) and attempt < max_retries:
                wait = 2 ** attempt  # 2s, 4s, 8s, 16s
                logger.warning(
                    f"Groq API error (attempt {attempt}/{max_retries}): {e}. "
                    f"Retrying in {wait}s..."
                )
                await asyncio.sleep(wait)
            else:
                logger.warning(
                    f"Context enrichment failed after {attempt} attempt(s): {e}. "
                    "Using original chunk."
                )
                return chunk

    return chunk


async def process_chunks_contextually(
    chunks: list[str],
    full_document: str,
) -> list[str]:
    """
    Processes all chunks and enriches each with contextual summaries.

    Processing is done in small batches to respect Groq's TPM (tokens per minute)
    rate limits. A configurable sleep is inserted between batches.

    If contextual_chunking_enabled is False, returns chunks unchanged (fast path).
    """
    if not settings.contextual_chunking_enabled:
        logger.info("Contextual chunking disabled — using raw chunks.")
        return chunks

    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set — skipping contextual enrichment.")
        return chunks

    logger.info(f"Starting contextual enrichment of {len(chunks)} chunks...")
    llm = ChatGroq(
        model=settings.groq_model_name,
        api_key=settings.groq_api_key,
        temperature=0,
        max_retries=0,  # We handle retries ourselves above
    )

    enriched: list[str] = []
    batch_size = 3  # Keep batches small to avoid burst rate limiting

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i: i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(chunks) + batch_size - 1) // batch_size
        logger.info(f"  Enriching batch {batch_num}/{total_batches} ({len(batch)} chunks)...")

        tasks = [
            _enrich_chunk_with_retry(chunk, full_document, llm)
            for chunk in batch
        ]
        results = await asyncio.gather(*tasks)
        enriched.extend(results)

        # Rate-limit buffer between batches (except the last)
        if i + batch_size < len(chunks):
            await asyncio.sleep(settings.chunking_rate_limit_delay)

    logger.info(f"Contextual enrichment complete: {len(enriched)} chunks enriched.")
    return enriched
