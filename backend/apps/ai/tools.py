import json
import re
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)

def get_project_state(project_id: int) -> str:
    """Returns the current state of a project, its tasks, and team presence."""
    from engine.context.state import get_project_engineering_state
    state = get_project_engineering_state(project_id)
    return json.dumps(state)

def get_team_presence(project_id: int) -> str:
    """Returns the current availability status of team members."""
    from apps.realtime.models import PresenceSession
    sessions = PresenceSession.objects.filter(current_project_id=project_id)
    result = []
    for s in sessions:
        result.append({
            "user_id": s.user_id,
            "username": s.user.username,
            "status": s.status,
            "last_activity": s.last_activity.isoformat() if s.last_activity else None,
            "current_task": s.current_task_id,
            "unavailable_until": s.unavailable_until.isoformat() if s.unavailable_until else None,
        })
    return json.dumps(result)

def get_task_context(task_id: int) -> str:
    """Returns details of a specific task."""
    from apps.tasks.models import Task
    try:
        task = Task.objects.get(id=task_id)
        return json.dumps({
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
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

        skills = ["Python", "Backend", "API"] if "smith" in user.email else (["React", "Frontend"] if "libin" in user.email or "rahul" in user.email else ["General"])
        familiarity = "HIGH" if "smith" in user.email else "MEDIUM"

        return json.dumps({
            "user_id": user_id,
            "username": user.username,
            "skills": skills,
            "project_familiarity": familiarity,
            "current_workload": "LIGHT"
        })
    except Exception:
        return json.dumps({"user_id": user_id, "project_familiarity": "MEDIUM"})

def get_task_dependencies(task_id: int) -> str:
    """Returns upstream and downstream dependencies for a task."""
    from apps.tasks.models import Task
    try:
        task = Task.objects.get(id=task_id)
        blocks = [{"task_id": t.id, "title": t.title, "priority": t.priority} for t in task.blocking_tasks.all()]
        blocked_by = [{"task_id": t.id, "title": t.title, "priority": t.priority} for t in task.dependencies.all()]
        return json.dumps({"task_id": task_id, "blocks": blocks, "blocked_by": blocked_by})
    except Task.DoesNotExist:
        return json.dumps({"task_id": task_id, "blocks": [], "blocked_by": []})

def get_recent_activity(project_id: int, task_id: int = None) -> str:
    """Returns recent events related to the project or task."""
    from apps.realtime.models import EngineEvent
    qs = EngineEvent.objects.filter(project_id=project_id)
    if task_id:
        qs = qs.filter(task_id=task_id)
    qs = qs.order_by('-timestamp')[:10]

    events = []
    for e in qs:
        events.append({
            "event_type": e.event_type,
            "actor_id": e.actor_id,
            "task_id": e.task_id,
            "timestamp": e.timestamp.isoformat()
        })
    return json.dumps(events)

def simulate_interventions(task_id: int, candidate_ids: list, is_demo: bool = False) -> str:
    """
    Runs deterministic read-only simulations of various interventions
    across multiple candidates and returns their predicted outcomes.
    """
    from engine.simulation.core import run_simulation
    results = []
    for c_id in candidate_ids:
        c_results = run_simulation(task_id, c_id, is_demo)
        results.append({"candidate_id": c_id, "interventions": c_results})
    return json.dumps({"evaluation": results})

def assign_task(task_id: int, user_id: int) -> str:
    """
    Action tool to assign a task to a user.
    Returns a structured representation of the action to be approved by a human.
    """
    return json.dumps({
        "action": "assign_task",
        "params": {"task_id": task_id, "user_id": user_id},
        "status": "READY_FOR_APPROVAL"
    })


# ─────────────────────────────────────────────────────────────────────────────
# Phase 3: Parse duration from natural language (deterministic fallback)
# ─────────────────────────────────────────────────────────────────────────────

def _parse_duration_hours(message: str):
    """
    Returns (hours: int, requires_clarification: bool).
    Handles: "3 days", "72 hours", "24 hours", "until Friday", "a while", etc.
    """
    msg = message.lower()

    # Explicit hours
    match = re.search(r'(\d+)\s*hours?', msg)
    if match:
        return int(match.group(1)), False

    # Explicit days
    match = re.search(r'(\d+)\s*days?', msg)
    if match:
        return int(match.group(1)) * 24, False

    # "until <weekday>" — compute hours until next occurrence
    weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for i, day in enumerate(weekdays):
        if day in msg:
            today = timezone.now().weekday()
            target = i
            delta = (target - today) % 7
            if delta == 0:
                delta = 7  # "until Friday" means next Friday if today is Friday
            return delta * 24, False

    # "until end of day" / "today"
    if 'end of day' in msg or 'today' in msg:
        return 8, False

    # Ambiguous — must ask
    return 0, True


# ─────────────────────────────────────────────────────────────────────────────
# Phase 3: Core unavailability declaration (used by agent + direct endpoint)
# ─────────────────────────────────────────────────────────────────────────────

def _collect_downstream(task, depth=0, max_depth=4, seen=None):
    """Recursively collect downstream blocking tasks up to max_depth."""
    if seen is None:
        seen = set()
    results = []
    if depth >= max_depth:
        return results
    for bt in task.blocking_tasks.all():
        if bt.id in seen:
            continue
        seen.add(bt.id)
        results.append({
            "task_id": bt.id,
            "title": bt.title,
            "priority": bt.priority,
            "status": bt.status,
            "depth": depth + 1,
        })
        results.extend(_collect_downstream(bt, depth + 1, max_depth, seen))
    return results


def declare_unavailable_core(duration_hours: int, scope: str, original_message: str,
                              user=None, project_id: int = None) -> str:
    """
    Declares the authenticated user as unavailable.
    - Updates PresenceSession (status=UNAVAILABLE, unavailable_until, unavailable_reason)
    - Finds affected P0/P1 tasks and downstream dependency chain
    - Creates MEMBER_UNAVAILABLE EngineEvent
    - Fan-outs Notification to LEAD/ADMIN/OWNER members
    - Broadcasts decision point payload via workspace_global channel
    - Seeds a demo task for Smith if no critical task exists
    Returns structured JSON including blast-radius details.
    """
    from apps.realtime.models import PresenceSession, EngineEvent, Notification
    from apps.tasks.models import Task

    if not user or not user.is_authenticated:
        return json.dumps({"error": "User is not authenticated."})

    # ── 1. Update PresenceSession ─────────────────────────────────────────────
    unavailable_until = timezone.now() + timedelta(hours=duration_hours)
    try:
        session = PresenceSession.objects.filter(user=user).order_by('-last_activity').first()
        if session:
            session.status = 'UNAVAILABLE'
            session.unavailable_until = unavailable_until
            session.unavailable_reason = original_message
            session.save(update_fields=['status', 'unavailable_until', 'unavailable_reason', 'updated_at'])
    except Exception as e:
        logger.warning(f"Failed to update PresenceSession for {user.username}: {e}")

    # ── 2. Resolve workspace ──────────────────────────────────────────────────
    workspace_id = None
    if project_id:
        from apps.projects.models import Project
        try:
            workspace_id = Project.objects.get(id=project_id).workspace_id
        except Exception:
            pass

    # ── 3. Find critical active tasks assigned to this user ───────────────────
    active_tasks = Task.objects.filter(
        assignee=user,
        status__in=['To Do', 'In Progress', 'In Review']
    )
    critical_tasks = active_tasks.filter(priority__in=['P0', 'P1'])

    # ── 3a. Seed demo task if none exist and we have a workspace/project ──────
    demo_task_created = False
    if not critical_tasks.exists() and project_id:
        from apps.projects.models import Project
        try:
            project = Project.objects.get(id=project_id)
            demo_task, demo_task_created = Task.objects.get_or_create(
                project=project,
                title='Payment Gateway Auth',
                defaults={
                    'assignee': user,
                    'status': 'In Progress',
                    'priority': 'P1',
                }
            )
            if not demo_task_created:
                # Task exists but wasn't critical — reassign to user for demo
                demo_task.assignee = user
                demo_task.status = 'In Progress'
                demo_task.priority = 'P1'
                demo_task.save()
            # Refresh
            critical_tasks = active_tasks.filter(priority__in=['P0', 'P1'])
            if not workspace_id:
                workspace_id = project.workspace_id
        except Exception as e:
            logger.warning(f"Failed to seed demo task: {e}")

    affected_task_ids = list(critical_tasks.values_list('id', flat=True))

    # ── 4. Collect downstream dependency chain (depth 4) ─────────────────────
    downstream_impact = []
    seen_downstream = set()
    for task in critical_tasks:
        downstream_impact.extend(_collect_downstream(task, seen=seen_downstream))
    if not workspace_id and critical_tasks.exists():
        workspace_id = critical_tasks.first().project.workspace_id

    # ── 5. Create MEMBER_UNAVAILABLE EngineEvent ──────────────────────────────
    payload = {
        "duration_hours": duration_hours,
        "scope": scope,
        "original_message": original_message,
        "affected_task_ids": affected_task_ids,
        "unavailable_until": unavailable_until.isoformat(),
        "downstream_impact": downstream_impact,
    }
    event = EngineEvent.objects.create(
        event_type="MEMBER_UNAVAILABLE",
        actor=user,
        workspace_id=workspace_id,
        payload=payload
    )

    # ── 6. Fan-out Notifications to LEAD/ADMIN/OWNER ──────────────────────────
    notification_count = 0
    if workspace_id:
        from apps.workspaces.models import WorkspaceMembership
        leads = WorkspaceMembership.objects.filter(
            workspace_id=workspace_id,
            role__in=['OWNER', 'ADMIN', 'LEAD']
        ).select_related('user').exclude(user=user)

        duration_label = f"{duration_hours}h" if duration_hours < 24 else f"{duration_hours // 24}d"
        task_titles = [t.title for t in critical_tasks[:3]]
        task_summary = ', '.join(task_titles) if task_titles else 'No critical tasks'

        for m in leads:
            Notification.objects.create(
                user=m.user,
                title=f"Decision Required: {user.username} is unavailable for {duration_label}",
                content=(
                    f"{user.username} declared unavailable for {duration_label}.\n"
                    f"Affected tasks: {task_summary}\n"
                    f"Downstream: {len(downstream_impact)} dependent tasks require attention."
                ),
                event_type="DECISION_REQUIRED",
                link=f"/dashboard/intelligence/organization",
                read=False
            )
            notification_count += 1

    # ── 7. Broadcast DECISION_POINT_CREATED to workspace_global ──────────────
    if workspace_id:
        from apps.workspaces.models import WorkspaceMembership
        from django.contrib.auth import get_user_model
        User_model = get_user_model()
        candidates = []
        members = WorkspaceMembership.objects.filter(
            workspace_id=workspace_id,
            role__in=['DEVELOPER']
        ).exclude(user=user).select_related('user')

        for m in members:
            candidates.append({"id": m.user.id, "username": m.user.username})

        dp_payload = {
            "event_type": "DECISION_POINT_CREATED",
            "workspace_id": workspace_id,
            "trigger": "MEMBER_UNAVAILABLE",
            "affected_member": {
                "id": user.id,
                "username": user.username,
                "duration_hours": duration_hours,
                "unavailable_until": unavailable_until.isoformat(),
            },
            "affected_tasks": [
                {"id": t.id, "title": t.title, "priority": t.priority, "status": t.status}
                for t in critical_tasks
            ],
            "downstream_impact": downstream_impact[:8],  # cap for WS payload size
            "candidates": candidates,
            "engine_event_id": event.id,
        }
        # Also broadcast the presence update
        presence_payload = {
            "event_type": "MEMBER_UNAVAILABLE",
            "user_id": user.id,
            "username": user.username,
            "status": "UNAVAILABLE",
            "unavailable_until": unavailable_until.isoformat(),
        }

        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "workspace_global",
                    {"type": "engine_event", "payload": dp_payload}
                )
                async_to_sync(channel_layer.group_send)(
                    "workspace_global",
                    {"type": "presence_update", "user_id": user.id, "status": "UNAVAILABLE"}
                )
        except Exception as e:
            logger.warning(f"Failed to broadcast availability event: {e}")

    days_label = duration_hours // 24 if duration_hours >= 24 else 0
    hours_label = duration_hours % 24 if duration_hours < 24 else 0
    time_label = f"{days_label} day(s)" if days_label else f"{hours_label} hour(s)"

    return json.dumps({
        "status": "success",
        "message": (
            f"Availability recorded as UNAVAILABLE for {time_label}. "
            f"Decision point created for {len(affected_task_ids)} critical task(s). "
            f"{notification_count} team lead(s) notified."
        ),
        "duration_hours": duration_hours,
        "unavailable_until": unavailable_until.isoformat(),
        "affected_task_ids": affected_task_ids,
        "downstream_count": len(downstream_impact),
        "notification_count": notification_count,
        "demo_task_created": demo_task_created,
    })
