from langgraph.types import Send  #type: ignore
from app.models.review import FileReview
from app.services.llm import llm
from app.graph.state import ReviewState, FileReviewState

structured_llm = llm.with_structured_output(FileReview)
MAX_CONTENT_CHARS = 12000


def build_prompt(path: str, content: str) -> str:
    truncated = len(content) > MAX_CONTENT_CHARS
    if truncated:
        content = content[:MAX_CONTENT_CHARS]

    note = (
        "\n\n[NOTE: file was truncated for review due to length. "
        "Base your review only on the code shown above.]"
        if truncated
        else ""
    )

    return f"""You are a senior software engineer.

        Review this source file.

        Evaluate:

        • Code quality
        • Readability
        • Maintainability
        • Best practices
        • Error handling

        Give a score from 0-100.

        Suggest improvements.

        File path:
        {path}

        Source code:
        {content}{note}"""


def dispatch_reviews(state: ReviewState):
    """Orchestrator step: fan out one Send per source file so
    review_one_file runs as a parallel worker branch per file instead of a
    sequential for-loop. LangGraph waits for every branch to finish before
    continuing to the next shared node (synthesize_report)."""
    sends = []
    for source_file in state["source_files"]:
        content = source_file["content"]
        if not content or not content.strip():
            print(f"Skipping {source_file['path']} (empty file)", flush=True)
            continue
        sends.append(
            Send(
                "review_one_file",
                {"path": source_file["path"], "content": content},
            )
        )
    return sends


def review_one_file(payload: FileReviewState):
    """Worker: reviews a single file. Runs once per Send dispatched above."""
    path = payload["path"]
    content = payload["content"]

    prompt = build_prompt(path, content)

    print(
        f"Reviewing {path}... ({len(content)} chars"
        f"{', truncated' if len(content) >= MAX_CONTENT_CHARS else ''})",
        flush=True,
    )
    try:
        review = structured_llm.invoke(prompt)
    except Exception as exc:
        print(f"Failed to review {path}: {exc}", flush=True)
        return {"reviews": []}

    print(f"Finished {path}", flush=True)
    return {"reviews": [review]}