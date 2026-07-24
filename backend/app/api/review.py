import asyncio
import json
import threading
import time
from uuid import uuid4

from app.core.limiter import limiter
from app.graph.graph import graph
from app.graph.state import ReviewState
from app.services.config import ANALYSIS_TIMEOUT, JOB_RETENTION_TIMEOUT
from app.services.llm import LLMInvocationError, LLMTimeoutError
from app.services.schemas.review import RepositoryRequest
from app.tools.github import CloneError, CloneTimeoutError, cleanup_repo, clone_repo
from app.tools.reader import read_readme
from app.tools.scanner import scan_repository
from app.tools.tree import build_directory_tree
from fastapi import APIRouter, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/review", tags=["Review"])
jobs: dict[str, dict] = {}
TERMINAL_STATUSES = {"completed", "failed"}


class AnalysisStartRequest(RepositoryRequest):
    job_id: str


class AnalysisCancelled(RuntimeError):
    pass


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _queue_event(job: dict, event: dict) -> None:
    if event.get("complete") and job.get("complete_event_sent"):
        return
    if event.get("complete"):
        job["complete_event_sent"] = True
    job["loop"].call_soon_threadsafe(job["queue"].put_nowait, event)


def _finish_job(job_id: str, status: str, error: str | None = None) -> None:
    job = jobs.get(job_id)
    if not job or job["status"] in TERMINAL_STATUSES:
        return
    job["status"] = status
    job["error"] = error
    job["finished_at"] = time.monotonic()
    message = "Analysis complete" if status == "completed" else error or "Analysis failed. Please try again."
    _queue_event(job, {"message": message, "error": error, "complete": True, "status": status})


def _raise_if_cancelled(job: dict) -> None:
    if job["cancel_event"].is_set():
        raise AnalysisCancelled()


def _public_error(exc: Exception) -> str:
    if isinstance(exc, CloneTimeoutError):
        return "Repository clone timed out. Please try again."
    if isinstance(exc, CloneError):
        return "Unable to clone the repository. Check the URL and network access."
    if isinstance(exc, LLMTimeoutError):
        return "AI analysis timed out. Please try again."
    if isinstance(exc, LLMInvocationError):
        return "AI analysis failed. Please try again."
    if isinstance(exc, AnalysisCancelled):
        return "Analysis timed out. Please try again."
    if "evaluation" in str(exc).lower():
        return "Evaluation failed. Please try again."
    return "Analysis failed unexpectedly. Please try again."


def _run_analysis(repo_url: str, job_id: str) -> None:
    job = jobs[job_id]
    repo_path: str | None = None
    try:
        print(f"Background task started for job {job_id}", flush=True)
        job["stage"] = "clone"
        _queue_event(job, {"message": "Cloning repository"})
        clone_result = clone_repo(repo_url, job_id)
        repo_path = clone_result["local_path"]
        job["repo_path"] = repo_path
        _raise_if_cancelled(job)

        job["stage"] = "prepare"
        _queue_event(job, {"message": "Scanning repository structure"})
        scan_result = scan_repository(repo_path) # type: ignore
        readme_content = read_readme(repo_path)["content"] # pyright: ignore[reportArgumentType]
        tree_structure = build_directory_tree(repo_path, depth=2) # pyright: ignore[reportArgumentType]
        _raise_if_cancelled(job)

        state = ReviewState(
            repo_url=repo_url,
            repo_path=repo_path, # pyright: ignore[reportArgumentType]
            repository=scan_result,
            readme={"content": readme_content},
            tree=tree_structure,
            summary={},
            files_to_review=[],
            source_files=[],
            reviews=[],
            cross_file_analysis={},
            final_report="",
            evaluation={},
            optimize_attempts=0,
        )

        result = state
        job["stage"] = "analysis"
        print(f"Graph started for job {job_id}", flush=True)
        for update in graph.stream(state, stream_mode="values"):
            _raise_if_cancelled(job)
            result = update
            if update.get("summary") and not job.get("summary_sent"):
                job["summary_sent"] = True
                _queue_event(job, {"message": "Reviewing repository structure"})
            if update.get("source_files") and not job.get("files_sent"):
                job["files_sent"] = True
                _queue_event(job, {"message": "Reviewing source files"})
            if update.get("final_report") and not job.get("report_sent"):
                job["report_sent"] = True
                _queue_event(job, {"message": "Evaluating final report"})

        _raise_if_cancelled(job)
        job["result"] = jsonable_encoder(
            {
                "summary": result["summary"],
                "reviews": result["reviews"],
                "files_to_review": result["files_to_review"],
                "final_report": result["final_report"],
            }
        )
        print(f"Graph finished for job {job_id}", flush=True)
        _finish_job(job_id, "completed")
        print(f"Background task finished for job {job_id}", flush=True)
    except Exception as exc:  # noqa: BLE001
        error = _public_error(exc)
        print(f"Background task failed for job {job_id}: {exc}", flush=True)
        _finish_job(job_id, "failed", error)
    finally:
        cleanup_repo(repo_path)
        job["repo_path"] = None


