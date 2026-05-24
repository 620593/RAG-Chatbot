"""
HuggingFace Embeddings
========================
Provides a singleton embedding model instance using HuggingFace's
Inference API (BAAI/bge-large-en-v1.5, 1024-dimensional vectors).

Singleton pattern ensures only one HTTP connection pool is created per
server process (important for performance and rate-limit management).
"""

import logging
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from backend.config import settings

logger = logging.getLogger(__name__)

_embeddings: HuggingFaceEndpointEmbeddings | None = None


def get_embeddings() -> HuggingFaceEndpointEmbeddings:
    """
    Returns the singleton HuggingFace embedding model.

    Raises:
        RuntimeError: If HF_TOKEN is not configured.
    """
    global _embeddings
    if _embeddings is None:
        if not settings.hf_token:
            raise RuntimeError(
                "HF_TOKEN environment variable is not set. "
                "A HuggingFace API token with Inference permissions is required."
            )
        logger.info(f"Initialising embeddings model: {settings.embedding_model_name}")
        _embeddings = HuggingFaceEndpointEmbeddings(
            model=settings.embedding_model_name,
            huggingfacehub_api_token=settings.hf_token,
        )
        logger.info("Embeddings model ready.")
    return _embeddings
