from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.developers.models import DeveloperProfile, EngineeringEvidence

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds historical engineering profiles and evidence for phase 2'

    def handle(self, *args, **options):
        # Users
        smith = User.objects.filter(email='smithc.cse2024@citchennai.net').first()
        libin = User.objects.filter(email='libin@gmail.com').first()
        balaji = User.objects.filter(email='balaji@gmail.com').first()
        
        # 1. Smith -> Real GitHub Evidence (simulate existing sync from Phase A)
        if smith:
            profile, _ = DeveloperProfile.objects.get_or_create(user=smith)
            profile.github_username = "smith"
            profile.github_connection_status = 'CONNECTED'
            profile.save()
            
            ev, created = EngineeringEvidence.objects.get_or_create(
                user=smith, 
                source='GITHUB'
            )
            ev.repository_count = 12
            ev.repositories = {
                "items": [
                    {"name": "payments-api", "owner": "devcollab", "commits": 140},
                    {"name": "platform-core", "owner": "devcollab", "commits": 40}
                ]
            }
            ev.technology_evidence = {"Python": 140000, "JavaScript": 85000, "Go": 30000}
            ev.architecture_evidence = {"devcollab/payments-api": ["src/api", "src/auth", "src/security"]}
            ev.dependency_evidence = {"devcollab/payments-api": ["requirements.txt", "package.json"]}
            ev.save()
            self.stdout.write(self.style.SUCCESS('Seeded Smith GitHub Evidence'))
            
        # 2. Libin -> Historical Profile
        if libin:
            profile, _ = DeveloperProfile.objects.get_or_create(user=libin)
            profile.historical_context = {
                "projects": ["Payments Platform", "Analytics"],
                "technologies": ["Python", "React", "PostgreSQL"],
                "repositories": ["payments-api", "analytics-dashboard"],
                "similar_task_count": 8,
                "previous_ownership": ["Gateway Integration"]
            }
            profile.save()
            self.stdout.write(self.style.SUCCESS('Seeded Libin Historical Profile'))
            
        # 3. Balaji -> Historical Profile
        if balaji:
            profile, _ = DeveloperProfile.objects.get_or_create(user=balaji)
            profile.historical_context = {
                "projects": ["Platform Services"],
                "technologies": ["JavaScript", "Node.js"],
                "repositories": ["platform-services"],
                "similar_task_count": 2,
                "previous_ownership": []
            }
            profile.save()
            self.stdout.write(self.style.SUCCESS('Seeded Balaji Historical Profile'))
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded historical profiles and evidence.'))
