from typing import Optional, Dict

REFERENCE_RULES: Dict[str, Dict[str, str]] = {
    "product_rule": {
        "name": "Product Rule",
        "formula": "d/dx [u(x) * v(x)] = u'(x)*v(x) + u(x)*v'(x)",
        "latex": r"\frac{d}{dx}[u \cdot v] = u'v + uv'",
        "description": "Derivative of a product requires differentiating each factor separately while keeping the other factor untouched, then summing the two products."
    },
    "quotient_rule": {
        "name": "Quotient Rule",
        "formula": "d/dx [u(x) / v(x)] = (u'(x)*v(x) - u(x)*v'(x)) / (v(x))^2",
        "latex": r"\frac{d}{dx}\left[\frac{u}{v}\right] = \frac{u'v - uv'}{v^2}",
        "description": "Low d-high minus high d-low over the square of what's below."
    },
    "chain_rule": {
        "name": "Chain Rule",
        "formula": "d/dx [f(g(x))] = f'(g(x)) * g'(x)",
        "latex": r"\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)",
        "description": "Differentiate outer function evaluated at inner function, multiplied by derivative of inner function."
    },
    "power_rule": {
        "name": "Power Rule",
        "formula": "d/dx [x^n] = n * x^(n-1)",
        "latex": r"\frac{d}{dx}[x^n] = n x^{n-1}",
        "description": "Multiply by current exponent and decrement power by 1."
    },
    "integration_by_parts": {
        "name": "Integration by Parts",
        "formula": "? u dv = u*v - ? v du",
        "latex": r"\int u \, dv = uv - \int v \, du",
        "description": "Transforms integral of product into uv minus integral of v du."
    },
    "sin_derivative": {
        "name": "Derivative of Sine",
        "formula": "d/dx [sin(x)] = cos(x)",
        "latex": r"\frac{d}{dx}\sin(x) = \cos(x)",
        "description": "Derivative of sin(x) is cos(x)."
    },
    "cos_derivative": {
        "name": "Derivative of Cosine",
        "formula": "d/dx [cos(x)] = -sin(x)",
        "latex": r"\frac{d}{dx}\cos(x) = -\sin(x)",
        "description": "Derivative of cos(x) is -sin(x) (note the negative sign)."
    }
}

def reference_lookup(topic: str) -> Optional[Dict[str, str]]:
    if not topic:
        return None
    topic_clean = topic.lower().replace(" ", "_").replace("-", "_")
    for key, val in REFERENCE_RULES.items():
        if key in topic_clean or topic_clean in key:
            return val
    if "product" in topic_clean:
        return REFERENCE_RULES["product_rule"]
    if "quotient" in topic_clean:
        return REFERENCE_RULES["quotient_rule"]
    if "chain" in topic_clean:
        return REFERENCE_RULES["chain_rule"]
    if "power" in topic_clean:
        return REFERENCE_RULES["power_rule"]
    if "parts" in topic_clean:
        return REFERENCE_RULES["integration_by_parts"]
    if "sin" in topic_clean:
        return REFERENCE_RULES["sin_derivative"]
    if "cos" in topic_clean:
        return REFERENCE_RULES["cos_derivative"]
    return None
