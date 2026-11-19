"""LLM Router — task-based model selection for cost optimization.

Routes each task type to the cheapest model that can handle it well,
with automatic fallback on failure.

Task → Model mapping (cost_optimized strategy):
  query_analysis      → Groq Fast (8B)     — simple classification
  query_rewrite       → Groq Fast (8B)     — simple rephrasing
  generate_answer     → Gemini Flash        — quality + citations
  grounding_check     → Groq Fast (8B)     — short JSON output
  memory_extraction   → Groq Fast (8B)     — simple extraction
  guardrail_check     → Groq Fast (8B)     — binary classification
  conversation_summary→ Gemini Flash        — full context understanding
  complex_reasoning   → Gemini Heavy (Pro)  — multi-hop, complex queries
"""

from __future__ import annotations
import logging
from enum import Enum
from typing import Optional

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TaskType(str, Enum):
    """Types of LLM tasks the router can handle."""
    QUERY_ANALYSIS = "query_analysis"
    QUERY_REWRITE = "query_rewrite"
    GENERATE_ANSWER = "generate_answer"
    GROUNDING_CHECK = "grounding_check"
    MEMORY_EXTRACTION = "memory_extraction"
    GUARDRAIL_CHECK = "guardrail_check"
    CONVERSATION_SUMMARY = "conversation_summary"
    COMPLEX_REASONING = "complex_reasoning"
    TITLE_GENERATION = "title_generation"


class ModelTier(str, Enum):
    """Model tiers from cheapest to most expensive."""
    GROQ_FAST = "groq_fast"
    GROQ_QUALITY = "groq_quality"
    GEMINI_FLASH = "gemini_flash"
    GEMINI_HEAVY = "gemini_heavy"


# ── Task → Model mapping per strategy ───────────────────────────────────────

STRATEGY_MAP = {
    "cost_optimized": {
        TaskType.QUERY_ANALYSIS: ModelTier.GROQ_FAST,
        TaskType.QUERY_REWRITE: ModelTier.GROQ_FAST,
        TaskType.GENERATE_ANSWER: ModelTier.GEMINI_FLASH,
        TaskType.GROUNDING_CHECK: ModelTier.GROQ_FAST,
        TaskType.MEMORY_EXTRACTION: ModelTier.GROQ_FAST,
        TaskType.GUARDRAIL_CHECK: ModelTier.GROQ_FAST,
        TaskType.CONVERSATION_SUMMARY: ModelTier.GEMINI_FLASH,
        TaskType.COMPLEX_REASONING: ModelTier.GEMINI_HEAVY,
        TaskType.TITLE_GENERATION: ModelTier.GROQ_FAST,
    },
    "quality_first": {
        TaskType.QUERY_ANALYSIS: ModelTier.GEMINI_FLASH,
        TaskType.QUERY_REWRITE: ModelTier.GEMINI_FLASH,
        TaskType.GENERATE_ANSWER: ModelTier.GEMINI_HEAVY,
        TaskType.GROUNDING_CHECK: ModelTier.GEMINI_FLASH,
        TaskType.MEMORY_EXTRACTION: ModelTier.GEMINI_FLASH,
        TaskType.GUARDRAIL_CHECK: ModelTier.GEMINI_FLASH,
        TaskType.CONVERSATION_SUMMARY: ModelTier.GEMINI_HEAVY,
        TaskType.COMPLEX_REASONING: ModelTier.GEMINI_HEAVY,
        TaskType.TITLE_GENERATION: ModelTier.GEMINI_FLASH,
    },
    "latency_first": {
        TaskType.QUERY_ANALYSIS: ModelTier.GROQ_FAST,
        TaskType.QUERY_REWRITE: ModelTier.GROQ_FAST,
        TaskType.GENERATE_ANSWER: ModelTier.GROQ_QUALITY,
        TaskType.GROUNDING_CHECK: ModelTier.GROQ_FAST,
        TaskType.MEMORY_EXTRACTION: ModelTier.GROQ_FAST,
        TaskType.GUARDRAIL_CHECK: ModelTier.GROQ_FAST,
        TaskType.CONVERSATION_SUMMARY: ModelTier.GROQ_QUALITY,
        TaskType.COMPLEX_REASONING: ModelTier.GEMINI_FLASH,
        TaskType.TITLE_GENERATION: ModelTier.GROQ_FAST,
    },
}

