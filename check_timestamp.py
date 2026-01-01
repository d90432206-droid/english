import os
from supabase import create_client, Client
from upload_supabase import URL, KEY

supabase: Client = create_client(URL, KEY)

def check_timestamps(video_id):
    print(f"Checking data for video: {video_id}...")
    try:
        response = supabase.table('english_videos').select('sentence_patterns').eq('video_id', video_id).execute()
        if response.data:
            patterns = response.data[0].get('sentence_patterns', [])
            print(f"Found {len(patterns)} patterns.")
            for i, p in enumerate(patterns):
                has_timestamp = 'timestamp' in p
                ts_value = p.get('timestamp')
                print(f"  Pattern {i+1}: {p.get('structure')[:20]}... | Has Timestamp: {has_timestamp} | Value: {ts_value}")
        else:
            print("Video not found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_timestamps("OvFfYRorOqM")
