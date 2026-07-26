import os
import re
import time
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


class LLMRateLimitError(RuntimeError):
    """A user-safe failure raised when the model provider's rate limit is exceeded."""


llm = ChatGroq(
    api_key=SecretStr(groq_api_key),
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    temperature=0.4,
    max_tokens=700,
    timeout=LLM_TIMEOUT,
    max_retries=0,
)

RATE_LIMIT_RETRIES = 4
RATE_LIMIT_DEFAULT_WAIT = 6.0
RATE_LIMIT_MAX_WAIT = 25.0
_RETRY_AFTER_RE = re.compile(r"try again in ([\d.]+)s", re.IGNORECASE)


def _is_rate_limit(exc: Exception) -> bool:
    status_code = getattr(exc, "status_code", None)
    if status_code == 429:
        return True
    text = f"{type(exc).__name__} {exc}".lower()
    return "rate limit" in text or "429" in text

def _rate_limit_wait_seconds(exc: Exception) -> float:
    """Prefer Groq's own suggested wait time (it's exact, from a live token
    counter) over a guessed backoff. Falls back to a fixed default if the
    message shape ever changes."""
    match = _RETRY_AFTER_RE.search(str(exc))
    if match:
        return min(float(match.group(1)) + 0.5, RATE_LIMIT_MAX_WAIT)  # small buffer
    return RATE_LIMIT_DEFAULT_WAIT
def invoke_llm(model: Any, prompt: Any):
    """Invoke any shared/structured model with consistent timeout reporting.

    Rate-limit errors (429) get a short retry with backoff, since they're
    usually transient (the provider's per-minute window clearing) rather
    than a real failure worth aborting the whole job over.
    """
    last_exc: Exception | None = None
    for attempt in range(RATE_LIMIT_RETRIES + 1):
        try:
            return model.invoke(prompt)
        except Exception as exc:  
            last_exc = exc
            print(f"LLM invocation failed (attempt {attempt + 1}): {type(exc).__name__}: {exc}", flush=True)
            if "timeout" in type(exc).__name__.lower() or "timed out" in str(exc).lower():
                raise LLMTimeoutError("AI analysis timed out. Please try again.") from exc
            if _is_rate_limit(exc) and attempt < RATE_LIMIT_RETRIES:
                wait = _rate_limit_wait_seconds(exc)
                print(f"Rate limited, retrying in {wait}s...", flush=True)
                time.sleep(wait)
                continue
            if _is_rate_limit(exc):
                raise LLMRateLimitError(
                    "AI provider rate limit reached. Please try again in a minute."
                ) from exc
            raise LLMInvocationError("AI analysis failed. Please try again.") from exc

    # Unreachable, but keeps type checkers happy.
    raise LLMInvocationError("AI analysis failed. Please try again.") from last_exc
