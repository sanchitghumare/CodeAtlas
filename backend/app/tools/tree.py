from pathlib import Path


def build_directory_tree(repo_path: str, depth=2)-> dict:
    root = Path(repo_path)
    tree = {"name": root.name, "type": "directory", "children": []}
    IGNORE_DIRS = {
        ".git",
        "venv",
        "__pycache__",
        "node_modules",
        ".next",
        "dist",
        "build",
    }
    if depth == 0:
        return {"name": root.name, "type": "directory", "children": []}
    items = sorted(root.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
    for item in items:
        if item.is_dir():
            if item.name in IGNORE_DIRS:
                continue
            tree["children"].append(build_directory_tree(str(item), depth - 1))
        else:
            tree["children"].append({"name": item.name, "type": "file"})

    return tree
