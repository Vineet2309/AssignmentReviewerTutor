from typing import Dict, Any, List
import uuid

# In-memory session tracking only for turn counts; solutions are never stored in MongoDB
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}

def get_session_state(session_id: str) -> Dict[str, Any]:
    if session_id not in ACTIVE_SESSIONS:
        ACTIVE_SESSIONS[session_id] = {
            "session_id": session_id,
            "turn": 0,
            "status": "in_progress"
        }
    return ACTIVE_SESSIONS[session_id]

def list_recent_sessions(limit: int = 15) -> List[Dict[str, Any]]:
    return list(ACTIVE_SESSIONS.values())[:limit]
