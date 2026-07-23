from app.graph.state import ReviewState
from app.models.review import Evaluation
from app.services.llm import llm

structured_llm = llm.with_structured_output(Evaluation)


def evaluate_report(state: ReviewState):
    summary = state["summary"]
    tree = state["tree"]
    reviews = state["reviews"]
    cross = state.get("cross_file_analysis", {})
    final_report = state["final_report"]

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

    prompt = f"""You are ReviewForge's Evaluation Agent.

        You are NOT a code reviewer.

        You are an expert evaluator responsible for judging the quality of an AI-generated repository review.

        Your task is NOT to improve, rewrite, or extend the review.

        Your task is ONLY to evaluate whether the generated review is accurate, well-supported, actionable, and useful.

        ---

        ## Inputs
        Repository Summary: {summary}
        Repository Tree: {tree}
        Individual File Reviews:
        {reviews_block}
        Cross-File Analysis: {cross}
        Final Synthesized Report:
        {final_report}

        Treat these as the source of truth.

        Do NOT invent repository details.

        ---

        ## Evaluation Rubric

        Evaluate the Final Report using the following criteria.

        ### 1. Correctness (20)

        - Are conclusions supported by the provided evidence?
        - Does the report avoid hallucinating repository details?
        - Are findings technically believable?

        ---

        ### 2. Evidence (20)

        Does every major finding reference concrete evidence from

        - file reviews
        - cross-file analysis
        - repository structure

        Penalize unsupported claims.

        ---

        ### 3. Actionability (15)

        Are recommendations

        - specific
        - practical
        - implementable

        Avoid rewarding generic advice like

        "Improve performance."

        Reward recommendations such as

        "Extract JWT verification into auth.ts and reuse it in middleware.ts."

        ---

        ### 4. Completeness (15)

        Did the report cover the important repository-wide issues?

        Did it ignore obvious architectural problems visible from the provided context?

        ---

        ### 5. Architectural Reasoning (15)

        Does the report reason across multiple files?

        Does it identify repository-level concerns instead of simply repeating file-level findings?

        ---

        ### 6. Clarity (10)

        Is the report

        - organized
        - concise
        - prioritized
        - easy to read

        ---

        ### 7. Non-Duplication (5)

        Avoid repeated findings expressed in different wording.

        ---

        ## Scoring

        Assign numeric scores that sum to overall_score out of 100:
        Correctness /20, Evidence /20, Actionability /15, Completeness /15,
        Architecture /15, Clarity /10, NonDuplication /5.

        ---

        ## Important Rules

        DO NOT

        - rewrite the report
        - generate new repository findings
        - invent evidence
        - speculate
        - recommend code changes

        Only evaluate what already exists.

        Be objective. Be strict.

        If evidence is missing, deduct points.
        If recommendations are vague, deduct points.
        If findings are duplicated, deduct points.

        ---

        ## Success Criteria

        A high-quality evaluation should

        - be objective
        - be concise
        - justify deductions
        - reward repository-level reasoning
        - identify missing evidence
        - produce actionable feedback for an Optimizer Agent

        Remember: you are evaluating the reviewer, not the repository.

        Set "passed" to true only if overall_score >= 75."""

    print("Evaluating final report...", flush=True)
    try:
        evaluation = structured_llm.invoke(prompt)
        state["evaluation"] = evaluation if isinstance(evaluation, dict) else evaluation.model_dump()
    except Exception as exc:
        print(f"Evaluation failed: {exc}", flush=True)
        state["evaluation"] = {
            "overall_score": 0,
            "passed": False,
            "feedback": [
                {
                    "category": "system",
                    "issue": "Evaluation failed.",
                    "reason": str(exc),
                    "suggestion": "Retry evaluation.",
                }
            ],
        }

    print(
        f"Evaluation: {state['evaluation'].get('overall_score')}/100, "
        f"passed={state['evaluation'].get('passed')}",
        flush=True,
    )
    # LangGraph expects node output as a partial state update. Returning the
    # evaluation object itself drops it at the top level, so the conditional
    # router sees the old empty `evaluation` state.
    return {"evaluation": state["evaluation"]}
