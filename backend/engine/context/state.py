import datetime
from django.utils import timezone
from apps.tasks.models import Task, TaskDependency
from apps.realtime.models import PresenceSession
from django.contrib.auth.models import User
from apps.projects.models import Project

def get_project_engineering_state(project_id):
    """
    Constructs a real-time engineering state snapshot for the Decision Engine.
    This aggregates tasks, their dependencies, and the live presence/availability 
    of the developers working on them.
    """
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return {"error": "Project not found"}

    # 1. Fetch live presence for all users in the workspace/project
    # We'll just fetch all sessions for simplicity, but ideally filter by project members.
    sessions = PresenceSession.objects.filter(current_project_id=project_id)
    
    # Map user ID to their current status
    user_presence_map = {}
    for session in sessions:
        user_id = session.user.id
        # In a real app, handle multiple sessions per user (e.g. prioritize ACTIVE over IDLE)
        # Here we just take the most recent session's status for the user
        if user_id not in user_presence_map or session.last_activity > user_presence_map[user_id]['last_activity']:
            user_presence_map[user_id] = {
                "status": session.status,
                "last_activity": session.last_activity,
                "current_task_id": session.current_task_id
            }

    # 2. Fetch tasks and dependencies
    tasks = Task.objects.filter(project_id=project_id)
    dependencies = TaskDependency.objects.filter(from_task__project_id=project_id)

    # Build dependency graph
    task_blocks = {} # task_id -> list of task_ids it blocks
    task_blocked_by = {} # task_id -> list of task_ids blocking it
    
    for dep in dependencies:
        from_id = dep.from_task_id
        to_id = dep.to_task_id
        
        if from_id not in task_blocks:
            task_blocks[from_id] = []
        task_blocks[from_id].append(to_id)
        
        if to_id not in task_blocked_by:
            task_blocked_by[to_id] = []
        task_blocked_by[to_id].append(from_id)

    # 3. Aggregate state
    tasks_state = {}
    risks = []

    for task in tasks:
        assignee_id = task.assignee_id
        assignee_status = user_presence_map.get(assignee_id, {}).get("status", "OFFLINE") if assignee_id else "UNASSIGNED"
        
        # Determine if this task is a risk
        # E.g. A CRITICAL or HIGH priority task that is IN_PROGRESS but assignee is OFFLINE or UNAVAILABLE
        is_risk = False
        if task.status in ['TODO', 'IN_PROGRESS']:
            if task.priority in ['HIGH', 'CRITICAL'] and assignee_status in ['OFFLINE', 'UNAVAILABLE']:
                is_risk = True
                risks.append({
                    "type": "OFFLINE_CRITICAL_ASSIGNEE",
                    "task_id": task.id,
                    "assignee_id": assignee_id,
                    "description": f"Critical task '{task.title}' is assigned to {task.assignee.username if task.assignee else 'None'} who is {assignee_status}."
                })
        
        tasks_state[task.id] = {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "assignee_id": assignee_id,
            "assignee_status": assignee_status,
            "blocks": task_blocks.get(task.id, []),
            "blocked_by": task_blocked_by.get(task.id, []),
            "is_risk": is_risk
        }

    return {
        "project_id": project.id,
        "timestamp": timezone.now().isoformat(),
        "total_tasks": len(tasks),
        "tasks": tasks_state,
        "risks": risks,
        "active_users_count": len([u for u, data in user_presence_map.items() if data["status"] == "ACTIVE"])
    }
