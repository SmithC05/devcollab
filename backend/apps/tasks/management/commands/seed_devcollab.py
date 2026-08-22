from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.projects.models import Project, ProjectMembership
from apps.tasks.models import Task, TaskDependency
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds the database with a realistic DevCollab demo workspace'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding devcollab database...')

        # Clear existing data
        TaskDependency.objects.all().delete()
        Task.objects.all().delete()
        ProjectMembership.objects.all().delete()
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
            description='Core payments infrastructure and gateway integrations.',
            created_by=users['Smith']
        )
        for username, user in users.items():
            role = 'OWNER' if username == 'Smith' else 'ADMIN' if username == 'Rahul' else 'MEMBER'
            ProjectMembership.objects.create(project=project, user=user, role=role)
        self.stdout.write('Created Payments project and memberships')

        # Tasks
        tasks_data = [
            {'title': 'Payment API', 'assignee': 'Smith', 'status': 'IN_PROGRESS', 'priority': 'CRITICAL', 'pos': 1.0},
            {'title': 'Frontend Integration', 'assignee': 'Rahul', 'status': 'IN_PROGRESS', 'priority': 'HIGH', 'pos': 2.0},
            {'title': 'Gateway Tests', 'assignee': 'Ankush', 'status': 'TODO', 'priority': 'MEDIUM', 'pos': 1.0},
            {'title': 'Security Review', 'assignee': 'Riya', 'status': 'TODO', 'priority': 'HIGH', 'pos': 2.0},
            {'title': 'Deployment', 'assignee': 'Karthik', 'status': 'TODO', 'priority': 'CRITICAL', 'pos': 3.0},
        ]

        tasks = {}
        for t in tasks_data:
            task = Task.objects.create(
                project=project,
                title=t['title'],
                assignee=users[t['assignee']],
                status=t['status'],
                priority=t['priority'],
                position=t['pos'],
                due_date=timezone.now().date() + timedelta(days=7),
                created_by=users['Smith']
            )
            tasks[t['title']] = task
            self.stdout.write(f'Created task {t["title"]}')

        # Dependencies
        TaskDependency.objects.create(from_task=tasks['Payment API'], to_task=tasks['Frontend Integration'])
        TaskDependency.objects.create(from_task=tasks['Frontend Integration'], to_task=tasks['Gateway Tests'])
        TaskDependency.objects.create(from_task=tasks['Gateway Tests'], to_task=tasks['Security Review'])
        TaskDependency.objects.create(from_task=tasks['Security Review'], to_task=tasks['Deployment'])
        self.stdout.write('Created task dependencies')

        self.stdout.write(self.style.SUCCESS('Successfully seeded DevCollab database!'))
