from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from backend.config import settings

_llm = None

def get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(model=settings.groq_model_name, api_key=settings.groq_api_key, temperature=0)
    return _llm

prompt = PromptTemplate(
    template="""You are a document analyst. Read the following document text carefully and write a 
comprehensive 3-5 sentence summary that clearly identifies:
1. What type of document this is (e.g., scorecard, invoice, report, research paper)
2. The key entities involved (e.g., person's name, organization, subject)
3. The most important facts or data points

Document Text:
{document}

Summary:""",
    input_variables=["document"],
)

def generate_document_summary(full_text: str) -> str:
    """Generates a high-quality document-level summary using the LLM."""
    print("---GENERATING DOCUMENT SUMMARY---")
    try:
        llm = get_llm()
        chain = prompt | llm | StrOutputParser()
        # Use first 8000 chars to stay within token limits
        summary = chain.invoke({"document": full_text[:8000]})
        # Tag this chunk so we know it's a summary
        return f"[DOCUMENT SUMMARY]\n{summary}"
    except Exception as e:
        print(f"Failed to generate document summary: {e}")
        return ""
