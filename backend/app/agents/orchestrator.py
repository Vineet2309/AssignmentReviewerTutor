import json
import logging
import re
from typing import Dict, Any, Optional
from app.config import TEXT_MODEL, MAX_HINT_LIMIT
from app.models import CheckApproachRequest, CheckApproachResponse, HintGiven, Step
from app.agents.parser_agent import extract_text_from_whiteboard
from app.tools.symbolic_calc import symbolic_calc
from app.tools.llm_client import get_chat_completion

logger = logging.getLogger(__name__)

# Lightweight in-memory session tracker (only tracks session turn & level, never stores solution in DB)
SESSION_TRACKER: Dict[str, Dict[str, Any]] = {}

HINT_LADDER_STYLES = {
    1: "Point to the region",
    2: "Name the concept, not the fix",
    3: "Targeted question",
    4: "Worked analogous example",
    5: "Partial reveal",
    6: "Full explanation & solution"
}

REVIEW_SYSTEM_PROMPT = """You are an expert Autonomous Assignment Reviewer & Socratic Tutor.
Your role:
1. Review the student's solution steps for the given question.
2. Check whether the solution is mathematically and logically correct.
3. If the solution is COMPLETELY correct and answers the question:
   - Set "is_correct": true
   - Set "is_complete": true
   - Set "hint": null (Do NOT generate further hints when correct!)
4. If the solution has errors or is incomplete:
   - Identify the "last_correct_step" (number of the last valid step).
   - Identify the "first_error_step" (number where the mistake begins).
   - Generate a Socratic hint for the step after the last correct step.
   - Socratic rules: max 2 sentences, question-first where possible.
   - Never reveal the final answer outright unless instructed for full solution.
5. If hint_level >= 6 (limit reached):
   - Provide "full_solution": a clear step-by-step solution to unblock the student.

Return strict JSON:
{
  "is_correct": boolean,
  "is_complete": boolean,
  "last_correct_step": integer or null,
  "first_error_step": integer or null,
  "error_diagnosis": "string",
  "hint": "string or null",
  "full_solution": "string or null"
}
"""

