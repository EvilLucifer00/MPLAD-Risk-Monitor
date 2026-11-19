"""Diagnostic v2: fix Gemini error display + Groq reasoning model handling."""
import asyncio, os, sys, json, traceback
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import httpx
from config import get_settings

settings = get_settings()

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # ── Gemini ──
        print("=" * 60)
        print(f"Testing Gemini model: {settings.gemini_model}")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
        headers = {
            "x-goog-api-key": settings.gemini_api_key.strip(),
            "Content-Type": "application/json",
        }
        payload = {
            "contents": [{"role": "user", "parts": [{"text": "Say hello"}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 50},
        }
        try:
            r = await client.post(url, json=payload, headers=headers)
            print(f"Status: {r.status_code}")
            print(f"Body: {r.text[:500]}")
        except Exception as e:
            print(f"Error type: {type(e).__name__}")
            print(f"Error: {e}")
            traceback.print_exc()

        # ── Groq with more tokens ──
        print("\n" + "=" * 60)
        print(f"Testing Groq model: {settings.groq_model_fast} (max_tokens=100)")
        groq_headers = {
            "Authorization": f"Bearer {settings.groq_api_key.strip()}",
            "Content-Type": "application/json",
        }
        groq_payload = {
            "model": settings.groq_model_fast,
            "messages": [{"role": "user", "content": "Say hello"}],
            "temperature": 0.1,
            "max_tokens": 100,
        }
        try:
            r = await client.post("https://api.groq.com/openai/v1/chat/completions",
                                  json=groq_payload, headers=groq_headers)
            print(f"Status: {r.status_code}")
            data = r.json()
            msg = data["choices"][0]["message"]
            print(f"content: '{msg.get('content', '')}'")
            print(f"reasoning: '{msg.get('reasoning', '')}'")
            print(f"finish_reason: {data['choices'][0].get('finish_reason')}")
            usage = data.get("usage", {})
            print(f"reasoning_tokens: {usage.get('completion_tokens_details', {}).get('reasoning_tokens', 'N/A')}")
            print(f"completion_tokens: {usage.get('completion_tokens', 'N/A')}")
        except Exception as e:
            print(f"Error: {e}")
            traceback.print_exc()

        # ── Also try qwen-qwq-32b as alternative fast model ──
        print("\n" + "=" * 60)
        alt_model = "qwen-qwq-32b"
        print(f"Testing Groq alt model: {alt_model}")
        groq_payload["model"] = alt_model
        try:
            r = await client.post("https://api.groq.com/openai/v1/chat/completions",
                                  json=groq_payload, headers=groq_headers)
            print(f"Status: {r.status_code}")
            data = r.json()
            msg = data["choices"][0]["message"]
            print(f"content: '{msg.get('content', '')}'")
            print(f"reasoning: '{msg.get('reasoning', '')}'")
            print(f"finish_reason: {data['choices'][0].get('finish_reason')}")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(main())
