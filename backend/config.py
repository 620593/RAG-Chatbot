import os
from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv

# Explicitly load .env from the backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model_name: str = "llama-3.3-70b-versatile"
    embedding_model_name: str = "BAAI/bge-large-en-v1.5"
    hf_token: str = ""
    qdrant_url: str = ":memory:" # Using memory for dev, change to URL for prod
    qdrant_api_key: Optional[str] = None
    collection_name: str = "rag_collection"
    
    # Rate limiting sleep time (seconds) to respect 12K TPM limit
    chunking_rate_limit_delay: float = 2.0 

settings = Settings()
