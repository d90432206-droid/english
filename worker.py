import time
import traceback
import json
import sys
from datetime import datetime, timedelta
from study_ai import fetch_transcript_final, analyze_with_ai, rotate_key, supabase

# Maximum time to run (e.g., 50 minutes to fit in an hourly cron)
MAX_RUNTIME_SECONDS = 50 * 60 
START_TIME = datetime.now()

def is_time_up():
    elapsed = (datetime.now() - START_TIME).total_seconds()
    return elapsed > MAX_RUNTIME_SECONDS

def process_queue(continuous=True):
    print(f"🚀 Video Processing Worker Started... Mode: {'Continuous' if continuous else 'Batch (One-off)'}")
    print(f"⏱️ Runtime Limit: {MAX_RUNTIME_SECONDS/60:.1f} minutes")
    
    attempted_ids = set() # Prevent infinite loop on same video in one run
    
    while True:
        # Check if we should exit due to time limit
        if not continuous and is_time_up():
            print(f"⏰ [Timeout] Reached {MAX_RUNTIME_SECONDS/60:.1f} minutes limit. Exiting gracefully.")
            break

        try:
            # 1. Fetch one pending task
            query = supabase.table('en_videos') \
                .select('*') \
                .eq('status', 'pending')
            
            # If we already tried some in this run and they failed, skip them
            if attempted_ids:
                # PostgREST doesn't have a clean 'NOT IN', but we can filter or just pick one
                # and skip if it's in attempted_ids.
                pass

            response = query.limit(1).execute()
                
            tasks = response.data
            
            if not tasks:
                if not continuous:
                    print("✅ [Batch Mode] Queue is empty. Exiting.")
                    break
                time.sleep(10) # No tasks, wait longer in continuous mode
                continue
                
            task = tasks[0]
            video_id = task.get('video_id')
            
            if not video_id:
                print("⚠️ Found task with missing video_id. Skipping.")
                continue

            if video_id in attempted_ids:
                print(f"⚠️ Video {video_id} already attempted and failed in this run. Skipping to avoid loop.")
                # We need to manually change its status to 'error' or something if it's still pending
                # but if we are here, it means the previous attempt failed to update status.
                # Let's try to fetch another one by using a longer tail or just breaking
                print("   (Queue might be stuck on this item. Suggest manual intervention.)")
                time.sleep(5)
                # To actually skip it in the query, we'd need better filtering. 
                # For now, let's just abort this run to avoid 6h hang.
                break

            attempted_ids.add(video_id)
            url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Processing Task: {video_id}")
            
            # 2. Mark as processing and try to fetch Title immediately
            title = None
            try:
                import yt_dlp
                # Add a socket timeout for yt-dlp
                ydl_opts = {
                    'quiet': True, 
                    'no_warnings': True,
                    'socket_timeout': 30, # 30 seconds timeout
                    'nocheckcertificate': True
                }
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    title = info.get('title')
            except Exception as e_yt:
                print(f"   ℹ️ yt-dlp metadata skip: {e_yt}")

            update_data = {'status': 'processing'}
            if title: update_data['title'] = title
            
            try:
                supabase.table('en_videos') \
                    .update(update_data) \
                    .eq('video_id', video_id) \
                    .execute()
            except Exception as update_err:
                print(f"   ⚠️ Could not update initial metadata: {update_err}")
                # Fallback: at least try to update status only
                supabase.table('en_videos') \
                    .update({'status': 'processing'}) \
                    .eq('video_id', video_id) \
                    .execute()
                
            # 3. Fetch Transcript
            try:
                transcript = fetch_transcript_final(video_id)
            except Exception as e_cc:
                if "429" in str(e_cc):
                    print("   🛑 YouTube IP 遭封鎖 (429)，暫停 60 秒...")
                    time.sleep(60)
                raise e_cc
            
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
                    if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                        print(f"   [{'429' if '429' in err_str else '503'}] Temporary error, rotating Key and retrying...")
                        rotate_key()
                        time.sleep(5 if "503" in err_str or "UNAVAILABLE" in err_str else 2)
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
                supabase.table('en_videos') \
                    .update(update_payload) \
                    .eq('video_id', video_id) \
                    .execute()
            except Exception as final_err:
                print(f"   ⚠️ Final update failed (possibly missing columns): {final_err}")
                # Fallback: update status and analysis data even if title/thumbnail fail
                # Assuming category/vocabulary/sentence_patterns ALWAYS exist
                supabase.table('en_videos') \
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
                    supabase.table('en_videos') \
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
