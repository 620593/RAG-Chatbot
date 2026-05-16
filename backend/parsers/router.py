import os
from .pdf_parser import parse_pdf
from .docx_parser import parse_docx
from .image_parser import parse_image

def parse_document(file_path: str) -> str:
    """Routes the file to the appropriate parser based on extension."""
    _, ext = os.path.splitext(file_path.lower())
    
    if ext == '.pdf':
        return parse_pdf(file_path)
    elif ext in ['.docx', '.doc']:
        return parse_docx(file_path)
    elif ext in ['.png', '.jpg', '.jpeg']:
        return parse_image(file_path)
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
