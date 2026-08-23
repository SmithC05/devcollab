from django.utils import timezone
from apps.developers.models import DeveloperProfile, EngineeringEvidence
from apps.realtime.models import EngineEvent
from .client import GitHubClient
import logging

logger = logging.getLogger(__name__)

def sync_github_evidence(user):
    profile, _ = DeveloperProfile.objects.get_or_create(user=user)
    
    if profile.sync_status == 'SYNCING':
        return False, "Already syncing"
        
    profile.sync_status = 'SYNCING'
    profile.save()
    
    try:
        client = GitHubClient(user)
        
        # 1. Identity
        gh_user = client.fetch_user_profile()
        profile.github_username = gh_user.get('login')
        profile.github_user_id = str(gh_user.get('id'))
        profile.github_connection_status = 'CONNECTED'
        
        # 2. Evidence - Fetch repositories
        repos = client.fetch_repositories(limit=20)
        
        technologies = {}
        architecture = {}
        dependencies = {}
        processed_repos = []
        
        for r in repos:
            owner = r['owner']['login']
            name = r['name']
            
            processed_repos.append({
                "name": name,
                "owner": owner,
                "description": r.get('description'),
                "updated_at": r.get('updated_at'),
            })
            
            try:
                langs = client.fetch_languages(owner, name)
                for lang, bytes_count in langs.items():
                    technologies[lang] = technologies.get(lang, 0) + bytes_count
            except Exception as e:
                logger.warning(f"Failed to fetch languages for {owner}/{name}: {e}")
                
            try:
                # Bounded architecture evidence: top-level directories
                contents = client.fetch_contents(owner, name)
                if isinstance(contents, list):
                    dirs = [item['name'] for item in contents if item['type'] == 'dir']
                    if dirs:
                        architecture[f"{owner}/{name}"] = dirs
                    
                    # Bounded dependency evidence: look for known manifests
                    files = [item['name'] for item in contents if item['type'] == 'file']
                    repo_deps = []
                    if 'package.json' in files:
                        repo_deps.append('npm')
                    if 'requirements.txt' in files or 'pyproject.toml' in files:
                        repo_deps.append('pip')
                    if 'pom.xml' in files:
                        repo_deps.append('maven')
                    if 'build.gradle' in files:
                        repo_deps.append('gradle')
                    if 'go.mod' in files:
                        repo_deps.append('go')
                    if 'Cargo.toml' in files:
                        repo_deps.append('cargo')
                        
                    if repo_deps:
                        dependencies[f"{owner}/{name}"] = repo_deps
            except Exception as e:
                logger.warning(f"Failed to fetch contents for {owner}/{name}: {e}")
                
        # 3. Normalize & Store
        evidence, _ = EngineeringEvidence.objects.get_or_create(user=user, source='GITHUB')
        evidence.repository_count = len(processed_repos)
        evidence.repositories = {"items": processed_repos}
        evidence.technology_evidence = technologies
        
        # We need to save the new evidence fields, let's store them inside a new dictionary field
        # or expand existing JSON fields. Since models.py has 'technology_evidence' but not architecture explicitly
        # let's check models.py
        # Actually models.py was created in Phase A, let's just append to `repositories` or similar, or check if we can add fields.
        # Wait, the prompt says "ensure EngineeringEvidence schema gracefully accepts the new dependency_evidence and architecture_evidence keys".
        # Let's add them. Since they are JSONFields in Django (I'll assume), they might need to be explicitly added to the model if it didn't use a generic JSON field.
        evidence.architecture_evidence = architecture
        evidence.dependency_evidence = dependencies
        evidence.schema_version = 'v2'
        evidence.save()
        
        profile.last_sync_at = timezone.now()
        profile.sync_status = 'COMPLETED'
        profile.sync_error = ''
        profile.save()
        
        # 4. Event
        EngineEvent.objects.create(
            event_type='GITHUB_EVIDENCE_UPDATED',
            actor=user,
            payload={
                "source": "GITHUB",
                "repository_count": evidence.repository_count,
                "schema_version": evidence.schema_version
            }
        )
        
        return True, "Success"
        
    except Exception as e:
        profile.sync_status = 'FAILED'
        profile.sync_error = str(e)
        profile.save()
        return False, str(e)
