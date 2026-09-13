from fastapi import APIRouter
import uuid
from app.agents.state_manager import get_session_state, list_recent_sessions

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.get("/list")
async def get_sessions():
    return list_recent_sessions()

@router.get("/{session_id}")
async def get_session(session_id: str):
    return get_session_state(session_id)

@router.post("/new")
async def create_new_session(question: str = ""):
    new_id = "session_" + str(uuid.uuid4())[:8]
    session = get_session_state(new_id)
    session["question"] = question
    return session
