from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class QuestionRecord(BaseModel):
    id: str
    title: str
    question_text: str
    topic: Optional[str] = "General Math"
    difficulty: Optional[str] = "Intermediate"
    whiteboard_image: Optional[str] = None
    created_at: Optional[str] = None

class CreateQuestionRequest(BaseModel):
    question_text: str
    title: Optional[str] = "Custom Problem"
    topic: Optional[str] = "Calculus"
    difficulty: Optional[str] = "Intermediate"
    whiteboard_image: Optional[str] = None

class Step(BaseModel):
    step_no: int
    content: str
    is_valid: bool = True
    raw_ocr_confidence: float = 0.95

class ParserOutput(BaseModel):
    question: str
    extracted_text: str = ""
    steps: List[Step] = []
    final_line: Optional[str] = None
    ambiguous_regions: List[Union[int, str]] = []

class HintGiven(BaseModel):
    step: int
    level: int
    text: str
    style_name: Optional[str] = None

class CheckApproachRequest(BaseModel):
    session_id: str
    question_text: Optional[str] = "Find the derivative of f(x) = x^2 * sin(x)"
    whiteboard_image: str
    text_override: Optional[str] = None

class CheckApproachResponse(BaseModel):
    session_id: str
    turn: int
    is_solved: bool
    status: str # "solved" | "in_progress" | "limit_reached"
    message: str
    last_correct_step: Optional[int] = None
    first_error_step: Optional[int] = None
    hint: Optional[HintGiven] = None
    full_solution: Optional[str] = None
    extracted_text: Optional[str] = ""
    steps: List[Step] = []
    trace: Optional[Dict[str, Any]] = None

class DoubtChatRequest(BaseModel):
    session_id: str
    message: str
    question_text: Optional[str] = None
