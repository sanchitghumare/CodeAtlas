from app.graph.context import compact_json, compact_reviews
from app.graph.state import ReviewState
from app.models.review import Evaluation
from app.services.llm import llm

structured_llm = llm.with_structured_output(Evaluation)


def evaluate_report(state: ReviewState):
    """Quality-gate the final report against compact source evidence."""
    prompt = f"""Evaluate whether this repository review is accurate and useful.
Score correctness (20), evidence (20), actionability (15), completeness (15),
architecture (15), clarity (10), and non-duplication (5). Do not rewrite it.
Pass only when score >=75 and the claims are supported by the evidence.
Give concise feedback only for material deficiencies.

Repository summary:
{compact_json(state["summary"], 900)}

File evidence:
{compact_reviews(state["reviews"], include_strengths=False)}

Cross-file evidence:
{compact_json(state.get("cross_file_analysis", {}), 1800)}

Report to evaluate:
{state["final_report"]}"""

    print("Evaluating final report...", flush=True)
    try:
        evaluation = structured_llm.invoke(prompt)
        result = evaluation if isinstance(evaluation, dict) else evaluation.model_dump()
    except Exception as exc:  # noqa: BLE001
        print(f"Evaluation failed: {exc}", flush=True)
        result = {
            "overall_score": 0,
            "passed": False,
            "feedback": [{"category": "system", "issue": "Evaluation failed.", "reason": str(exc), "suggestion": "Retry evaluation."}],
        }

    print(f"Evaluation: {result.get('overall_score')}/100, passed={result.get('passed')}", flush=True)
    return {"evaluation": result}
