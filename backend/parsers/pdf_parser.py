"""
PDF Parser
============
Extracts text from PDF files using two complementary strategies:
  1. pdfplumber (primary) — best for structured text, tables, forms
  2. PyMuPDF / fitz (fallback) — best for complex layouts, scanned-ish docs

Both strategies append page-break markers so downstream chunking can
split on natural document boundaries.
"""

import logging
import fitz          # PyMuPDF
import pdfplumber

logger = logging.getLogger(__name__)


def parse_pdf(file_path: str) -> str:
    """
    Parses a PDF file and returns its full text content.

    Tries pdfplumber first (better for tables / forms), then falls back
    to PyMuPDF if the result is empty or too sparse.
    """
    text = _parse_with_pdfplumber(file_path)

    if len(text.strip()) < 100:
        logger.warning(
            f"pdfplumber yielded sparse text ({len(text.strip())} chars) for '{file_path}'. "
            "Trying PyMuPDF fallback..."
        )
        pymupdf_text = _parse_with_pymupdf(file_path)
        # Use whichever produced more content
        text = pymupdf_text if len(pymupdf_text) > len(text) else text

    return text


def _parse_with_pdfplumber(file_path: str) -> str:
    """Primary extractor: pdfplumber handles tables and structured documents well."""
    result_parts = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                # Regular text
                page_text = page.extract_text() or ""
                if page_text.strip():
                    result_parts.append(page_text)

                # Tables → readable pipe-delimited rows
                for table in page.extract_tables():
                    for row in table:
                        clean_row = [str(cell).strip() for cell in row if cell is not None and str(cell).strip()]
                        if clean_row:
                            result_parts.append(" | ".join(clean_row))

                result_parts.append(f"\n--- Page {page_num} ---\n")

    except pdfplumber.utils.exceptions.PDFSyntaxError as e:
        logger.warning(f"pdfplumber syntax error on '{file_path}': {e}")
    except Exception as e:
        logger.error(f"pdfplumber unexpected error on '{file_path}': {e}")

    return "\n".join(result_parts)


def _parse_with_pymupdf(file_path: str) -> str:
    """Fallback extractor using PyMuPDF — handles complex layouts better."""
    result_parts = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")  # type: ignore[arg-type]
            if text.strip():
                result_parts.append(text)
            result_parts.append(f"\n--- Page {page_num + 1} ---\n")
        doc.close()
    except Exception as e:
        logger.error(f"PyMuPDF error on '{file_path}': {e}")

    return "\n".join(result_parts)
