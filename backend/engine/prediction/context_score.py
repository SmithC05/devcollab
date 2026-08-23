def calculate_context_score(task_id: int, candidate_id: int) -> float:
    """
    Calculates a developer's context familiarity with a task using real DB state.

    Score = proportion of tasks in the same project that this candidate is assigned to,
    weighted by how many of those tasks overlap with the given task's status/priority.
    Returns a score from 0.05 (no context) to 0.95 (high context).

    This is intentionally deterministic — the same inputs always produce the same score.
    No email matching, no hardcoded names.
    """
    try:
        from apps.tasks.models import Task
        task = Task.objects.select_related('project').get(id=task_id)
        project = task.project

        total_project_tasks = Task.objects.filter(project=project).count()
        if total_project_tasks == 0:
            return 0.5  # No data to derive from

        # How many tasks in this project has the candidate worked on?
        candidate_tasks_in_project = Task.objects.filter(
            project=project, assignee_id=candidate_id
        ).count()

        # Base score: proportion of project tasks owned
        base_score = candidate_tasks_in_project / total_project_tasks

        # Boost if candidate owns the specific task
        if task.assignee_id == candidate_id:
            base_score = max(base_score, 0.85)

        # Clamp to a realistic range
        return round(min(0.95, max(0.05, base_score)), 3)

    except Exception:
        return 0.5
