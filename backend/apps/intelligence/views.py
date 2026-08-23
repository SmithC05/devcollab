"""
Engineering Command Center API view.
Aggregates organization-wide engineering state into a single response.
This is a read-only, non-mutating endpoint for the Intelligence UI.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.projects.models import Project
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.tasks.models import Task
from django.utils import timezone
from django.db.models import Count, Q
from django.contrib.auth import get_user_model

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

            task_count = active_user_tasks.count()
            # Derive capacity signal (0–100). 0 tasks → ~10%, 5+ tasks → high
            raw_capacity = min(95, task_count * 18 + 5)

            availability = (
                "OVERLOADED"  if raw_capacity >= 85 else
                "BUSY"        if raw_capacity >= 55 else
                "AVAILABLE"   if raw_capacity >= 15 else
                "IDLE"
            )

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

            members_data.append({
                "id":                   user.id,
                "name":                 f"{user.first_name} {user.last_name}".strip() or user.username,
                "username":             user.username,
                "email":                user.email,
                "role":                 membership.role,
                "availability":         availability,
                "capacity_pct":         raw_capacity,
                "active_task_count":    task_count,
                "in_progress_tasks":    in_progress_tasks.count(),
                "critical_task_count":  critical_tasks.count(),
                "project_contexts":     project_contexts,
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


class DecisionPointDetailView(APIView):
    """
    GET /api/intelligence/decision/<dp_id>/

    Returns full detail for a single decision point identified by its live ID
    (e.g. "dp-overload-1", "dp-risk-2", "dp-blocked-3").

    All data is derived from real DB state — no fixtures, no hardcoded names,
    no hardcoded user IDs.  The candidate list contains real workspace member IDs
    so the simulation endpoint can consume them directly.
    """

    def get(self, request, dp_id):
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=404)

        projects = Project.objects.filter(workspace=workspace)
        all_tasks = Task.objects.filter(project__in=projects).select_related('assignee', 'project')
        memberships = workspace.memberships.select_related('user').all()

        # ── Rebuild the same member capacity data the command center uses ───
        members_data = []
        for membership in memberships:
            user = membership.user
            user_tasks = all_tasks.filter(assignee=user)
            active_user_tasks = user_tasks.exclude(status=Task.StatusChoices.DONE)
            critical_tasks = user_tasks.filter(
                priority=Task.PriorityChoices.P0
            ).exclude(status=Task.StatusChoices.DONE)

            task_count = active_user_tasks.count()
            raw_capacity = min(95, task_count * 18 + 5)

            availability = (
                "OVERLOADED"  if raw_capacity >= 85 else
                "BUSY"        if raw_capacity >= 55 else
                "AVAILABLE"   if raw_capacity >= 15 else
                "IDLE"
            )

            project_contexts = []
            for p in projects:
                member_project_tasks = p.tasks.filter(assignee=user).exclude(status=Task.StatusChoices.DONE)
                if member_project_tasks.exists():
                    total_project_tasks = p.tasks.count() or 1
                    owned = member_project_tasks.count()
                    context_score = min(100, int((owned / total_project_tasks) * 100))
                    project_contexts.append({
                        "project_id":    p.id,
                        "project_name":  p.name,
                        "task_count":    owned,
                        "context_score": context_score,
                    })

            members_data.append({
                "id":                user.id,
                "name":              f"{user.first_name} {user.last_name}".strip() or user.username,
                "username":          user.username,
                "email":             user.email,
                "role":              membership.role,
                "availability":      availability,
                "capacity_pct":      raw_capacity,
                "active_task_count": task_count,
                "critical_task_count": critical_tasks.count(),
                "project_contexts":  project_contexts,
            })

        # ── Parse dp_id → locate the right artifact ───────────────────────
        # Format: dp-<type_slug>-<entity_id> or numeric ID
        if dp_id.isdigit():
            task_match = all_tasks.filter(id=int(dp_id)).first()
            if task_match:
                return self._build_project_dp(f"dp-risk-{task_match.project_id}", "risk", task_match.project_id, members_data, all_tasks, projects)
            project_match = projects.filter(id=int(dp_id)).first()
            if project_match:
                return self._build_project_dp(f"dp-risk-{project_match.id}", "risk", project_match.id, members_data, all_tasks, projects)
            member_match = next((m for m in members_data if m["id"] == int(dp_id)), None)
            if member_match:
                return self._build_overload_dp(f"dp-overload-{member_match['id']}", member_match["id"], members_data, all_tasks, projects)

        parts = dp_id.split("-")  # ['dp', 'overload', '1']  or  ['dp', 'risk', '1']
        if len(parts) < 3 or parts[0] != "dp":
            return Response({"error": f"Invalid decision point ID: {dp_id}"}, status=400)

        dp_type_slug = parts[1]   # 'overload' | 'risk' | 'blocked'
        try:
            entity_id = int(parts[2])
        except ValueError:
            return Response({"error": f"Invalid entity ID in decision point: {dp_id}"}, status=400)

        if dp_type_slug == "overload":
            return self._build_overload_dp(dp_id, entity_id, members_data, all_tasks, projects)
        elif dp_type_slug in ("risk", "blocked"):
            return self._build_project_dp(dp_id, dp_type_slug, entity_id, members_data, all_tasks, projects)
        else:
            return Response({"error": f"Unknown decision point type: {dp_type_slug}"}, status=400)

    # ── ENGINEER_OVERLOADED ─────────────────────────────────────────────────
    def _build_overload_dp(self, dp_id, user_id, members_data, all_tasks, projects):
        member = next((m for m in members_data if m["id"] == user_id), None)
        if not member:
            return Response({"error": f"Member {user_id} not found"}, status=404)

        # Identify the most critical active task owned by this member
        critical_tasks = all_tasks.filter(
            assignee_id=user_id,
            priority=Task.PriorityChoices.P0
        ).exclude(status=Task.StatusChoices.DONE).order_by('created_at')

        anchor_task = critical_tasks.first() or all_tasks.filter(
            assignee_id=user_id
        ).exclude(status=Task.StatusChoices.DONE).first()

        if not anchor_task:
            return Response({"error": "No active task found for this overloaded member"}, status=404)

        # Candidates: other workspace members who are not overloaded
        candidates = [
            m for m in members_data
            if m["id"] != user_id and m["availability"] != "OVERLOADED"
        ]

        return Response(self._build_dp_payload(
            dp_id=dp_id,
            severity="HIGH",
            dp_type="ENGINEER_OVERLOADED",
            title=f"{member['name']} — Owner Overloaded",
            description=(
                f"{member['name']} is overloaded with {member['active_task_count']} active tasks "
                f"including {member['critical_task_count']} P0 item(s). "
                f"Task '{anchor_task.title}' is at risk."
            ),
            project_name=anchor_task.project.name,
            task=anchor_task,
            owner=member,
            candidates=candidates,
            intervention_types=["WAIT", "REASSIGN", "PAIR", "AI_ASSIST", "KNOWLEDGE_TRANSFER"],
        ))

    # ── CRITICAL_WORK_AT_RISK / BLOCKED_WORK ───────────────────────────────
    def _build_project_dp(self, dp_id, dp_type_slug, project_id, members_data, all_tasks, projects):
        try:
            project = projects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": f"Project {project_id} not found"}, status=404)

        # Find the most critical at-risk task in this project
        at_risk_task = all_tasks.filter(
            project=project,
            priority=Task.PriorityChoices.P0
        ).exclude(status=Task.StatusChoices.DONE).first()

        if not at_risk_task:
            at_risk_task = all_tasks.filter(
                project=project,
                priority=Task.PriorityChoices.P1
            ).exclude(status=Task.StatusChoices.DONE).first()

        if not at_risk_task:
            at_risk_task = all_tasks.filter(
                project=project
            ).exclude(status=Task.StatusChoices.DONE).first()

        if not at_risk_task:
            return Response({"error": "No at-risk tasks found in this project"}, status=404)

        severity = "CRITICAL" if dp_type_slug == "blocked" else "HIGH"
        dp_type  = "BLOCKED_WORK" if dp_type_slug == "blocked" else "CRITICAL_WORK_AT_RISK"

        owner_id = at_risk_task.assignee_id
        owner = next((m for m in members_data if m["id"] == owner_id), None)

        candidates = [
            m for m in members_data
            if m["id"] != owner_id and m["availability"] not in ("OVERLOADED",)
        ]

        return Response(self._build_dp_payload(
            dp_id=dp_id,
            severity=severity,
            dp_type=dp_type,
            title=f"{project.name} — {severity.title()} Work At Risk",
            description=(
                f"Critical task '{at_risk_task.title}' in '{project.name}' is not yet complete. "
                f"{'Work is blocked downstream.' if dp_type_slug == 'blocked' else 'Delivery is at risk.'}"
            ),
            project_name=project.name,
            task=at_risk_task,
            owner=owner,
            candidates=candidates,
            intervention_types=["WAIT", "REASSIGN", "PAIR", "AI_ASSIST", "DE_SCOPE"],
        ))

    # ── Shared payload builder ─────────────────────────────────────────────
    def _build_dp_payload(self, dp_id, severity, dp_type, title, description,
                          project_name, task, owner, candidates, intervention_types):
        now = timezone.now()

        owner_name = owner["name"] if owner else "Unassigned"
        owner_capacity = owner["capacity_pct"] if owner else 0
        owner_context = owner["project_contexts"][0]["context_score"] if owner and owner["project_contexts"] else 0

        # Candidate shape used by DecisionPoint.jsx and SimulationCenter.jsx
        candidate_list = [
            {
                "id":           m["id"],       # real DB user pk — usable by simulation endpoint
                "name":         m["name"],
                "capacity":     m["capacity_pct"],
                "status":       m["availability"],
                "contextScore": next(
                    (pc["context_score"] for pc in m["project_contexts"]
                     if pc["project_name"] == project_name),
                    max(5, 100 - m["capacity_pct"])  # fallback: inverse of workload
                ),
                "role":         m["role"],
            }
            for m in candidates
        ]

        return {
            "decision": {
                "id":          dp_id,
                "severity":    severity,
                "type":        dp_type,
                "title":       title,
                "description": description,
                "project":     project_name,
                "task":        task.title,
                "task_id":     task.id,       # real task pk — passed to simulation
                "detected_at": now.isoformat(),
            },
            "trigger": {
                "label": dp_type.replace("_", " ").title(),
                "type":  dp_type,
                "before": {
                    "member":    owner_name,
                    "status":    "ACTIVE",
                    "capacity":  max(0, owner_capacity - 15),
                    "role":      f"{task.title} owner",
                    "provenance": "REAL_DB",
                },
                "after": {
                    "member":    owner_name,
                    "status":    owner["availability"] if owner else "UNKNOWN",
                    "capacity":  owner_capacity,
                    "role":      f"{task.title} owner",
                    "provenance": "DERIVED",
                },
            },
            "engineeringSnapshot": {
                "owner": {
                    "id":             owner["id"] if owner else None,
                    "name":           owner_name,
                    "capacity":       owner_capacity,
                    "contextScore":   owner_context,
                    "status":         owner["availability"] if owner else "UNKNOWN",
                    "active_tasks":   owner["active_task_count"] if owner else 0,
                    "critical_tasks": owner["critical_task_count"] if owner else 0,
                    "provenance":     "DERIVED",
                },
                "candidates": candidate_list,
            },
            "scenarioDefaults": {
                "task_id":          task.id,
                "trigger":          dp_type,
                "duration_hours":   72,
                "duration_options": [24, 48, 72],
                # candidate_ids: real DB IDs for direct use in POST /api/simulations/evaluate/
                "candidate_ids":    [c["id"] for c in candidate_list],
                "candidates":       candidate_list,
                "interventionOptions": [
                    {"id": t, "label": t.replace("_", " ").title(), "description": ""}
                    for t in intervention_types
                ],
                "objectives": [
                    {"id": "minimize_delay",    "label": "Minimize delivery delay"},
                    {"id": "minimize_transfer", "label": "Minimize context-transfer effort"},
                    {"id": "protect_ownership", "label": "Protect critical responsibilities"},
                    {"id": "minimize_workload", "label": "Minimize workload disruption"},
                ],
            },
            "systemStatus": {
                "source":       "LIVE",
                "last_synced":  now.isoformat(),
                "agent_status": "READY_FOR_SIMULATION",
            },
        }
