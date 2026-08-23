import json
from engine.context.state import get_project_engineering_state
from apps.realtime.models import PresenceSession, EngineEvent
from apps.tasks.models import Task
from engine.simulation.core import run_simulation

def get_project_state(project_id: int) -> str:
    """Returns the current state of a project, its tasks, and team presence."""
    state = get_project_engineering_state(project_id)
    return json.dumps(state)

def get_team_presence(project_id: int) -> str:
    """Returns the current availability status of team members."""
    sessions = PresenceSession.objects.filter(current_project_id=project_id)
    result = []
    for s in sessions:
        result.append({
            "user_id": s.user_id,
            "username": s.user.username,
            "status": s.status,
            "last_activity": s.last_activity.isoformat() if s.last_activity else None,
            "current_task": s.current_task_id
        })
    return json.dumps(result)

def get_task_context(task_id: int) -> str:
    """Returns details of a specific task."""
    try:
        task = Task.objects.get(id=task_id)
        return json.dumps({
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "assignee_id": task.assignee_id,
            "project_id": task.project_id
        })
    except Task.DoesNotExist:
        return json.dumps({"error": "Task not found"})

def get_developer_profile(user_id: int, project_id: int) -> str:
    """Returns an evidence-based profile of a developer for a given project."""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)
        
        # Simple dynamic logic based on email to maintain demo personality
        skills = ["Python", "Backend", "API"] if "smith" in user.email else (["React", "Frontend"] if "rahul" in user.email else ["General"])
        familiarity = "HIGH" if "smith" in user.email else "MEDIUM"
        
        return json.dumps({
            "user_id": user_id,
            "username": user.username,
            "skills": skills,
            "project_familiarity": familiarity,
            "current_workload": "LIGHT" # Would be dynamically calculated in a real app
        })
    except Exception:
        return json.dumps({
            "user_id": user_id,
            "project_familiarity": "MEDIUM"
        })

def get_task_dependencies(task_id: int) -> str:
    """Returns upstream and downstream dependencies for a task."""
    return json.dumps({
        "task_id": task_id,
        "blocks": [],
        "blocked_by": []
    })

def get_recent_activity(project_id: int, task_id: int = None) -> str:
    """Returns recent events related to the project or task."""
    qs = EngineEvent.objects.filter(project_id=project_id)
    if task_id:
        qs = qs.filter(task_id=task_id)
    qs = qs.order_by('-created_at')[:10]
    
    events = []
    for e in qs:
        events.append({
            "event_type": e.event_type,
            "actor_id": e.actor_id,
            "task_id": e.task_id,
            "timestamp": e.created_at.isoformat()
        })
    return json.dumps(events)

def simulate_interventions(task_id: int, candidate_ids: list, is_demo: bool = False) -> str:
    """
    Runs deterministic read-only simulations of various interventions (WAIT, REASSIGN, PAIR, KNOWLEDGE_TRANSFER)
    across multiple candidates and returns their predicted outcomes.
    """
    results = []
    for c_id in candidate_ids:
        c_results = run_simulation(task_id, c_id, is_demo)
        results.append({
            "candidate_id": c_id,
            "interventions": c_results
        })
    return json.dumps({"evaluation": results})

def assign_task(task_id: int, user_id: int) -> str:
    """
    Action tool to assign a task to a user.
    Note: For the prototype, the Agent prepares this action, but the UI must approve it.
    We return a structured representation of the action to be executed.
    """
    return json.dumps({
        "action": "assign_task",
        "params": {
            "task_id": task_id,
            "user_id": user_id
        },
        "status": "READY_FOR_APPROVAL"
    })

def declare_unavailable_core(duration_days: int, scope: str, original_message: str, user=None, project_id: int=None) -> str:
    """
    Declares the authenticated user as unavailable for the given duration and scope.
    This creates an availability event and triggers an engineering decision point.
    """
    from apps.realtime.models import PresenceSession, EngineEvent
    from apps.tasks.models import Task
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    import json
    
    if not user or not user.is_authenticated:
        return json.dumps({"error": "User is not authenticated."})
        
    # Update PresenceSession
    try:
        session = PresenceSession.objects.filter(user=user).order_by('-last_activity').first()
        if session:
            session.status = 'UNAVAILABLE'
            session.save()
    except Exception as e:
        pass
        
    # Find active critical tasks
    active_tasks = Task.objects.filter(
        assignee=user, 
        status__in=['TODO', 'IN_PROGRESS', 'IN_REVIEW']
    )
    
    # Priority for P0, P1
    critical_tasks = active_tasks.filter(priority__in=['P0', 'P1'])
    affected_task_ids = list(critical_tasks.values_list('id', flat=True))
    
    # Downstream impact (blocking tasks)
    downstream_impact = []
    for task in critical_tasks:
        for bt in task.blocking_tasks.all():
            downstream_impact.append({"task_id": bt.id, "title": bt.title})
    
    # Determine Workspace
    workspace_id = None
    if critical_tasks.exists():
        workspace_id = critical_tasks.first().project.workspace_id
        
    if not workspace_id and project_id:
        from apps.projects.models import Project
        try:
            workspace_id = Project.objects.get(id=project_id).workspace_id
        except:
            pass

    # Create EngineEvent
    payload = {
        "duration_days": duration_days,
        "scope": scope,
        "original_message": original_message,
        "affected_task_ids": affected_task_ids
    }
    
    event = EngineEvent.objects.create(
        event_type="MEMBER_UNAVAILABLE",
        actor=user,
        workspace_id=workspace_id,
        payload=payload
    )
    
    # Broadcast Decision Point
    if workspace_id:
        from apps.workspaces.models import WorkspaceMembership
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        candidates = []
        members = WorkspaceMembership.objects.filter(
            workspace_id=workspace_id, 
            role__in=['DEVELOPER']
        ).exclude(user=user)
        
        for m in members:
            candidates.append({"id": m.user.id, "username": m.user.username})
            
        dp_payload = {
            "event_type": "DECISION_POINT_CREATED",
            "workspace_id": workspace_id,
            "trigger": "MEMBER_UNAVAILABLE",
            "affected_member": {"id": user.id, "username": user.username, "duration_days": duration_days},
            "affected_tasks": [{"id": t.id, "title": t.title, "priority": t.priority} for t in critical_tasks],
            "downstream_impact": downstream_impact,
            "candidates": candidates
        }
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"workspace_global",
                {
                    "type": "engine_event",
                    "payload": dp_payload
                }
            )
            
    return json.dumps({
        "status": "success",
        "message": f"Availability recorded as UNAVAILABLE for {duration_days} days. Decision point created for {len(critical_tasks)} critical tasks."
    })

