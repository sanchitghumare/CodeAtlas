import shutil
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from app.services.config import CLONE_TIMEOUT

TEMP_DIR = Path(tempfile.gettempdir()) / "ReviewForge"


class CloneError(RuntimeError):
    pass


class CloneTimeoutError(CloneError):
    pass


def cleanup_repo(repo_path: str | Path | None) -> None:
    if repo_path:
        shutil.rmtree(repo_path, ignore_errors=True)


def _run_git(arguments: list[str], timeout: int) -> None:
    try:
        subprocess.run(
            ["git", *arguments],
            check=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise CloneTimeoutError("Repository clone timed out. Please try again.") from exc
    except subprocess.CalledProcessError as exc:
        print(f"git failed (exit {exc.returncode}): {exc.stderr}", flush=True)
        raise CloneError(f"Unable to clone the repository: {exc.stderr.strip()}") from exc
    except OSError as exc:
        print(f"git could not be executed: {exc}", flush=True)
        raise CloneError(f"Unable to run git: {exc}") from exc


def clone_repo(repo_url: str, job_id: str) -> dict:
    """Clone a job-scoped shallow copy with an explicit network deadline."""
    parsed_url = urlparse(repo_url)
    parts = [part for part in parsed_url.path.split("/") if part]
    if len(parts) < 2:
        raise CloneError("The repository URL is invalid.")

    repo_name = parts[-1].removesuffix(".git")
    destination =  (TEMP_DIR / job_id).resolve()
    if TEMP_DIR.resolve() not in destination.parents:
      raise ValueError("Invalid job id")
    cleanup_repo(destination)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Cloning {repo_name}...", flush=True)
    try:
        _run_git(["clone", "--depth", "1", repo_url, str(destination)], CLONE_TIMEOUT)
    except CloneError:
        cleanup_repo(destination)
        raise
    print("Clone completed.", flush=True)
    return {"repo_name": repo_name, "local_path": str(destination)}
