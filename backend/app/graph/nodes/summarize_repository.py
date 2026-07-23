from langchain_core.messages import HumanMessage
from app.graph.state import ReviewState
from app.services.llm import llm
from pydantic import BaseModel


class RepositorySummary(BaseModel):
    project_type: str
    purpose: str
    architecture: str
    technologies: list[str]
    frameworks: list[str]
    languages: list[str]
    review_targets: list[str]
    entry_points: list[str]
    confidence: float


structured_llm = llm.with_structured_output(RepositorySummary)


def summarize_repository(state: ReviewState):

    metadata = state["repository"]
    readme = state["readme"]["content"]
    tree = state["tree"]
    prompt = f"""
        You are a senior software engineer.

        Repository Metadata:

        Languages:
        {metadata["languages"]}

        Frameworks:
        {metadata["frameworks"]}

        Important Files:
        {metadata["important_files"]}
        Entry Points:
        {metadata["entry_points"]}
        Total Files:
        {metadata["total_files"]}
        Total Directories:
        {metadata["total_directories"]}

        README:

        {readme}

        Directory Tree:

        {tree}

        Summarize this repository.

       Return ONLY a valid JSON object.

        Rules:
        - Do NOT write any explanation.
        - Do NOT write "Here's the JSON".
        - Do NOT use markdown.
        - Do NOT use ```json.
        - Do NOT write anything before or after the JSON.

        The response must start with '{" and end with "}'.

        Return exactly this schema:

         {{
            "project_type": "",
            "purpose": "",
            "architecture": "",
            "technologies": [],
            "frameworks": [],
            "languages": [],
            "review_targets": [],
            "entry_points": [],
            "confidence": 0.0
        }}
        """
    response = structured_llm.invoke([HumanMessage(content=prompt)])
    if isinstance(response, BaseModel):
        state["summary"] = response.model_dump()
    else:
        state["summary"] = response
    return state["summary"]
