# ── Base image ────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# ── System dependencies ────────────────────────────────────────────────────────
# tesseract-ocr        → OCR for image files (pytesseract)
# libglib2.0-0         → Required by some PIL/Pillow operations
# poppler-utils        → Required by pdfplumber for certain PDF types
# libgomp1             → OpenMP (needed by some ML libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        libglib2.0-0 \
        poppler-utils \
        libgomp1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Python dependencies ───────────────────────────────────────────────────────
# Copy requirements first so Docker can cache this layer separately from code
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────────
COPY . .

# ── Runtime ───────────────────────────────────────────────────────────────────
# Create the upload temp dir and SQLite DB dir at container start
RUN mkdir -p temp_uploads

EXPOSE 8000

# Use 2 uvicorn workers for concurrency on Render's free tier (1 CPU)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
