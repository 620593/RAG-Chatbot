from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from backend.config import settings
from backend.graph.state import GraphState

_llm = None

def get_llm() -> ChatGroq:
    """Returns the rewriter LLM, initializing lazily."""
    global _llm
    if _llm is None:
        _llm = ChatGroq(model=settings.groq_model_name, api_key=settings.groq_api_key, temperature=0)
    return _llm

prompt = PromptTemplate(
    template="""You are a search query optimizer for a document retrieval system.
Your job is to rewrite the user's question into a clear, keyword-rich search query
that will retrieve the most relevant chunks from a vector store.

Rules:
- If the question is broad (e.g., "what is this about?", "summarize this"), output keywords like "introduction overview summary main topic"
- If the question is specific, extract the key entities and concepts
- Output ONLY the rewritten query. No explanation, no punctuation.

Original Question: {question}
Rewritten Search Query:""",
    input_variables=["question"],
)

def rewrite_query(state: GraphState):
    """Rewrites the user's question into a better retrieval query."""
    print("---REWRITE QUERY---")
    question = state["question"]
    llm = get_llm()
    chain = prompt | llm | StrOutputParser()
    rewritten = chain.invoke({"question": question})
    print(f"---REWRITTEN QUERY: {rewritten}---")
    return {"question": rewritten}
