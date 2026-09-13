import subprocess
import sys
import tempfile
import os
from typing import Dict, Any, List

def code_sandbox(code: str, test_cases: List[str] = []) -> Dict[str, Any]:
    full_code = code + "\n\n"
    for tc in test_cases:
        full_code += f"assert {tc}, 'Failed test: {tc}'\n"
        
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(full_code)
        temp_path = f.name
        
    try:
        proc = subprocess.run(
            [sys.executable, temp_path],
            capture_output=True,
            text=True,
            timeout=3
        )
        passed = (proc.returncode == 0)
        return {
            "passed": passed,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "error_type": None if passed else ("syntax" if "SyntaxError" in proc.stderr else "runtime"),
            "internal_note": "All code unit tests passed in sandbox." if passed else f"Code test failed: {proc.stderr.strip()}",
            "verified_by": "code_sandbox"
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "stdout": "",
            "stderr": "Execution timed out",
            "error_type": "runtime",
            "internal_note": "Execution timed out in code_sandbox.",
            "verified_by": "code_sandbox"
        }
    except Exception as e:
        return {
            "passed": False,
            "stdout": "",
            "stderr": str(e),
            "error_type": "runtime",
            "internal_note": f"Sandbox exception: {str(e)}",
            "verified_by": "code_sandbox"
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
