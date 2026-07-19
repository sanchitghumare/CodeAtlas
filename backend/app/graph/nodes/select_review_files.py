from pathlib import Path

SKIP_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".pdf",
    ".lock",
    ".log",
    ".zip",
    ".csv",
}
SKIP_DIRS = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".idea",
    ".vscode",
    "__pycache__",
    ".venv",
    "venv",
}
SOURCE_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".cpp",
    ".c",
    ".go",
    ".rs",
}
Max_files=3
HIGH_PRIORITY = [
    "app/api",
    "actions",
    "db",
    "models",
    "middleware",
    "lib",
]

MEDIUM_PRIORITY = [
    "app",
    "pages",
    "components",
]

LOW_PRIORITY = [
    "test",
    "__tests__",
    "docs",
]
def priority(path: str):
    if any(path.startswith(p) for p in HIGH_PRIORITY):
        return 0
    if any(path.startswith(p) for p in MEDIUM_PRIORITY):
        return 1
    return 2

def select_review_files(state):
    repo=Path(state["repo_path"])
    files_to_review = []
    for path in repo.rglob("*"):
        if path.is_file():
            if not path.is_file():
              continue
            if path.suffix in SKIP_EXTENSIONS:
                continue
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            if path.suffix not in SOURCE_EXTENSIONS:
                continue
            files_to_review.append(str(path.relative_to(repo)))
            files_to_review.sort(key=priority)
    state["files_to_review"] = files_to_review[:Max_files]
    return state