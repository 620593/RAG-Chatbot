from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from backend.config import settings
from backend.graph.state import GraphState

_llm = None

def get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(model=settings.groq_model_name, api_key=settings.groq_api_key, temperature=0)
    return _llm

prompt = PromptTemplate(
    template="""You are a document relevance grader.
Assess whether the retrieved document contains ANY information that could help answer the user's question.
Be LENIENT — if the document is from the same knowledge domain or provides useful background context, grade it as relevant.
Only grade 'no' if the document is completely unrelated to the question topic.

Retrieved Document:
{document}

User Question: {question}

Output ONLY 'yes' or 'no'.
""",
    input_variables=["document", "question"],
)

def grade_documents(state: GraphState):
    """Grades retrieved documents for relevance. Passes all docs to generate if none pass."""
    print("---CHECK DOCUMENT RELEVANCE TO QUESTION---")
    question = state["question"]
    documents = state["documents"]
    llm = get_llm()
    grader_chain = prompt | llm

    filtered_docs = []
    for d in documents:
        score = grader_chain.invoke({"question": question, "document": d})
        grade = score.content.lower().strip()
        if grade.startswith("yes"):
            print("---GRADE: DOCUMENT RELEVANT---")
            filtered_docs.append(d)
        else:
            print("---GRADE: DOCUMENT NOT RELEVANT---")

    # Fallback: if ALL docs were graded out, pass the originals anyway
    # so the generator can still attempt an answer rather than returning nothing.
    if not filtered_docs and documents:
        print("---FALLBACK: USING ALL RETRIEVED DOCS AS CONTEXT---")
        filtered_docs = documents

    return {"documents": filtered_docs, "question": question}
