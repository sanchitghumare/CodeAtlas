from typing import TypedDict

class ReviewState(TypedDict):
    repo_url: str
    repo_path: str
    repository: dict  # scanner output
    readme: dict
    tree: dict
    summary: dict
    files_to_review: list[str]
    source_files: list[dict]
    reviews: list[dict]
    final_report: str