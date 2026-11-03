from supabase import Client,create_client
from config.config import settings

supabase:Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)