from fastapi import APIRouter, HTTPException
from app.models import CheckApproachRequest
from app.agents.orchestrator import Orchestrator

router = APIRouter(prefix="/api/review", tags=["review"])

@router.post("/check-approach")
async def check_approach(request: CheckApproachRequest):
    try:
        result = Orchestrator.process_turn(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
