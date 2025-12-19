"""
Supabase configuration for PCL platform
"""
import os

# You'll set these in Vercel environment variables
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Example of how to authenticate with Supabase
SUPABASE_CONFIG = {
    "url": supabase_url,
    "key": supabase_key,
    "options": {
        "autoRefreshToken": True,
        "persistSession": True,
        "detectSessionInUrl": True,
    },
}
