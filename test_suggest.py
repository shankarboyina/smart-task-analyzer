import json, requests
data = json.load(open("sample_tasks.json"))
r = requests.post("http://127.0.0.1:8000/api/tasks/suggest/", json=data)
print(r.status_code)
print(r.json())
