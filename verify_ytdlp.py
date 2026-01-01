import yt_dlp
import json
import sys

video_id = "OvFfYRorOqM"
url = f"https://www.youtube.com/watch?v={video_id}"

print(f"Testing yt-dlp for {url}")

ydl_opts = {
    'skip_download': True,
    'writesubtitles': True,
    'writeautomaticsub': True,
    'subtitleslangs': ['en'],
    'quiet': True,
}

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        # Check subtitles
        subs = info.get('subtitles')
        auto_subs = info.get('automatic_captions')
        
        print("\nManual Subtitles:")
        print(json.dumps(list(subs.keys()) if subs else [], indent=2))
        
        print("\nAutomatic Captions:")
        print(json.dumps(list(auto_subs.keys()) if auto_subs else [], indent=2))
        
        # Try to get the content?
        # yt-dlp doesn't return the subtitle text in extract_info, it downloads it file.
        # But we can check if it exists.
        
        if (subs and 'en' in subs) or (auto_subs and 'en' in auto_subs):
            print("\nSUCCESS: Found English subtitles/captions.")
        else:
            print("\nFAILURE: No English subtitles found.")
            
except Exception as e:
    print(f"ERROR: {e}")
