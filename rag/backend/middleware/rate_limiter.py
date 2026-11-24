"""Token-bucket rate limiter + concurrency throttle middleware.

Features:
  - Per-IP token bucket rate limiting (configurable RPS and burst)
  - Global concurrency semaphore to protect RAG pipeline on constrained hardware
  - Returns 429 Too Many Requests when rate limit is exceeded
  - Returns 503 Service Busy when concurrency limit is reached
  - Excludes health check and static routes from throttling
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class TokenBucket:
    """Simple token bucket for rate limiting."""

    def __init__(self, rate: float, burst: int):
        """
        Args:
            rate:  Tokens replenished per second (sustained RPS).
            burst: Maximum tokens in the bucket (burst capacity).
        """
        self.rate = rate
        self.burst = burst
        self.tokens = float(burst)
        self.last_refill = time.monotonic()

    def consume(self) -> bool:
        """Try to consume one token. Returns True if allowed."""
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
        self.last_refill = now

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP rate limiting using token buckets.

    Config via constructor or env:
        rate:  Sustained requests per second per IP (default: 2)
        burst: Max burst capacity per IP (default: 5)
    """

    # Paths exempt from rate limiting
    EXEMPT_PATHS = {"/api/health", "/docs", "/openapi.json", "/redoc"}

    def __init__(self, app: ASGIApp, rate: float = 2.0, burst: int = 5):
        super().__init__(app)
        self.rate = rate
        self.burst = burst
        self._buckets: dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(rate=self.rate, burst=self.burst)
        )
        logger.info(
            "RateLimitMiddleware initialized: rate=%.1f req/s, burst=%d",
            self.rate, self.burst,
        )

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, respecting X-Forwarded-For behind proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip exempt paths
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        bucket = self._buckets[client_ip]

        if not bucket.consume():
            logger.warning("Rate limit exceeded for IP %s on %s", client_ip, request.url.path)
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please wait before retrying.",
                    "retry_after_seconds": round(1.0 / self.rate, 1),
                },
                headers={"Retry-After": str(round(1.0 / self.rate))},
            )

        return await call_next(request)


class ConcurrencyThrottleMiddleware(BaseHTTPMiddleware):
    """Limits the number of concurrent heavy RAG requests.

    On resource-constrained instances (e.g., t3.micro), this prevents
    OOM kills by serializing requests through the RAG pipeline.

    Config:
        max_concurrent: Maximum simultaneous requests to the RAG pipeline (default: 2)
        queue_timeout:  Seconds to wait for a slot before returning 503 (default: 60)
    """

    # Only throttle heavy endpoints (chat and stream)
    THROTTLED_PATHS = {"/api/chat", "/api/chat/stream"}

    def __init__(self, app: ASGIApp, max_concurrent: int = 2, queue_timeout: float = 60.0):
        super().__init__(app)
        self.max_concurrent = max_concurrent
        self.queue_timeout = queue_timeout
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._active_count = 0
        logger.info(
            "ConcurrencyThrottleMiddleware initialized: max_concurrent=%d, queue_timeout=%.0fs",
            self.max_concurrent, self.queue_timeout,
        )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only throttle heavy RAG paths
        if request.url.path not in self.THROTTLED_PATHS:
            return await call_next(request)

        try:
            acquired = await asyncio.wait_for(
                self._acquire_semaphore(), timeout=self.queue_timeout
            )
        except asyncio.TimeoutError:
            logger.warning(
                "Concurrency queue timeout — %d active requests, rejecting new request on %s",
                self._active_count, request.url.path,
            )
            return JSONResponse(
                status_code=503,
                content={
                    "detail": "Service busy. All processing slots are occupied. Please retry shortly.",
                    "active_requests": self._active_count,
                    "max_concurrent": self.max_concurrent,
                },
                headers={"Retry-After": "10"},
            )

        self._active_count += 1
        try:
            return await call_next(request)
        finally:
            self._active_count -= 1
            self._semaphore.release()

    async def _acquire_semaphore(self):
        """Acquire the semaphore (awaitable for use with wait_for)."""
        await self._semaphore.acquire()
        return True
