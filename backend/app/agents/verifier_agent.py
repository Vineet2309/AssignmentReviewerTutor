import logging
from typing import List, Optional
from app.models import Step, VerifierResult, ParserOutput
from app.tools.symbolic_calc import symbolic_calc
from app.tools.code_sandbox import code_sandbox
from app.tools.reference_lookup import reference_lookup

logger = logging.getLogger(__name__)

def verify_student_steps(parser_output: ParserOutput, question_target: str = "") -> VerifierResult:
    steps = parser_output.steps
    
    if not steps or len(steps) == 0:
        return VerifierResult(
            first_error_step=None,
            error_type=None,
            confidence="high",
            verified_by="symbolic_calc",
            internal_note="No steps found to verify.",
            is_correct=True,
            is_complete=False
        )

    if len(steps) == 1:
        # Just the initial problem statement or 1 line
        return VerifierResult(
            first_error_step=None,
            error_type=None,
            confidence="high",
            verified_by="symbolic_calc",
            internal_note="Initial problem step recorded.",
            is_correct=True,
            is_complete=False
        )

    # Check each step transformation: step_n -> step_n+1
    for i in range(len(steps) - 1):
        step_before = steps[i].content
        step_after = steps[i+1].content
        calc_result = symbolic_calc(step_before, step_after)
        
        if not calc_result.get("is_valid", True):
            return VerifierResult(
                first_error_step=steps[i+1].step_no,
                error_type=calc_result.get("error_type", "wrong_rule"),
                confidence="high",
                verified_by=calc_result.get("verified_by", "symbolic_calc"),
                internal_note=calc_result.get("internal_note", "Transformation is mathematically invalid."),
                is_correct=False,
                is_complete=False
            )

    # Check if final line is reached and complete
    final_line = parser_output.final_line
    is_complete = False
    if final_line and len(steps) >= 2:
        if question_target:
            target_check = symbolic_calc(final_line, question_target)
            if target_check.get("is_valid", False):
                is_complete = True
        else:
            is_complete = True

    return VerifierResult(
        first_error_step=None,
        error_type=None,
        confidence="high",
        verified_by="symbolic_calc",
        internal_note=f"Verified {len(steps)} steps consecutively using SymPy CAS.",
        is_correct=True,
        is_complete=is_complete
    )
