# smart-task-analyzer
Smart Task Analyzer using Django

# Smart Task Analyzer

A mini web application that evaluates and prioritizes tasks using a custom, explainable scoring algorithm.  
The goal is to help users decide **what to work on first** based on urgency, importance, effort, and dependencies.

This project includes:
- Django backend (REST-style API)
- Static frontend (HTML, CSS, JavaScript)
- Custom scoring engine with explainable outputs
- Add/Edit/Remove task interface with animations
- Unit tests for scoring logic

---

# 1. Setup Instructions

## Requirements
- Python 3.8+
- Django 4.0+
- SQLite (default with Django)
- Any modern browser for the frontend

## Installation


git clone [https://github.com/shankar_boyina/samrt-task-analyzer.git
cd smart-task-analyzer
](https://github.com/shankarboyina/smart-task-analyzer.git)
## Create and activate a virtual environment:
python -m venv venv
venv\Scripts\activate
## Install dependencies:
pip install -r requirements.txt
## Apply migrations:
python manage.py migrate
## Run backend:
python manage.py runserver
## Serve the frontend:
cd frontend
python -m http.server 5500
## Open the UI:
http://127.0.0.1:5500/
## The frontend communicates with the backend at:
http://127.0.0.1:8000/api/tasks/analyze/
http://127.0.0.1:8000/api/tasks/suggest/

# 2. Algorithm Explanation
The Smart Task Analyzer uses a weighted scoring system designed to mimic how humans naturally prioritize work. Each task receives a score between 0 and 1, built from four key components: urgency, importance, effort, and dependencies. The scoring engine also supports multiple strategies such as smart, fastest_wins, deadline_driven, and high_impact.

Urgency

Urgency is derived from the number of days until the due date.

Past-due tasks receive the highest urgency boost.

Tasks due today get a strong urgency signal.

Tasks due far in the future gradually decay toward zero urgency.

Tasks without a due date are treated as low urgency by default.

Urgency uses a logistic-style decay to keep scores smooth and intuitive.

Importance

Importance is user-provided on a 1–10 scale, then normalized to 0–1.
If importance is missing or invalid, it defaults to 5 (mid).
Importance carries more weight in high-impact strategy modes where value delivered matters more than deadlines.

Effort

Effort represents estimated hours. Smaller effort means a higher contribution to the score in fastest_wins mode.
Effort contribution is inverted — tasks that are quick to finish are rewarded; heavy tasks get proportionally lower effort scores.

Dependencies

Dependencies influence prioritization by identifying blockers:

If a task is blocking several others, it receives a positive bonus.

If a task depends on many others, it may receive a small penalty.

Cycles in dependencies are detected and returned in the API result for debugging.

## Final Scoring
score = w1*urgency + w2*importance + w3*effort + w4*dependency


Weights depend on the chosen strategy:

smart: balanced weighting

fastest_wins: high-effort penalty

deadline_driven: urgency dominates

high_impact: importance dominates

The backend returns:

final score

component contributions

a natural-language explanation

This ensures full transparency behind prioritization decisions.

# 3. Design Decisions
Backend-first approach: Clear, testable, stateless API for scoring.

Explainability: Every ranking includes a textual explanation so a reviewer can understand why a task ranked where it did.

Frontend kept simple: Vanilla JS + lightweight UI → no build steps, easy for evaluators to run.

Algorithm-centered: Focused on clean scoring math, handling edge cases, and explaining decisions.

Time-efficiency: Avoided unnecessary frameworks to meet the 24-hour time constraint.

# 4. Time Breakdown

### 4. Time Breakdown

| Task                                 | Time Spent     |
|--------------------------------------|----------------|
| Backend setup (Django project + API) | 1 hour         |
| Scoring engine design + testing      | 2.5 hours      |
| Frontend creation + styling          | 2 hours        |
| Task builder UI (Add/Edit/Remove)    | 1.5 hours      |
| Debugging, testing, fixes            | 1 hour         |
| README + GitHub cleanup              | 30 minutes     |
| Total                                | ~8.5 hours     |


# 5. Bonus Challenges Attempted
Dynamic scoring strategies

Explainable scoring breakdown

Animated UI with color-coded cards

Task editing, bulk paste, live preview list

Cycle detection in task dependencies

Top 3 suggestion endpoint

Not attempted yet: persistent DB storage, authentication, drag-and-drop UI

# 6. Future Improvements
Add full CRUD DB persistence for tasks

Add user accounts, saved profiles, and cloud sync

Improve scoring via ML-based ranking

Add analytics dashboard (charts, burndown, time estimation accuracy)

Move frontend into Django templates for cleaner deployment

Add CSV/PDF export of prioritized tasks

Implement drag-and-drop Kanban view

# 7. Tests
python manage.py test
