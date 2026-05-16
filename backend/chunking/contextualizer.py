import asyncio
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from backend.config import settings

prompt_template = """
You are an expert at providing context for text snippets.
Given the full document context, please provide a brief (1-3 sentences) context for the following chunk so it can be understood in isolation.
Full Document Context:
{full_document}

Chunk:
{chunk}

Context:
"""

prompt = PromptTemplate(template=prompt_template, input_variables=["full_document", "chunk"])

async def enrich_chunk_with_context(chunk: str, full_document: str, llm: ChatGroq) -> str:
    """Uses the LLM to generate context for a specific chunk."""
    try:
        chain = prompt | llm
        response = await chain.ainvoke({"full_document": full_document[:15000], "chunk": chunk}) 
        # Using slicing on full_document to avoid massive context explosion, adjust as needed.
        context = response.content.strip()
        return f"{context}\n\n{chunk}"
    except Exception as e:
        print(f"Failed to generate context for chunk: {e}")
        return chunk # Fallback to original chunk if rate limit or error hits

async def process_chunks_contextually(chunks: list[str], full_document: str) -> list[str]:
    """Processes a list of chunks concurrently to add context."""
    llm = ChatGroq(model=settings.groq_model_name, api_key=settings.groq_api_key)
    enriched_chunks = []
    
    # We process in small batches to respect the 12K TPM limit
    batch_size = 3
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        tasks = [enrich_chunk_with_context(chunk, full_document, llm) for chunk in batch]
        batch_results = await asyncio.gather(*tasks)
        enriched_chunks.extend(batch_results)
        await asyncio.sleep(settings.chunking_rate_limit_delay) # Rate limit backoff
        
    return enriched_chunks
