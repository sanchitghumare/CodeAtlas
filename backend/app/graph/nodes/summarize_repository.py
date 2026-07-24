from app.graph.context import clip, compact_tree
from app.graph.state import ReviewState
from app.services.llm import llm
from pydantic import BaseModel


class RepositorySummary(BaseModel):
    project_type: str
    purpose: str
    architecture: str
    frameworks: list[str]
    languages: list[str]
    confidence: float


structured_llm = llm.with_structured_output(RepositorySummary)


def summarize_repository(state: ReviewState):
    metadata = state["repository"]
    prompt = f"""Summarize this repository for a code-review system. Infer only
what the evidence supports: project type, purpose, architecture, languages,
frameworks, and confidence.

Metadata: languages={metadata["languages"]}; frameworks={metadata["frameworks"]};
important_files={metadata["important_files"][:20]};
entry_points={metadata["entry_points"][:10]}; files={metadata["total_files"]};
directories={metadata["total_directories"]}

README (may be absent):
{clip(state["readme"]["content"], 1500)}

Repository paths:
{compact_tree(state["tree"])}"""
    response = structured_llm.invoke(prompt)
    summary = response.model_dump() if isinstance(response, BaseModel) else response
    return {"summary": summary}
