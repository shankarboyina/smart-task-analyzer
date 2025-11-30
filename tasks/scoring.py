from datetime import datetime, date
from typing import Dict, List, Any

# Configurable weights (strategies override these)
DEFAULT_WEIGHTS = {
    "urgency": 0.4,
    "importance": 0.3,
    "effort": 0.2,
    "dependency": 0.1,
}

STRATEGIES = {
    "fastest_wins": {"urgency": 0.25, "importance": 0.2, "effort": 0.45, "dependency": 0.1},
    "high_impact": {"urgency": 0.2, "importance": 0.55, "effort": 0.15, "dependency": 0.1},
    "deadline_driven": {"urgency": 0.6, "importance": 0.2, "effort": 0.1, "dependency": 0.1},
    "smart_balance": DEFAULT_WEIGHTS,
    "smart": DEFAULT_WEIGHTS,
}

def parse_date_safe(datestr: str):
    try:
        return datetime.strptime(datestr, "%Y-%m-%d").date()
    except Exception:
        return None

def detect_cycles(tasks: List[Dict[str, Any]]) -> List[List[str]]:
    """
    Detect cycles in dependency graph. Returns list of cycles (each is a list of ids).
    """
    adj = {}
    ids = set()
    for t in tasks:
        tid = t.get("id") or t.get("external_id")
        if not tid:
            continue
        ids.add(tid)
        deps = t.get("dependencies") or []
        adj[tid] = deps

    visited = set()
    stack = set()
    cycles = []

    def dfs(node, path):
        if node in stack:
            idx = path.index(node)
            cycles.append(path[idx:])
            return
        if node in visited:
            return
        visited.add(node)
        stack.add(node)
        for neigh in adj.get(node, []):
            if neigh in adj:
                dfs(neigh, path + [neigh])
        stack.remove(node)

    for n in list(ids):
        if n not in visited:
            dfs(n, [n])
    return cycles

def compute_dependency_bonus(task_id: str, all_tasks: List[Dict[str, Any]]) -> float:
    """
    Small saturating boost if other tasks depend on this task.
    Returns value ~0..0.2
    """
    count = 0
    for t in all_tasks:
        deps = t.get("dependencies") or []
        if task_id in deps:
            count += 1
    if count == 0:
        return 0.0
    return 0.2 * (1 - 1 / (1 + count))

def normalize_importance(importance: int) -> float:
    try:
        imp = int(importance)
    except Exception:
        imp = 5
    imp = max(1, min(10, imp))
    return (imp - 1) / 9.0  # maps 1..10 -> 0..1

def normalize_effort(estimated_hours: float) -> float:
    try:
        h = float(estimated_hours)
    except Exception:
        h = 1.0
    if h <= 0:
        h = 1.0
    # lower hours -> higher quick-win score
    return 1.0 / (1.0 + h)

def compute_urgency(due_date: str):
    """
    Return (urgency: 0..1, message)
    - None or invalid date -> urgency 0
    - past due -> urgency 1.0 with message
    - due today -> urgency 1.0
    - future -> 1/(1+days)
    """
    if not due_date:
        return 0.0, "no due date"
    d = parse_date_safe(due_date)
    if not d:
        return 0.0, "invalid due date"
    today = date.today()
    delta = (d - today).days
    if delta < 0:
        return 1.0, f"past due by {-delta} day(s)"
    if delta == 0:
        return 1.0, "due today"
    u = 1.0 / (1.0 + delta)
    return u, f"due in {delta} day(s)"

def score_task(task: Dict[str, Any], all_tasks: List[Dict[str, Any]], weights: Dict[str, float]) -> Dict[str, Any]:
    tid = task.get("id") or task.get("external_id") or "unknown"
    title = task.get("title") or ""
    due = task.get("due_date")
    imp = task.get("importance", 5)
    est = task.get("estimated_hours", 1)
    deps = task.get("dependencies") or []

    urgency, u_msg = compute_urgency(due)
    importance = normalize_importance(imp)
    effort = normalize_effort(est)
    dependency = compute_dependency_bonus(tid, all_tasks)

    s = (
        weights.get("urgency", 0.4) * urgency
        + weights.get("importance", 0.3) * importance
        + weights.get("effort", 0.2) * effort
        + weights.get("dependency", 0.1) * dependency
    )

    score = max(0.0, min(1.0, float(s)))

    components = {
        "urgency": round(float(urgency), 4),
        "importance": round(float(importance), 4),
        "effort": round(float(effort), 4),
        "dependency": round(float(dependency), 4),
    }

    explanation = f"{u_msg}; importance normalized {components['importance']}; effort contribution {components['effort']}"
    if dependency > 0:
        explanation += f"; blocker for other tasks (+{components['dependency']})"
    if "importance" not in task:
        explanation += "; importance defaulted to 5"
    if "estimated_hours" not in task:
        explanation += "; estimated_hours defaulted to 1"

    return {
        "id": tid,
        "title": title,
        "score": round(score, 4),
        "components": components,
        "explanation": explanation,
        "raw": {
            "due_date": due,
            "importance": imp,
            "estimated_hours": est,
            "dependencies": deps,
        }
    }

def analyze_tasks(tasks: List[Dict[str, Any]], strategy: str = "smart") -> Dict[str, Any]:
    strat = STRATEGIES.get(strategy, STRATEGIES["smart"])
    cycles = detect_cycles(tasks)

    results = []
    for t in tasks:
        out = score_task(t, tasks, strat)
        results.append(out)

    results_sorted = sorted(results, key=lambda x: x["score"], reverse=True)

    return {
        "tasks": results_sorted,
        "cycles": cycles,
        "strategy": strategy
    }

def suggest_top(tasks: List[Dict[str, Any]], top_n: int = 3, strategy: str = "smart") -> Dict[str, Any]:
    analysis = analyze_tasks(tasks, strategy)
    top = analysis["tasks"][:top_n]
    suggestions = []
    for t in top:
        comp = t["components"]
        reason_parts = []
        if comp["urgency"] >= 0.8:
            reason_parts.append("urgent")
        if comp["importance"] >= 0.6:
            reason_parts.append("important")
        if comp["effort"] >= 0.5:
            reason_parts.append("quick win")
        if comp["dependency"] > 0:
            reason_parts.append("unblocks others")
        if not reason_parts:
            reason_parts.append("balanced priority")
        suggestions.append({
            "id": t["id"],
            "title": t["title"],
            "score": t["score"],
            "reason": ", ".join(reason_parts),
            "explanation": t["explanation"]
        })
    return {
        "suggestions": suggestions,
        "strategy": strategy,
        "cycles": analysis["cycles"]
    }
