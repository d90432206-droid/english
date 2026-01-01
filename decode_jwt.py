import json
import base64

jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZicGRqbnJlbGpoZmdtZGZsZmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjY1OTUsImV4cCI6MjA4MDM0MjU5NX0.Ocy7vUZ3tURpPC2t7PQ4062r_zxtVSNehiYN2nT6blQ"

# Decode payload
try:
    header, payload, signature = jwt_token.split('.')
    # Add padding if needed
    payload += '=' * (-len(payload) % 4)
    decoded = base64.urlsafe_b64decode(payload)
    data = json.loads(decoded)
    print("Decoded JWT Data:")
    print(json.dumps(data, indent=2))
    
    project_ref = data.get('ref')
    if project_ref:
        print(f"\nDerived Supabase URL: https://{project_ref}.supabase.co")
    else:
        print("\nCould not find 'ref' in JWT.")
        
except Exception as e:
    print(f"Error decoding JWT: {e}")
