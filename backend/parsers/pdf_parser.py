import fitz  # PyMuPDF fallback
import pdfplumber

def parse_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF, using pdfplumber for accurate
    table and structured data extraction with PyMuPDF as fallback.
    """
    text = _parse_with_pdfplumber(file_path)
    if not text.strip():
        print("pdfplumber returned empty text, falling back to PyMuPDF...")
        text = _parse_with_pymupdf(file_path)
    return text

def _parse_with_pdfplumber(file_path: str) -> str:
    """Extracts text + tables from PDF using pdfplumber (better for structured docs)."""
    result = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                # Extract regular text
                page_text = page.extract_text() or ""
                result += page_text + "\n"

                # Extract tables as readable key-value text
                for table in page.extract_tables():
                    for row in table:
                        # Filter empty cells and join as readable line
                        clean_row = [str(cell).strip() for cell in row if cell]
                        if clean_row:
                            result += " | ".join(clean_row) + "\n"
                result += "\n"
    except Exception as e:
        print(f"pdfplumber error on {file_path}: {e}")
    return result

def _parse_with_pymupdf(file_path: str) -> str:
    """Fallback extractor using PyMuPDF."""
    text = ""
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text("text") + "\n\n"
        doc.close()
    except Exception as e:
        print(f"PyMuPDF error on {file_path}: {e}")
    return text
