"""Compact, deterministic context builders shared by graph nodes."""

import json
from typing import Any


def value(item: Any, key: str, default: Any = None) -> Any:
    if isinstance(item, dict):
        return item.get(key, default)
    return getattr(item, key, default)


def clip(text: Any, limit: int) -> str:
    text = str(text or "").strip()
    return text if len(text) <= limit else f"{text[:limit - 1].rstrip()}…"


def compact_tree(tree: dict, max_nodes: int = 60) -> str:
    """Flatten a directory tree to a bounded path list for LLM context."""
    paths: list[str] = []

    def visit(node: dict, prefix: str = "") -> None:
        if len(paths) >= max_nodes:
            return
        name = node.get("name", "")
        path = f"{prefix}/{name}" if prefix else name
        if node.get("type") == "file":
            paths.append(path)
            return
        for child in node.get("children", []):
            visit(child, path)

    for child in tree.get("children", []):
        visit(child)

    suffix = "\n… tree truncated" if len(paths) >= max_nodes else ""
    return "\n".join(paths) + suffix


def compact_reviews(
    reviews: list[Any],
    *,
    include_strengths: bool = False,
    max_issues_per_file: int = 3,
    max_description_chars: int = 220,
    max_suggestion_chars: int = 160,
) -> str:
    """Preserve priority findings while dropping verbose repeated review data."""
    blocks: list[str] = []
    for review in reviews:
        path = value(review, "path", "unknown")
        score = value(review, "score", "?")
        lines = [f"{path} (score {score}/100)"]
        if include_strengths:
            strengths = value(review, "strengths", []) or []
            if strengths:
                lines.append(f"strengths: {', '.join(clip(item, 80) for item in strengths[:2])}")

        issues = value(review, "issues", []) or []
        for issue in issues[:max_issues_per_file]:
            severity = value(issue, "severity", "")
            category = value(issue, "category", "")
            description = clip(value(issue, "description", ""), max_description_chars)
            suggestion = clip(value(issue, "suggestion", ""), max_suggestion_chars)
            lines.append(f"- [{severity}/{category}] {description}; fix: {suggestion}")
        if not issues:
            lines.append("- no material issues")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def compact_json(data: Any, limit: int = 3500) -> str:
    """Serialize structured context without indentation and bound its size."""
    return clip(json.dumps(data, separators=(",", ":"), default=lambda item: item.model_dump()), limit)