# Fallback chain: if the chosen model fails, try the next one
FALLBACK_CHAIN = [
    ModelTier.GEMINI_FLASH,
    ModelTier.GROQ_QUALITY,
    ModelTier.GROQ_FAST,
    ModelTier.GEMINI_HEAVY,
]


class LLMRouter:
    """Routes LLM tasks to optimal models based on cost/quality/latency strategy."""

    def __init__(self):
        self._strategy = settings.llm_router_strategy
        self._task_map = STRATEGY_MAP.get(self._strategy, STRATEGY_MAP["cost_optimized"])
        logger.info("LLM Router initialized with strategy: %s", self._strategy)

    def _get_model_config(self, tier: ModelTier) -> tuple[str, str]:
        """Return (provider, model_name) for a given tier.

        Returns:
            Tuple of ('gemini'|'groq', model_name_string).
        """
        if tier == ModelTier.GROQ_FAST:
            return ("groq", settings.groq_model_fast)
        elif tier == ModelTier.GROQ_QUALITY:
            return ("groq", settings.groq_model_quality)
        elif tier == ModelTier.GEMINI_FLASH:
            return ("gemini", settings.gemini_model)
        elif tier == ModelTier.GEMINI_HEAVY:
            return ("gemini", settings.gemini_model_heavy)
        else:
            return ("gemini", settings.gemini_model)

    def _is_provider_available(self, provider: str) -> bool:
        """Check if a provider has API keys configured."""
        if provider == "gemini":
            return bool(settings.gemini_api_key)
        elif provider == "groq":
            return bool(settings.groq_api_key)
        return False

    async def _call_provider(
        self,
        provider: str,
        model: str,
        prompt: str,
        temperature: float,
        max_tokens: int,
        system_prompt: str | None = None,
    ) -> str:
        """Call the appropriate provider's API."""
        if provider == "gemini":
            from llm.providers.gemini import call_gemini
            return await call_gemini(prompt, model=model, temperature=temperature,
                                     max_tokens=max_tokens, system_prompt=system_prompt)
        elif provider == "groq":
            from llm.providers.groq import call_groq
            return await call_groq(prompt, model=model, temperature=temperature,
                                   max_tokens=max_tokens, system_prompt=system_prompt)
        else:
            raise ValueError(f"Unknown provider: {provider}")

    async def generate(
        self,
        task: TaskType,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        system_prompt: str | None = None,
    ) -> str:
        """Route a task to the optimal model and generate a response.

        Tries the primary model for the task, then falls back through
        the fallback chain on failure.

        Args:
            task: The type of task (determines which model to use).
            prompt: The prompt to send.
            temperature: Sampling temperature.
            max_tokens: Max output tokens.
            system_prompt: Optional system instruction.

        Returns:
            Generated text response.

        Raises:
            RuntimeError: If all providers fail.
        """
        primary_tier = self._task_map.get(task, ModelTier.GEMINI_FLASH)
        provider, model = self._get_model_config(primary_tier)

        # Try primary model
        if self._is_provider_available(provider):
            try:
                result = await self._call_provider(
                    provider, model, prompt, temperature, max_tokens, system_prompt
                )
                logger.debug("Task '%s' completed with %s/%s", task.value, provider, model)
                return result
            except Exception as e:
                logger.warning(
                    "Primary model failed for task '%s' (%s/%s): %s",
                    task.value, provider, model, e,
                )

        # Fallback chain
        for fallback_tier in FALLBACK_CHAIN:
            if fallback_tier == primary_tier:
                continue  # Already tried

            fb_provider, fb_model = self._get_model_config(fallback_tier)
            if not self._is_provider_available(fb_provider):
                continue

            try:
                result = await self._call_provider(
                    fb_provider, fb_model, prompt, temperature, max_tokens, system_prompt
                )
                logger.info(
                    "Task '%s' succeeded with fallback %s/%s",
                    task.value, fb_provider, fb_model,
                )
                return result
            except Exception as e:
                logger.warning("Fallback %s/%s failed: %s", fb_provider, fb_model, e)
                continue

        raise RuntimeError(
            f"All LLM providers failed for task '{task.value}'. "
            "Check GEMINI_API_KEY and GROQ_API_KEY in .env"
        )

    @property
    def strategy(self) -> str:
        return self._strategy


# ── Module-level singleton ───────────────────────────────────────────────────
llm_router = LLMRouter()
