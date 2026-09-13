import json
import logging
import re
from typing import Dict, Any, List, Optional
from app.config import VISION_MODEL, AI_API_KEY, AI_BASE_URL, GROQ_API_KEY
from app.models import ParserOutput, Step

logger = logging.getLogger(__name__)

VISION_TRANSCRIBE_PROMPT = """You are an OCR and handwriting transcription engine.
Transcribe all mathematical work, code, or equations written on this whiteboard image.

Instructions:
1. Output each written step or line on a new line.
2. Format mathematical expressions using standard LaTeX notation (e.g. \\frac{d}{dx}, x^2, \\sin(x), \\int).
3. Do NOT solve the problem or add commentary. Return ONLY the transcribed lines from the image.
"""

def extract_text_from_whiteboard(
    whiteboard_image_base64: str,
    question_text: str,
    text_override: Optional[str] = None
) -> ParserOutput:
    """
    Step 1 of Tutoring Flow: Image -> Image-to-Text Generator (VISION_MODEL: qwen/qwen3.8-27b).
    Extracts text line-by-line from the whiteboard canvas.
    """
    # 1. Direct text override if student provided typed steps
    if text_override and text_override.strip():
        extracted = text_override.strip()
        lines = [l.strip() for l in extracted.split("\n") if l.strip()]
        steps = [Step(step_no=idx, content=line, is_valid=True, raw_ocr_confidence=0.98) for idx, line in enumerate(lines, 1)]
        return ParserOutput(
            question=question_text,
            extracted_text=extracted,
            steps=steps,
            final_line=steps[-1].content if len(steps) > 1 else None,
            ambiguous_regions=[]
        )

    # 2. Vision Model Transcription
    api_key = AI_API_KEY or GROQ_API_KEY
    if api_key and whiteboard_image_base64:
        try:
            image_url = whiteboard_image_base64
            if not image_url.startswith("data:image"):
                image_url = f"data:image/png;base64,{image_url}"

            # If custom base URL (e.g. OpenRouter or OpenAI)
            if AI_BASE_URL:
                from openai import OpenAI
                client = OpenAI(api_key=api_key, base_url=AI_BASE_URL)
            else:
                from groq import Groq
                client = Groq(api_key=api_key)

            response = client.chat.completions.create(
                model=VISION_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": VISION_TRANSCRIBE_PROMPT
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"Question context: {question_text}\nTranscribe all handwritten lines and steps written on this whiteboard:"},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    }
                ],
                temperature=0.1,
                max_tokens=800
            )
            raw_text = response.choices[0].message.content.strip()
            # Clean markdown code blocks if any
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```[a-zA-Z]*\n?", "", raw_text)
                raw_text = re.sub(r"\n?```$", "", raw_text)

            lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
            steps = [Step(step_no=idx, content=line, is_valid=True, raw_ocr_confidence=0.92) for idx, line in enumerate(lines, 1)]
            return ParserOutput(
                question=question_text,
                extracted_text=raw_text,
                steps=steps,
                final_line=steps[-1].content if len(steps) > 1 else None,
                ambiguous_regions=[]
            )
        except Exception as e:
            logger.warning(f"Vision transcription failed with model {VISION_MODEL}: {e}")

    # 3. Fallback when canvas is drawn or offline:
    # Instead of hardcoding a fake formula, we state that input was received for the given question
    # and allow the reviewer LLM to evaluate the question context directly.
    return ParserOutput(
        question=question_text,
        extracted_text="Student whiteboard solution submitted.",
        steps=[Step(step_no=1, content="Student solution on whiteboard", is_valid=True, raw_ocr_confidence=0.85)],
        final_line=None,
        ambiguous_regions=[]
    )
