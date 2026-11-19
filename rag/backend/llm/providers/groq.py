"""Groq API client (OpenAI-compatible) with streaming and non-streaming support."""

from __future__ import annotations
import json
import logging
from typing import AsyncIterator, Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=120.0)
    return _client


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.groq_api_key.strip()}",
        "Content-Type": "application/json",
    }


async def call_groq(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 1024,
    system_prompt: str | None = None,
) -> str:
    """Call Groq API (non-streaming).

    Args:
        prompt: User prompt text.
        model: Model name (defaults to settings.groq_model_fast).
        temperature: Sampling temperature.
        max_tokens: Max output tokens.
        system_prompt: Optional system instruction.

    Returns:
        Generated text response.
    """
    model = model or settings.groq_model_fast
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    client = _get_client()
    try:
        response = await client.post(GROQ_BASE_URL, json=payload, headers=_headers())
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error("Groq API error (%s): %s", e.response.status_code, e.response.text)
        raise
    data = response.json()

    try:
        content = data["choices"][0]["message"]["content"]
        if content:
            return content.strip()
        # Reasoning models (e.g. gpt-oss) may put output in 'reasoning' when content is empty
        reasoning = data["choices"][0]["message"].get("reasoning", "")
        if reasoning:
            return reasoning.strip()
        return ""
    except (IndexError, KeyError, TypeError):
        return ""


async def stream_groq(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 1024,
    system_prompt: str | None = None,
) -> AsyncIterator[str]:
    """Stream Groq API response token by token.

    Yields:
        Text chunks as they arrive.
    """
    model = model or settings.groq_model_fast
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }

    client = _get_client()
    async with client.stream("POST", GROQ_BASE_URL, json=payload, headers=_headers()) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                chunk = line[6:].strip()
                if chunk == "[DONE]":
                    break
                try:
                    data = json.loads(chunk)
                    delta = data["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content
                except (json.JSONDecodeError, IndexError, KeyError):
                    continue
