import logging
from typing import Dict, Any, Optional
from groq import Groq
from app.config import GROQ_API_KEY, GROQ_TEXT_MODEL
from app.models import VerifierResult, HintGiven
from app.tools.reference_lookup import reference_lookup

logger = logging.getLogger(__name__)

HINT_LADDER_STYLES = {
    1: "Point to the region",
    2: "Name the concept, not the fix",
    3: "Targeted question",
    4: "Worked analogous example",
    5: "Partial reveal",
    6: "Full explanation"
}

def generate_socratic_hint(
    verifier_result: VerifierResult,
    step_no: int,
    level: int,
    question_text: str,
    step_content: str,
    repeat_error_count: int = 1
) -> HintGiven:
    error_type = verifier_result.error_type or "wrong_rule"
    internal_note = verifier_result.internal_note
    ref = reference_lookup(question_text) or reference_lookup(step_content)

    if GROQ_API_KEY:
        try:
            client = Groq(api_key=GROQ_API_KEY)
            prompt = f"""You are the Hint Strategist Agent in a Socratic tutoring orchestra.
Task: Provide a Socratic hint at Hint Level {level} ({HINT_LADDER_STYLES.get(level, 'Hint')}).

Context:
- Problem: {question_text}
- Student's step {step_no}: {step_content}
- Error type: {error_type}
- Internal diagnosis (NEVER state this or the answer directly): {internal_note}
- Reference rule: {ref.get('name') if ref else 'Calculus/Algebra rule'}

Escalation ladder:
Level 1 (Point to region): "Take another look at step {step_no}."
Level 2 (Name concept): "Which rule applies when differentiating a product of two functions?"
Level 3 (Targeted question): "What is d/dx(x^2) ? and did you apply that here?"
Level 4 (Worked analogous example): "Solve a similar mini-problem, then invite student to apply it."
Level 5 (Partial reveal): "Show the correct rule/formula, still let student apply it."
Level 6 (Full explanation): "Explain the step and let them redo the rest independently. Never reveal the final numeric answer."

Hard Rules:
1. Never reveal the final answer or corrected version below level 6.
2. At level 6, only unblock the step, never reveal final answer.
3. Max 2 sentences.
4. Question-first where possible.
5. Return ONLY the hint text.
"""
            res = client.chat.completions.create(
                model=GROQ_TEXT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=150
            )
            txt = res.choices[0].message.content.strip().replace('"', '')
            return HintGiven(
                step=step_no,
                level=level,
                text=txt,
                style_name=HINT_LADDER_STYLES.get(level)
            )
        except Exception as e:
            logger.warning(f"Groq text completion failed: {e}. Using deterministic Socratic rule.")

    # High-quality deterministic Socratic fallbacks:
    if level == 1:
        text = f"Take another look at step {step_no} ? does the transformation here match your expected rule?"
    elif level == 2:
        if error_type == "sign_error":
            text = f"What happens to the sign when carrying out the operation in step {step_no}?"
        elif "product" in question_text.lower() or (ref and "product" in ref.get("name", "").lower()):
            text = f"Which rule applies when differentiating a product of two functions in step {step_no}?"
        elif "quotient" in question_text.lower() or (ref and "quotient" in ref.get("name", "").lower()):
            text = f"Which rule applies when differentiating a quotient of functions in step {step_no}?"
        elif "chain" in question_text.lower():
            text = f"What rule applies when differentiating a composite function in step {step_no}?"
        else:
            text = f"Which fundamental mathematical property applies to step {step_no}?"
    elif level == 3:
        if error_type == "sign_error":
            text = f"Did you check whether the second term in step {step_no} should be added or subtracted?"
        elif error_type == "arithmetic":
            text = f"Could you double-check the constant calculation in step {step_no}?"
        else:
            text = f"What is the derivative of each component individually, and how are both parts combined in step {step_no}?"
    elif level == 4:
        text = f"For example, to differentiate x^2 * sin(x), we get 2x*sin(x) + x^2*cos(x). How can you apply that same structure to your problem?"
    elif level == 5:
        formula = ref.get("formula") if ref else "u'(x)*v(x) + u(x)*v'(x)"
        text = f"Remember the formula requires: {formula}. How can you substitute your specific functions into this formula?"
    else:
        text = f"In step {step_no}, differentiate each function in turn while holding the other constant, then sum them together. Try writing each part separately and retry the step!"

    return HintGiven(
        step=step_no,
        level=level,
        text=text,
        style_name=HINT_LADDER_STYLES.get(level)
    )
