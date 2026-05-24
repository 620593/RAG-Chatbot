"""
Image Parser
=============
Extracts text from images using Tesseract OCR via pytesseract.

Graceful degradation:
  - If Tesseract is not installed (common on some cloud environments),
    a descriptive placeholder is returned instead of crashing.
  - Pillow preprocessing (greyscale + contrast boost) improves OCR accuracy.
"""

import logging
from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)

# Try importing pytesseract; degrade gracefully if not available
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
    logger.info("pytesseract available — image OCR enabled.")
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract not found — image OCR will return a placeholder.")


def _preprocess_image(img: Image.Image) -> Image.Image:
    """Applies pre-processing steps to improve OCR accuracy."""
    # Convert to greyscale
    img = img.convert("L")
    # Sharpen edges
    img = img.filter(ImageFilter.SHARPEN)
    # Boost contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    return img


def parse_image(file_path: str) -> str:
    """
    Extracts text from an image file using Tesseract OCR.

    Args:
        file_path: Path to the image file (.png, .jpg, .jpeg, .webp).

    Returns:
        OCR-extracted text or a descriptive placeholder if Tesseract is unavailable.
    """
    if not TESSERACT_AVAILABLE:
        return (
            "[Image uploaded — Tesseract OCR is not installed on this server. "
            "Text extraction from images is unavailable. "
            "Please convert the image to a searchable PDF before uploading.]"
        )

    try:
        img = Image.open(file_path)
        preprocessed = _preprocess_image(img)

        # Use English language config with LSTM engine
        custom_config = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(preprocessed, config=custom_config)

        if not text.strip():
            logger.warning(f"OCR produced no text for '{file_path}'. Image may have no text content.")
            return "[Image processed — no readable text found in this image.]"

        return text.strip()

    except Exception as e:
        logger.error(f"OCR error on '{file_path}': {e}")
        return f"[OCR failed for this image: {str(e)}]"
