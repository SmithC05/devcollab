from django.db import models
from django.contrib.auth.models import User
from apps.projects.models import Project

class Task(models.Model):
    STATUS_CHOICES = (
        ('TODO', 'Todo'),
        ('IN_PROGRESS', 'In Progress'),
        ('IN_REVIEW', 'In Review'),
        ('DONE', 'Done'),
    )
    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    position = models.FloatField(default=0.0) # for kanban ordering
    due_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class TaskDependency(models.Model):
    from_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='outgoing_dependencies')
    to_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='incoming_dependencies')
    dependency_type = models.CharField(max_length=50, default='BLOCKS')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_task', 'to_task')

    def __str__(self):
        return f"{self.from_task.title} -> {self.to_task.title}"

class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.author} on {self.task}"
