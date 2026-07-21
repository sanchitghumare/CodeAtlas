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


class ScoreBreakdown(BaseModel):
    correctness: int
    evidence: int
    actionability: int
    completeness: int
    architecture: int
    clarity: int
    non_duplication: int


class FeedbackItem(BaseModel):
    category: str
    issue: str
    reason: str
    suggestion: str


class Evaluation(BaseModel):
    overall_score: int
    passed: bool
    scores: ScoreBreakdown
    strengths: list[str]
    weaknesses: list[str]
    feedback: list[FeedbackItem]
    confidence: float

    