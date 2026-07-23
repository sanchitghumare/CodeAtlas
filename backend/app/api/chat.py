from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.llm import llm
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
    analysis_context = f"""
         Repository: {analysis.get("repository_summary")}

            Summary:
            {analysis.get("summary")}

            File Reviews:
            {analysis.get("reviews")}

            Final Report:
            {analysis.get("final_report")}
            """
    prompt = f"""
You are ReviewForge AI.

You previously analyzed a GitHub repository.

Repository Analysis:
{analysis_context}

Conversation History:
{history}

User Question:
{question}

Instructions:
- Answer ONLY using the repository analysis.
- If the answer cannot be inferred from the analysis, clearly say so.
- Be concise and technical.
"""
    async def generate_response():
        async for chunk in llm.astream(prompt):
            if chunk.content:
                content = chunk.content
                if isinstance(content, str):
                    yield content
                else:
                    yield "".join(
                        item if isinstance(item, str) else str(item)
                        for item in content
                    )

    return StreamingResponse(generate_response(), media_type="text/plain; charset=utf-8")
