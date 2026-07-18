from fastapi import APIRouter
from app.schemas.review import RepositoryRequest

router = APIRouter(
    prefix="/review",
    tags=["Review"]
)

@router.post("/analyze")
async def analyze_repository(request: RepositoryRequest):
    return {
        "status": "success",
        "repository": request.repo_url
    }