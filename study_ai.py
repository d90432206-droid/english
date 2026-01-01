import pandas as pd
import yt_dlp
import re
import glob
from google import genai
import json
import time
import os
import html
import youtube_transcript_api as yta
from upload_supabase import URL, KEY
from supabase import create_client

supabase = create_client(URL, KEY)

# 1. 配置
from dotenv import load_dotenv
load_dotenv()

# Read keys from env
env_keys = os.getenv("GOOGLE_API_KEYS", "")
API_KEYS = [k.strip() for k in env_keys.split(',') if k.strip()]
if not API_KEYS:
    # Fallback to empty list or handle error
    print("Warning: GOOGLE_API_KEYS not found in .env")

current_key_index = 0
client = None

def init_client():
    global client, current_key_index
    if not API_KEYS: return
    
    # Ensure index is valid
    current_key_index = current_key_index % len(API_KEYS)
    key = API_KEYS[current_key_index]
    
    client = genai.Client(api_key=key)
    print(f"🔑 [系統] 切換至第 {current_key_index + 1} 組 API Key")

def rotate_key():
    global current_key_index
    current_key_index += 1
    init_client()

# Initialize first key
init_client()
MODEL_NAME = "gemini-3-flash-preview"

def clean_vtt_text(vtt_content):
    """
    簡單清理 VTT 格式，只保留文字。
    移除 header, timestamp, tag 等。
    """
    lines = vtt_content.splitlines()
    text_lines = []
    # Regular expression for timestamp '00:00:00.000 --> 00:00:05.000'
    timestamp_pattern = re.compile(r'\d{2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{2}:\d{2}:\d{2}\.\d{3}')
    
    seen_lines = set() # Avoid immediate duplicates often found in VTT karaoke-style
    
    # 狀態: 讀取 header 中
    is_header = True

    for line in lines:
        line = line.strip()
        
        # Header filtering check for empty line
        if is_header and not line:
            is_header = False
            continue
            
        if not line: continue
        
        # Header filtering
        if is_header:
            if line == 'WEBVTT': continue
            if line.startswith('Kind:'): continue
            if line.startswith('Language:'): continue
            if line.startswith('Style:'): continue
            if line.startswith('::cue'): continue
            # If we see a timestamp, header is definitely over
            if timestamp_pattern.match(line) or '-->' in line:
                is_header = False
            # If we see normal text that is not a header key, maybe header is over?
            # Safest is to rely on timestamp or known keywords.
        
        if not line: continue
        if line.startswith('NOTE '): continue
        if timestamp_pattern.match(line): 
            is_header = False
            continue
        if '-->' in line: 
            is_header = False
            continue
        
        # Remove tags like <c.colorE6E6E6>...
        clean_line = re.sub(r'<[^>]+>', '', line)
        clean_line = html.unescape(clean_line)
        clean_line = clean_line.strip()
        
        if not clean_line: continue
        
        # Filter headers if they leaked (sometimes no timestamp before first cue if lazy?)
        if clean_line in ['WEBVTT', 'Kind: captions', 'Language: en']: continue
        
        # Simple dedup for adjacent lines
        if clean_line in seen_lines:
            pass
        else:
            text_lines.append(clean_line)
            seen_lines.add(clean_line)
            
    # Post-process to merge unique lines
    unique_lines = []
    last_line = ""
    for tl in text_lines:
        if tl != last_line:
            unique_lines.append(tl)
            last_line = tl
            
    return " ".join(unique_lines)

def parse_vtt_with_timestamps(vtt_content):
    """
    解析 VTT 內容，回傳 '秒數|文字' 格式。
    """
    lines = vtt_content.splitlines()
    output = []
    
    # Simple timestamp regex: 00:00:00.000
    timestamp_pattern = re.compile(r'(\d{2}):(\d{2}):(\d{2})\.(\d{3})')
    
    current_start = None
    
    for line in lines:
        line = line.strip()
        if not line: continue
        if line == 'WEBVTT': continue
        if '-->' in line:
            # Parse start time
            # 00:00:01.500 --> 00:00:03.000
            try:
                start_str = line.split('-->')[0].strip()
                match = timestamp_pattern.match(start_str)
                if match:
                    h, m, s, ms = map(int, match.groups())
                    current_start = h * 3600 + m * 60 + s
            except:
                pass
            continue
            
        # Skip tags/metadata
        if line.startswith('NOTE'): continue
        if line.startswith('Kind:'): continue
        if line.startswith('Language:'): continue
        
        # Text line
        if current_start is not None:
            # Remove HTML-like tags
            clean_text = re.sub(r'<[^>]+>', '', line)
            clean_text = html.unescape(clean_text).strip()
            if clean_text:
                output.append(f"{current_start}|{clean_text}")
                # Reset current_start so we don't repeat timestamp for multiple lines unless new timestamp appears? 
                # Actually VTT usually has timestamp then text. 
                # We keep current_start valid until next timestamp.
                
    return "\n".join(output)

