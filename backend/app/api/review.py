import asyncio
import json

from app.graph.graph import graph
from app.graph.state import ReviewState
from app.services.schemas.review import RepositoryRequest
from app.tools.github import clone_repo
from app.tools.reader import read_readme
from app.tools.scanner import scan_repository
from app.tools.tree import build_directory_tree
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/review", tags=["Review"])
jobs: dict[str, dict] = {}


class AnalysisStartRequest(RepositoryRequest):
    job_id: str


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _run_analysis(repo_url: str, job_id: str, loop: asyncio.AbstractEventLoop) -> None:
    job = jobs[job_id]

    def publish(message: str) -> None:
        loop.call_soon_threadsafe(job["queue"].put_nowait, {"message": message})

    try:
        print(f"Background task started for job {job_id}", flush=True)
        publish("Cloning repository")
        clone_result = clone_repo(repo_url)
        repo_path = clone_result["local_path"]
        print(f"Repository cloned for job {job_id}", flush=True)
        publish("Scanning repository structure")
        scan_result = scan_repository(repo_path)
        print(f"Repository scanned for job {job_id}", flush=True)
        readme_content = read_readme(repo_path)
        tree_structure = build_directory_tree(repo_path, depth=2)
        print(f"Repository context prepared for job {job_id}", flush=True)
        state = ReviewState(
            repo_url=repo_url,
            repo_path=repo_path,
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

        node_messages = {
            "summarize": "Generating repository summary",
            "select_review_files": "Selecting files for review",
            "read_source_files": "Reading source files",
            "review_one_file": "Reviewing source files",
            "synthesize_report": "Generating final report",
            "evaluate_report": "Evaluating report quality",
            "optimize_report": "Improving final report",
        }
        result = state
        print(f"Graph started for job {job_id}", flush=True)
        for update in graph.stream(state, stream_mode="values"):
            result = update
            # The stream's completed-node name is not exposed in values mode;
            # report useful milestones from the evolving state instead.
            if update.get("summary") and not job.get("summary_sent"):
                job["summary_sent"] = True
                publish(node_messages["select_review_files"])
            if update.get("source_files") and not job.get("files_sent"):
                job["files_sent"] = True
                publish(node_messages["review_one_file"])
            if update.get("final_report") and not job.get("report_sent"):
                job["report_sent"] = True
                publish(node_messages["evaluate_report"])

        print(f"Graph finished for job {job_id}", flush=True)
        print(f"Preparing final result for job {job_id}", flush=True)
        job["result"] = jsonable_encoder({
            "summary": result["summary"],
            "reviews": result["reviews"],
            "files_to_review": result["files_to_review"],
            "final_report": result["final_report"],
        })
        print(f"Final result stored in job memory for {job_id}", flush=True)
        job["status"] = "completed"
        print(f"Sending complete event for job {job_id}", flush=True)
        loop.call_soon_threadsafe(
            job["queue"].put_nowait, {"message": "Analysis complete", "complete": True}
        )
        print(f"Background task finished for job {job_id}", flush=True)
    except Exception as exc: # noqa: BLE001
        job["status"] = "failed"
        job["error"] = str(exc)
        print(f"Background task failed for job {job_id}: {exc}", flush=True)
        loop.call_soon_threadsafe(
            job["queue"].put_nowait,
            {"message": "Analysis failed", "error": str(exc), "complete": True},
        )


@router.post("/analyze/start")
async def start_analysis(request: AnalysisStartRequest):
    if request.job_id in jobs:
        return {"job_id": request.job_id, "status": jobs[request.job_id]["status"]}

    loop = asyncio.get_running_loop()
    jobs[request.job_id] = {
        "queue": asyncio.Queue(),
        "status": "running",
        "result": None,
    }
    background_tasks: set[asyncio.Task] = set()
    task = asyncio.create_task(asyncio.to_thread(_run_analysis, str(request.repo_url), request.job_id, loop))
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
    return {"job_id": request.job_id, "status": "running"}


@router.get("/analyze/{job_id}/events")
async def stream_analysis_events(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    async def event_stream():
        print(f"SSE client connected for job {job_id}", flush=True)
        yield _sse("progress", {"message": "Analysis started"})
        while True:
            event = await job["queue"].get()
            if event.get("complete"):
                print(f"Emitting complete SSE event for job {job_id}", flush=True)
            yield _sse("complete" if event.get("complete") else "progress", event)
            if event.get("complete"):
                print(f"SSE stream finished for job {job_id}", flush=True)
                break

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )


@router.get("/analyze/{job_id}/result")
async def get_analysis_result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    if job["status"] == "failed":
        raise HTTPException(status_code=500, detail=job.get("error", "Analysis failed"))
    if job["status"] != "completed":
        raise HTTPException(status_code=202, detail="Analysis still running")
    print(f"Returning completed result for job {job_id}", flush=True)
    return job["result"]


@router.post("/analyze")
def analyze_repository(request: RepositoryRequest):
    """Legacy synchronous endpoint retained for existing API consumers."""
    clone_result = clone_repo(str(request.repo_url))
    repo_path = clone_result["local_path"]
    scan_result = scan_repository(repo_path)
    readme_content = read_readme(repo_path)
    tree_structure = build_directory_tree(repo_path, depth=2)
    state = ReviewState(
        repo_url=str(request.repo_url),
        repo_path=repo_path,
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
    result = graph.invoke(state)
    return {
        "summary": result["summary"],
        "reviews": result["reviews"],
        "files_to_review": result["files_to_review"],
        "final_report": result["final_report"],
    }
