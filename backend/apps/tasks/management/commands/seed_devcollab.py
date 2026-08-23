from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.projects.models import Project
from apps.tasks.models import Task
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with a simplified DevCollab demo workspace'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding simplified devcollab database...')

        users_data = [
            {'username': 'admin', 'email': 'admin@gmail.com', 'role': 'OWNER'},
            {'username': 'lead', 'email': 'lead@gmail.com', 'role': 'ADMIN'},
            {'username': 'Smith', 'email': 'smithc.cse2024@citchennai.net', 'role': 'DEVELOPER'},
            {'username': 'Libin', 'email': 'libin@gmail.com', 'role': 'DEVELOPER'},
            {'username': 'Balaji', 'email': 'balaji@gmail.com', 'role': 'DEVELOPER'},
        ]
        
        users = {}
        for u in users_data:
            user, created = User.objects.get_or_create(username=u['username'], defaults={'email': u['email']})
            if not created and user.email != u['email']:
                user.email = u['email']
            user.set_password('admin123')
            # For smith, ensure password is smithpass for backward compatibility in demo
            if u['username'] == 'Smith':
                user.set_password('smithpass')
            user.save()
            users[u['username']] = user
            if created:
                self.stdout.write(f'Created user {u["username"]}')
            else:
                self.stdout.write(f'Updated user {u["username"]}')

        # Workspace
        workspace, ws_created = Workspace.objects.get_or_create(name='DevCollab Engineering', defaults={'owner': users['admin']})
        for u in users_data:
            WorkspaceMembership.objects.get_or_create(workspace=workspace, user=users[u['username']], defaults={'role': u['role']})
        if ws_created:
            self.stdout.write('Created workspace and memberships')

        # Projects
        project_payments, _ = Project.objects.get_or_create(
            workspace_id=workspace.id,
            name='Payments Platform'
        )
        self.stdout.write('Created Payments Platform project')
        
        project_platform, _ = Project.objects.get_or_create(
            workspace_id=workspace.id,
            name='Platform Services'
        )
        self.stdout.write('Created Platform Services project')

        # Tasks
        tasks_data = [
            {'title': 'Payment API', 'assignee': None, 'status': 'TODO', 'priority': 'P0'},
            {'title': 'Gateway Integration', 'assignee': 'Libin', 'status': 'IN_PROGRESS', 'priority': 'P1'},
            {'title': 'Security Review', 'assignee': 'Balaji', 'status': 'TODO', 'priority': 'P1'},
            {'title': 'Payment Tests', 'assignee': 'Libin', 'status': 'TODO', 'priority': 'P2'},
            {'title': 'Deployment', 'assignee': 'Balaji', 'status': 'TODO', 'priority': 'P2'},
        ]

        tasks = {}
        for idx, t in enumerate(tasks_data):
            task, t_created = Task.objects.get_or_create(
                project=project_payments,
                title=t['title'],
                defaults={
                    'assignee': users[t['assignee']] if t['assignee'] else None,
                    'status': t['status'],
                    'priority': t['priority']
                }
            )
            if not t_created:
                task.assignee = users[t['assignee']] if t['assignee'] else None
                task.status = t['status']
                task.priority = t['priority']
                task.save()

            tasks[t['title']] = task
            if t_created:
                self.stdout.write(f'Created task {t["title"]}')

        # Dependencies
        # Payment API -> Gateway Integration -> Security Review -> Deployment
        tasks['Gateway Integration'].dependencies.add(tasks['Payment API'])
        tasks['Security Review'].dependencies.add(tasks['Gateway Integration'])
        tasks['Deployment'].dependencies.add(tasks['Security Review'])
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded DevCollab database with simplified demo state!'))
