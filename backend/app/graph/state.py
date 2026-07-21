import operator
from typing import Annotated, TypedDict
class ReviewState(TypedDict):
    repo_url: str
    repo_path: str
    repository: dict  # scanner output
    readme: dict
    tree: dict
    summary: dict
    files_to_review: list[str]
    source_files: list[dict]
    reviews: Annotated[list, operator.add]
    cross_file_analysis: dict
    final_report: str
    evaluation: dict
    optimize_attempts: int


class FileReviewState(TypedDict):
    """State shape for a single review_one_file worker branch, dispatched
    via Send. Only carries what one file's review needs."""
    path: str
    content: str