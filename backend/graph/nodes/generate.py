"""
Answer Generation Node
========================
Generates a comprehensive, well-structured answer using the LLM grounded
on the retrieved and graded document context.

Prompt design principles:
  - Instructs the model to cite source documents when possible
  - Encourages structured, markdown-formatted output
  - Handles the "no relevant context" case gracefully
  - Uses temperature=0 for factual, deterministic answers
"""

import logging
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from backend.config import settings
from backend.graph.state import GraphState

logger = logging.getLogger(__name__)

_llm: ChatGroq | None = None

_GENERATE_PROMPT = PromptTemplate(
    template="""You are an expert AI research assistant answering questions based on retrieved document context.

## Instructions
- Answer the question **thoroughly and accurately** using ONLY the provided context.
- Structure your answer with clear headings, bullet points, or numbered lists where appropriate.
- If the answer spans multiple aspects, cover each one clearly.
- Where specific facts, figures, or claims come from the documents, you may note them inline.
- If the context does not contain enough information to fully answer the question, clearly state:
  "Based on the indexed documents, I can partially answer..." and provide what you can.
- Do NOT fabricate information not present in the context.
- Format your response using Markdown.

## Retrieved Context
{context}

## Question
{question}

## Answer
""",
    input_variables=["context", "question"],
)

_NO_CONTEXT_RESPONSE = (
    "I'm sorry, but I couldn't find any relevant information in the indexed documents "
    "to answer your question.\n\n"
    "**Suggestions:**\n"
    "- Make sure you've uploaded the relevant document(s) using the **📎 attach** button.\n"
    "- Try rephrasing your question with more specific keywords.\n"
    "- Check the **Vector Store** tab to verify your documents were indexed successfully."
)


def _get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model=settings.groq_model_name,
            api_key=settings.groq_api_key,
            temperature=0,
        )
    return _llm


def generate(state: GraphState) -> dict:
    """
    Generates the final answer grounded on the retrieved document context.

    Returns:
        Updated state with 'generation' key containing the markdown-formatted answer.
    """
    logger.info("--- NODE: GENERATE ---")
    question = state["question"]
    documents = state["documents"]
    source_files = state.get("source_files", [])

    if not documents:
        logger.warning("No documents passed to generate node — returning guidance message.")
        return {
            "generation": _NO_CONTEXT_RESPONSE,
            "documents": documents,
            "source_files": source_files,
            "question": question,
        }

    try:
        llm = _get_llm()
        rag_chain = _GENERATE_PROMPT | llm | StrOutputParser()
        context = "\n\n---\n\n".join(documents)
        generation = rag_chain.invoke({"context": context, "question": question})

        if not generation or not generation.strip():
            generation = "The model returned an empty response. Please try rephrasing your question."

        logger.info("Answer generated successfully.")
        return {
            "generation": generation,
            "documents": documents,
            "source_files": source_files,
            "question": question,
        }

    except Exception as e:
        logger.error(f"Generation failed: {e}", exc_info=True)
        return {
            "generation": f"An error occurred while generating the answer: {str(e)}",
            "documents": documents,
            "source_files": source_files,
            "question": question,
        }