def fetch_transcript_final(video_id):
    """
    嘗試獲取帶有時間戳記的字幕。
    優先使用 youtube_transcript_api (YTA)，失敗則退回 yt-dlp 下載 VTT 解析。
    """
    # 1. Try youtube_transcript_api
    try:
        print("   [嘗試] 使用 youtube_transcript_api...")
        # Fix: YTA usage
        from youtube_transcript_api import YouTubeTranscriptApi
        
        try:
            # Method A: list_transcripts (Newer API, supports auto-generated)
            try:
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                try:
                    transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
                except:
                    # If specific english not found, get generated or any
                    try:
                        transcript = transcript_list.find_generated_transcript(['en'])
                    except:
                        transcript = next(iter(transcript_list))
                
                raw_data = transcript.fetch()
                
            except AttributeError:
                # Method B: Old API fallback
                print("    -> 'list_transcripts' not found, using 'get_transcript'...")
                raw_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US'])

            full_text = ""
            for p in raw_data:
                start_time = int(p['start'])
                text = p['text'].replace('\n', ' ')
                full_text += f"{start_time}|{text}\n"
            
            print(f"   [成功] YTA 抓取完成 ({len(full_text)} chars)")
            return full_text
        except Exception as inner_e:
            print(f"    -> YTA inner error: {inner_e}")
            raise inner_e

    except Exception as e:
        print(f"   [失敗] YTA 失敗: {str(e)[:100]}... 改用 yt-dlp")
        
    # 2. Fallback to yt-dlp
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        temp_filename = f"temp_{video_id}"
        
        # Cleanup old files
        for f in glob.glob(f"{temp_filename}*"):
            try: os.remove(f)
            except: pass

        ydl_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en.*', 'en'], 
            'outtmpl': temp_filename,
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(url, download=True)
            
        possible_files = glob.glob(f"{temp_filename}*.vtt")
        if not possible_files:
            print("   [失敗] yt-dlp 也沒下載到字幕")
            return None
            
        target_file = possible_files[0]
        # Prefer non-auto if available? Just pick first for now.
        
        with open(target_file, 'r', encoding='utf-8') as f:
            vtt_content = f.read()
            
        # Cleanup
        for f in possible_files:
            try: os.remove(f)
            except: pass
            
        print("   [成功] yt-dlp 下載並讀取 VTT")
        return parse_vtt_with_timestamps(vtt_content)
        
    except Exception as e:
        print(f"   [失敗] yt-dlp 失敗: {str(e)}")
        return None

def analyze_with_ai(text_with_timestamps):
    # 1. 定義您的標準標籤庫 (Standard Tag Library)
    tags_list = ["社交 (Social)", "職場 (Work)", "旅遊 (Travel)", "生活 (Daily)", "文化 (Culture)", "學術 (Academic)"]

    prompt = f"""
    你是一個專業的英文老師。我會提供一段影片逐字稿，格式為「秒數|英文內容」。
    
    請分析並執行以下任務：
    1. 從這份標籤清單中 {tags_list}，挑選出 1~2 個最符合本影片的情境標籤。
    2. 整理出 8 個核心單字 (難度適中，實用為主)。
    3. 整理出 6 個常用句型，並找出該句型在影片中出現的**準確時間點 (timestamp)**。
    4. **所有解釋與例句必須包含繁體中文翻譯**。
    
    必須嚴格遵守以下 JSON 格式回傳 (欄位名稱請保持英文)：
    {{
      "category": ["標籤1", "標籤2"],
      "vocabulary": [
        {{
          "word": "英文單字",
          "phonetic": "KK音標",
          "definition": "英文解釋",
          "definition_zh": "繁體中文解釋",
          "example": "英文例句",
          "example_zh": "例句中文翻譯"
        }}
      ],
      "sentence_patterns": [
        {{
          "structure": "句型結構",
          "usage": "用法說明",
          "example": "例句",
          "timestamp": 120  /* (數字, 該句型在影片中出現的秒數) */
        }}
      ]
    }}
    
    逐字稿內容 (前 6000 字)：
    {text_with_timestamps[:6000]}
    """
    response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
    raw_text = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(raw_text)

def main():
    # 檢查 API KEY 是否已設定
    valid_keys = [k for k in API_KEYS if "YOUR_" not in k and "您的" not in k and len(k) > 10]
    if not valid_keys:
        print("❌ 錯誤: 請先在程式碼第 18 行填入至少一組有效的 Google API Key")
        return

    if not os.path.exists('links.csv'): return
    df = pd.read_csv('links.csv')
    urls = df.iloc[:, 0].tolist()
    if "http" in str(df.columns[0]): urls.insert(0, df.columns[0])

    results = []
    print(f"🚀 生產線啟動，預計處理 {len(urls)} 個連結...")

    for i, url in enumerate(urls):
        v_id = str(url).split('v=')[-1].split('&')[0] if 'v=' in str(url) else str(url).split('/')[-1]
        print(f"[{i+1}/{len(urls)}] 處理: {v_id}", end="")
        
        text = fetch_transcript_final(v_id)
        if text:
            # Retry loop for AI generation
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    # 傳送給 AI 分析
                    analysis = analyze_with_ai(text)
                    
                    analysis['video_id'] = v_id
                    analysis['url'] = url
                    results.append(analysis)
                    
                    # Upload to Supabase immediately
                    try:
                        print(f"   [上傳] 正在寫入資料庫...")
                        supabase.table('english_videos').upsert(analysis).execute()
                        print("   ✅ 資料庫更新成功！")
                    except Exception as db_err:
                        print(f"   ⚠️ 資料庫寫入失敗 (但已存入 JSON): {db_err}")

                    print(" ✅ AI分析成功")
                    break # Success, exit retry loop
                    
                except Exception as e:
                    error_str = str(e)
                    if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                        print(f" ⚠️ 額度用盡 (429)，自動切換下一組 API Key...")
                        rotate_key()
                        time.sleep(2) # Brief pause before retry with new key
                    else:
                        print(f" ❌ AI分析出錯: {e}")
                        break # Other errors, don't retry
        else:
            print(" 🚫 真的找不到任何CC字幕軌")
        
        time.sleep(10)

    with open('learning_data.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("\n✨ 任務完成！已產出精華筆記。")

if __name__ == "__main__":
    main()