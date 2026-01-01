from youtube_transcript_api import YouTubeTranscriptApi

video_id = "OvFfYRorOqM"
print(f"Testing transcript fetch for: {video_id}")

try:
    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    print("Transcript list fetched.")
    for transcript in transcript_list:
        print(f"Found: {transcript.language_code} ({transcript.language}) - Generated: {transcript.is_generated}")
    
    transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
    print(f"Selected transcript: {transcript.language_code}")
    
    data = transcript.fetch()
    print(f"Fetched {len(data)} items.")
    print("First item:", data[0])
    
except Exception as e:
    print("Error:", e)
