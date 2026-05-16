from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from backend.config import settings
from backend.graph.state import GraphState

# Lazy initialization to avoid errors at module load before .env is read
_llm = None

def get_llm() -> ChatGroq:
    """Returns the generator LLM, initializing lazily."""
    global _llm
    if _llm is None:
        _llm = ChatGroq(model=settings.groq_model_name, api_key=settings.groq_api_key, temperature=0)
    return _llm

prompt = PromptTemplate(
    template="""You are an assistant for question-answering tasks.
Use the following retrieved context to answer the question.
If you don't know the answer from the context, say "I don't have enough information to answer that."
Keep your answer concise.

Question: {question}
Context: {context}
Answer:
""",
    input_variables=["question", "context"],
)

def generate(state: GraphState):
    """
    Generate answer using retrieved context.

    Args:
        state (dict): The current graph state.

    Returns:
        state (dict): Updated with 'generation' key containing the LLM answer.
    """
    print("---GENERATE---")
    question = state["question"]
    documents = state["documents"]

    if not documents:
        return {
            "generation": "I'm sorry, I couldn't find any relevant information to answer your question.",
            "documents": documents,
            "question": question,
        }

    llm = get_llm()
    rag_chain = prompt | llm | StrOutputParser()
    context = "\n\n".join(documents)
    generation = rag_chain.invoke({"context": context, "question": question})

    return {"documents": documents, "question": question, "generation": generation}
