import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq  # type: ignore[import-not-found]
from pydantic import SecretStr

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY") 

if not groq_api_key:
    raise RuntimeError("Missing GROQ_API_KEY (or GROQ_API) environment variable")

llm = ChatGroq(
    api_key=SecretStr(groq_api_key),
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    temperature=0.4,
    # All graph outputs are deliberately concise; this avoids runaway output
    # while leaving enough room for the final repository report.
    max_tokens=700,
)
