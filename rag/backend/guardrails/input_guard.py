"""Input guardrails — PII detection, prompt injection, topic scope, profanity, SQL injection, length.

All checks run sequentially; the first failure short-circuits with a block.
Lightweight regex checks run first (free), LLM-based checks run last (cost).
"""

from __future__ import annotations
import logging
import re
from typing import Optional

from config import get_settings
from guardrails.schemas import GuardrailResult
from llm.router import llm_router, TaskType

logger = logging.getLogger(__name__)
settings = get_settings()

# ── PII Patterns ─────────────────────────────────────────────────────────────

PII_PATTERNS = {
    "aadhaar": re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
    "pan": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
    "phone_india": re.compile(r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b"),
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    "credit_card": re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"),
}

# ── Injection Patterns ──────────────────────────────────────────────────────

INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(a|an)\s+", re.IGNORECASE),
    re.compile(r"system\s*prompt\s*:", re.IGNORECASE),
    re.compile(r"forget\s+(everything|all|your)\s+(you|instructions?|rules?)", re.IGNORECASE),
    re.compile(r"act\s+as\s+(if\s+)?(you\s+are|a)\s+", re.IGNORECASE),
    re.compile(r"pretend\s+(you\s+are|to\s+be)\s+", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"DAN\s+mode", re.IGNORECASE),
    # Additional injection patterns
    re.compile(r"system\s*override", re.IGNORECASE),
    re.compile(r"reveal\s+(all\s+)?(internal|system|secret|backend|private)", re.IGNORECASE),
    re.compile(r"(output|show|display|print|dump)\s+(the\s+)?(database|system|internal|backend)\s*(password|key|secret|prompt|credential)s?", re.IGNORECASE),
    re.compile(r"(bypass|disable|override)\s+(all\s+)?(safety|security|filter|guard|restriction)s?", re.IGNORECASE),
    re.compile(r"do\s+not\s+follow\s+(your\s+)?(rules?|instructions?|guidelines?)", re.IGNORECASE),
    re.compile(r"new\s+instructions?\s*:", re.IGNORECASE),
]

# ── SQL Injection Patterns ──────────────────────────────────────────────────

SQL_PATTERNS = [
    re.compile(r"\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)\s+", re.IGNORECASE),
    re.compile(r";\s*(SELECT|DROP|DELETE|INSERT|UPDATE)\s+", re.IGNORECASE),
    re.compile(r"--\s*$", re.MULTILINE),
    re.compile(r"'\s*(OR|AND)\s+\d+\s*=\s*\d+", re.IGNORECASE),
]

# ── Profanity Blocklist (minimal — LLM-based check handles nuance) ──────────

PROFANITY_WORDS = {
    "fuck", "shit", "bitch", "asshole", "bastard", "damn",
    "cunt", "dick", "piss", "slut", "whore",
}


def _check_length(message: str) -> Optional[GuardrailResult]:
    """Check message length."""
    if len(message) > settings.guardrails_max_input_length:
        return GuardrailResult(
            passed=False,
            blocked_reason=f"Message too long ({len(message)} chars). Maximum is {settings.guardrails_max_input_length}.",
            flags=["max_length_exceeded"],
        )
    if len(message.strip()) == 0:
        return GuardrailResult(
            passed=False,
            blocked_reason="Empty message.",
            flags=["empty_message"],
        )
    return None


def _check_pii(message: str) -> tuple[list[str], str]:
    """Detect and optionally redact PII. Returns (flags, sanitized_message)."""
    flags = []
    sanitized = message
    for pii_type, pattern in PII_PATTERNS.items():
        matches = pattern.findall(message)
        if matches:
            flags.append(f"pii_{pii_type}")
            if settings.guardrails_block_pii:
                sanitized = pattern.sub(f"[REDACTED_{pii_type.upper()}]", sanitized)
    return flags, sanitized


def _check_injection(message: str) -> Optional[str]:
    """Check for prompt injection patterns."""
    for pattern in INJECTION_PATTERNS:
        if pattern.search(message):
            return "Potential prompt injection detected."
    return None


def _check_sql_injection(message: str) -> Optional[str]:
    """Check for SQL injection patterns."""
    for pattern in SQL_PATTERNS:
        if pattern.search(message):
            return "Potential SQL injection detected."
    return None


def _check_profanity(message: str) -> Optional[str]:
    """Check for profanity via blocklist."""
    words = set(re.findall(r"\b\w+\b", message.lower()))
    found = words & PROFANITY_WORDS
    if found:
        return "Message contains inappropriate language."
    return None


