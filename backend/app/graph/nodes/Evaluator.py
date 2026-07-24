from app.graph.context import compact_json, compact_reviews
from app.graph.state import ReviewState
from app.models.review import Evaluation
from app.services.llm import LLMTimeoutError, invoke_llm, llm

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
        evaluation = invoke_llm(structured_llm, prompt)
        result = (
        evaluation
        if isinstance(evaluation, dict)
        else evaluation.model_dump()
        )
    except LLMTimeoutError:
        raise
    except Exception as exc:
        raise RuntimeError("Evaluation failed. Please try again.") from exc

    print(f"Evaluation: {result.get('overall_score')}/100, passed={result.get('passed')}", flush=True)
    return {"evaluation": result}
