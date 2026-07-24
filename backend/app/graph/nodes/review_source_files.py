from app.graph.state import FileReviewState, ReviewState
from app.models.review import FileReview
from app.services.llm import LLMInvocationError, LLMTimeoutError, invoke_llm, llm
from langgraph.types import Send  # type: ignore

structured_llm = llm.with_structured_output(FileReview)
MAX_CONTENT_CHARS = 3500


def build_prompt(path: str, content: str) -> str:
    truncated = len(content) > MAX_CONTENT_CHARS
    if truncated:
        content = content[:MAX_CONTENT_CHARS]

    note = "\n[File excerpt is truncated; assess only the shown code.]" if truncated else ""
    return f"""Review this source file as a senior engineer.
Focus on correctness, security, reliability, and maintainability. Report only
material findings with an actionable fix; do not comment on formatting.

File: {path}
Code:
{content}{note}"""


def dispatch_reviews(state: ReviewState):
    """Fan out one independent file-review task per selected source file."""
    sends = []
    for source_file in state["source_files"]:
        content = source_file["content"]
        if not content or not content.strip():
            print(f"Skipping {source_file['path']} (empty file)", flush=True)
            continue
        sends.append(Send("review_one_file", {"path": source_file["path"], "content": content}))
    return sends


def review_one_file(payload: FileReviewState):
    path = payload["path"]
    content = payload["content"]
    print(f"Reviewing {path}... ({len(content)} chars)", flush=True)
    try:
        review = invoke_llm(structured_llm, build_prompt(path, content))
    except (LLMTimeoutError, LLMInvocationError):
        raise
    except Exception as exc:  # noqa: BLE001
        print(f"Failed to review {path}: {exc}", flush=True)
        raise RuntimeError(f"AI review failed for {path}.") from exc

    print(f"Finished {path}", flush=True)
    return {"reviews": [review]}
