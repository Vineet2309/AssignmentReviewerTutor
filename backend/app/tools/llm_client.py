import logging
from app.config import AI_API_KEY, AI_BASE_URL, GROQ_API_KEY

logger = logging.getLogger(__name__)

def get_chat_completion(messages, model: str, temperature: float = 0.2, max_tokens: int = 1000, response_format=None):
    """
    Calls OpenAI-compatible / Groq LLM endpoint dynamically based on user config.
    """
    api_key = AI_API_KEY or GROQ_API_KEY
    if not api_key:
        return None

    try:
        # If AI_BASE_URL is specified (e.g. OpenRouter or local endpoint)
        if AI_BASE_URL:
            from openai import OpenAI
            client = OpenAI(api_key=api_key, base_url=AI_BASE_URL)
            kwargs = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            if response_format:
                kwargs["response_format"] = response_format
            response = client.chat.completions.create(**kwargs)
            return response.choices[0].message.content

        # Default to Groq if GROQ_API_KEY or standard Groq setup
        from groq import Groq
        client = Groq(api_key=api_key)
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if response_format:
            kwargs["response_format"] = response_format
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    except Exception as e:
        logger.warning(f"LLM completion call failed with model {model}: {e}")
        return None
