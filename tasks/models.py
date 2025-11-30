from django.db import models
from django.db.models import JSONField

class Task(models.Model):
    """
    Simple Task model (optional). We process tasks from API payloads,
    but having this model allows persistence later.
    """
    external_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=300)
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.FloatField(default=1.0)
    importance = models.IntegerField(default=5)  # expected 1..10
    dependencies = JSONField(default=list, blank=True)  # list of external_ids
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.external_id} - {self.title}"
