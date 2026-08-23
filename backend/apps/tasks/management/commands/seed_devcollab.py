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
            WorkspaceMembership.objects.update_or_create(
                workspace=workspace,
                user=users[u['username']],
                defaults={'role': u['role']}
            )
        if ws_created:
            self.stdout.write('Created workspace and memberships')
        else:
            self.stdout.write('Updated workspace memberships')

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
        
        # Engineering Evidence (Synthetic for Demo)
        from apps.developers.models import EngineeringEvidence
        import json
        
        # Give Libin some frontend/integration evidence
        EngineeringEvidence.objects.update_or_create(
            user=users['Libin'],
            source='GITHUB',
            defaults={
                'repository_count': 8,
                'repositories': {"items": [{"name": "dashboard-ui", "description": "React dashboard"}, {"name": "api-client", "description": "Frontend API client"}]},
                'technology_evidence': {"JavaScript": 120000, "TypeScript": 90000, "React": 50000},
                'architecture_evidence': {"dashboard-ui": ["src/components", "src/hooks"]},
                'dependency_evidence': {"dashboard-ui": ["npm"]},
                'schema_version': 'v2'
            }
        )
        
        # Give Balaji some devops/security evidence
        EngineeringEvidence.objects.update_or_create(
            user=users['Balaji'],
            source='GITHUB',
            defaults={
                'repository_count': 5,
                'repositories': {"items": [{"name": "infra-as-code", "description": "Terraform and CI/CD"}, {"name": "security-scanner", "description": "Automated vulnerability scanner"}]},
                'technology_evidence': {"Go": 80000, "HCL": 40000, "Shell": 15000},
                'architecture_evidence': {"infra-as-code": ["terraform/aws", ".github/workflows"]},
                'dependency_evidence': {"infra-as-code": ["go"]},
                'schema_version': 'v2'
            }
        )
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded DevCollab database with simplified demo state and synthetic evidence!'))
