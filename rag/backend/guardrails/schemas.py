"""Guardrail result dataclasses."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class GuardrailResult:
    """Result from input guardrail checks."""
    passed: bool
    blocked_reason: Optional[str] = None
    sanitized_message: Optional[str] = None  # PII-redacted version
    flags: list[str] = field(default_factory=list)


@dataclass
class OutputGuardrailResult:
    """Result from output guardrail checks."""
    passed: bool
    sanitized_answer: Optional[str] = None  # cleaned/modified answer
    grounding_score: float = 0.0
    hallucination_flags: list[str] = field(default_factory=list)
    factuality_flags: list[str] = field(default_factory=list)
    safety_flags: list[str] = field(default_factory=list)
    pii_redacted: bool = False
    citations_enforced: bool = False
    blocked_reason: Optional[str] = None
    flags: list[str] = field(default_factory=list)
