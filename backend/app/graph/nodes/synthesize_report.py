from app.services.llm import llm
from app.graph.state import ReviewState


def build_prompt(state: ReviewState) -> str:
    summary = state["summary"]
    reviews = state["reviews"]
    cross_file_analysis=state["cross_file_analysis"]
    reviews_block = "\n\n".join(
        f"File: {r.path}\n"
        f"Score: {r.score}/100\n"
        f"Strengths: {', '.join(r.strengths) if r.strengths else 'none noted'}\n"
        f"Issues:\n"
        + (
            "\n".join(
                f"  - [{i.severity}/{i.category}] {i.description} "
                f"(fix: {i.suggestion})"
                for i in r.issues
            )
            if r.issues
            else "  none"
        )
        for r in reviews
    )

    return f"""You are a senior software engineer writing a final code review
        report for a pull request / repository audit.

        Project type: {summary.get("project_type", "unknown")}
        Purpose: {summary.get("purpose", "unknown")}
        Architecture: {summary.get("architecture", "unknown")}

        Below are the per-file reviews already produced. Do not re-review the
        code. Synthesize these findings into a short report with:

        1. An overall health assessment (2-3 sentences)
        2. The most important recurring issues across files, if any
        3. A prioritized list of the top 3-5 recommendations

        Keep it concise and actionable. Plain text, no markdown headers.

        Per-file reviews:
        {reviews_block}
         
        The cross-file analysis is as follows:
        {cross_file_analysis}"""


def _coerce_text_content(content: object) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
                elif text is not None:
                    parts.append(str(text))
            elif item is not None:
                parts.append(str(item))
        return "".join(parts)

    return str(content)


def synthesize_report(state: ReviewState):
    if not state["reviews"]:
        state["final_report"] = (
            "No files were reviewed, so no report could be generated."
        )
        return state

    print("Synthesizing final report...", flush=True)
    prompt = build_prompt(state)
    response = llm.invoke(prompt)
    state["final_report"] = _coerce_text_content(response.content)
    print("Report ready.", flush=True)
    return {"final_report": _coerce_text_content(response.content)}