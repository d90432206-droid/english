import json
from supabase import create_client, Client
from upload_supabase import URL, KEY, TABLE_NAME

# Initialize Supabase client
supabase: Client = create_client(URL, KEY)

def upload_from_json():
    json_path = "learning_data.json"
    
    try:
        # 1. Read the JSON file
        print(f"Reading data from {json_path}...")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if not isinstance(data, list):
            # Try to handle if it's a single object
            data = [data]
            
        print(f"Found {len(data)} records to upload.")
        
        # 2. Upload each record
        for item in data:
            video_id = item.get('video_id')
            print(f"Uploading data for video: {video_id}...")
            
            # Upsert into Supabase
            response = supabase.table(TABLE_NAME).upsert(item).execute()
            
        print("✅ Upload complete! All data from JSON has been sent to Supabase.")
        
    except Exception as e:
        print(f"❌ Error during upload: {str(e)}")

if __name__ == "__main__":
    upload_from_json()
