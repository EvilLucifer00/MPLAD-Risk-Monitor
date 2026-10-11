"""Unified LLM provider with automatic fallback: Gemini → Groq.

Tries Gemini first. If Gemini is unavailable or fails,
falls back to Groq. The active provider is cached after
the first successful call so subsequent calls skip the health check.
"""

from __future__ import annotations
import json
import logging
from enum import Enum
from typing import Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMProvider(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"


class LLMClient:
    """Multi-provider LLM client with automatic failover."""

    def __init__(self):
        self._active_provider: Optional[LLMProvider] = None
        self._checked = False

    # ── Provider health checks ───────────────────────────────────────────

    def _is_gemini_configured(self) -> bool:
        return bool(settings.gemini_api_key and settings.gemini_api_key != "")

    def _is_groq_configured(self) -> bool:
        return bool(settings.groq_api_key and settings.groq_api_key != "")

    # ── Provider resolution ──────────────────────────────────────────────

    async def _resolve_provider(self) -> LLMProvider:
        """Determine which provider to use based on priority + availability."""

        # If user explicitly set a preferred provider, try that first
        preferred = settings.llm_provider.lower()

        if preferred == "gemini":
            if self._is_gemini_configured():
                return LLMProvider.GEMINI
        elif preferred == "groq":
            if self._is_groq_configured():
                return LLMProvider.GROQ

        # Auto-fallback: Gemini → Groq
        if preferred == "auto" or True:  # always try fallback chain
            if self._is_gemini_configured():
                logger.info("🔄 Using Gemini API")
                return LLMProvider.GEMINI
            if self._is_groq_configured():
                logger.info("🔄 Falling back to Groq API")
                return LLMProvider.GROQ

        raise RuntimeError(
            "No LLM provider available. Please either:\n"
            "  1. Set GEMINI_API_KEY in .env\n"
            "  2. Set GROQ_API_KEY in .env"
        )

    async def _get_provider(self) -> LLMProvider:
        """Get the active provider, resolving on first call."""
        if not self._checked:
            self._active_provider = await self._resolve_provider()
            self._checked = True
            logger.info("🤖 Active LLM provider: %s", self._active_provider.value)
        return self._active_provider

    def reset(self):
        """Reset provider cache (e.g., if a provider comes back online)."""
        self._active_provider = None
        self._checked = False

    # ── Provider-specific call implementations ───────────────────────────

    async def _call_gemini(
        self, prompt: str, temperature: float, max_tokens: int
    ) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent"
            f"?key={settings.gemini_api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        # Extract text from Gemini response
        try:
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
        except (IndexError, KeyError, TypeError):
            pass

        return ""

    async def _call_groq(
        self, prompt: str, temperature: float, max_tokens: int
    ) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        # Extract text from OpenAI-compatible response
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (IndexError, KeyError, TypeError):
            return ""

    # ── Unified call method ──────────────────────────────────────────────

    async def generate(
        self,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> str:
        """Generate text using the active LLM provider with automatic fallback.

        Args:
            prompt: The prompt to send to the LLM.
            temperature: Sampling temperature (0.0 - 1.0).
            max_tokens: Maximum tokens to generate.

        Returns:
            The generated text response.
        """
        provider = await self._get_provider()

        # Try the active provider first
        try:
            if provider == LLMProvider.GEMINI:
                return await self._call_gemini(prompt, temperature, max_tokens)
            elif provider == LLMProvider.GROQ:
                return await self._call_groq(prompt, temperature, max_tokens)
        except Exception as e:
            logger.warning(
                "Primary provider '%s' failed: %s. Attempting fallback…",
                provider.value, e,
            )

        # Fallback chain
        fallback_order = [LLMProvider.GEMINI, LLMProvider.GROQ]
        for fallback in fallback_order:
            if fallback == provider:
                continue  # Skip the one that already failed

            try:
                if fallback == LLMProvider.GEMINI:
                    if not self._is_gemini_configured():
                        continue
                    result = await self._call_gemini(prompt, temperature, max_tokens)
                elif fallback == LLMProvider.GROQ:
                    if not self._is_groq_configured():
                        continue
                    result = await self._call_groq(prompt, temperature, max_tokens)
                else:
                    continue

                # Update active provider to the one that worked
                self._active_provider = fallback
                logger.info("✅ Switched to fallback provider: %s", fallback.value)
                return result

            except Exception as fallback_err:
                logger.warning("Fallback '%s' also failed: %s", fallback.value, fallback_err)
                continue

        raise RuntimeError(
            "All LLM providers failed. Check Gemini API key or Groq API key."
        )

    @property
    def active_provider_name(self) -> str:
        """Return the name of the currently active provider."""
        if self._active_provider:
            return self._active_provider.value
        return "not initialized"


# ── Module-level singleton ───────────────────────────────────────────────────
llm_client = LLMClient()
