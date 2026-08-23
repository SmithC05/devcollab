import logging
from typing import Dict, Any, Tuple
from django.utils import timezone

from apps.developers.models import EngineeringEvidence, DeveloperProfile
from apps.tasks.models import Task
from apps.projects.models import ProjectRepositoryMapping

logger = logging.getLogger(__name__)

class EvidenceResult:
    def __init__(self, value: float | str | None, source: str, evidence: str):
        self.value = value
        self.source = source
        self.evidence = evidence

def get_developer_context(task: Task, developer) -> Tuple[Dict[str, Any], Dict[str, str], Dict[str, str]]:
    """
    Constructs the feature payload required for the context transfer model.
    Returns:
        features (dict): The feature values to be passed to the model.
        provenance (dict): Mapping of feature names to their data source (REAL_DB, REAL_GITHUB, HISTORICAL_PROFILE, DERIVED, UNAVAILABLE).
        explanations (dict): Human-readable explanations of the evidence.
    """
    
    # 1. Fetch relevant entities
    project = task.project
    
    mapping = None
    try:
        mapping = project.repository_mapping
    except ProjectRepositoryMapping.DoesNotExist:
        pass

    github_evidence = None
    historical_profile = None
    
    try:
        github_evidence = EngineeringEvidence.objects.filter(user=developer, source='GITHUB').first()
    except Exception:
        pass
        
    try:
        profile = DeveloperProfile.objects.filter(user=developer).first()
        if profile and profile.historical_context:
            historical_profile = profile.historical_context
    except Exception:
        pass

    mapped_repo = mapping.github_repository_full_name if mapping and mapping.active else None
    
    repo_stats = {}
    total_repos = 0
    technologies = {}
    architecture = {}
    dependencies = {}
    
    has_github = False
    has_historical = False
    
    if github_evidence:
        has_github = True
        total_repos = github_evidence.repository_count
        repo_items = github_evidence.repositories.get("items", [])
        if mapped_repo:
            for r in repo_items:
                if f"{r.get('owner')}/{r.get('name')}" == mapped_repo:
                    repo_stats = r
                    break
        technologies = github_evidence.technology_evidence or {}
        architecture = github_evidence.architecture_evidence or {}
        dependencies = github_evidence.dependency_evidence or {}
    elif historical_profile:
        has_historical = True
        hist_repos = historical_profile.get("repositories", [])
        total_repos = len(hist_repos)
        if mapped_repo and mapped_repo.split('/')[-1] in hist_repos:
            repo_stats = {"name": mapped_repo.split('/')[-1]}
        elif hist_repos:
            repo_stats = {"name": hist_repos[0]} # just any match
            
        technologies = {t: 1000 for t in historical_profile.get("technologies", [])}
        architecture = {r: ["src"] for r in hist_repos}
        dependencies = {r: ["package.json"] for r in hist_repos}

    # Initialize return dictionaries
    features = {}
    provenance = {}
    explanations = {}
    
    def add_feat(name, result: EvidenceResult):
        features[name] = result.value
        provenance[name] = result.source
        explanations[name] = result.evidence

    source_tag = "REAL_GITHUB" if has_github else ("HISTORICAL_PROFILE" if has_historical else "UNAVAILABLE")

    if repo_stats:
        add_feat("repository_familiarity", EvidenceResult(
            0.9, source_tag, f"Developer has mapped repository experience."
        ))
    elif total_repos > 0:
        add_feat("repository_familiarity", EvidenceResult(
            min(1.0, total_repos / 30.0), source_tag, f"Developer has contributed to {total_repos} generic repositories."
        ))
    else:
        add_feat("repository_familiarity", EvidenceResult(
            None, "UNAVAILABLE", "Insufficient mapped repository evidence."
        ))

    if technologies:
        total_bytes = sum(technologies.values())
        if total_bytes > 0:
            add_feat("technology_familiarity", EvidenceResult(
                min(1.0, 0.5 + (len(technologies) / 20.0)), source_tag, 
                f"Exposed to {len(technologies)} languages."
            ))
        else:
            add_feat("technology_familiarity", EvidenceResult(0.1, source_tag, "No significant byte counts."))
    else:
        add_feat("technology_familiarity", EvidenceResult(
            None, "UNAVAILABLE", "No technology evidence."
        ))

    user_task_count = Task.objects.filter(assignee=developer, project=project).count()
    if historical_profile and project.name in historical_profile.get("projects", []):
        add_feat("project_familiarity", EvidenceResult(
            0.8, "HISTORICAL_PROFILE", f"Historical evidence shows experience in project {project.name}."
        ))
    elif user_task_count > 0:
        add_feat("project_familiarity", EvidenceResult(
            min(1.0, 0.2 + (user_task_count / 10.0)), "REAL_DB", f"Developer previously assigned to {user_task_count} tasks in project {project.name}."
        ))
    elif mapped_repo and repo_stats:
        add_feat("project_familiarity", EvidenceResult(
            0.5, "DERIVED", f"No prior tasks, but has contributed to mapped repository."
        ))
    else:
        add_feat("project_familiarity", EvidenceResult(
            0.1, "DERIVED", f"No prior tasks in {project.name}."
        ))

    if architecture:
        add_feat("architecture_familiarity", EvidenceResult(
            0.5, source_tag, f"Analyzed top-level architecture modules."
        ))
    else:
        add_feat("architecture_familiarity", EvidenceResult(
            None, "UNAVAILABLE", "Current evidence does not contain sufficient architecture/module history."
        ))

    if historical_profile:
        sim_count = historical_profile.get("similar_task_count", 0)
        add_feat("similar_task_count", EvidenceResult(
            sim_count + user_task_count, "HISTORICAL_PROFILE", f"Historical + DB count: {sim_count + user_task_count} tasks."
        ))
    else:
        add_feat("similar_task_count", EvidenceResult(
            user_task_count, "REAL_DB", f"Counted {user_task_count} previous tasks in the same project."
        ))
        
    add_feat("role_level", EvidenceResult(
        "Senior" if "smith" in developer.email.lower() else "Junior", 
        "DERIVED", 
        "Derived heuristically from email domain for now."
    ))
    add_feat("task_type", EvidenceResult("Feature", "DERIVED", "Task type is 'Feature' based on title heuristically."))
    add_feat("codebase_size", EvidenceResult("Medium", "DERIVED", "Assuming medium codebase."))

    add_feat("task_progress", EvidenceResult(
        0.5 if task.status == 'In Progress' else (1.0 if task.status == 'Done' else 0.0),
        "REAL_DB",
        f"Task status is {task.status}"
    ))
    add_feat("remaining_work_fraction", EvidenceResult(
        max(0.0, 1.0 - features["task_progress"]),
        "DERIVED",
        "Calculated from task progress"
    ))
    
    add_feat("years_experience", EvidenceResult(None, "UNAVAILABLE", "No structured experience data"))

    add_feat("task_complexity", EvidenceResult(0.5, "DERIVED", "Task complexity defaulted."))

    if dependencies:
        add_feat("dependency_count", EvidenceResult(
            len(dependencies), source_tag, f"Detected dependencies."
        ))
        add_feat("dependency_familiarity", EvidenceResult(
            min(1.0, 0.4 + (len(dependencies) / 5.0)), source_tag, f"Familiar with mapped repository dependencies."
        ))
    else:
        add_feat("dependency_count", EvidenceResult(None, "UNAVAILABLE", "No dependency environments detected."))
        add_feat("dependency_familiarity", EvidenceResult(None, "UNAVAILABLE", "No dependency evidence available."))

    add_feat("documentation_quality", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("comment_context_quality", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    
    if historical_profile and historical_profile.get("previous_ownership"):
        add_feat("previous_owner_context", EvidenceResult(
            0.8, "HISTORICAL_PROFILE", "Historical profile indicates previous component ownership."
        ))
    else:
        add_feat("previous_owner_context", EvidenceResult(None, "UNAVAILABLE", "No historical ownership changes recorded."))
    
    add_feat("ownership_changes_before", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("handoff_quality", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("current_workload_hours", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("concurrent_task_count", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("hours_until_deadline", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("test_coverage", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("task_volatility", EvidenceResult(None, "UNAVAILABLE", "No evidence"))

    return features, provenance, explanations
