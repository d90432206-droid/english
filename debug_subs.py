import youtube_transcript_api as yta
import sys
import traceback

video_id = sys.argv[1] if len(sys.argv) > 1 else "OvFfYRorOqM"
print(f"Checking subtitles for video: {video_id}")

try:
    transcript_list = yta.YouTubeTranscriptApi.list_transcripts(video_id)
    t = list(transcript_list)[0] 
    print(f"Attempting to fetch: {t}")
    data = t.fetch()
    print(f"Successfully fetched {len(data)} items.")
except Exception:
    traceback.print_exc()
