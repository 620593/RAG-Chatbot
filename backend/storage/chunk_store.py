"""
Chunk Persistent Storage (SQLite)
===================================
Stores indexed chunks and their metadata to SQLite so BM25 can be
reconstructed after a server restart (e.g., Render cold-start).

Schema:
  chunks (id, text, filename, source, uploaded_at)

Note: This does NOT replace Qdrant — Qdrant holds the dense vectors.
SQLite here exists solely for BM25 in-memory reconstruction.
"""

import sqlite3
import logging
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

DB_PATH = Path("chunks.db")


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            text        TEXT NOT NULL,
            filename    TEXT DEFAULT '',
            source      TEXT DEFAULT '',
            uploaded_at TEXT DEFAULT ''
        )
    """)
    conn.commit()
    return conn


def save_chunks(
    chunks: list[str],
    metadatas: list[dict] | None = None,
    filename: str = "unknown",
) -> None:
    """
    Persists chunks (and their metadata) to SQLite.

    Existing chunks for the same filename are replaced to avoid duplicates on re-upload.
    Chunks from other documents are preserved (multi-document support).
    """
    if metadatas is None:
        metadatas = [{"filename": filename, "source": filename} for _ in chunks]

    now = datetime.utcnow().isoformat()

    try:
        conn = _get_connection()
        # Remove old chunks from THIS specific file only
        conn.execute("DELETE FROM chunks WHERE filename = ?", (filename,))

        rows = [
            (
                chunk,
                meta.get("filename", filename),
                meta.get("source", filename),
                now,
            )
            for chunk, meta in zip(chunks, metadatas)
        ]
        conn.executemany(
            "INSERT INTO chunks (text, filename, source, uploaded_at) VALUES (?, ?, ?, ?)",
            rows,
        )
        conn.commit()
        conn.close()
        logger.info(f"Persisted {len(chunks)} chunks for '{filename}' to SQLite.")
    except Exception as e:
        logger.error(f"Failed to persist chunks: {e}")


def load_chunks_with_metadata() -> list[dict]:
    """
    Loads all persisted chunks from SQLite including their metadata.

    Returns:
        List of dicts with keys: text, filename, source, uploaded_at.
    """
    try:
        conn = _get_connection()
        rows = conn.execute(
            "SELECT text, filename, source, uploaded_at FROM chunks ORDER BY id"
        ).fetchall()
        conn.close()
        return [
            {"text": r[0], "filename": r[1], "source": r[2], "uploaded_at": r[3]}
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Failed to load chunks from SQLite: {e}")
        return []


# Backwards-compatible alias used by BM25 rebuild in main.py startup
def load_chunks() -> list[str]:
    """Returns only the text column of all persisted chunks (legacy alias)."""
    return [item["text"] for item in load_chunks_with_metadata()]