class Orchestrator:
    @staticmethod
    def process_turn(request: CheckApproachRequest) -> Dict[str, Any]:
        session_id = request.session_id
        question_text = request.question_text or "General Mathematics Assignment"

        # Manage in-memory session metadata (turn counter & hint level)
        if session_id not in SESSION_TRACKER:
            SESSION_TRACKER[session_id] = {
                "turn": 0,
                "hint_level": 1,
                "question": question_text,
                "consecutive_errors": 0
            }

        session = SESSION_TRACKER[session_id]
        session["turn"] += 1
        turn_no = session["turn"]
        current_hint_level = session["hint_level"]

        # Step 1: Image-to-Text Model Transcription
        parser_output = extract_text_from_whiteboard(
            whiteboard_image_base64=request.whiteboard_image,
            question_text=question_text,
            text_override=request.text_override
        )

        extracted_text = parser_output.extracted_text
        steps = parser_output.steps

        # Check with CAS symbolic verification if steps are distinct
        cas_error_step = None
        cas_note = ""
        for i in range(len(steps) - 1):
            s_before = steps[i].content
            s_after = steps[i+1].content
            calc = symbolic_calc(s_before, s_after)
            if not calc.get("is_valid", True):
                cas_error_step = steps[i+1].step_no
                cas_note = calc.get("internal_note", "Transformation invalid.")
                break

        # Step 2: Review by LLM (TEXT_MODEL: openai/gpt-oss-120b)
        review_prompt = f"""Question: {question_text}
Student's transcribed solution on whiteboard:
\"\"\"
{extracted_text}
\"\"\"
Current attempt turn: {turn_no}
Current hint escalation level: {current_hint_level} (out of {MAX_HINT_LIMIT})
CAS symbolic check note: {cas_note or 'No direct CAS syntax errors detected'}

Please analyze whether the student's solution is correct, find the last correct step, and return the required JSON evaluation:"""

        llm_response = get_chat_completion(
            messages=[
                {"role": "system", "content": REVIEW_SYSTEM_PROMPT},
                {"role": "user", "content": review_prompt}
            ],
            model=TEXT_MODEL,
            temperature=0.1,
            max_tokens=900,
            response_format={"type": "json_object"}
        )

        is_correct = False
        is_complete = False
        last_correct_step = None
        first_error_step = cas_error_step
        hint_text = None
        full_solution = None

        if llm_response:
            try:
                # Clean code ticks if any
                clean_json = llm_response.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]

                eval_data = json.loads(clean_json.strip())
                is_correct = bool(eval_data.get("is_correct", False))
                is_complete = bool(eval_data.get("is_complete", False))
                last_correct_step = eval_data.get("last_correct_step")
                first_error_step = eval_data.get("first_error_step") or cas_error_step
                hint_text = eval_data.get("hint")
                full_solution = eval_data.get("full_solution")
            except Exception as e:
                logger.warning(f"Error parsing LLM review output: {e}")

        # Fallback evaluation if LLM was unavailable:
        if not llm_response:
            if cas_error_step is None and len(steps) >= 2:
                is_correct = True
                is_complete = True
            else:
                first_error_step = cas_error_step or (len(steps) if steps else 1)
                last_correct_step = max(1, first_error_step - 1) if first_error_step else 1
                hint_text = f"Take a close look at step {first_error_step} — does this match the governing rule for this question?"

        # Step 3: Decision Logic matching exact user requirements:
        # If the solution is correct:
        if is_correct and is_complete:
            session["consecutive_errors"] = 0
            return {
                "session_id": session_id,
                "turn": turn_no,
                "is_solved": True,
                "status": "solved",
                "message": "🎉 Correct Solution! Your solution is verified and accurate. Great work solving it!",
                "last_correct_step": len(steps),
                "first_error_step": None,
                "hint": None, # DO NOT generate further hints when correct!
                "full_solution": None,
                "extracted_text": extracted_text,
                "steps": [s.model_dump() for s in steps],
                "trace": {
                    "reviewer": "openai/gpt-oss-120b",
                    "vision_model": "qwen/qwen3.8-27b",
                    "decision": "correct_solution",
                    "sympy_note": cas_note or "All transformations valid"
                }
            }

        # If not correct: check if hint limit reached
        if current_hint_level >= MAX_HINT_LIMIT:
            # Reached limit: generate or provide full right solution!
            if not full_solution:
                # Ask LLM for the full correct step-by-step solution
                sol_response = get_chat_completion(
                    messages=[
                        {"role": "user", "content": f"Provide the complete, clear step-by-step mathematical solution to this problem:\n{question_text}"}
                    ],
                    model=TEXT_MODEL,
                    temperature=0.1,
                    max_tokens=600
                )
                full_solution = sol_response or "Please review the fundamental theorem for this problem."

            return {
                "session_id": session_id,
                "turn": turn_no,
                "is_solved": False,
                "status": "limit_reached",
                "message": f"You've reached the maximum hint limit ({MAX_HINT_LIMIT} hints). Here is the complete right solution:",
                "last_correct_step": last_correct_step,
                "first_error_step": first_error_step,
                "hint": None,
                "full_solution": full_solution,
                "extracted_text": extracted_text,
                "steps": [s.model_dump() for s in steps],
                "trace": {
                    "reviewer": "openai/gpt-oss-120b",
                    "decision": "limit_reached_solution_revealed",
                    "hint_level": MAX_HINT_LIMIT
                }
            }

        # Otherwise, solution is not yet correct: increment hint level and return Socratic hint
        target_step = first_error_step or ((last_correct_step or 1) + 1)
        hint_obj = HintGiven(
            step=target_step,
            level=current_hint_level,
            text=hint_text or f"Review step {target_step}: what property or operation should apply next?",
            style_name=HINT_LADDER_STYLES.get(current_hint_level, "Socratic Guidance")
        )

        # Bump hint level for next turn
        session["hint_level"] = min(current_hint_level + 1, MAX_HINT_LIMIT)

        return {
            "session_id": session_id,
            "turn": turn_no,
            "is_solved": False,
            "status": "in_progress",
            "message": hint_obj.text,
            "last_correct_step": last_correct_step,
            "first_error_step": first_error_step,
            "hint": hint_obj.model_dump(),
            "full_solution": None,
            "extracted_text": extracted_text,
            "steps": [s.model_dump() for s in steps],
            "trace": {
                "reviewer": "openai/gpt-oss-120b",
                "decision": "generate_hint",
                "last_correct_step": last_correct_step,
                "first_error_step": first_error_step,
                "hint_level": current_hint_level,
                "style": hint_obj.style_name,
                "sympy_note": cas_note
            }
        }
