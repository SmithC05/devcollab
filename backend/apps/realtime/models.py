from django.db import models
from django.contrib.auth.models import User
import uuid

class PresenceSession(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('IDLE', 'Idle'),
        ('OFFLINE', 'Offline'),
        ('UNAVAILABLE', 'Unavailable'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='presence_sessions')
    session_token = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OFFLINE')
    connected_at = models.DateTimeField(null=True, blank=True)
    last_seen = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now_add=True)
    current_project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)
    current_task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"

class EngineEvent(models.Model):
    event_type = models.CharField(max_length=100)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    workspace = models.ForeignKey('workspaces.Workspace', on_delete=models.SET_NULL, null=True, blank=True)
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)
    task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True)
    payload = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} at {self.timestamp}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='realtime_notifications')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    event_type = models.CharField(max_length=100)
    link = models.CharField(max_length=255, blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
