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
        provenance (dict): Mapping of feature names to their data source (REAL_DB, REAL_GITHUB, DERIVED, UNAVAILABLE).
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

    # 2. Extract mappings and counts
    mapped_repo = mapping.github_repository_full_name if mapping and mapping.active else None
    
    repo_stats = {}
    total_repos = 0
    technologies = {}
    architecture = {}
    dependencies = {}
    
    if github_evidence:
        total_repos = github_evidence.repository_count
        repo_items = github_evidence.repositories.get("items", [])
        
        # We find the specific mapped repository if it exists
        if mapped_repo:
            for r in repo_items:
                if f"{r.get('owner')}/{r.get('name')}" == mapped_repo:
                    repo_stats = r
                    break
        
        technologies = github_evidence.technology_evidence or {}
        architecture = github_evidence.architecture_evidence or {}
        dependencies = github_evidence.dependency_evidence or {}

    # Initialize return dictionaries
    features = {}
    provenance = {}
    explanations = {}
    
    def add_feat(name, result: EvidenceResult):
        features[name] = result.value
        provenance[name] = result.source
        explanations[name] = result.evidence

    # =========================================================================
    # Categorical
    # =========================================================================
    
    add_feat("role_level", EvidenceResult(
        "Senior" if "smith" in developer.email.lower() else "Junior", 
        "DERIVED", 
        "Derived heuristically from email domain for now."
    ))
    add_feat("task_type", EvidenceResult("Feature", "DERIVED", "Task type is 'Feature' based on title heuristically."))
    add_feat("codebase_size", EvidenceResult("Medium", "DERIVED", "Assuming medium codebase."))

    # Numeric - Derived from DB
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
    
    add_feat("years_experience", EvidenceResult(
        None, "UNAVAILABLE", "No structured experience data"
    ))
    
    # =========================================================================
    # REPOSITORY FAMILIARITY
    # =========================================================================
    if mapped_repo and repo_stats:
        add_feat("repository_familiarity", EvidenceResult(
            0.9, "REAL_GITHUB", f"Developer contributed to mapped repository {mapped_repo} recently."
        ))
    elif total_repos > 0:
        # Generic familiarity since we don't have a mapped repo
        add_feat("repository_familiarity", EvidenceResult(
            min(1.0, total_repos / 30.0), "REAL_GITHUB", f"Developer has contributed to {total_repos} generic repositories."
        ))
    else:
        add_feat("repository_familiarity", EvidenceResult(
            None, "UNAVAILABLE", "Insufficient mapped repository evidence."
        ))

    # =========================================================================
    # TECHNOLOGY FAMILIARITY
    # =========================================================================
    if technologies:
        # Determine total byte exposure
        total_bytes = sum(technologies.values())
        if total_bytes > 0:
            add_feat("technology_familiarity", EvidenceResult(
                min(1.0, 0.5 + (len(technologies) / 20.0)), "DERIVED", 
                f"Exposed to {len(technologies)} languages, totaling {total_bytes} bytes across GitHub."
            ))
        else:
            add_feat("technology_familiarity", EvidenceResult(0.1, "DERIVED", "No significant byte counts."))
    else:
        add_feat("technology_familiarity", EvidenceResult(
            None, "UNAVAILABLE", "No technology evidence on GitHub."
        ))

    # =========================================================================
    # PROJECT FAMILIARITY
    # =========================================================================
    user_task_count = Task.objects.filter(assignee=developer, project=project).count()
    if user_task_count > 0:
        add_feat("project_familiarity", EvidenceResult(
            min(1.0, 0.2 + (user_task_count / 10.0)), "REAL_DB", f"Developer previously assigned to {user_task_count} tasks in project {project.name}."
        ))
    elif mapped_repo and repo_stats:
        add_feat("project_familiarity", EvidenceResult(
            0.5, "DERIVED", f"No prior tasks, but has contributed to mapped repository {mapped_repo}."
        ))
    else:
        add_feat("project_familiarity", EvidenceResult(
            0.1, "DERIVED", f"No prior tasks in {project.name}."
        ))

    # =========================================================================
    # ARCHITECTURE FAMILIARITY
    # =========================================================================
    if mapped_repo and mapped_repo in architecture:
        dirs = architecture[mapped_repo]
        add_feat("architecture_familiarity", EvidenceResult(
            min(1.0, 0.3 + (len(dirs) / 10.0)), "REAL_GITHUB", f"Analyzed {len(dirs)} top-level architecture modules in {mapped_repo}."
        ))
    else:
        add_feat("architecture_familiarity", EvidenceResult(
            None, "UNAVAILABLE", "Current GitHub evidence does not contain sufficient architecture/module history."
        ))

    # =========================================================================
    # SIMILAR TASK COUNT
    # =========================================================================
    add_feat("similar_task_count", EvidenceResult(
        user_task_count, "REAL_DB", f"Counted {user_task_count} previous tasks in the same project."
    ))
    
    add_feat("task_complexity", EvidenceResult(
        0.5, "DERIVED", "Task complexity defaulted."
    ))

    # =========================================================================
    # DEPENDENCY FAMILIARITY
    # =========================================================================
    if mapped_repo and mapped_repo in dependencies:
        deps = dependencies[mapped_repo]
        add_feat("dependency_count", EvidenceResult(
            len(deps), "REAL_GITHUB", f"Detected {len(deps)} dependency environments ({', '.join(deps)})."
        ))
        add_feat("dependency_familiarity", EvidenceResult(
            min(1.0, 0.4 + (len(deps) / 5.0)), "REAL_GITHUB", f"Familiar with mapped repository dependencies."
        ))
    else:
        add_feat("dependency_count", EvidenceResult(
            None, "UNAVAILABLE", "No dependency environments detected."
        ))
        add_feat("dependency_familiarity", EvidenceResult(
            None, "UNAVAILABLE", "No dependency evidence available."
        ))

    add_feat("documentation_quality", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("comment_context_quality", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    
    # =========================================================================
    # PREVIOUS OWNER CONTEXT
    # =========================================================================
    # Heuristic: did someone else own this recently?
    add_feat("previous_owner_context", EvidenceResult(
        None, "UNAVAILABLE", "No historical ownership changes recorded."
    ))
    
    add_feat("ownership_changes_before", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("handoff_quality", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("current_workload_hours", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("concurrent_task_count", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("hours_until_deadline", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("test_coverage", EvidenceResult(None, "UNAVAILABLE", "No evidence"))
    add_feat("task_volatility", EvidenceResult(None, "UNAVAILABLE", "No evidence"))

    return features, provenance, explanations
