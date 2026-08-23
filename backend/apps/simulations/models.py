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
    # Phase 3: Track which member's unavailability triggered this scenario (for stale-state validation)
    unavailable_member = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='triggered_simulations'
    )
    original_assignee = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='original_assignment_simulations'
    )
    duration_hours = models.IntegerField(null=True, blank=True)
