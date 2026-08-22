import urllib.request
import json
import uuid

# 1. Register
email = f"test_{uuid.uuid4().hex[:6]}@gmail.com"
data = json.dumps({"name": "Test User", "email": email, "password": "password"}).encode('utf-8')
req = urllib.request.Request("http://127.0.0.1:8000/api/auth/register/", data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print("Register:", res)
        token = res.get('session_token')
except Exception as e:
    print("Register failed:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
    token = None

# 2. Get Workspaces
if token:
    print("Token:", token)
    req = urllib.request.Request("http://127.0.0.1:8000/api/workspaces/", headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print("Workspaces:", res)
    except Exception as e:
        print("Workspaces failed:", getattr(e, 'code', e))
        if hasattr(e, 'read'):
            print(e.read().decode())
