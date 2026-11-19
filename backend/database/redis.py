from config.config import settings
import redis.asyncio as redis


redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)