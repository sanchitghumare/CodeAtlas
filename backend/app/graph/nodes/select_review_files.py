from pathlib import Path

SKIP_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".pdf",
    ".lock", ".log", ".zip", ".csv",
}
SKIP_FILES = {
    "layout.tsx", "layout.jsx", "layout.js", "layout.ts",
    "instrumentation.ts", "instrumentation.js", "instrumentation-client.js",
    "next-env.d.ts", "next.config.js", "next.config.ts",
    "tailwind.config.js", "tailwind.config.ts",
    "postcss.config.js", "eslint.config.js",
}
SKIP_DIRS = {
    ".git", "node_modules", ".next", "dist", "build", "coverage",
    ".idea", ".vscode", "__pycache__", ".venv", "venv",
}
SOURCE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".h",
    ".go", ".rs", ".rb", ".php", ".cs", ".mjs", ".cjs", ".vue", ".svelte",
    ".kt", ".swift", ".scala",
}

MAX_FILES = 5 
HIGH_PRIORITY = ["app/api", "api", "actions", "db", "models", "middleware", "lib", "services", "core"]
MEDIUM_PRIORITY = ["app", "pages", "components", "routes", "controllers"]
LOW_PRIORITY = ["test", "__tests__", "tests", "docs", "examples", "scripts"]

NAME_SIGNALS = ("route", "controller", "service", "schema", "model", "auth", "middleware", "config", "index")


def _matches_prefix(parts: tuple[str, ...], prefixes: list[str]) -> bool:
    for prefix in prefixes:
        prefix_parts = prefix.split("/")
        if parts[: len(prefix_parts)] == tuple(prefix_parts):
            return True
    return False


def priority(rel_path: Path) -> int:
    parts = rel_path.parts[:-1]  
    if _matches_prefix(parts, HIGH_PRIORITY):
        return 0
    if _matches_prefix(parts, MEDIUM_PRIORITY):
        return 1
    if _matches_prefix(parts, LOW_PRIORITY):
        return 3
    return 2


def name_signal_score(rel_path: Path) -> int:
    stem = rel_path.stem.lower()
    return 0 if any(sig in stem for sig in NAME_SIGNALS) else 1


def select_review_files(state):
    repo = Path(state["repo_path"])
    candidates = []

    for path in repo.rglob("*"):
        if not path.is_file():
            continue
        if path.name in SKIP_FILES:
            continue
        if path.suffix in SKIP_EXTENSIONS:
            continue
        if path.suffix not in SOURCE_EXTENSIONS:
            continue

        rel = path.relative_to(repo)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue

        try:
            size = path.stat().st_size
        except OSError:
            continue
        if size == 0 or size > 200_000:  # skip empty files and huge generated/minified ones
            continue

        candidates.append((priority(rel), name_signal_score(rel), rel.as_posix()))

    candidates.sort(key=lambda c: (c[0], c[1], c[2]))

    state["files_to_review"] = [rel for _, _, rel in candidates[:MAX_FILES]]
    return state
