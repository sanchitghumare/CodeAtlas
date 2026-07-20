
from fastapi import APIRouter
from app.schemas.review import RepositoryRequest
from app.tools.github import clone_repo
from app.tools.scanner import scan_repository
from app.tools.reader import read_readme
from app.graph.state import ReviewState
from app.tools.tree import build_directory_tree
from app.graph.graph import graph
router = APIRouter(
    prefix="/review",
    tags=["Review"]
)

@router.post("/analyze")
async def analyze_repository(request: RepositoryRequest):
   
    clone_result = clone_repo(str(request.repo_url))
    repo_path=clone_result["local_path"]
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
    )
    result=graph.invoke(state)
    return{ "summary": result["summary"],
            "reviews": result["reviews"],
            "files_to_review": result["files_to_review"],
            "final_report": result["final_report"]
          }