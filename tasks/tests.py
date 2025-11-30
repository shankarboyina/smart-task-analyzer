from django.test import TestCase
from .scoring import analyze_tasks, detect_cycles

class ScoringTests(TestCase):
    def test_urgency_and_importance_affect_score(self):
        tasks = [
            {"id":"a", "title":"A", "due_date":"2025-12-01", "estimated_hours":1, "importance":10, "dependencies":[]},
            {"id":"b", "title":"B", "due_date":"2030-01-01", "estimated_hours":1, "importance":10, "dependencies":[]},
        ]
        res = analyze_tasks(tasks, strategy="smart")
        ids = [t['id'] for t in res['tasks']]
        self.assertEqual(ids[0], "a")

    def test_missing_fields_do_not_crash(self):
        tasks = [{"id":"x", "title":"X"}]
        res = analyze_tasks(tasks)
        self.assertIn('tasks', res)
        self.assertEqual(len(res['tasks']), 1)
        t = res['tasks'][0]
        self.assertIn('score', t)

    def test_cycle_detection_detects_cycle(self):
        tasks = [
            {"id":"1", "dependencies":["2"]},
            {"id":"2", "dependencies":["3"]},
            {"id":"3", "dependencies":["1"]},
        ]
        cycles = detect_cycles(tasks)
        self.assertGreater(len(cycles), 0)
