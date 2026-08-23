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


class ProjectMembership(models.Model):
    """Links a workspace member to a specific project."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_memberships')
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='added_project_members')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.project.name}"



class WikiPage(models.Model):
    """Per-project wiki pages — content is HTML from Tiptap editor."""
    project    = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='wiki_pages')
    title      = models.CharField(max_length=300, default='Untitled Page')
    content    = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='wiki_pages_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='wiki_pages_updated')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.title} ({self.project.name})"


class Snippet(models.Model):
    """Per-project code snippets with syntax highlighting metadata."""
    LANGUAGE_CHOICES = [
        ('javascript', 'JavaScript'), ('typescript', 'TypeScript'),
        ('python', 'Python'), ('bash', 'Bash'), ('sql', 'SQL'),
        ('html', 'HTML'), ('css', 'CSS'), ('json', 'JSON'),
        ('yaml', 'YAML'), ('go', 'Go'), ('rust', 'Rust'),
        ('java', 'Java'), ('csharp', 'C#'), ('cpp', 'C++'),
        ('php', 'PHP'), ('ruby', 'Ruby'), ('swift', 'Swift'),
        ('kotlin', 'Kotlin'), ('markdown', 'Markdown'), ('text', 'Plain Text'),
    ]

    project     = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='snippets')
    title       = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    language    = models.CharField(max_length=50, choices=LANGUAGE_CHOICES, default='javascript')
    code        = models.TextField()
    tags        = models.JSONField(default=list, blank=True)
    created_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='snippets_created')
    updated_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='snippets_updated')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} [{self.language}] ({self.project.name})"

class ProjectRepositoryMapping(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='repository_mapping')
    github_repository_id = models.CharField(max_length=255)
    github_repository_full_name = models.CharField(max_length=255) # e.g. owner/repo
    connected_at = models.DateTimeField(auto_now_add=True)
    connected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_repo_mappings')
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.project.name} <-> {self.github_repository_full_name}"
