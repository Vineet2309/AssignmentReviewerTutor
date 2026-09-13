from fastapi import APIRouter
from app.models import DoubtChatRequest
from app.config import TEXT_MODEL
from app.tools.llm_client import get_chat_completion

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/doubt")
async def answer_doubt(req: DoubtChatRequest):
    question_context = req.question_text or "Mathematics Problem"

    prompt = f"""You are a gentle, encouraging Socratic tutor helping a student with their question.
Assignment question: {question_context}
Student's doubt or question: {req.message}

Rules:
1. Socratic tone: guide with a focused question or conceptual insight.
2. Max 2 sentences.
3. NEVER reveal the final answer or solve the problem outright for them.
"""
    reply = get_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        model=TEXT_MODEL,
        temperature=0.3,
        max_tokens=150
    )

    if reply:
        return {"reply": reply.strip()}

    return {
        "reply": "Think about the definitions of each term in your expression. What property governs how they interact?"
    }
