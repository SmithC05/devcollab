import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.projects.models import Workspace, Project
from apps.tasks.models import Task
from apps.developers.models import Notification

User = get_user_model()

def seed_data():
    # Clear existing
    Workspace.objects.all().delete()
    User.objects.filter(username="testuser").delete()

    # Create User
    user = User.objects.create_user(username="testuser", email="test@example.com", password="password123")
    user.first_name = "Authenticated"
    user.last_name = "User"
    user.save()

    # Create Workspace
    workspace = Workspace.objects.create(name="DevCollab Startup")
    workspace.members.add(user)
    
    # Also create for apps.workspaces
    from apps.workspaces.models import Workspace as NewWorkspace, WorkspaceMembership
    new_workspace = NewWorkspace.objects.create(name="DevCollab Startup")
    WorkspaceMembership.objects.create(workspace=new_workspace, user=user, role='OWNER')

    # Create Projects
    p1 = Project.objects.create(name="Frontend App", workspace=workspace)
    p2 = Project.objects.create(name="Backend API", workspace=workspace)
    p3 = Project.objects.create(name="Marketing Site", workspace=workspace)

    # Create Tasks
    now = timezone.now()
    
    # Task distributions
    tasks_data = [
        (p1, "Setup React", Task.StatusChoices.DONE, now - timedelta(days=1)),
        (p1, "Create layout", Task.StatusChoices.DONE, now - timedelta(days=2)),
        (p1, "Integrate charts", Task.StatusChoices.IN_PROGRESS, None),
        (p1, "Add dark mode", Task.StatusChoices.IN_REVIEW, None),
        (p1, "Fix tests", Task.StatusChoices.TODO, None),
        
        (p2, "Setup Django", Task.StatusChoices.DONE, now - timedelta(days=3)),
        (p2, "Create models", Task.StatusChoices.DONE, now - timedelta(days=1)),
        (p2, "Write API views", Task.StatusChoices.IN_PROGRESS, None),
        (p2, "Setup PostgreSQL", Task.StatusChoices.TODO, None),
        
        (p3, "Design mockup", Task.StatusChoices.DONE, now - timedelta(days=5)),
        (p3, "Write copy", Task.StatusChoices.DONE, now - timedelta(days=6)),
        (p3, "Publish", Task.StatusChoices.TODO, None),
    ]

    for proj, title, status, completed_at in tasks_data:
        Task.objects.create(
            project=proj,
            title=title,
            status=status,
            completed_at=completed_at,
            assignee=user
        )

    # Create Notifications
    Notification.objects.create(user=user, message="You were assigned to 'Integrate charts'")
    Notification.objects.create(user=user, message="Project 'Frontend App' was created")

    print("Seed data created successfully.")

if __name__ == "__main__":
    seed_data()
