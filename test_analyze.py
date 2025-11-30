# test_analyze.py — diagnostic test client
import json
import requests
import sys
from pathlib import Path

p = Path("sample_tasks.json")
if not p.exists():
    print("ERROR: sample_tasks.json not found in project root.")
    sys.exit(1)

data = json.load(open(p, "r"))
url = "http://127.0.0.1:8000/api/tasks/analyze/"

try:
    r = requests.post(url, json=data, timeout=10)
except Exception as e:
    print("REQUEST ERROR:", repr(e))
    print("Make sure the Django server is running with: python manage.py runserver")
    sys.exit(1)

print("HTTP status:", r.status_code)
print("Response headers:", r.headers.get("content-type"))
# Try to print pretty JSON if possible, otherwise raw text
try:
    print("JSON response:")
    print(json.dumps(r.json(), indent=2))
except Exception:
    print("Raw response text:")
    print(r.text[:2000])
