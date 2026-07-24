import os
from typing import Any

from app.services.config import LLM_TIMEOUT
from dotenv import load_dotenv
from langchain_groq import ChatGroq  # type: ignore
from pydantic import SecretStr

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise RuntimeError("Missing GROQ_API_KEY environment variable")


class LLMTimeoutError(RuntimeError):
    """A user-safe failure raised when a model request exceeds its deadline."""


class LLMInvocationError(RuntimeError):
    """A user-safe failure raised when a model request cannot be completed."""


llm = ChatGroq(
    api_key=SecretStr(groq_api_key),
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    temperature=0.4,
    max_tokens=700,
    timeout=LLM_TIMEOUT,
    max_retries=0,
)


def invoke_llm(model: Any, prompt: Any):
    """Invoke any shared/structured model with consistent timeout reporting."""
    try:
        return model.invoke(prompt)
    except Exception as exc:  # noqa: BLE001
        if "timeout" in type(exc).__name__.lower() or "timed out" in str(exc).lower():
            raise LLMTimeoutError("AI analysis timed out. Please try again.") from exc
        raise LLMInvocationError("AI analysis failed. Please try again.") from exc
