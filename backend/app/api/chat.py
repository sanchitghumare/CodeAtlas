from app.graph.context import clip, compact_json, compact_reviews
from app.services.llm import llm
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    analysis: dict
    history: list
    question: str


@router.post("/chat")
async def chat(request: ChatRequest):
    analysis = request.analysis
    history = request.history
    question = request.question
    recent_history = [
        {"role": item.get("role"), "content": clip(item.get("content"), 700)}
        for item in history[-6:]
        if isinstance(item, dict)
    ]
    prompt = f"""You are ReviewForge AI. Answer the question using only this repository analysis. If the
answer is not supported, say so. Be concise and technical.

Summary: {compact_json(analysis.get("summary", {}), 900)}
Final report: {clip(analysis.get("final_report"), 2400)}
Findings:
{compact_reviews(analysis.get("reviews", []), include_strengths=False, max_issues_per_file=2)}
Cross-file: {compact_json(analysis.get("cross_file_analysis", {}), 1200)}
History: {compact_json(recent_history, 1800)}
Question: {clip(question, 1000)}"""

    async def generate_response():
        async for chunk in llm.astream(prompt):
            if chunk.content:
                content = chunk.content
                if isinstance(content, str):
                    yield content
                else:
                    yield "".join(
                        item if isinstance(item, str) else str(item) for item in content
                    )

    return StreamingResponse(
        generate_response(), media_type="text/plain; charset=utf-8"
    )
