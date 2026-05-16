from PIL import Image
import pytesseract

def parse_image(file_path: str) -> str:
    """Extracts text from an image using Tesseract OCR."""
    text = ""
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
    except Exception as e:
        print(f"Error parsing Image {file_path}: {e}")
    return text
