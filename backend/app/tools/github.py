
from urllib.parse import urlparse

from git import Repo
from pathlib import Path
import tempfile
TEMP_DIR = Path(tempfile.gettempdir()) / "CodeAtlas"

def clone_repo(repo_url: str) -> dict:
    """
    Clone a GitHub repository into backend/temp
    """
    parsed_url = urlparse(repo_url)
    repo_name = parsed_url.path.lstrip("/").split("/")[-1]
    destination = TEMP_DIR / repo_name
    print(f"Cloning {repo_name}...")
    if destination.exists():
     repo = Repo(destination)
     repo.remotes.origin.pull()
    else:
     Repo.clone_from(repo_url, destination)

    print("Clone completed.")
    return {
        "repo_name": repo_name,
        "local_path": str(destination)
    }