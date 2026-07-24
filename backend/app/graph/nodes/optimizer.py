from app.graph.context import compact_json, compact_reviews
from app.graph.nodes.synthesize_report import _coerce_text_content
from app.graph.state import ReviewState
from app.services.llm import llm


def optimize_report(state: ReviewState):
    """Rewrite only when the evaluator identifies material report defects."""
    evaluation = state.get("evaluation", {})
    prompt = f"""Improve this repository review using the evaluator feedback.
Keep supported findings, remove unsupported claims, merge duplicates, and make
recommendations concrete. Do not introduce new findings. Plain text only.

Evaluator feedback:
{compact_json({"weaknesses": evaluation.get("weaknesses", []), "feedback": evaluation.get("feedback", [])}, 1800)}

Evidence:
{compact_reviews(state["reviews"], include_strengths=False)}
{compact_json(state.get("cross_file_analysis", {}), 1500)}

Current report:
{state["final_report"]}"""

    print("Optimizing report based on evaluator feedback...", flush=True)
    final_report = _coerce_text_content(llm.invoke(prompt).content)
    attempts = state.get("optimize_attempts", 0) + 1
    print(f"Optimize attempt {attempts} complete.", flush=True)
    return {"final_report": final_report, "optimize_attempts": attempts}
