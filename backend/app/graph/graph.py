from app.graph.nodes.cross_file_analysis import cross_file_analysis
from app.graph.nodes.Evaluator import evaluate_report
from app.graph.nodes.optimizer import optimize_report
from app.graph.nodes.read_source_files import read_source_files
from app.graph.nodes.review_source_files import dispatch_reviews, review_one_file
from app.graph.nodes.select_review_files import select_review_files
from app.graph.nodes.summarize_repository import summarize_repository
from app.graph.nodes.synthesize_report import synthesize_report
from app.graph.state import ReviewState
from langgraph.graph import END, START, StateGraph  # type: ignore

MAX_OPTIMIZE_ATTEMPTS = 1
CONFIDENCE_THRESHOLD = 0.7


def route_after_evaluation(state: ReviewState) -> str:
    """Conditional edge from evaluate_report.

    Accept the report only if the evaluator both passed it AND is
    confident in that judgment — a "passed" verdict the evaluator itself
    isn't sure about shouldn't ship as-is.

    accepted -> END
    rejected, attempts remaining -> optimize_report (rewrite, re-evaluate)
    rejected, attempts exhausted -> END anyway (ship the last version
        rather than loop forever on a report that isn't converging)
    """
    evaluation = state.get("evaluation", {})
    attempts = state.get("optimize_attempts", 0)

    passed = evaluation.get("passed", False)
    confidence = evaluation.get("confidence", 0.0)
    accepted = passed and confidence >= CONFIDENCE_THRESHOLD

    if accepted:
        print(
            f"Evaluation accepted (passed={passed}, confidence={confidence}) "
            "— final report accepted.",
            flush=True,
        )
        return "end"

    if attempts >= MAX_OPTIMIZE_ATTEMPTS:
        print(
            f"Evaluation not accepted after {attempts} optimize attempt(s) "
            "— giving up and returning the last version.",
            flush=True,
        )
        return "end"

    print(
        f"Evaluation not accepted (passed={passed}, confidence={confidence}, "
        f"score={evaluation.get('overall_score')}) — optimizing "
        f"(attempt {attempts + 1}/{MAX_OPTIMIZE_ATTEMPTS}).",
        flush=True,
    )
    return "optimize"


builder = StateGraph(ReviewState)

builder.add_node("summarize", summarize_repository)
builder.add_node("select_review_files", select_review_files)
builder.add_node("read_source_files", read_source_files)
builder.add_node("review_one_file", review_one_file)
builder.add_node("cross_file_analysis", cross_file_analysis)
builder.add_node("synthesize_report", synthesize_report)
builder.add_node("evaluate_report", evaluate_report)
builder.add_node("optimize_report", optimize_report)

builder.add_edge(START, "summarize")
builder.add_edge("summarize", "select_review_files")
builder.add_edge("select_review_files", "read_source_files")

builder.add_conditional_edges(
    "read_source_files",
    dispatch_reviews,
    ["review_one_file"],
)

builder.add_edge("review_one_file", "cross_file_analysis")
builder.add_edge("cross_file_analysis", "synthesize_report")
builder.add_edge("synthesize_report", "evaluate_report")

builder.add_conditional_edges(
    "evaluate_report",
    route_after_evaluation,
    {"optimize": "optimize_report", "end": END},
)
builder.add_edge("optimize_report", "evaluate_report")

graph = builder.compile()
