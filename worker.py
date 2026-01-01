import time
import traceback
import json
import sys
from study_ai import fetch_transcript_final, analyze_with_ai, rotate_key, supabase

def process_queue(continuous=True):
    print(f"🚀 Video Processing Worker Started... Mode: {'Continuous' if continuous else 'Batch (One-off)'}")
    
    while True:
        try:
            # 1. Fetch one pending task
            response = supabase.table('english_videos') \
                .select('*') \
                .eq('status', 'pending') \
                .limit(1) \
                .execute()
                
            tasks = response.data
            
            if not tasks:
                if not continuous:
                    print("✅ [Batch Mode] Queue is empty. Exiting.")
                    break
                time.sleep(2) # No tasks, wait less
                continue
                
            task = tasks[0]
            video_id = task['video_id']
            url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"\nProcessing Task: {video_id}")
            
            # 2. Mark as processing and try to fetch Title immediately for better UX
            title = None
            try:
                import yt_dlp
                with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True}) as ydl:
                    info = ydl.extract_info(url, download=False)
                    title = info.get('title')
            except: pass

            update_data = {'status': 'processing'}
            if title: update_data['title'] = title
            
            try:
                supabase.table('english_videos') \
                    .update(update_data) \
                    .eq('video_id', video_id) \
                    .execute()
            except Exception as update_err:
                print(f"   ⚠️ Could not update initial metadata: {update_err}")
                # Fallback: at least try to update status only
                supabase.table('english_videos') \
                    .update({'status': 'processing'}) \
                    .eq('video_id', video_id) \
                    .execute()
                
            # 3. Fetch Transcript
            transcript = fetch_transcript_final(video_id)
            
            if not transcript:
                raise Exception("Failed to fetch transcript (No CC found)")
                
            # 4. AI Analysis
            # Retry logic for AI (simplified from study_ai.py)
            analysis = None
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    analysis = analyze_with_ai(transcript)
                    break
                except Exception as ai_err:
                    err_str = str(ai_err)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        print("   [429] Rotating Key...")
                        rotate_key()
                        time.sleep(2)
                    else:
                        raise ai_err # Re-raise other errors
            
            if not analysis:
                raise Exception("AI Analysis Failed after retries")

            # 5. Update Database with Results
            # Merge existing fields (like thumbnail) with new analysis
            update_payload = {
                'status': 'completed',
                'category': analysis.get('category', []),
                'vocabulary': analysis.get('vocabulary', []),
                'sentence_patterns': analysis.get('sentence_patterns', []),
                'processing_error': None
            }
            
            try:
                supabase.table('english_videos') \
                    .update(update_payload) \
                    .eq('video_id', video_id) \
                    .execute()
            except Exception as final_err:
                print(f"   ⚠️ Final update failed (possibly missing columns): {final_err}")
                # Fallback: update status and analysis data even if title/thumbnail fail
                # Assuming category/vocabulary/sentence_patterns ALWAYS exist
                supabase.table('english_videos') \
                    .update({
                        'status': 'completed',
                        'category': update_payload['category'],
                        'vocabulary': update_payload['vocabulary'],
                        'sentence_patterns': update_payload['sentence_patterns']
                    }) \
                    .eq('video_id', video_id) \
                    .execute()
                
            print(f"✅ Task Completed: {video_id}")
            
        except Exception as e:
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Task Failed: {error_msg}")
            
            # Update DB with error
            try:
                if 'video_id' in locals():
                    supabase.table('english_videos') \
                        .update({
                            'status': 'error', 
                            'processing_error': str(e)
                        }) \
                        .eq('video_id', video_id) \
                        .execute()
            except:
                pass
                
        time.sleep(2) # Small buffer between tasks

if __name__ == "__main__":
    # Check for batch mode flag
    is_batch = "--batch" in sys.argv
    process_queue(continuous=not is_batch)
