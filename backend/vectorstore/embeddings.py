from langchain_huggingface import HuggingFaceEndpointEmbeddings
from backend.config import settings

def get_embeddings() -> HuggingFaceEndpointEmbeddings:
    """Initializes and returns the HuggingFace embedding model via API."""
    return HuggingFaceEndpointEmbeddings(
        model=f"https://api-inference.huggingface.co/pipeline/feature-extraction/{settings.embedding_model_name}",
        huggingfacehub_api_token=settings.hf_token,
    )
