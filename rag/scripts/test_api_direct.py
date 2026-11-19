"""Test FastAPI endpoints directly using AsyncClient."""
import asyncio, os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import httpx
from main import app

async def main():
    print("=" * 65)
    print("Testing FastAPI App: Health & Chat Endpoint")
    print("=" * 65)
    
    # Use lifespan context manager with AsyncClient
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test", timeout=60.0) as client:
        # 1. Health check
        print("\n--- 1. Testing GET /api/health ---")
        res = await client.get("/api/health")
        print(f"Status: {res.status_code}")
        print(f"Response: {json.dumps(res.json(), indent=2)}")

        # 2. Test chat message
        print("\n--- 2. Testing POST /api/chat ---")
        chat_payload = {
            "message": "What is the annual MPLADS fund allocation per Member of Parliament?"
        }
        res = await client.post("/api/chat", json=chat_payload)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print("\nResponse:")
            print(f"Answer: {data.get('answer', '')[:300]}...")
            print(f"Citations: {len(data.get('citations', []))}")
            for c in data.get('citations', [])[:3]:
                print(f"  - [{c.get('document_name')}] chunk {c.get('chunk_index')} (score: {c.get('similarity_score')})")
            print(f"Grounding score: {data.get('grounding_score')}")
            print(f"Model used: {data.get('model_used')}")
            print("\n🎉 Full RAG pipeline test succeeded!")
        else:
            print(f"Error: {res.text}")

if __name__ == "__main__":
    asyncio.run(main())
