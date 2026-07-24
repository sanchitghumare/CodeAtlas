from app.graph.context import compact_json, compact_reviews
from app.graph.state import ReviewState
from app.services.llm import invoke_llm, llm


def build_prompt(state: ReviewState) -> str:
    summary = state["summary"]
    reviews = state["reviews"]
    cross_file_analysis = state["cross_file_analysis"]
    reviews_block = compact_reviews(reviews, include_strengths=False)

    return f"""Write a concise repository review from the evidence below.
Include: overall health (2-3 sentences), recurring risks, and 3-5 prioritized
recommendations. Do not invent findings or re-review source code. Plain text.

Repository: type={summary.get("project_type", "unknown")}; purpose={summary.get("purpose", "unknown")}; architecture={summary.get("architecture", "unknown")}

File evidence:
{reviews_block}

Cross-file evidence:
{compact_json(cross_file_analysis, 2200)}"""


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
    response = invoke_llm(llm, prompt)
    state["final_report"] = _coerce_text_content(response.content)
    print("Report ready.", flush=True)
    return {"final_report": _coerce_text_content(response.content)}
