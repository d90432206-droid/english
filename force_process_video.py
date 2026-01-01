from study_ai import fetch_transcript_final, analyze_with_ai
from upload_supabase import URL, KEY, TABLE_NAME
from supabase import create_client
import json

def run_force_update():
    v_id = "OvFfYRorOqM"
    url = "https://www.youtube.com/watch?v=OvFfYRorOqM"
    
    print(f"Fetching transcript for {v_id}...")
    text = fetch_transcript_final(v_id)
    if not text:
        print("Failed to fetch transcript.")
        return

    print("Analyzing with AI (New Bilingual Prompt)...")
    try:
        analysis = analyze_with_ai(text)
        analysis['video_id'] = v_id
        analysis['url'] = url
        
        print("Payload to upload:", json.dumps(analysis, ensure_ascii=False)[:200] + "...")
        print("Uploading to Supabase...")
        supabase = create_client(URL, KEY)
        response = supabase.table(TABLE_NAME).upsert(analysis).execute()
        print("Upload complete! Please refresh the web app.")
        
    except Exception as e:
        print(f"Error during AI analysis or Upload: {e}")
        # import traceback
        # traceback.print_exc()

if __name__ == "__main__":
    run_force_update()
