from django.db import models
from django.contrib.auth import get_user_model
from apps.projects.models import Project

User = get_user_model()

class Task(models.Model):
    class StatusChoices(models.TextChoices):
        TODO = 'To Do', 'To Do'
        IN_PROGRESS = 'In Progress', 'In Progress'
        IN_REVIEW = 'In Review', 'In Review'
        DONE = 'Done', 'Done'

    class PriorityChoices(models.TextChoices):
        P0 = 'P0', 'P0'
        P1 = 'P1', 'P1'
        P2 = 'P2', 'P2'
        P3 = 'P3', 'P3'

    title = models.CharField(max_length=255)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    status = models.CharField(max_length=50, choices=StatusChoices.choices, default=StatusChoices.TODO)
    priority = models.CharField(max_length=2, choices=PriorityChoices.choices, default=PriorityChoices.P2)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.status}"
