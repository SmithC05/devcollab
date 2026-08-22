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

        users_data = [
            {'username': 'Smith', 'email': 'smith@devcollab.io'},
            {'username': 'Rahul', 'email': 'rahul@devcollab.io'},
            {'username': 'Ankush', 'email': 'ankush@devcollab.io'},
            {'username': 'Riya', 'email': 'riya@devcollab.io'},
            {'username': 'Karthik', 'email': 'karthik@devcollab.io'},
        ]
        
        users = {}
        for u in users_data:
            user, created = User.objects.get_or_create(username=u['username'], defaults={'email': u['email']})
            user.set_password('DevCollab123')
            user.save()
            users[u['username']] = user
            if created:
                self.stdout.write(f'Created user {u["username"]}')

        # Workspace
        workspace, ws_created = Workspace.objects.get_or_create(name='DevCollab Engineering', defaults={'owner': users['Smith']})
        for username, user in users.items():
            role = 'OWNER' if username == 'Smith' else 'ADMIN' if username == 'Rahul' else 'MEMBER'
            WorkspaceMembership.objects.get_or_create(workspace=workspace, user=user, defaults={'role': role})
        if ws_created:
            self.stdout.write('Created workspace and memberships')

        # Project
        project, prj_created = Project.objects.get_or_create(
            workspace_id=workspace.id,
            name='Payments',
            defaults={'description': 'Core payments infrastructure and gateway integrations.'}
        )
        if prj_created:
            self.stdout.write('Created Payments project')

        # Tasks
        tasks_data = [
            {'title': 'Payment API', 'assignee': 'Smith', 'status': 'IN_PROGRESS'},
            {'title': 'Frontend Integration', 'assignee': 'Rahul', 'status': 'IN_PROGRESS'},
            {'title': 'Gateway Tests', 'assignee': 'Ankush', 'status': 'TODO'},
            {'title': 'Security Review', 'assignee': 'Riya', 'status': 'TODO'},
            {'title': 'Deployment', 'assignee': 'Karthik', 'status': 'TODO'},
        ]

        tasks = {}
        for idx, t in enumerate(tasks_data):
            task, t_created = Task.objects.get_or_create(
                project=project,
                title=t['title'],
                defaults={
                    'assignee': users[t['assignee']],
                    'status': t['status'],
                    'position': float(idx)
                }
            )
            # Update assignee and status if already existed to keep it sync with the seed logic
            if not t_created:
                task.assignee = users[t['assignee']]
                task.status = t['status']
                task.save()

            tasks[t['title']] = task
            if t_created:
                self.stdout.write(f'Created task {t["title"]}')
            self.stdout.write(f'Created task {t["title"]}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded DevCollab database!'))
