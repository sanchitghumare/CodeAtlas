
from urllib.parse import urlparse

from git import Repo
from pathlib import Path
TEMP_DIR=Path("temp")

def clone_repo(repo_url: str) -> dict:
    """
    Clone a GitHub repository into backend/temp
    """
    parsed_url = urlparse(repo_url)
    repo_name = parsed_url.path.lstrip("/").split("/")[-1]
    destination = TEMP_DIR / repo_name
   
    if destination.exists():
     return {
        "repo_name": repo_name,
        "local_path": str(destination)
    }

    print(f"Cloning {repo_name}...")
    Repo.clone_from(repo_url, destination)
    print("Clone completed.")
    return {
        "repo_name": repo_name,
        "local_path": str(destination)
    }