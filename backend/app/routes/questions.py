from fastapi import APIRouter, HTTPException
from app.models import CreateQuestionRequest
from app.database import save_question_to_db, get_all_questions_from_db, get_question_by_id

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.get("/list")
async def list_questions():
    """Returns ALL questions stored in MongoDB (custom user questions + curated questions) to try again."""
    questions = get_all_questions_from_db()
    return questions

@router.get("/samples")
async def get_sample_questions():
    """Legacy alias returning all questions."""
    return get_all_questions_from_db()

@router.post("/create")
async def create_question(req: CreateQuestionRequest):
    """Saves ONLY the question into MongoDB. Never saves student solutions."""
    # Determine a clean title if default
    title = req.title
    if not title or title == "Custom Problem":
        # Extract first few words as title
        words = req.question_text.strip().split()
        title = " ".join(words[:5]) + ("..." if len(words) > 5 else "")

    saved = save_question_to_db({
        "title": title,
        "question_text": req.question_text,
        "topic": req.topic or "Calculus",
        "difficulty": req.difficulty or "Intermediate",
        "whiteboard_image": req.whiteboard_image
    })
    return saved

@router.get("/{question_id}")
async def get_question(question_id: str):
    q = get_question_by_id(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q
