import os
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    @abstractmethod
    async def generate_text(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        response_format: Optional[str] = None,
    ) -> str:
        pass

class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        self.api_key = api_key
        self.model = model
        try:
            import anthropic
            self.client = anthropic.AsyncAnthropic(api_key=api_key)
        except ImportError:
            logger.warning("anthropic SDK not installed")
            self.client = None

    async def generate_text(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        response_format: Optional[str] = None,
    ) -> str:
        if not self.client:
            raise RuntimeError("Anthropic SDK not available")
        kwargs: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}],
        }
        if response_format == "json":
            kwargs["system"] = system_prompt + "\n\nRespond ONLY with valid JSON. Do not include markdown code fences or any text outside the JSON object."
        message = await self.client.messages.create(**kwargs)
        return message.content[0].text

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(api_key=api_key)
        except ImportError:
            logger.warning("openai SDK not installed")
            self.client = None

    async def generate_text(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        response_format: Optional[str] = None,
    ) -> str:
        if not self.client:
            raise RuntimeError("OpenAI SDK not available")
        kwargs: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        }
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}
        response = await self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

def get_llm_provider() -> LLMProvider:
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
    if anthropic_key:
        return AnthropicProvider(api_key=anthropic_key, model=anthropic_model)
    if openai_key:
        return OpenAIProvider(api_key=openai_key, model=openai_model)
    raise RuntimeError("No LLM API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.")
