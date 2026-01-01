from google import genai
import os

# Using the placeholder string to see if it triggers the ascii error
INVALID_KEY = "您的_API_KEY"

print(f"Testing with API Key: {INVALID_KEY}")
try:
    client = genai.Client(api_key=INVALID_KEY)
    # Just a simple generation attempt
    client.models.generate_content(model="gemini-2.0-flash", contents="Hello")
except Exception as e:
    print(f"Caught expected error: {e}")
