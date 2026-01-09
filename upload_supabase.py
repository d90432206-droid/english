import os
import json
from supabase import create_client, Client

from dotenv import load_dotenv

load_dotenv()

# Supabase Credentials
URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

# Configuration
TABLE_NAME = "en_videos" # <--- Change this if your table has a different name

def main():
    print(f"Connecting to Supabase ({URL})...")
    try:
        supabase: Client = create_client(URL, KEY)
    except NameError:
        print("Error: 'supabase' library not correctly installed or imported.")
        print("Run: pip install supabase")
        return
    except Exception as e:
        print(f"Error connecting: {e}")
        return

    if not os.path.exists('learning_data.json'):
        print("learning_data.json not found!")
        return
        
    with open('learning_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Found {len(data)} items to upload.")
    
    for item in data:
        record = {
            "video_id": item.get('video_id'),
            "url": item.get('url'),
            "category": item.get('category'), # Array
            "vocabulary": item.get('vocabulary'), # JSONB
            "sentence_patterns": item.get('sentence_patterns'), # JSONB
        }
        
        print(f"Uploading {item.get('video_id')}...", end="")
        try:
            # Upsert using video_id as key
            response = supabase.table(TABLE_NAME).upsert(record).execute()
            print(" Done.")
        except Exception as e:
            print(f" Error: {e}")
            if "relation" in str(e) and "does not exist" in str(e):
                print(f"\n❌ CRITICAL: Table '{TABLE_NAME}' does not exist.")
                print("Please create it in your Supabase SQL Editor with this command:")
                print("-" * 40)
                print("""
CREATE TABLE english_videos (
    video_id TEXT PRIMARY KEY,
    url TEXT,
    category TEXT[],
    vocabulary JSONB,
    sentence_patterns JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
                """)
                print("-" * 40)
                return

if __name__ == "__main__":
    main()
