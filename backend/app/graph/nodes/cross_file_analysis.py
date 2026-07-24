import json
import logging

from app.graph.context import compact_reviews, compact_tree
from app.graph.state import ReviewState
from app.services.llm import llm

logger = logging.getLogger(__name__)


def cross_file_analysis(state: ReviewState):
    """Identify only risks that need evidence from more than one reviewed file."""
    prompt = f"""Find repository-level risks supported by multiple reviewed files.
Do not repeat isolated file findings or discuss formatting. If none exist, say so.

Summary: {state["summary"].get("architecture", "unknown")}
Relevant paths:
{compact_tree(state["tree"], max_nodes=40)}

File-review evidence:
{compact_reviews(state["reviews"], include_strengths=False, max_issues_per_file=3)}

Return JSON only:
{{"repository_health":{{"score":0,"summary":""}},"cross_file_findings":[{{"title":"","severity":"","files":[""],"description":"","evidence":"","recommendation":"","impact":""}}],"quick_wins":[],"long_term_refactors":[],"strengths":[]}}"""
    response = llm.invoke(prompt)
    content = str(response.content).strip()
    if content.startswith("```"):
        lines = content.splitlines()[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    try:
        analysis = json.loads(content)
    except json.JSONDecodeError:
        logger.exception("Failed to parse cross-file analysis")
        return {"cross_file_analysis": {}}
    return {"cross_file_analysis": analysis}
