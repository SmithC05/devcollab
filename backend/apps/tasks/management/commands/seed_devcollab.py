from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.projects.models import Project
from apps.tasks.models import Task
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with a realistic DevCollab demo workspace'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding devcollab database...')

        # Clear existing data
        Task.objects.all().delete()
        Project.objects.all().delete()
        WorkspaceMembership.objects.all().delete()
        Workspace.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()

        # Users
        users_data = [
            {'username': 'Smith', 'email': 'smith@devcollab.io'},
            {'username': 'Rahul', 'email': 'rahul@devcollab.io'},
            {'username': 'Ankush', 'email': 'ankush@devcollab.io'},
            {'username': 'Riya', 'email': 'riya@devcollab.io'},
            {'username': 'Karthik', 'email': 'karthik@devcollab.io'},
        ]
        
        users = {}
        for u in users_data:
            user = User.objects.create_user(username=u['username'], email=u['email'], password='DevCollab123')
            users[u['username']] = user
            self.stdout.write(f'Created user {u["username"]}')

        # Workspace
        workspace = Workspace.objects.create(name='DevCollab Engineering', owner=users['Smith'])
        for username, user in users.items():
            role = 'OWNER' if username == 'Smith' else 'ADMIN' if username == 'Rahul' else 'MEMBER'
            WorkspaceMembership.objects.create(workspace=workspace, user=user, role=role)
        self.stdout.write('Created workspace and memberships')

        # Project
        project = Project.objects.create(
            workspace=workspace,
            name='Payments',
            description='Core payments infrastructure and gateway integrations.'
        )
        self.stdout.write('Created Payments project')

        # Tasks
        tasks_data = [
            {'title': 'Payment API', 'assignee': 'Smith', 'status': 'In Progress'},
            {'title': 'Frontend Integration', 'assignee': 'Rahul', 'status': 'In Progress'},
            {'title': 'Gateway Tests', 'assignee': 'Ankush', 'status': 'To Do'},
            {'title': 'Security Review', 'assignee': 'Riya', 'status': 'To Do'},
            {'title': 'Deployment', 'assignee': 'Karthik', 'status': 'To Do'},
        ]

        tasks = {}
        for t in tasks_data:
            task = Task.objects.create(
                project=project,
                title=t['title'],
                assignee=users[t['assignee']],
                status=t['status']
            )
            tasks[t['title']] = task
            self.stdout.write(f'Created task {t["title"]}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded DevCollab database!'))
