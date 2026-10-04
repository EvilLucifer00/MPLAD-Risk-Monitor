from supabase import Client,create_client
from config.config import settings

# Initialize Supabase client
# This client connects the backend to the Supabase database using credentials from the environment config
supabase:Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)