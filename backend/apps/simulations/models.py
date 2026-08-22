from django.db import models
from apps.tasks.models import Task
from django.contrib.auth import get_user_model

User = get_user_model()

class SimulationScenario(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    trigger = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    results = models.JSONField(default=dict)
    status = models.CharField(max_length=50, default="EVALUATED")  # EVALUATED, APPROVED, REJECTED
