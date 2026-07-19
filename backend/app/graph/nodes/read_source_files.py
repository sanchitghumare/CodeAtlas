from pathlib import Path

MAX_CHARS = 5000

def read_source_files(state):

    repo = Path(state["repo_path"])

    source_files = []

    for relative_path in state["files_to_review"]:

        full_path = repo / relative_path

        try:
            with open(full_path, "r", encoding="utf-8") as f:

                content = f.read()

                if len(content) > MAX_CHARS:
                    content = content[:MAX_CHARS]

                source_files.append({
                    "path": relative_path,
                    "content": content
                })

        except Exception as e:
            print(f"Couldn't read {relative_path}: {e}")

    state["source_files"] = source_files
    return state