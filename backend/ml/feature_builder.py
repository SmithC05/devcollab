from django.utils import timezone
from apps.tasks.models import Task

def build_features(task: Task) -> dict:
    """
    Builds the 31 required ML features from the actual DevCollab database.
    If features are missing from the schema, this raises a ValueError documenting the gap.
    """
    now = timezone.now()
    task_age_hours = (now - task.created_at).total_seconds() / 3600.0 if task.created_at else 0.0
    
    status_mapping = {
        'To Do': 0.0,
        'In Progress': 50.0,
        'In Review': 90.0,
        'Done': 100.0,
    }
    task_progress = status_mapping.get(task.status, 0.0)
    
    concurrent_task_count = 0
    if task.assignee:
        concurrent_task_count = Task.objects.filter(
            assignee=task.assignee, 
            status__in=['To Do', 'In Progress']
        ).count()
        
    team_size = 1
    if hasattr(task, 'project') and task.project and hasattr(task.project, 'workspace'):
        team_size = task.project.workspace.members.count()

    features = {
        "task_progress": task_progress,
        "task_age_hours": task_age_hours,
        "concurrent_task_count": concurrent_task_count,
        "team_size": team_size,
    }

    # Document missing features (GAP)
    required_features = [
        "task_complexity", "task_type", "task_priority", "remaining_work_fraction",
        "task_progress", "estimated_remaining_hours", "dependency_count",
        "downstream_dependency_count", "upstream_dependency_count", "task_age_hours",
        "ownership_changes", "number_of_reopens", "number_of_status_changes", "role",
        "relevant_experience", "similar_task_count", "technology_familiarity",
        "project_familiarity", "repository_familiarity", "current_workload_hours",
        "concurrent_task_count", "context_score", "architecture_familiarity",
        "architecture_stability", "dependency_familiarity", "current_task_involvement",
        "hours_until_deadline", "deadline_pressure", "deadline_hours", "team_size",
        "reviewer_available"
    ]
    
    missing = [feat for feat in required_features if feat not in features]
    
    if missing:
        raise ValueError(f"Missing required ML features from DB: {', '.join(missing)}")
        
    return features


def get_verification_scenario() -> dict:
    """
    Controlled demo/verification path with fresh, unseen values matching the saved schema.
    This must NEVER be used for normal task inference.
    """
    return {
        "task_complexity": 8,
        "task_type": "Backend",
        "task_priority": "P1",
        "remaining_work_fraction": 0.60,
        "task_progress": 40.0,
        "estimated_remaining_hours": 15.0,
        "dependency_count": 2,
        "downstream_dependency_count": 1,
        "upstream_dependency_count": 1,
        "task_age_hours": 24.0,
        "ownership_changes": 1,
        "number_of_reopens": 0,
        "number_of_status_changes": 2,
        "role": "Lead",
        "relevant_experience": 4,
        "similar_task_count": 12,
        "technology_familiarity": 4,
        "project_familiarity": 3,
        "repository_familiarity": 3,
        "current_workload_hours": 28.5,
        "concurrent_task_count": 2,
        "context_score": 8,
        "architecture_familiarity": 7,
        "architecture_stability": 7,
        "dependency_familiarity": 6,
        "current_task_involvement": 9,
        "hours_until_deadline": 84.0,
        "deadline_pressure": 0.8,
        "deadline_hours": 120.0,
        "team_size": 5,
        "reviewer_available": 1
    }
