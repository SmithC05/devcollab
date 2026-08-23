from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

from apps.workspaces.models import Workspace

class Project(models.Model):
    name = models.CharField(max_length=255)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='projects')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.workspace.name})"

class ProjectRepositoryMapping(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='repository_mapping')
    github_repository_id = models.CharField(max_length=255)
    github_repository_full_name = models.CharField(max_length=255) # e.g. owner/repo
    connected_at = models.DateTimeField(auto_now_add=True)
    connected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_repo_mappings')
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.project.name} <-> {self.github_repository_full_name}"
