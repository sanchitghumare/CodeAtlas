import json
from typing import cast

from app.graph.state import ReviewState
from app.services.llm import llm


def optimize_report(state: ReviewState):
    """Optimizer Agent: rewrites final_report to address the Evaluator's
    feedback. Grounded strictly in the same evidence already gathered
    (reviews, cross-file analysis, summary) — it does not re-review files
    or invent new findings, only improves how the existing findings are
    argued and presented.
    """
    evaluation = state.get("evaluation", {})
    final_report = state["final_report"]
    reviews = state["reviews"]
    cross = state.get("cross_file_analysis", {})

    weaknesses = evaluation.get("weaknesses", [])
    feedback = evaluation.get("feedback", [])

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

    feedback_block = "\n".join(
        f"- [{f.get('category', 'general')}] {f.get('issue', '')}: "
        f"{f.get('reason', '')} -> {f.get('suggestion', '')}"
        for f in feedback
    ) or "No specific feedback items provided."

    weaknesses_block = "\n".join(f"- {w}" for w in weaknesses) or "None listed."

    prompt = f"""You are ReviewForge's Optimizer Agent.

        You are given a final repository review report and an evaluator's
        critique of that report. Your job is to REWRITE the report so it
        addresses the critique — not to re-review the repository.

        Rules:
        - Do NOT invent new findings, files, or evidence that aren't already
          present in the source material below.
        - Do NOT speculate about code you haven't been shown.
        - Fix what the evaluator flagged: vague recommendations should
          become specific and implementable, unsupported claims should be
          removed or tied to concrete evidence from the file reviews, and
          duplicated findings should be merged.
        - Keep the same overall structure: an overall assessment,
          recurring/repository-level issues, and a prioritized
          recommendations list.
        - Plain text, no markdown headers.

        ## Evaluator's weaknesses found in the previous report
        {weaknesses_block}

        ## Evaluator's detailed feedback
        {feedback_block}

        ## Source evidence (do not exceed this — ground every claim here)
        Per-file reviews:
        {reviews_block}

        Cross-file analysis:
        {json.dumps(cross, indent=2) if cross else "Not available."}

        ## Previous report to rewrite
        {final_report}

        Write the improved report now."""

    print("Optimizing report based on evaluator feedback...", flush=True)
    response = llm.invoke(prompt)

    state["final_report"] = cast(str, response.content)
    state["optimize_attempts"] = state.get("optimize_attempts", 0) + 1
    print(f"Optimize attempt {state['optimize_attempts']} complete.", flush=True)

    return state