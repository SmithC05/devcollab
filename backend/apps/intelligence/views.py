"""
Engineering Command Center API view.
Aggregates organization-wide engineering state into a single response.
This is a read-only, non-mutating endpoint for the Intelligence UI.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.projects.models import Project
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.tasks.models import Task
from apps.realtime.models import PresenceSession
from django.utils import timezone
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .capacity import calculate_capacity

User = get_user_model()


class EngineeringCommandCenterView(APIView):
    """
    GET /api/intelligence/command-center/

    Returns aggregated engineering state for the DevCollab
    Intelligence Command Center. Read-only. No mutations.
    """

    def get(self, request):
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace:
            return Response(self._empty_state())

        projects = Project.objects.filter(workspace=workspace)
        all_tasks = Task.objects.filter(project__in=projects)
        memberships = workspace.memberships.select_related('user').all()

        # ── Organization metrics ──────────────────────────────────────────
        active_tasks = all_tasks.exclude(status=Task.StatusChoices.DONE)
        blocked_tasks = all_tasks.filter(
            status=Task.StatusChoices.TODO,
            priority__in=[Task.PriorityChoices.P0, Task.PriorityChoices.P1]
        )
        at_risk_tasks = all_tasks.filter(priority=Task.PriorityChoices.P0).exclude(status=Task.StatusChoices.DONE)

        org_metrics = {
            "member_count":         memberships.count(),
            "project_count":        projects.count(),
            "active_project_count": projects.filter(is_active=True).count(),
            "active_task_count":    active_tasks.count(),
            "blocked_task_count":   blocked_tasks.count(),
            "at_risk_task_count":   at_risk_tasks.count(),
            "decision_point_count": 0,  # Will be populated below
        }

        # ── Project intelligence ──────────────────────────────────────────
        projects_data = []
        for p in projects:
            p_tasks = p.tasks.all()
            total = p_tasks.count()
            done = p_tasks.filter(status=Task.StatusChoices.DONE).count()
            in_progress = p_tasks.filter(status=Task.StatusChoices.IN_PROGRESS).count()
            blocked = p_tasks.filter(
                status=Task.StatusChoices.TODO,
                priority__in=[Task.PriorityChoices.P0, Task.PriorityChoices.P1]
            ).count()
            at_risk = p_tasks.filter(priority=Task.PriorityChoices.P0).exclude(status=Task.StatusChoices.DONE).count()
            progress = int((done / total * 100)) if total > 0 else 0

            # Health derived from real signals
            health = (
                "CRITICAL" if at_risk > 0 and blocked > 1 else
                "HIGH"     if blocked > 0 or at_risk > 0 else
                "MEDIUM"   if in_progress > 0 and total > 5 else
                "STABLE"
            )

            # Members assigned to this project
            assignee_ids = p_tasks.filter(assignee__isnull=False).values_list('assignee_id', flat=True).distinct()
            assignees = User.objects.filter(id__in=assignee_ids)

            projects_data.append({
                "id":               p.id,
                "name":             p.name,
                "is_active":        p.is_active,
                "health":           health,
                "total_tasks":      total,
                "active_tasks":     in_progress,
                "blocked_tasks":    blocked,
                "at_risk_tasks":    at_risk,
                "done_tasks":       done,
                "progress":         progress,
                "member_count":     assignees.count(),
                "members":          [
                    {"id": u.id, "name": f"{u.first_name} {u.last_name}".strip() or u.username}
                    for u in assignees
                ],
                "updated_at":       p.updated_at.isoformat() if p.updated_at else None,
            })

        # ── Team capacity ─────────────────────────────────────────────────
        members_data = []
        for membership in memberships:
            user = membership.user
            user_tasks = all_tasks.filter(assignee=user)
            active_user_tasks = user_tasks.exclude(status=Task.StatusChoices.DONE)
            critical_tasks = user_tasks.filter(
                priority=Task.PriorityChoices.P0
            ).exclude(status=Task.StatusChoices.DONE)
            in_progress_tasks = user_tasks.filter(status=Task.StatusChoices.IN_PROGRESS)

            cap_data = calculate_capacity(user, all_tasks)
            availability = cap_data["availability"]
            raw_capacity = cap_data["capacity_pct"]

            # Collect project context for this member
            project_contexts = []
            for p in projects:
                member_project_tasks = p.tasks.filter(assignee=user).exclude(status=Task.StatusChoices.DONE)
                if member_project_tasks.exists():
                    # Context score: heuristic based on how many tasks they own in this project
                    total_project_tasks = p.tasks.count() or 1
                    owned = member_project_tasks.count()
                    context_score = min(100, int((owned / total_project_tasks) * 100))
                    project_contexts.append({
                        "project_id":   p.id,
                        "project_name": p.name,
                        "task_count":   owned,
                        "context_score": context_score,
                    })

            # Presence/availability — check real PresenceSession status
            presence_session = PresenceSession.objects.filter(
                user=user
            ).order_by('-last_activity').first()
            presence_status = presence_session.status if presence_session else 'OFFLINE'
            unavailable_until = (
                presence_session.unavailable_until.isoformat()
                if presence_session and presence_session.unavailable_until else None
            )
            unavailable_reason = (
                presence_session.unavailable_reason
                if presence_session else ''
            )

            # Override availability if PresenceSession says UNAVAILABLE
            if presence_status == 'UNAVAILABLE':
                availability = 'UNAVAILABLE'
            else:
                availability = cap_data["availability"]

            members_data.append({
                "id":                   user.id,
                "name":                 f"{user.first_name} {user.last_name}".strip() or user.username,
                "username":             user.username,
                "email":                user.email,
                "role":                 membership.role,
                "availability":         availability,
                "presence_status":      presence_status,
                "unavailable_until":    unavailable_until,
                "unavailable_reason":   unavailable_reason,
                "capacity_pct":         raw_capacity,
                "active_task_count":    cap_data["active_task_count"],
                "in_progress_tasks":    in_progress_tasks.count(),
                "critical_task_count":  cap_data["critical_task_count"],
                "project_contexts":     project_contexts,
                "owned_tasks":          [
                    {"id": t.id, "title": t.title, "priority": t.priority, "status": t.status, "project_name": t.project.name, "dependency_count": t.blocking_tasks.count()}
                    for t in active_user_tasks
                ]
            })


        # ── Decision points (derived from real signals) ───────────────────
        decision_points = []

        # Rule 1: Overloaded members with critical tasks
        for m in members_data:
            if m["availability"] == "OVERLOADED" and m["critical_task_count"] > 0:
                decision_points.append({
                    "id":          f"dp-overload-{m['id']}",
                    "severity":    "HIGH",
                    "type":        "ENGINEER_OVERLOADED",
                    "trigger":     f"{m['name']} is overloaded with {m['active_task_count']} active tasks",
                    "impact":      f"{m['critical_task_count']} critical task(s) at risk",
                    "affected_member": m["name"],
                    "affected_project": m["project_contexts"][0]["project_name"] if m["project_contexts"] else None,
                })

        # Rule 2: Projects with blocked critical work
        for p in projects_data:
            if p["at_risk_tasks"] > 0:
                decision_points.append({
                    "id":          f"dp-risk-{p['id']}",
                    "severity":    "CRITICAL" if p["at_risk_tasks"] > 1 else "HIGH",
                    "type":        "CRITICAL_WORK_AT_RISK",
                    "trigger":     f"P0 task(s) in '{p['name']}' not yet complete",
                    "impact":      f"{p['at_risk_tasks']} critical task(s) may miss deadline",
                    "affected_member":  None,
                    "affected_project": p["name"],
                })

        # Rule 3: Projects with blocked tasks and high health severity
        for p in projects_data:
            if p["health"] in ("HIGH", "CRITICAL") and p["blocked_tasks"] > 0:
                # Avoid duplicating if already captured by rule 2
                already = any(d["affected_project"] == p["name"] and d["type"] == "CRITICAL_WORK_AT_RISK" for d in decision_points)
                if not already:
                    decision_points.append({
                        "id":          f"dp-blocked-{p['id']}",
                        "severity":    p["health"],
                        "type":        "BLOCKED_WORK",
                        "trigger":     f"{p['blocked_tasks']} high-priority task(s) blocked in '{p['name']}'",
                        "impact":      "Downstream delivery risk",
                        "affected_member":  None,
                        "affected_project": p["name"],
                    })

        org_metrics["decision_point_count"] = len(decision_points)

        # ── System status ─────────────────────────────────────────────────
        system_status = {
            "source":       "LIVE",           # Real DB data
            "last_synced":  timezone.now().isoformat(),
            "agent_status": "MONITORING",
        }

        return Response({
            "organization":    org_metrics,
            "projects":        projects_data,
            "members":         members_data,
            "decision_points": decision_points,
            "system_status":   system_status,
        })

    def _empty_state(self):
        return {
            "organization": {
                "member_count": 0, "project_count": 0, "active_project_count": 0,
                "active_task_count": 0, "blocked_task_count": 0,
                "at_risk_task_count": 0, "decision_point_count": 0,
            },
            "projects":        [],
            "members":         [],
            "decision_points": [],
            "system_status": {
                "source":       "LIVE",
                "last_synced":  timezone.now().isoformat(),
                "agent_status": "IDLE",
            },
        }

from rest_framework.decorators import api_view
from apps.tasks.models import Task
from apps.integrations.evidence import get_developer_context
from django.shortcuts import get_object_or_404
from .capacity import calculate_capacity

@api_view(['GET'])
def compare_task_candidates(request):
    task_id = request.GET.get('task_id')
    if not task_id:
        return Response({"error": "task_id required"}, status=400)
    
    task = get_object_or_404(Task, id=task_id)
    
    workspace = task.project.workspace
    eligible_memberships = workspace.memberships.filter(
        role__in=['DEVELOPER']
    ).select_related('user')
    all_tasks = Task.objects.all()
    
    candidates = []
    # Get all UNAVAILABLE user IDs so we can exclude/flag them
    unavailable_user_ids = set(
        PresenceSession.objects.filter(status='UNAVAILABLE').values_list('user_id', flat=True)
    )

    for m in eligible_memberships:
        u = m.user
        if "admin" in u.email: continue
        # Exclude UNAVAILABLE members from candidate pool
        if u.id in unavailable_user_ids: continue
        
        cap_data = calculate_capacity(u, all_tasks)
        features, provenance, explanations = get_developer_context(task, u)
        
        score = (features.get("repository_familiarity") or 0.0) * 0.4 + \
                (features.get("project_familiarity") or 0.0) * 0.4 + \
                (features.get("technology_familiarity") or 0.0) * 0.2
                
        # Business Rule: If task is high priority (P0/P1) and the candidate has almost 
        # no project familiarity, cap their score so they evaluate as a LOW match.
        project_fam = features.get("project_familiarity") or 0.0
        if task.priority in ['P0', 'P1'] and project_fam < 0.2:
            score = min(score, 0.29)
        
        context_level = "HIGH" if score > 0.6 else "MEDIUM" if score > 0.3 else "LOW"
        
        evidence_arr = [{"feature": k, "value": features[k], "provenance": provenance[k], "explanation": explanations[k]} for k in features]
        
        candidates.append({
            "developer": {"id": u.id, "name": u.get_full_name() or u.username, "email": u.email, "role": m.role},
            "capacity": cap_data,
            "context": {"level": context_level, "score": score},
            "features": features,
            "provenance": provenance,
            "evidence": evidence_arr
        })
        
        
    return Response({
        "task": {"id": task.id, "title": task.title, "project_name": task.project.name},
        "candidates": candidates
    })

@api_view(['GET'])
def get_member_evidence(request, pk):
    task_id = request.GET.get('task_id')
    member = get_object_or_404(User, id=pk)
    
    task = get_object_or_404(Task, id=task_id) if task_id else None
    
    all_tasks = Task.objects.all()
    cap_data = calculate_capacity(member, all_tasks)
    
    features, provenance, explanations = {}, {}, {}
    evidence_arr = []
    if task:
        features, provenance, explanations = get_developer_context(task, member)
        evidence_arr = [{"feature": k, "value": features[k], "provenance": provenance[k], "explanation": explanations[k]} for k in features]
    
    ai_summary = "AI Summary temporarily unavailable."
    
    return Response({
        "developer": {"id": member.id, "name": member.get_full_name() or member.username},
        "capacity": cap_data,
        "features": features,
        "provenance": provenance,
        "evidence": evidence_arr,
        "ai_summary": ai_summary
    })

from django.conf import settings
from apps.developers.models import EngineeringEvidence

@api_view(['GET'])
def summarize_member_evidence(request, pk):
    member = get_object_or_404(User, id=pk)
    evidence = EngineeringEvidence.objects.filter(user=member, source='GITHUB').first()
    
    if not evidence:
        return Response({"summary": "No GitHub evidence available to summarize."})
        
    metadata = evidence.evidence_metadata or {}
    last_analyzed_str = evidence.last_analyzed_at.isoformat() if evidence.last_analyzed_at else None
    
    cached_summary = metadata.get('ai_summary')
    cached_timestamp = metadata.get('ai_summary_timestamp')
    
    if cached_summary and cached_timestamp == last_analyzed_str:
        return Response({"summary": cached_summary, "cached": True})
        
    prompt = f"""
    You are an engineering intelligence AI. Summarize the following developer's GitHub evidence in 2-3 short, factual sentences.
    Focus on their primary languages, repository experience, and key technical skills. Do not invent any information.
    
    Developer: {member.username}
    Total Repositories: {evidence.repository_count}
    Repository Details: {evidence.repositories}
    Technologies: {evidence.technology_evidence}
    """
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        summary_text = response.text.strip()
        
        EngineeringEvidence.objects.filter(id=evidence.id).update(
            evidence_metadata={
                **metadata,
                'ai_summary': summary_text,
                'ai_summary_timestamp': last_analyzed_str
            }
        )
        return Response({"summary": summary_text, "cached": False})
    except ImportError:
        return Response({"summary": "AI summarization unavailable (google-generativeai not installed)."})
    except Exception as e:
        return Response({"summary": "Could not generate summary at this time.", "error": str(e)})


# ─────────────────────────────────────────────────────────────────────────────
# Phase 3: Unavailability Status Endpoint
# GET /api/intelligence/unavailability-status/<user_id>/
# Returns live unavailability state + blast radius for a given member.
# Used by DecisionPoint live mode and SimulationCenter stale-state check.
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
def unavailability_status(request, user_id):
    user = get_object_or_404(User, id=user_id)

    session = PresenceSession.objects.filter(user=user).order_by('-last_activity').first()
    is_unavailable = session and session.status == 'UNAVAILABLE'

    # Critical affected tasks
    affected_tasks = []
    downstream_impact = []
    if is_unavailable:
        from apps.ai.tools import _collect_downstream
        critical_tasks = Task.objects.filter(
            assignee=user,
            priority__in=['P0', 'P1'],
            status__in=['To Do', 'In Progress', 'In Review']
        )
        for task in critical_tasks:
            affected_tasks.append({
                "id": task.id,
                "title": task.title,
                "priority": task.priority,
                "status": task.status,
                "project_name": task.project.name,
            })
            downstream_impact.extend(_collect_downstream(task))

    # Check for active simulation scenarios
    from apps.simulations.models import SimulationScenario
    active_scenario = SimulationScenario.objects.filter(
        unavailable_member=user,
        status="EVALUATED"
    ).order_by('-created_at').first()

    return Response({
        "user_id": user.id,
        "username": user.username,
        "is_unavailable": is_unavailable,
        "presence_status": session.status if session else "OFFLINE",
        "unavailable_until": session.unavailable_until.isoformat() if (session and session.unavailable_until) else None,
        "unavailable_reason": session.unavailable_reason if session else "",
        "affected_tasks": affected_tasks,
        "downstream_impact": downstream_impact,
        "has_active_decision": active_scenario is not None,
        "active_scenario_id": active_scenario.id if active_scenario else None,
    })




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recommend_and_assign(request):
    """
    POST /api/intelligence/recommend-assign/
    Body: { task_id: int, developer_id: int }

    Assigns the given developer to the task and broadcasts a TASK_UPDATED
    WebSocket event so the Kanban board and Intelligence view refresh live.
    """
    task_id = request.data.get('task_id')
    developer_id = request.data.get('developer_id')

    if not task_id or not developer_id:
        return Response({'error': 'task_id and developer_id are required.'}, status=400)

    task = get_object_or_404(Task, id=task_id)
    developer = get_object_or_404(User, id=developer_id)

    task.assignee = developer
    task.save(update_fields=['assignee'])

    # Broadcast so Kanban + Intelligence views refresh in real-time
    try:
        from apps.realtime.models import EngineEvent
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        from apps.tasks.serializers import TaskSerializer

        event_payload = {
            'task_id': task.id,
            'new_status': task.status,
            'new_assignee_id': developer.id,
            'new_assignee_name': developer.get_full_name() or developer.username,
            'task_data': TaskSerializer(task).data,
        }
        EngineEvent.objects.create(
            event_type='TASK_UPDATED',
            actor=request.user,
            project=task.project,
            task=task,
            payload=event_payload,
        )
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'workspace_global',
            {'type': 'engine_event', 'payload': {'event_type': 'TASK_UPDATED', **event_payload}}
        )
    except Exception as e:
        # Don't fail the assignment if the broadcast fails
        pass

    return Response({
        'success': True,
        'task_id': task.id,
        'assignee_id': developer.id,
        'assignee_name': developer.get_full_name() or developer.username,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unassigned_tasks(request):
    """
    GET /api/intelligence/unassigned-tasks/
    Returns all tasks with no assignee in the current workspace.
    """
    from apps.workspaces.permissions import get_current_workspace
    workspace = get_current_workspace(request)
    if not workspace:
        return Response({'tasks': []})

    projects = Project.objects.filter(workspace=workspace)
    tasks = Task.objects.filter(project__in=projects, assignee__isnull=True).exclude(
        status='DONE'
    ).select_related('project').order_by('priority', 'created_at')

    return Response({
        'tasks': [
            {
                'id': t.id,
                'title': t.title,
                'priority': t.priority,
                'status': t.status,
                'project_id': t.project_id,
                'project_name': t.project.name,
            }
            for t in tasks
        ]
    })

