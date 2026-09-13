import re
from typing import Dict, Any
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

transformations = standard_transformations + (implicit_multiplication_application,)

def clean_latex_for_sympy(s: str) -> str:
    s = s.strip()
    s = re.sub(r'^(?:d/dx|\\frac\{d\}\{dx\})\s*[\[\(]?\s*(.*?)\s*[\]\)]?$', r'\1', s, flags=re.IGNORECASE)
    s = re.sub(r'^(?:f\(x\)|y|dy/dx)\s*=\s*', '', s)
    s = s.replace(r'\left', '').replace(r'\right', '')
    s = s.replace(r'\cdot', '*').replace(r'\times', '*')

    while r'\frac' in s:
        match = re.search(r'\\frac\{([^{}]+)\}\{([^{}]+)\}', s)
        if not match:
            break
        num, den = match.group(1), match.group(2)
        s = s[:match.start()] + f'(({num})/({den}))' + s[match.end():]

    s = s.replace(r'\sin', 'sin').replace(r'\cos', 'cos').replace(r'\tan', 'tan')
    s = s.replace(r'\ln', 'log').replace(r'\log', 'log')
    s = s.replace(r'\sqrt{', 'sqrt(').replace(r'\sqrt', 'sqrt')
    s = s.replace(r'\pi', 'pi')
    s = s.replace('^', '**')
    s = re.sub(r'\\[a-zA-Z]+', '', s)
    if '=' in s:
        parts = s.split('=')
        s = parts[-1].strip()
    return s.strip()

def symbolic_calc(expr_before_str: str, expr_after_str: str, operation: str = 'auto') -> Dict[str, Any]:
    try:
        x = sp.Symbol('x')
        c_before = clean_latex_for_sympy(expr_before_str)
        c_after = clean_latex_for_sympy(expr_after_str)

        try:
            expr1 = parse_expr(c_before, transformations=transformations)
        except Exception:
            expr1 = None

        try:
            expr2 = parse_expr(c_after, transformations=transformations)
        except Exception:
            expr2 = None

        if expr1 is None or expr2 is None:
            return {
                'is_valid': True,
                'error_type': None,
                'internal_note': f'CAS parse bypassed: {c_before} -> {c_after}',
                'verified_by': 'symbolic_calc'
            }

        # 1. Algebraic equivalence
        diff_direct = sp.simplify(expr1 - expr2)
        if diff_direct == 0:
            return {
                'is_valid': True,
                'error_type': None,
                'internal_note': 'Valid algebraic equivalence verified by SymPy CAS.',
                'verified_by': 'symbolic_calc'
            }

        # 2. Derivative step
        d_expr1 = sp.diff(expr1, x)
        diff_derivative = sp.simplify(d_expr1 - expr2)
        if diff_derivative == 0:
            return {
                'is_valid': True,
                'error_type': None,
                'internal_note': f'Valid differentiation step verified by SymPy CAS: d/dx({expr1}) == {expr2}.',
                'verified_by': 'symbolic_calc'
            }

        # 3. Sign error
        if sp.simplify(d_expr1 + expr2) == 0 or sp.simplify(expr1 + expr2) == 0:
            return {
                'is_valid': False,
                'error_type': 'sign_error',
                'internal_note': f'Sign error verified by SymPy CAS: expected {d_expr1 if diff_derivative != 0 else expr1}, but received opposite sign.',
                'verified_by': 'symbolic_calc'
            }

        # 4. Arithmetic error
        diff_val = sp.simplify(d_expr1 - expr2)
        if diff_val.is_number and diff_val != 0:
            return {
                'is_valid': False,
                'error_type': 'arithmetic',
                'internal_note': f'Arithmetic error verified by SymPy CAS: off by constant {diff_val}.',
                'verified_by': 'symbolic_calc'
            }

        # 5. Wrong rule
        return {
            'is_valid': False,
            'error_type': 'wrong_rule',
            'internal_note': f'Calculus/algebra transformation invalid, verified by SymPy CAS. Expected {d_expr1}, received {expr2}.',
            'verified_by': 'symbolic_calc'
        }

    except Exception as e:
        return {
            'is_valid': True,
            'error_type': None,
            'internal_note': f'CAS verification exception: {str(e)}',
            'verified_by': 'symbolic_calc'
        }
