"""
Application Configuration
==========================
All settings are read from environment variables (or a .env file in the backend/ directory).
Production deployment should inject these via Render's Environment Variables panel.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Explicitly load .env from the backend directory so local dev works without
# needing to set system-level environment variables.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Settings(BaseSettings):
    # --- LLM (Groq) ---
    groq_api_key: str = ""
    groq_model_name: str = "llama-3.3-70b-versatile"

    # --- Embeddings (HuggingFace) ---
    embedding_model_name: str = "BAAI/bge-large-en-v1.5"
    hf_token: str = ""

    # --- Vector Store (Qdrant Cloud) ---
    qdrant_url: str = ""           # e.g. https://xxxx.qdrant.io:6333
    qdrant_api_key: Optional[str] = None
    collection_name: str = "rag_collection"

    # --- Pipeline tuning ---
    # Rate-limit sleep between contextual chunking batches (seconds)
    chunking_rate_limit_delay: float = 2.0
    # Max retries for Groq API calls
    groq_max_retries: int = 4
    # Enable/disable LLM-based contextual enrichment of chunks
    contextual_chunking_enabled: bool = True
    # Chunk size and overlap for text splitter
    chunk_size: int = 1000
    chunk_overlap: int = 150

    # --- Upload limits ---
    max_upload_size_mb: int = 50

    # --- CORS ---
    # Comma-separated list of allowed origins, or "*" for development
    cors_origins: str = "*"

    class Config:
        # pydantic-settings reads from environment variables case-insensitively
        env_file = ".env"
        extra = "ignore"


settings = Settings()
