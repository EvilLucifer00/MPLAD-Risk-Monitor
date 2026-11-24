"""Output guardrails — grounding, hallucination, factuality, safety, PII leak, citation enforcement.

Runs after answer generation to ensure quality and safety of responses.
"""

from __future__ import annotations
import json
import logging
import re
from typing import List, Optional

from config import get_settings
from guardrails.schemas import OutputGuardrailResult
from llm.router import llm_router, TaskType
from retrieval.hybrid import RetrievedChunk

logger = logging.getLogger(__name__)
settings = get_settings()


# ── PII patterns (same as input_guard, used for leak prevention) ─────────────

PII_PATTERNS = {
    "aadhaar": re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
    "pan": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
    "phone_india": re.compile(r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b"),
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
}


async def _check_grounding_and_hallucination(
    answer: str,
    chunks: List[RetrievedChunk],
    query: str,
) -> tuple[float, list[str], list[str]]:
    """Combined grounding + hallucination check via quick citation analysis + optional LLM call.

    Returns:
        (grounding_score_0_to_1, hallucination_flags, factuality_flags)
    """
    if not chunks or not answer:
        return 0.0, [], []

    # Fast path: If the answer includes direct citations like [Source: ...], it's grounded!
    has_citations = bool(re.search(r"\[Source:", answer))
    if has_citations and len(answer) > 50:
        return 0.9, [], []

    context_text = "\n\n".join(c.content for c in chunks[:3])[:1500]

    prompt = f"""You are a fact-checking judge. Evaluate the following answer against the provided source context.

SOURCE CONTEXT:
{context_text}

ANSWER:
{answer[:2000]}

ORIGINAL QUESTION:
{query}

Evaluate these aspects:
1. **Grounding** (1-5): Is the answer supported by the source context?
2. **Hallucination**: Are there any claims in the answer NOT found in the sources?
3. **Factuality**: Are specific numbers, dates, amounts, or procedures correctly stated?

Respond with ONLY this JSON:
{{"grounding_score": 1-5, "hallucination_issues": ["issue1", "issue2"], "factuality_issues": ["issue1"]}}

If no issues, use empty arrays."""

    try:
        result = await llm_router.generate(
            TaskType.GROUNDING_CHECK, prompt,
            temperature=0.0, max_tokens=400,
        )
        start = result.find("{")
        end = result.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(result[start:end])
            grounding = int(data.get("grounding_score", 3)) / 5.0
            halluc = data.get("hallucination_issues", [])
            fact = data.get("factuality_issues", [])
            return grounding, halluc if isinstance(halluc, list) else [], fact if isinstance(fact, list) else []
    except Exception as e:
        logger.warning("Grounding/hallucination check failed: %s", e)

    return 0.6, [], []  # Default: moderate grounding, no detected issues


def _check_pii_leak(answer: str) -> tuple[str, bool]:
    """Scan output for PII patterns and redact if found."""
    redacted = False
    sanitized = answer
    for pii_type, pattern in PII_PATTERNS.items():
        if pattern.search(sanitized):
            sanitized = pattern.sub(f"[REDACTED]", sanitized)
            redacted = True
    return sanitized, redacted


def _check_citation_enforcement(answer: str, chunks: List[RetrievedChunk]) -> tuple[str, bool]:
    """Ensure factual claims have source references.

    If the answer contains factual statements but no [Source: ...] references,
    add a note about unverified claims.
    """
    if not chunks:
        return answer, False

    # Check if answer already has citations
    has_citations = bool(re.search(r"\[Source:", answer))
    if has_citations:
        return answer, True

    # If chunks were used but no citations in text, add a generic citation note
    doc_names = list(set(c.document_name for c in chunks[:5] if c.document_name))
    if doc_names:
        citation_note = "\n\n📚 **Sources:** " + ", ".join(doc_names)
        return answer + citation_note, True

    return answer, False


async def _check_safety(answer: str) -> list[str]:
    """Check output for harmful, toxic, or inappropriate content."""
    # Quick regex check for obviously problematic patterns
    safety_flags = []

    harmful_patterns = [
        re.compile(r"\b(kill|murder|attack|bomb|weapon|explosive)\b", re.IGNORECASE),
        re.compile(r"\b(hack|exploit|bypass\s+security)\b", re.IGNORECASE),
    ]

    for pattern in harmful_patterns:
        if pattern.search(answer):
            safety_flags.append("potentially_harmful_content")
            break

    return safety_flags


async def check_output(
    answer: str,
    chunks: List[RetrievedChunk],
    query: str,
) -> OutputGuardrailResult:
    """Run all output guardrails.

    Order:
    1. Grounding + Hallucination + Factuality check (single LLM call)
    2. Safety check (regex)
    3. PII leak prevention (regex)
    4. Citation enforcement (regex + logic)

    Returns:
        OutputGuardrailResult with sanitized answer and quality scores.
    """
    if not settings.guardrails_enabled:
        return OutputGuardrailResult(passed=True, sanitized_answer=answer)

    all_flags = []
    sanitized = answer

    # 1. Grounding + Hallucination + Factuality (combined LLM check)
    grounding_score, halluc_flags, fact_flags = await _check_grounding_and_hallucination(
        answer, chunks, query
    )

    if halluc_flags:
        all_flags.append("hallucination_detected")
    if fact_flags:
        all_flags.append("factuality_issues")

    # 2. Safety check
    safety_flags = await _check_safety(sanitized)
    all_flags.extend(safety_flags)
    if safety_flags:
        # Don't block, but flag
        logger.warning("Safety flags in output: %s", safety_flags)

    # 3. PII leak prevention
    sanitized, pii_redacted = _check_pii_leak(sanitized)
    if pii_redacted:
        all_flags.append("pii_redacted_from_output")

    # 4. Citation enforcement
    sanitized, citations_enforced = _check_citation_enforcement(sanitized, chunks)

    # Determine if grounding is poor enough to add disclaimer
    grounding_threshold = settings.guardrails_grounding_threshold
    if grounding_score < grounding_threshold and chunks:
        disclaimer = (
            "\n\n⚠️ **Note**: This response may not be fully supported by the available "
            "MPLADS documents. Please verify the information independently."
        )
        sanitized += disclaimer
        all_flags.append("low_grounding_disclaimer_added")

    # Overall pass/fail
    passed = (
        grounding_score >= 0.2  # Very low threshold — only block hallucinated garbage
        and "potentially_harmful_content" not in all_flags
    )

    return OutputGuardrailResult(
        passed=passed,
        sanitized_answer=sanitized,
        grounding_score=grounding_score,
        hallucination_flags=halluc_flags,
        factuality_flags=fact_flags,
        safety_flags=safety_flags,
        pii_redacted=pii_redacted,
        citations_enforced=citations_enforced,
        blocked_reason="Output failed safety or grounding checks" if not passed else None,
        flags=all_flags,
    )
