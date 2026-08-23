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



# ─────────────────────────────────────────────────────────────────────────────
# Phase 4 — Incident Intelligence
# ─────────────────────────────────────────────────────────────────────────────
import json
import re
import logging
from django.utils import timezone
from apps.realtime.models import EngineEvent, PresenceSession
from apps.workspaces.models import WorkspaceMembership
from apps.workspaces.permissions import get_current_workspace
from apps.projects.models import WikiPage, Snippet
from apps.simulations.models import SimulationScenario
from engine.simulation.core import run_simulation
from apps.integrations.evidence import get_developer_context
from apps.ai.prompts import INCIDENT_UNDERSTANDING_PROMPT, INCIDENT_HISTORY_SUMMARY_PROMPT
from rest_framework.decorators import authentication_classes, permission_classes

logger = logging.getLogger(__name__)

from rest_framework.authentication import BaseAuthentication

class BypassCSRFAuthentication(BaseAuthentication):
    """
    Custom DRF authentication class that simply maps the Django request.user 
    (set by JWTAuthMiddleware) to the DRF request.user, without enforcing CSRF 
    checks that SessionAuthentication normally performs.
    """
    def authenticate(self, request):
        user = getattr(request._request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        return (user, None)

def _resolve_incident_context(request):
    """
    Resolves (user, workspace) for incident views.

    DRF's request.user goes through a lazy auth pipeline that can drop
    the user set by JWTAuthMiddleware. This helper reads the user directly
    from the underlying Django HttpRequest (set by JWTAuthMiddleware) and
    then resolves the workspace — with fallback to the user's first
    membership if the X-Workspace-Id header is absent.

    Returns: (user, workspace)  — either may be None on failure.
    """
    # Read user set by JWTAuthMiddleware on the raw Django request
    raw = getattr(request, '_request', request)  # DRF wraps; fall back for plain Django
    user = getattr(raw, 'user', None)
    if user is None or not user.is_authenticated:
        return None, None

    workspace_id = request.META.get('HTTP_X_WORKSPACE_ID')

    if workspace_id:
        try:
            m = WorkspaceMembership.objects.select_related('workspace').get(
                user=user, workspace_id=workspace_id
            )
            return user, m.workspace
        except (WorkspaceMembership.DoesNotExist, ValueError):
            pass  # fall through to first-workspace fallback

    # Fallback: user's first workspace
    m = WorkspaceMembership.objects.select_related('workspace').filter(user=user).first()
    if m:
        return user, m.workspace

    return user, None

def _call_gemini_text(prompt: str) -> str:
    """
    Calls Gemini with a plain text prompt and returns the text response.
    Raises ValueError if API key not configured.
    Raises Exception on any other failure.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', None)
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    from google import genai as genai_client
    from google.genai import types as genai_types
    client = genai_client.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=genai_types.GenerateContentConfig(temperature=0.1)
    )
    return response.text.strip()


def _deterministic_incident_intent(message: str) -> dict:
    """
    Fallback: keyword-based incident intent extraction when Gemini is unavailable.
    Only extracts what the message supports — no hallucination.
    """
    msg_lower = message.lower()

    # System detection
    system = "unknown_system"
    if any(w in msg_lower for w in ["payment", "gateway", "transaction", "checkout"]):
        system = "payment_gateway"
    elif any(w in msg_lower for w in ["auth", "login", "oauth", "jwt"]):
        system = "authentication"
    elif any(w in msg_lower for w in ["api", "endpoint", "service"]):
        system = "api_service"
    elif any(w in msg_lower for w in ["database", "db", "postgres", "sql"]):
        system = "database"

    # Severity
    severity = "HIGH"
    critical_words = ["failing", "down", "cannot", "outage", "timeout", "timing out", "broken", "unavailable", "not working"]
    high_words = ["slow", "degraded", "intermittent", "errors", "error"]
    if any(w in msg_lower for w in critical_words):
        severity = "CRITICAL"
    elif any(w in msg_lower for w in high_words):
        severity = "HIGH"
    else:
        severity = "MEDIUM"

    # Symptoms
    symptoms = []
    if any(w in msg_lower for w in ["timeout", "timing out", "timed out"]):
        symptoms.append("transaction_timeout")
    if any(w in msg_lower for w in ["failing", "failed", "failure"]):
        symptoms.append("service_failure")
    if any(w in msg_lower for w in ["down", "unavailable"]):
        symptoms.append("service_unavailable")
    if any(w in msg_lower for w in ["error", "errors"]):
        symptoms.append("error_rate_spike")
    if not symptoms:
        symptoms.append("unspecified_degradation")

    # Environment
    environment = "UNKNOWN"
    if "production" in msg_lower or "prod" in msg_lower:
        environment = "PRODUCTION"
    elif "staging" in msg_lower:
        environment = "STAGING"
    elif "dev" in msg_lower or "development" in msg_lower:
        environment = "DEVELOPMENT"

    return {
        "intent": "CRITICAL_INCIDENT",
        "system": system,
        "severity": severity,
        "symptoms": symptoms,
        "environment": environment,
        "needs_clarification": False,
        "clarification_question": None,
        "extraction_method": "DETERMINISTIC_FALLBACK"
    }


@api_view(['POST'])
@authentication_classes([BypassCSRFAuthentication])
@permission_classes([])
def incident_understand(request):
    """
    POST /api/intelligence/incident/understand/
    Extracts structured intent from a natural-language incident message.
    Uses Gemini; falls back to deterministic keyword extraction if unavailable.
    Never fabricates task IDs, engineers, root cause, or remediation steps.
    """
    print("----- INSIDE INCIDENT UNDERSTAND -----")
    message = request.data.get("message", "").strip()
    if not message:
        return Response({"error": "message is required"}, status=400)

    if len(message) < 5:
        return Response({
            "needs_clarification": True,
            "clarification_question": "Can you describe what is failing and in which environment?"
        })

    # Try Gemini first
    try:
        full_prompt = f"{INCIDENT_UNDERSTANDING_PROMPT}\n\nIncident message: {message}"
        raw = _call_gemini_text(full_prompt)
        # Strip markdown fences if present
        raw = re.sub(r'^```json\s*', '', raw.strip())
        raw = re.sub(r'^```\s*', '', raw.strip())
        raw = re.sub(r'```\s*$', '', raw.strip())
        intent = json.loads(raw)
        intent["extraction_method"] = "GEMINI"
    except Exception as e:
        logger.warning(f"Gemini incident understanding failed, using deterministic fallback: {e}")
        intent = _deterministic_incident_intent(message)

    intent["original_message"] = message
    return Response(intent)


@api_view(['POST'])
@authentication_classes([BypassCSRFAuthentication])
@permission_classes([])
def incident_analyze(request):
    """
    POST /api/intelligence/incident/analyze/
    Given a structured incident intent:
    1. Creates CRITICAL_INCIDENT EngineEvent
    2. Finds affected project + tasks + dependency graph
    3. Checks PresenceSession availability for owners
    4. Retrieves historical knowledge (WikiPage, Snippet, EngineeringEvidence)
    5. Summarizes history with Gemini
    6. Identifies eligible responder candidates with context + capacity
    """
    actor, workspace = _resolve_incident_context(request)
    if not actor:
        return Response({"error": "Authentication required. Please log in again."}, status=401)
    if not workspace:
        return Response({"error": "No workspace found. Please ensure you are a member of a workspace."}, status=400)

    intent = request.data.get("intent", {})
    system = intent.get("system", "unknown_system")
    severity = intent.get("severity", "HIGH")
    symptoms = intent.get("symptoms", [])
    environment = intent.get("environment", "UNKNOWN")
    original_message = intent.get("original_message", "")

    # ── 1. Record EngineEvent ─────────────────────────────────────────────
    event = EngineEvent.objects.create(
        event_type="CRITICAL_INCIDENT",
        actor=actor,
        workspace=workspace,
        payload={
            "workspace_id": workspace.id,
            "actor_id": actor.id if actor else None,
            "severity": severity,
            "system": system,
            "symptoms": symptoms,
            "environment": environment,
            "summary": f"Production incident: {system.replace('_', ' ').title()}",
            "original_message": original_message,
            "timestamp": timezone.now().isoformat(),
            "status": "ACTIVE",
            "timeline": [
                {"step": "INCIDENT_REPORTED", "ts": timezone.now().isoformat(), "label": "Incident reported"}
            ]
        }
    )

    # ── 2. Find affected project + tasks ─────────────────────────────────
    projects = workspace.projects.all()

    # Match project by system name keywords
    keywords = [k for k in system.replace('_', ' ').split() if len(k) > 2]
    affected_project = None
    for kw in keywords:
        for p in projects:
            if kw.lower() in p.name.lower():
                affected_project = p
                break
        if affected_project:
            break
    # Fallback: first active project
    if not affected_project:
        affected_project = projects.filter(is_active=True).first()

    affected_tasks = []
    blast_radius_tasks = []
    responsible_engineers = {}

    if affected_project:
        # Find directly-affected tasks (in-progress or blocked)
        candidate_tasks = affected_project.tasks.exclude(
            status=Task.StatusChoices.DONE
        ).order_by('priority')

        # Match tasks to incident system keywords
        direct_tasks = []
        downstream_tasks = []

        for task in candidate_tasks:
            title_lower = task.title.lower()
            if any(kw.lower() in title_lower for kw in keywords):
                direct_tasks.append(task)
            else:
                downstream_tasks.append(task)

        if not direct_tasks:
            # Fallback: treat all non-done tasks as potentially affected
            direct_tasks = list(candidate_tasks[:6])

        # Build dependency graph
        for task in direct_tasks:
            downstream = list(task.blocking_tasks.exclude(status=Task.StatusChoices.DONE))
            blast_radius_tasks.extend(downstream)

            owner_info = None
            if task.assignee:
                owner_info = {
                    "id": task.assignee.id,
                    "name": task.assignee.get_full_name() or task.assignee.username,
                    "username": task.assignee.username,
                }

            affected_tasks.append({
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "owner": owner_info,
                "downstream_count": len(downstream),
                "downstream": [{"id": d.id, "title": d.title, "status": d.status} for d in downstream]
            })

            if task.assignee:
                uid = task.assignee.id
                if uid not in responsible_engineers:
                    responsible_engineers[uid] = {
                        "id": uid,
                        "name": task.assignee.get_full_name() or task.assignee.username,
                        "username": task.assignee.username,
                        "tasks": []
                    }
                responsible_engineers[uid]["tasks"].append({"id": task.id, "title": task.title})

        # Add downstream task owners
        for task in blast_radius_tasks:
            if task.assignee:
                uid = task.assignee.id
                if uid not in responsible_engineers:
                    responsible_engineers[uid] = {
                        "id": uid,
                        "name": task.assignee.get_full_name() or task.assignee.username,
                        "username": task.assignee.username,
                        "tasks": []
                    }

    # ── 3. Availability check via PresenceSession ─────────────────────────
    presence_map = {}
    sessions = PresenceSession.objects.filter(user__id__in=responsible_engineers.keys())
    for s in sessions:
        presence_map[s.user_id] = s.status

    for uid, eng in responsible_engineers.items():
        raw_status = presence_map.get(uid, "UNKNOWN")
        # Map presence to availability label
        avail_map = {
            "ACTIVE": "AVAILABLE", "IDLE": "IDLE",
            "OFFLINE": "UNAVAILABLE", "UNAVAILABLE": "UNAVAILABLE", "UNKNOWN": "UNKNOWN"
        }
        eng["availability"] = avail_map.get(raw_status, "UNKNOWN")
        eng["presence_status"] = raw_status

    # ── 4. Historical knowledge retrieval ─────────────────────────────────
    historical_evidence = []
    evidence_text_parts = []

    if affected_project:
        # Search WikiPages
        for kw in keywords[:3]:
            pages = WikiPage.objects.filter(project=affected_project, title__icontains=kw)
            for page in pages[:3]:
                text = re.sub(r'<[^>]+>', '', page.content)[:500]
                historical_evidence.append({
                    "type": "WIKI_PAGE",
                    "title": page.title,
                    "snippet": text[:200],
                    "source": "REAL_DB"
                })
                evidence_text_parts.append(f"Wiki: {page.title}\n{text}")

        # Search Snippets
        for kw in keywords[:3]:
            snippets = Snippet.objects.filter(project=affected_project, title__icontains=kw)
            for snip in snippets[:3]:
                historical_evidence.append({
                    "type": "SNIPPET",
                    "title": snip.title,
                    "snippet": snip.description[:200] if snip.description else snip.code[:200],
                    "source": "REAL_DB"
                })
                evidence_text_parts.append(f"Snippet: {snip.title}\n{snip.description[:300]}")

    # Search EngineeringEvidence for any user with gateway/payment history
    all_memberships = workspace.memberships.select_related('user').all()
    for m in all_memberships:
        ev = EngineeringEvidence.objects.filter(user=m.user).first()
        if ev and ev.similar_work_evidence:
            for kw in keywords:
                ev_str = json.dumps(ev.similar_work_evidence).lower()
                if kw.lower() in ev_str:
                    historical_evidence.append({
                        "type": "ENGINEERING_EVIDENCE",
                        "title": f"{m.user.username} — similar work evidence",
                        "snippet": str(ev.similar_work_evidence)[:200],
                        "source": "REAL_GITHUB"
                    })
                    evidence_text_parts.append(f"Dev evidence ({m.user.username}): {str(ev.similar_work_evidence)[:300]}")
                    break

    # Search previous CRITICAL_INCIDENT events
    prev_incidents = EngineEvent.objects.filter(
        workspace=workspace,
        event_type="CRITICAL_INCIDENT"
    ).exclude(id=event.id).order_by('-timestamp')[:5]

    for prev in prev_incidents:
        prev_sys = prev.payload.get("system", "")
        if any(kw.lower() in prev_sys.lower() for kw in keywords):
            resolution = prev.payload.get("resolution", "")
            if resolution:
                historical_evidence.append({
                    "type": "PREVIOUS_INCIDENT",
                    "title": f"Previous {prev_sys} incident",
                    "snippet": resolution[:300],
                    "source": "REAL_DB"
                })
                evidence_text_parts.append(f"Previous incident resolution: {resolution[:300]}")

    # ── 5. GenAI history summary ──────────────────────────────────────────
    genai_summary = "No matching historical resolution found."
    if evidence_text_parts:
        try:
            prompt = INCIDENT_HISTORY_SUMMARY_PROMPT.format(
                system=system.replace('_', ' '),
                symptoms=', '.join(symptoms),
                evidence='\n\n'.join(evidence_text_parts)[:3000]
            )
            genai_summary = _call_gemini_text(prompt)
        except Exception as e:
            logger.warning(f"Gemini history summary failed: {e}")
            genai_summary = "Historical knowledge summary unavailable."

    # ── 6. Candidate responders ───────────────────────────────────────────
    all_tasks = Task.objects.filter(project__workspace=workspace)
    candidates = []
    seen_ids = set()

    memberships = workspace.memberships.select_related('user').filter(
        role__in=['DEVELOPER', 'OWNER', 'LEAD']
    )

    # Use the first affected task as context reference for ML features
    reference_task = None
    if affected_project:
        reference_task = affected_project.tasks.exclude(status=Task.StatusChoices.DONE).first()

    for m in memberships:
        u = m.user
        if u.id in seen_ids:
            continue
        seen_ids.add(u.id)

        cap_data = calculate_capacity(u, all_tasks)
        context_score = 0.0
        features = {}
        provenance = {}
        evidence_arr = []

        if reference_task:
            try:
                features, provenance, explanations = get_developer_context(reference_task, u)
                context_score = (
                    (features.get("repository_familiarity") or 0.0) * 0.4 +
                    (features.get("project_familiarity") or 0.0) * 0.4 +
                    (features.get("technology_familiarity") or 0.0) * 0.2
                )
                evidence_arr = [
                    {"feature": k, "value": features[k], "provenance": provenance[k], "explanation": explanations.get(k, "")}
                    for k in features
                ]
            except Exception as e:
                logger.warning(f"Could not compute context for {u.username}: {e}")

        context_level = "HIGH" if context_score > 0.6 else "MEDIUM" if context_score > 0.3 else "LOW"

        # Availability from PresenceSession
        session = PresenceSession.objects.filter(user=u).order_by('-last_activity').first()
        raw_status = session.status if session else "UNKNOWN"
        avail_map = {
            "ACTIVE": "AVAILABLE", "IDLE": "IDLE",
            "OFFLINE": "UNAVAILABLE", "UNAVAILABLE": "UNAVAILABLE", "UNKNOWN": "UNKNOWN"
        }
        availability = avail_map.get(raw_status, "UNKNOWN")

        candidates.append({
            "id": u.id,
            "name": u.get_full_name() or u.username,
            "username": u.username,
            "role": m.role,
            "availability": availability,
            "presence_status": raw_status,
            "capacity": cap_data,
            "context_score": round(context_score, 3),
            "context_level": context_level,
            "evidence": evidence_arr[:5]
        })

    # Sort: available first, then by context score desc
    def candidate_sort_key(c):
        avail_order = {"AVAILABLE": 0, "IDLE": 1, "BUSY": 2, "UNAVAILABLE": 3, "UNKNOWN": 4}
        return (avail_order.get(c["availability"], 5), -c["context_score"])

    candidates.sort(key=candidate_sort_key)

    # Update event timeline
    event.payload["timeline"].append({
        "step": "IMPACT_IDENTIFIED",
        "ts": timezone.now().isoformat(),
        "label": f"Affected project identified: {affected_project.name if affected_project else 'Unknown'}"
    })
    event.payload["timeline"].append({
        "step": "HISTORY_SEARCHED",
        "ts": timezone.now().isoformat(),
        "label": f"Historical knowledge searched — {len(historical_evidence)} sources found"
    })
    event.payload["timeline"].append({
        "step": "CANDIDATES_EVALUATED",
        "ts": timezone.now().isoformat(),
        "label": f"{len(candidates)} candidate responders evaluated"
    })
    event.save()

    return Response({
        "incident_event_id": event.id,
        "severity": severity,
        "system": system,
        "symptoms": symptoms,
        "environment": environment,
        "affected_project": {
            "id": affected_project.id,
            "name": affected_project.name,
        } if affected_project else None,
        "affected_tasks": affected_tasks,
        "blast_radius": [
            {"id": t.id, "title": t.title, "status": t.status}
            for t in list(dict.fromkeys(blast_radius_tasks))
        ],
        "responsible_engineers": list(responsible_engineers.values()),
        "historical_evidence": historical_evidence,
        "genai_history_summary": genai_summary,
        "candidates": candidates,
        "reference_task_id": reference_task.id if reference_task else None,
    })


@api_view(['POST'])
@authentication_classes([BypassCSRFAuthentication])
@permission_classes([])
def incident_simulate(request):
    """
    POST /api/intelligence/incident/simulate/
    Runs the existing deterministic simulation engine against incident candidates.
    Records a SimulationScenario for approval. Returns recommendation.
    """
    incident_event_id = request.data.get("incident_event_id")
    task_ids = request.data.get("task_ids", [])
    candidate_ids = request.data.get("candidate_ids", [])

    if not incident_event_id or not task_ids or not candidate_ids:
        return Response({"error": "incident_event_id, task_ids, and candidate_ids are required"}, status=400)

    try:
        incident_event = EngineEvent.objects.get(id=incident_event_id)
    except EngineEvent.DoesNotExist:
        return Response({"error": "Incident event not found"}, status=404)

    # Use the primary task (first task_id) for simulation + scenario record
    primary_task_id = task_ids[0]
    try:
        primary_task = Task.objects.get(id=primary_task_id)
    except Task.DoesNotExist:
        return Response({"error": "Primary task not found"}, status=404)

    # Validate candidates exist
    valid_candidates = []
    for cid in candidate_ids:
        try:
            from django.contrib.auth import get_user_model
            U = get_user_model()
            u = U.objects.get(id=cid)
            valid_candidates.append(u)
        except Exception:
            pass

    if not valid_candidates:
        return Response({"error": "No valid candidates"}, status=400)

    # Run simulation engine for each candidate
    evaluation_results = []
    for candidate in valid_candidates:
        results = run_simulation(primary_task.id, candidate.id)
        evaluation_results.append({
            "candidate_id": candidate.id,
            "candidate_name": candidate.get_full_name() or candidate.username,
            "interventions": results
        })

    # Derive backend recommendation
    best_score = float('inf')
    recommendation = None

    for cand_result in evaluation_results:
        for inv in cand_result["interventions"]:
            if inv.get("error"):
                continue
            score = inv.get("estimated_completion", 999)
            risk = inv.get("risk", "HIGH")
            if risk == "HIGH":
                score += 100
            elif risk == "MEDIUM":
                score += 20

            if score < best_score:
                best_score = score
                recommendation = {
                    "candidate_id": cand_result["candidate_id"],
                    "candidate_name": cand_result["candidate_name"],
                    "intervention": inv.get("type"),
                    "estimated_completion": inv.get("estimated_completion"),
                    "risk": risk,
                    "predicted_transfer_effort": inv.get("predicted_transfer_effort_hours"),
                    "predicted_transfer_reduction": inv.get("predicted_transfer_effort_reduction_hours"),
                    "reason": inv.get("reason", [])
                }

    # Recommendation explanation factors
    recommendation_reasons = []
    if recommendation:
        rec_cid = recommendation["candidate_id"]
        for cr in evaluation_results:
            if cr["candidate_id"] == rec_cid:
                recommendation_reasons.append(f"CAPACITY: {cr['candidate_name']} has available capacity.")
                break
        if recommendation.get("predicted_transfer_effort") is not None:
            recommendation_reasons.append(
                f"CONTEXT: Estimated context transfer effort = {recommendation['predicted_transfer_effort']}h (ML PREDICTION)"
            )
        if recommendation.get("predicted_transfer_reduction") is not None:
            recommendation_reasons.append(
                f"TRANSFER: Knowledge transfer reduces ramp-up by ~{recommendation['predicted_transfer_reduction']}h"
            )
        recommendation_reasons.append(
            f"INTERVENTION: {recommendation['intervention']} selected as lowest-risk path."
        )

    # Persist SimulationScenario
    scenario = SimulationScenario.objects.create(
        task=primary_task,
        trigger="CRITICAL_INCIDENT",
        results={
            "incident_event_id": incident_event_id,
            "evaluation": evaluation_results,
            "recommendation": recommendation
        },
        status="EVALUATED"
    )

    # Update incident timeline
    incident_event.payload["timeline"].append({
        "step": "RESPONSE_SIMULATED",
        "ts": timezone.now().isoformat(),
        "label": f"Response simulation completed — {len(candidate_ids)} candidate(s) evaluated"
    })
    incident_event.payload["timeline"].append({
        "step": "RECOMMENDATION_GENERATED",
        "ts": timezone.now().isoformat(),
        "label": f"Recommendation: {recommendation['intervention'] if recommendation else 'None'} → {recommendation['candidate_name'] if recommendation else 'N/A'}"
    })
    incident_event.save()

    return Response({
        "scenario_id": scenario.id,
        "incident_event_id": incident_event_id,
        "evaluation_results": evaluation_results,
        "recommendation": recommendation,
        "recommendation_reasons": recommendation_reasons,
    })


@api_view(['POST'])
@authentication_classes([BypassCSRFAuthentication])
@permission_classes([])
def incident_approve(request):
    """
    POST /api/intelligence/incident/approve/
    Executes the approved incident response.
    RBAC enforced. Validates scenario freshness. Fires EngineEvent + WebSocket.
    """
    from apps.tasks.permissions import assert_task_permission
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    scenario_id = request.data.get("scenario_id")
    intervention = request.data.get("intervention")
    candidate_id = request.data.get("candidate_id")
    incident_event_id = request.data.get("incident_event_id")

    if not all([scenario_id, intervention, candidate_id]):
        return Response({"error": "scenario_id, intervention, and candidate_id are required"}, status=400)

    try:
        scenario = SimulationScenario.objects.get(id=scenario_id)
    except SimulationScenario.DoesNotExist:
        return Response({"error": "Simulation scenario not found"}, status=404)

    if scenario.status == "APPROVED":
        return Response({"error": "Scenario already approved — cannot execute stale recommendation."}, status=409)

    try:
        from django.contrib.auth import get_user_model
        U = get_user_model()
        candidate = U.objects.get(id=candidate_id)
    except Exception:
        return Response({"error": "Candidate not found"}, status=404)

    # RBAC check — get actor directly from middleware-set user
    actor, _ws = _resolve_incident_context(request)
    if not actor:
        return Response({"error": "Authentication required"}, status=401)
    task = scenario.task
    try:
        assert_task_permission(actor, task, 'assign')
    except Exception as e:
        return Response({"error": str(e)}, status=403)

    # Validate candidate availability (stale-check)
    session = PresenceSession.objects.filter(user=candidate).order_by('-last_activity').first()
    if session and session.status == "UNAVAILABLE":
        return Response({
            "error": "INCIDENT_STATE_CHANGED",
            "detail": f"{candidate.username} has become unavailable since simulation. Please re-evaluate."
        }, status=409)

    # Execute mutation
    if intervention in ["REASSIGN", "KNOWLEDGE_TRANSFER", "PAIR"]:
        task.assignee = candidate
        task.save()

    scenario.status = "APPROVED"
    scenario.save()

    # Update incident event
    incident_event = None
    if incident_event_id:
        try:
            incident_event = EngineEvent.objects.get(id=incident_event_id)
            incident_event.payload["timeline"].append({
                "step": "HUMAN_APPROVED",
                "ts": timezone.now().isoformat(),
                "label": f"Response approved: {intervention} → {candidate.username}"
            })
            incident_event.payload["timeline"].append({
                "step": "RESPONSE_EXECUTED",
                "ts": timezone.now().isoformat(),
                "label": f"Task ownership updated for: {task.title}"
            })
            incident_event.payload["approved_response"] = {
                "candidate_id": candidate.id,
                "candidate_name": candidate.get_full_name() or candidate.username,
                "intervention": intervention,
                "task_id": task.id,
                "task_title": task.title
            }
            incident_event.save()
        except Exception as e:
            logger.warning(f"Could not update incident event: {e}")

    # Fire EngineEvent
    approval_event = EngineEvent.objects.create(
        event_type="INCIDENT_RESPONSE_APPROVED",
        actor=request.user if request.user.is_authenticated else None,
        project=task.project,
        task=task,
        payload={
            "scenario_id": scenario.id,
            "incident_event_id": incident_event_id,
            "intervention": intervention,
            "candidate_id": candidate.id,
            "candidate_name": candidate.get_full_name() or candidate.username,
            "task_id": task.id,
            "task_title": task.title,
        }
    )

    # Broadcast via WebSocket
    channel_layer = get_channel_layer()
    if channel_layer:
        try:
            async_to_sync(channel_layer.group_send)(
                "workspace_global",
                {
                    "type": "engine_event",
                    "payload": {
                        "event_type": "INCIDENT_RESPONSE_APPROVED",
                        "incident_event_id": incident_event_id,
                        "scenario_id": scenario.id,
                        "intervention": intervention,
                        "candidate_id": candidate.id,
                        "candidate_name": candidate.get_full_name() or candidate.username,
                        "task_id": task.id,
                        "task_title": task.title,
                        "timestamp": timezone.now().isoformat(),
                    }
                }
            )
        except Exception as e:
            logger.warning(f"WebSocket broadcast failed: {e}")

    return Response({
        "success": True,
        "message": f"Incident response executed: {intervention} — {task.title} reassigned to {candidate.username}.",
        "event_id": approval_event.id,
        "updated_task": {
            "id": task.id,
            "title": task.title,
            "assignee_id": candidate.id,
            "assignee_name": candidate.get_full_name() or candidate.username,
        }
    })


@api_view(['POST'])
@authentication_classes([BypassCSRFAuthentication])
@permission_classes([])
def incident_update(request, event_id):
    """
    POST /api/intelligence/incident/<event_id>/update/
    Accepts a follow-up natural-language message (e.g. "Gateway recovered").
    Extracts update intent and updates the incident event payload.
    """
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    try:
        incident_event = EngineEvent.objects.get(id=event_id)
    except EngineEvent.DoesNotExist:
        return Response({"error": "Incident event not found"}, status=404)

    update_message = request.data.get("message", "").strip()
    if not update_message:
        return Response({"error": "message is required"}, status=400)

    # Determine update type via keywords
    msg_lower = update_message.lower()
    update_type = "UPDATE"
    new_status = incident_event.payload.get("status", "ACTIVE")

    if any(w in msg_lower for w in ["recovered", "resolved", "fixed", "working", "back up", "restored"]):
        update_type = "RESOLUTION"
        new_status = "RESOLVED"
    elif any(w in msg_lower for w in ["unavailable", "offline", "cannot respond"]):
        update_type = "RESPONDER_CHANGE"
    elif any(w in msg_lower for w in ["worse", "escalating", "critical", "spreading"]):
        update_type = "ESCALATION"
    elif any(w in msg_lower for w in ["only", "partial", "some", "still"]):
        update_type = "PARTIAL_RESOLUTION"
        new_status = "PARTIALLY_RESOLVED"

    incident_event.payload["status"] = new_status
    incident_event.payload["timeline"].append({
        "step": f"INCIDENT_{update_type}",
        "ts": timezone.now().isoformat(),
        "label": update_message[:200]
    })
    if new_status == "RESOLVED":
        incident_event.payload["resolved_at"] = timezone.now().isoformat()

    incident_event.save()

    # Emit update event
    update_event = EngineEvent.objects.create(
        event_type=f"INCIDENT_{update_type}",
        actor=request.user if request.user.is_authenticated else None,
        workspace=incident_event.workspace,
        payload={
            "incident_event_id": incident_event.id,
            "update_type": update_type,
            "new_status": new_status,
            "message": update_message,
            "timestamp": timezone.now().isoformat()
        }
    )

    channel_layer = get_channel_layer()
    if channel_layer:
        try:
            async_to_sync(channel_layer.group_send)(
                "workspace_global",
                {
                    "type": "engine_event",
                    "payload": {
                        "event_type": f"INCIDENT_{update_type}",
                        "incident_event_id": incident_event.id,
                        "new_status": new_status,
                        "message": update_message,
                        "timestamp": timezone.now().isoformat()
                    }
                }
            )
        except Exception as e:
            logger.warning(f"WebSocket update broadcast failed: {e}")

    return Response({
        "incident_event_id": incident_event.id,
        "update_type": update_type,
        "new_status": new_status,
        "timeline": incident_event.payload.get("timeline", []),
        "needs_reevaluation": update_type in ["ESCALATION", "RESPONDER_CHANGE"]
    })
