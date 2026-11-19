"""Gemini API client with streaming and non-streaming support."""

from __future__ import annotations
import json
import logging
from typing import AsyncIterator, Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Reusable client with connection pooling
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=120.0)
    return _client


async def call_gemini(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 1024,
    system_prompt: str | None = None,
) -> str:
    """Call Gemini API (non-streaming).

    Args:
        prompt: User prompt text.
        model: Model name (defaults to settings.gemini_model).
        temperature: Sampling temperature.
        max_tokens: Max output tokens.
        system_prompt: Optional system instruction.

    Returns:
        Generated text response.
    """
    model = model or settings.gemini_model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {
        "x-goog-api-key": settings.gemini_api_key.strip(),
        "Content-Type": "application/json",
    }

    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": system_prompt}]})
        contents.append({"role": "model", "parts": [{"text": "Understood. I will follow these instructions."}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }

    client = _get_client()
    last_err = None
    for attempt in range(3):
        try:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            break
        except httpx.HTTPStatusError as e:
            last_err = e
            if e.response.status_code in (503, 429) and attempt < 2:
                import asyncio as _aio
                wait = 2 ** attempt  # 1s, 2s
                logger.warning("Gemini %s (attempt %d/3), retrying in %ds...",
                               e.response.status_code, attempt + 1, wait)
                await _aio.sleep(wait)
                continue
            logger.error("Gemini API error (%s): %s", e.response.status_code, e.response.text)
            raise
    else:
        raise last_err  # type: ignore[misc]
    data = response.json()

    try:
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "").strip()
    except (IndexError, KeyError, TypeError):
        pass

    return ""


async def stream_gemini(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 1024,
    system_prompt: str | None = None,
) -> AsyncIterator[str]:
    """Stream Gemini API response token by token.

    Yields:
        Text chunks as they arrive.
    """
    model = model or settings.gemini_model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse"
    headers = {
        "x-goog-api-key": settings.gemini_api_key.strip(),
        "Content-Type": "application/json",
    }

    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": system_prompt}]})
        contents.append({"role": "model", "parts": [{"text": "Understood."}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }

    client = _get_client()
    async with client.stream("POST", url, json=payload, headers=headers) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                try:
                    data = json.loads(line[6:])
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            text = parts[0].get("text", "")
                            if text:
                                yield text
                except (json.JSONDecodeError, IndexError, KeyError):
                    continue
