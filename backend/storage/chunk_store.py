import sqlite3, json

DB_PATH = "chunks.db"

def save_chunks(chunks: list[str]):
    """Persist chunks to SQLite."""
    con = sqlite3.connect(DB_PATH)
    con.execute("CREATE TABLE IF NOT EXISTS chunks (id INTEGER PRIMARY KEY, text TEXT)")
    con.execute("DELETE FROM chunks")  # Clear old data
    con.executemany("INSERT INTO chunks (text) VALUES (?)", [(c,) for c in chunks])
    con.commit()
    con.close()

def load_chunks() -> list[str]:
    """Load persisted chunks from SQLite."""
    try:
        con = sqlite3.connect(DB_PATH)
        rows = con.execute("SELECT text FROM chunks ORDER BY id").fetchall()
        con.close()
        return [r[0] for r in rows]
    except Exception:
        return []
