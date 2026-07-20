
from langgraph.graph import StateGraph, START, END  #type: ignore
from app.graph.state import ReviewState
from app.graph.nodes.summarize_repository import summarize_repository
from app.graph.nodes.select_review_files import select_review_files
from app.graph.nodes.read_source_files import read_source_files
from app.graph.nodes.review_source_files import dispatch_reviews, review_one_file
from app.graph.nodes.synthesize_report import synthesize_report
from app.graph.nodes.cross_file_analysis import cross_file_analysis
builder = StateGraph(ReviewState)

builder.add_node("summarize", summarize_repository)
builder.add_node("select_review_files", select_review_files)
builder.add_node("read_source_files", read_source_files)
builder.add_node("review_one_file", review_one_file)
builder.add_node("synthesize_report", synthesize_report)
builder.add_node("cross_file_analysis", cross_file_analysis)

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
builder.add_edge("synthesize_report", END)

graph = builder.compile()