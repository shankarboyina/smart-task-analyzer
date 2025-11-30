from django.shortcuts import render
import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt

from .scoring import analyze_tasks, suggest_top

@csrf_exempt
def analyze_view(request):
    """
    POST /api/tasks/analyze/
    Body: { "tasks": [...], "strategy": "smart" }
    """
    if request.method != "POST":
        return JsonResponse({"error": "only POST allowed"}, status=405)
    try:
        payload = json.loads(request.body.decode('utf-8') or "{}")
    except json.JSONDecodeError:
        return HttpResponseBadRequest("invalid json")

    tasks = payload.get("tasks")
    if tasks is None:
        return HttpResponseBadRequest("missing 'tasks' array in request body")

    strategy = payload.get("strategy", "smart")
    try:
        result = analyze_tasks(tasks, strategy)
    except Exception as e:
        return JsonResponse({"error": "analysis failed", "details": str(e)}, status=500)

    return JsonResponse(result, safe=False)


@csrf_exempt
def suggest_view(request):
    """
    POST /api/tasks/suggest/ with same body shape as analyze.
    """
    if request.method not in ("POST", "GET"):
        return JsonResponse({"error": "only POST or GET allowed"}, status=405)

    if request.method == "POST":
        try:
            payload = json.loads(request.body.decode('utf-8') or "{}")
        except json.JSONDecodeError:
            return HttpResponseBadRequest("invalid json")
        tasks = payload.get("tasks", [])
        strategy = payload.get("strategy", "smart")
    else:
        return HttpResponseBadRequest("GET not supported for suggest in this simple implementation. Use POST with tasks.")

    try:
        result = suggest_top(tasks, top_n=3, strategy=strategy)
    except Exception as e:
        return JsonResponse({"error": "suggest failed", "details": str(e)}, status=500)
    return JsonResponse(result, safe=False)

# Create your views here.
