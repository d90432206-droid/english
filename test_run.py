from study_ai import fetch_transcript_final

video_id = "OvFfYRorOqM"
print(f"Testing extraction for {video_id}...")
text = fetch_transcript_final(video_id)

if text:
    print(f"SUCCESS! Extracted {len(text)} characters.")
    print(f"Sample: {text[:100]}...")
else:
    print("FAILURE: returned None")
