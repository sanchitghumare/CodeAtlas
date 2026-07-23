import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq  # type: ignore[import-not-found]

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY") 

if not groq_api_key:
    raise RuntimeError("Missing GROQ_API_KEY (or GROQ_API) environment variable")

llm = ChatGroq(
    api_key=groq_api_key,
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    temperature=0.4,
    max_tokens=1024,
)
