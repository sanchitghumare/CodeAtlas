from pydantic import BaseModel

class Issue(BaseModel):
    severity: str
    category: str
    description: str
    suggestion: str

class FileReview(BaseModel):
    path: str
    score: int
    strengths: list[str]
    issues: list[Issue]