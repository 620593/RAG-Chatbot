"""
Text Splitter
==============
Splits extracted document text into overlapping chunks for vector indexing.
Uses LangChain's RecursiveCharacterTextSplitter which respects natural
document boundaries (paragraphs → sentences → words → characters).
"""

import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from backend.config import settings

logger = logging.getLogger(__name__)


def split_text(
    text: str,
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> list[str]:
    """
    Splits a document's text into overlapping chunks.

    Args:
        text: The full document text to split.
        chunk_size: Maximum characters per chunk (default from settings).
        chunk_overlap: Overlap between consecutive chunks (default from settings).

    Returns:
        List of text chunk strings.
    """
    chunk_size = chunk_size or settings.chunk_size
    chunk_overlap = chunk_overlap or settings.chunk_overlap

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        # Priority order: try to split on paragraph breaks first
        separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
        length_function=len,
        is_separator_regex=False,
    )

    chunks = splitter.split_text(text)
    logger.info(f"Split text into {len(chunks)} chunks (size={chunk_size}, overlap={chunk_overlap})")
    return chunks
