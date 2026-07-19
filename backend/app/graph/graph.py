from app.graph.nodes.read_source_files import read_source_files
from langgraph.graph import StateGraph, START, END # type: ignore
from app.graph.state import ReviewState
from app.graph.nodes.summarize_repository import summarize_repository
from app.graph.nodes.select_review_files import select_review_files
from app.graph.nodes.review_source_files import review_source_files
builder = StateGraph(ReviewState)

builder.add_node("summarize", summarize_repository)
builder.add_node(
    "select_review_files",
    select_review_files,
)
builder.add_node("read_source_files", read_source_files)
builder.add_node("review_source_files", review_source_files)
builder.add_edge(START, "summarize")
builder.add_edge("summarize", "select_review_files")
builder.add_edge("select_review_files", "read_source_files")
builder.add_edge("read_source_files", "review_source_files")
builder.add_edge("review_source_files", END)

graph = builder.compile()