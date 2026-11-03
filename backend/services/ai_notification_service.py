import os
from typing import Any, Dict

import httpx
from config.config import settings


AI_NOTIFICATION_AGENT_URL = settings.AI_NOTIFICATION_AGENT_URL

AI_NOTIFICATION_AGENT_API_KEY = settings.AI_NOTIFICATION_AGENT_API_KEY


async def generate_notification_description(
    context: Dict[str, Any],
) -> str:
    """
    Ask the external AI agent to produce a short
    notification description.

    The agent should return:

        {
            "description": "..."
        }
    """

    if not AI_NOTIFICATION_AGENT_URL:
        raise RuntimeError(
            "AI_NOTIFICATION_AGENT_URL is not configured"
        )

    headers = {
        "Content-Type": "application/json",
    }

    if AI_NOTIFICATION_AGENT_API_KEY:
        headers["Authorization"] = (
            f"Bearer {AI_NOTIFICATION_AGENT_API_KEY}"
        )

    payload = {
        "task": "notification_description",
        "instructions": (
            "Generate a concise notification description "
            "for an MPLADS monitoring portal. "
            "Keep it to 1-2 sentences. "
            "Use only the supplied facts. "
            "Do not invent information. "
            "Mention the most important reason for the alert "
            "and, when appropriate, the action required."
        ),
        "context": context,
    }

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        response = await client.post(
            AI_NOTIFICATION_AGENT_URL,
            json=payload,
            headers=headers,
        )

        response.raise_for_status()

        data = response.json()

    description = data.get(
        "description"
    )

    if not description:
        raise RuntimeError(
            "AI notification agent returned no description"
        )

    return str(description).strip()