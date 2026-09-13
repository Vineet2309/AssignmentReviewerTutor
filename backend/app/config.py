import os
from dotenv import load_dotenv

load_dotenv()

# User-specified models:
TEXT_MODEL = os.getenv("TEXT_MODEL", "openai/gpt-oss-120b")
VISION_MODEL = os.getenv("VISION_MODEL", "qwen/qwen3.8-27b")

# AI API keys & base URL (supports Groq, OpenRouter, or standard OpenAI-compatible endpoints)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_API_KEY = os.getenv("AI_API_KEY", GROQ_API_KEY or OPENAI_API_KEY)
AI_BASE_URL = os.getenv("AI_BASE_URL", "")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "socratic_tutor")

# Maximum hint level before full solution is revealed
MAX_HINT_LIMIT = int(os.getenv("MAX_HINT_LIMIT", "6"))