# Fast keywords to short-circuit topic check (0ms, skips LLM)
GOV_KEYWORDS = re.compile(
    r"\b(mplad|mplads|mp|fund|funds|expenditure|project|projects|district|guideline|guidelines|"
    r"authority|collector|sanction|sanctioned|sanctioning|work|works|panchayat|constituency|"
    r"lok\s*sabha|rajya\s*sabha|audit|scheme|solar|water|hospital|school|road|bridge|community|"
    r"disaster|relief|calamity|prohibited|permissible|recommend|eligible|eligibility|ceiling|limit)\b",
    re.IGNORECASE,
)

async def _check_topic_scope(message: str) -> Optional[str]:
    """Check if the message is about MPLADS/governance (on-topic).
    Fast keyword match runs first (0ms). LLM only runs on ambiguous queries.
    """
    if GOV_KEYWORDS.search(message):
        return None  # Definitely on-topic, skip LLM call!
    prompt = f"""Classify whether the following user message is related to ANY of these topics:
- MPLADS (Members of Parliament Local Area Development Scheme)
- Government projects, funds, schemes
- MP (Member of Parliament) duties, constituency work
- District administration, governance
- Public infrastructure, development works
- Budget allocation, expenditure, auditing
- General greetings or follow-up questions in a conversation

Message: "{message}"

Respond with ONLY "on_topic" or "off_topic". Nothing else."""

    try:
        result = await llm_router.generate(
            TaskType.GUARDRAIL_CHECK, prompt,
            temperature=0.0, max_tokens=20,
        )
        if "off_topic" in result.lower():
            return (
                "I'm an MPLADS (Members of Parliament Local Area Development Scheme) assistant. "
                "I can help with questions about MPLADS guidelines, fund allocation, project management, "
                "and related governance topics. Could you rephrase your question?"
            )
    except Exception as e:
        logger.warning("Topic scope check failed: %s", e)
        # Don't block on LLM failure — allow through
    return None


async def check_input(message: str) -> GuardrailResult:
    """Run all input guardrails in sequence.

    Order (cheapest first):
    1. Length check (free)
    2. PII detection (regex, free)
    3. Prompt injection (regex, free)
    4. SQL injection (regex, free)
    5. Profanity (blocklist, free)
    6. Topic scope (LLM-based, costs tokens)

    Returns:
        GuardrailResult with passed=True if all checks pass.
    """
    if not settings.guardrails_enabled:
        return GuardrailResult(passed=True, sanitized_message=message)

    all_flags = []

    # 1. Length check
    length_result = _check_length(message)
    if length_result:
        return length_result

    # 2. PII detection & redaction
    pii_flags, sanitized = _check_pii(message)
    all_flags.extend(pii_flags)
    if pii_flags and settings.guardrails_block_pii:
        logger.info("PII detected and redacted: %s", pii_flags)
        # Block the original message and return a safe redacted response
        return GuardrailResult(
            passed=False,
            blocked_reason=(
                "Your message contained personally identifiable information "
                f"({', '.join(f.replace('pii_', '').upper() for f in pii_flags)}) "
                "which has been redacted for your safety. Please rephrase without sensitive data."
            ),
            sanitized_message=sanitized,
            flags=all_flags + ["pii_blocked"],
        )

    # 3. Prompt injection
    injection_reason = _check_injection(message)
    if injection_reason:
        return GuardrailResult(
            passed=False,
            blocked_reason=injection_reason,
            flags=all_flags + ["prompt_injection"],
        )

    # 4. SQL injection
    sql_reason = _check_sql_injection(message)
    if sql_reason:
        return GuardrailResult(
            passed=False,
            blocked_reason=sql_reason,
            flags=all_flags + ["sql_injection"],
        )

    # 5. Profanity
    profanity_reason = _check_profanity(message)
    if profanity_reason:
        return GuardrailResult(
            passed=False,
            blocked_reason=profanity_reason,
            flags=all_flags + ["profanity"],
        )

    # 6. Topic scope (LLM-based — most expensive, runs last)
    topic_redirect = await _check_topic_scope(sanitized)
    if topic_redirect:
        return GuardrailResult(
            passed=False,
            blocked_reason=topic_redirect,
            flags=all_flags + ["off_topic"],
        )

    return GuardrailResult(
        passed=True,
        sanitized_message=sanitized,
        flags=all_flags,
    )
