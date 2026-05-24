"""
Document Parser Router
========================
Routes uploaded files to the correct parser based on file extension.
All parsers follow the contract: return extracted text as str.
Errors are caught and logged; an empty string is returned rather than crashing.
"""

import os
import logging
from .pdf_parser import parse_pdf
from .docx_parser import parse_docx
from .image_parser import parse_image

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {
    ".pdf": parse_pdf,
    ".docx": parse_docx,
    ".doc": parse_docx,
    ".png": parse_image,
    ".jpg": parse_image,
    ".jpeg": parse_image,
    ".webp": parse_image,
}


def parse_document(file_path: str) -> str:
    """
    Routes the file to the appropriate parser based on extension.

    Args:
        file_path: Absolute or relative path to the uploaded file.

    Returns:
        Extracted text content as a string. Returns empty string on failure.

    Raises:
        ValueError: If the file extension is not supported.
    """
    _, ext = os.path.splitext(file_path.lower())

    if ext in SUPPORTED_EXTENSIONS:
        parser_fn = SUPPORTED_EXTENSIONS[ext]
        logger.info(f"Parsing '{os.path.basename(file_path)}' with {parser_fn.__module__}")
        return parser_fn(file_path)

    elif ext in (".txt", ".md"):
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to read text file '{file_path}': {e}")
            return ""

    else:
        raise ValueError(
            f"Unsupported file extension: '{ext}'. "
            f"Supported types: {', '.join(sorted(list(SUPPORTED_EXTENSIONS.keys()) + ['.txt', '.md']))}"
        )
