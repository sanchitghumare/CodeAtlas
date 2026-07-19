from pathlib import Path


def read_file(file_path: str):
    """
    Read the content of a file and return it as a string.
    """
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"The file {file_path} does not exist.")

    with path.open("r", encoding="utf-8", errors="ignore") as file:
        content = file.read()

    return {"success": True, "path": str(path), "content": content}


def read_readme(repo_path: str):
    """
    Read the README file from the repository if it exists.
    """
    for item in Path(repo_path).iterdir():
        if item.is_file() and item.name.lower().startswith("readme"):
            return {
                "exists": True,
                "path": str(item.relative_to(repo_path)),
                "content": read_file(str(item))["content"][:3000],
            }
    return {"exists": False, "path": None, "content": None}