async def _run_with_timeout(repo_url: str, job_id: str) -> None:
    job = jobs[job_id]
    try:
        await asyncio.wait_for(asyncio.to_thread(_run_analysis, repo_url, job_id), timeout=ANALYSIS_TIMEOUT)
    except TimeoutError:
        job["cancel_event"].set()
        print(f"Global timeout reached for job {job_id}", flush=True)
        _finish_job(job_id, "failed", "Analysis timed out. Please try again.")
    except Exception as exc:  # defensive: the worker normally handles errors  # noqa: BLE001
        _finish_job(job_id, "failed", _public_error(exc))


def cleanup_expired_jobs() -> None:
    """Remove completed in-memory jobs after clients have had time to fetch them."""
    now = time.monotonic()
    expired = [
        job_id
        for job_id, job in jobs.items()
        if job.get("status") in TERMINAL_STATUSES
        and now - job.get("finished_at", now) > JOB_RETENTION_TIMEOUT
    ]
    for job_id in expired:
        jobs.pop(job_id, None)


def _create_job(repo_url: str, job_id: str, loop: asyncio.AbstractEventLoop) -> dict:
    job = {
        "queue": asyncio.Queue(),
        "loop": loop,
        "status": "running",
        "error": None,
        "result": None,
        "stage": "queued",
        "repo_path": None,
        "cancel_event": threading.Event(),
        "started_at": time.monotonic(),
        "finished_at": None,
        "complete_event_sent": False,
    }
    jobs[job_id] = job
    return job


@router.post("/analyze/start")
@limiter.limit("5/minute")
async def start_analysis( request: Request,
    body: AnalysisStartRequest,):
    if body.job_id in jobs:
        job = jobs[body.job_id]
        return {"job_id": body.job_id, "status": job["status"]}

    loop = asyncio.get_running_loop()
    job = _create_job(str(body.repo_url), body.job_id, loop)
    task = asyncio.create_task(_run_with_timeout(str(body.repo_url), body.job_id))
    job["task"] = task
    return {"job_id": body.job_id, "status": "running"}


@router.get("/analyze/{job_id}/events")
@limiter.limit("60/minute")
async def stream_analysis_events( request: Request,job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    async def event_stream():
        yield _sse("progress", {"message": "Analysis started"})
        while True:
            event = await job["queue"].get()
            yield _sse("complete" if event.get("complete") else "progress", event)
            if event.get("complete"):
                break

    return StreamingResponse(event_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@router.get("/analyze/{job_id}/result")
async def get_analysis_result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    if job["status"] == "failed":
        raise HTTPException(status_code=500, detail=job.get("error") or "Analysis failed.")
    if job["status"] != "completed":
        raise HTTPException(status_code=202, detail="Analysis still running")
    return job["result"]


@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_repository(_: Request, request: RepositoryRequest):
    """Legacy synchronous endpoint; runs through the same timeout-controlled job lifecycle."""
    job_id = str(uuid4())
    _create_job(str(request.repo_url), job_id, asyncio.get_running_loop())
    await _run_with_timeout(str(request.repo_url), job_id)
    job = jobs[job_id]
    if job["status"] == "failed":
        raise HTTPException(status_code=500, detail=job["error"])
    return job["result"]
