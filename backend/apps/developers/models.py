from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message}"

class DeveloperProfile(models.Model):
    CONNECTION_STATUS = (
        ('NOT_CONNECTED', 'Not Connected'),
        ('CONNECTED', 'Connected'),
        ('DISCONNECTED', 'Disconnected'),
        ('ERROR', 'Error'),
    )
    
    SYNC_STATUS = (
        ('NOT_SYNCED', 'Not Synced'),
        ('PENDING', 'Pending'),
        ('SYNCING', 'Syncing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='developer_profile')
    github_username = models.CharField(max_length=255, blank=True, null=True)
    github_user_id = models.CharField(max_length=255, blank=True, null=True)
    github_connection_status = models.CharField(max_length=50, choices=CONNECTION_STATUS, default='NOT_CONNECTED')
    github_connected_at = models.DateTimeField(null=True, blank=True)
    
    last_sync_at = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(max_length=50, choices=SYNC_STATUS, default='NOT_SYNCED')
    sync_error = models.TextField(blank=True, null=True)
    
    # Structure conceptually:
    # {
    #   "projects": [], "technologies": [], "repositories": [], "modules": [],
    #   "architecture_areas": [], "dependencies": [], "similar_task_count": 0, "previous_ownership": []
    # }
    historical_context = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Profile for {self.user.username}"


class EngineeringEvidence(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='engineering_evidence')
    source = models.CharField(max_length=50, default='GITHUB') # e.g. GITHUB, HISTORICAL_PROFILE
    
    repository_count = models.IntegerField(default=0)
    repositories = models.JSONField(default=dict, blank=True)
    technology_evidence = models.JSONField(default=dict, blank=True)
    module_evidence = models.JSONField(default=dict, blank=True)
    architecture_evidence = models.JSONField(default=dict, blank=True)
    dependency_evidence = models.JSONField(default=dict, blank=True)
    similar_work_evidence = models.JSONField(default=dict, blank=True)
    contribution_summary = models.JSONField(default=dict, blank=True)
    ownership_evidence = models.JSONField(default=dict, blank=True)
    
    evidence_metadata = models.JSONField(default=dict, blank=True)
    
    last_analyzed_at = models.DateTimeField(auto_now=True)
    schema_version = models.CharField(max_length=50, default='v1')

    class Meta:
        indexes = [
            models.Index(fields=['user', 'source']),
        ]

    def __str__(self):
        return f"Evidence ({self.source}) for {self.user.username}"
