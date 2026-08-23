import json
import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.tasks.models import Task
from apps.tasks.serializers import TaskSerializer
from apps.realtime.models import EngineEvent, Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from engine.simulation.core import run_simulation
from .models import SimulationScenario

User = get_user_model()
logger = logging.getLogger(__name__)


@api_view(['POST'])
def evaluate_scenario(request):
    """
    Read-only evaluation of interventions across multiple candidates.
    Does NOT mutate engineering state or emit EngineEvents.
    Optionally records the triggering unavailable member for stale-state validation.
    """
    data = request.data
    task_id = data.get('task_id')
    trigger = data.get('trigger', 'MANUAL_EVALUATION')
    candidate_ids = data.get('candidate_ids', [])
    is_demo = data.get('is_demo', False)
    unavailable_member_id = data.get('unavailable_member_id')
    duration_hours = data.get('duration_hours')

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    evaluation_results = []
    for c_id in candidate_ids:
        results = run_simulation(task.id, c_id, is_demo)
        evaluation_results.append({"candidate_id": c_id, "interventions": results})

    # Determine recommended intervention (lowest score = best)
    best = None
    best_score = float('inf')
    for cand_eval in evaluation_results:
        for inv in cand_eval['interventions']:
            score = inv.get('estimated_completion', 99)
            if inv.get('risk') == 'HIGH':
                score += 100
            elif inv.get('risk') == 'MEDIUM':
                score += 20
            if score < best_score:
                best_score = score
                best = {**inv, 'candidate_id': cand_eval['candidate_id']}

    # Record original assignee for stale validation
    original_assignee = task.assignee

    create_kwargs = dict(
        task=task,
        trigger=trigger,
        results={"evaluation": evaluation_results, "recommended": best},
        status="EVALUATED",
    )
    if unavailable_member_id:
        try:
            create_kwargs['unavailable_member'] = User.objects.get(id=unavailable_member_id)
        except User.DoesNotExist:
            pass
    if original_assignee:
        create_kwargs['original_assignee'] = original_assignee
    if duration_hours:
        create_kwargs['duration_hours'] = int(duration_hours)

    scenario = SimulationScenario.objects.create(**create_kwargs)

    return Response({
        "scenario_id": scenario.id,
        "task_id": task.id,
        "trigger": trigger,
        "candidates_evaluated": len(candidate_ids),
        "evaluation_results": evaluation_results,
        "recommended": best,
    })


@api_view(['POST'])
def approve_scenario(request, scenario_id):
    """
    Execution endpoint. Validates staleness, mutates state, fires EngineEvents,
    and broadcasts to workspace_global (so Kanban + all views update).
    """
    data = request.data
    candidate_id = data.get('candidate_id')
    intervention = data.get('intervention')

    try:
        scenario = SimulationScenario.objects.select_related(
            'task', 'task__project', 'unavailable_member', 'original_assignee'
        ).get(id=scenario_id)
    except SimulationScenario.DoesNotExist:
        return Response({"error": "Scenario not found"}, status=404)

    if scenario.status == "APPROVED":
        return Response({"error": "Scenario already approved"}, status=400)

    try:
        candidate = User.objects.get(id=candidate_id)
    except User.DoesNotExist:
        return Response({"error": "Candidate not found"}, status=404)

    # ── Stale-State Validation ────────────────────────────────────────────────
    if scenario.unavailable_member:
        from apps.realtime.models import PresenceSession
        still_unavailable = PresenceSession.objects.filter(
            user=scenario.unavailable_member,
            status='UNAVAILABLE'
        ).exists()
        if not still_unavailable:
            return Response({
                "error": "SCENARIO_OUTDATED",
                "message": (
                    f"{scenario.unavailable_member.username} is no longer UNAVAILABLE. "
                    "Engineering state changed after this simulation was created."
                ),
                "resolution": "RE_EVALUATE"
            }, status=409)

    # Verify task still exists and assignee hasn't changed
    current_task = Task.objects.get(id=scenario.task.id)
    if scenario.original_assignee and current_task.assignee_id != scenario.original_assignee_id:
        return Response({
            "error": "SCENARIO_OUTDATED",
            "message": "Task assignee changed after simulation was created.",
            "resolution": "RE_EVALUATE"
        }, status=409)

    # ── RBAC Check ───────────────────────────────────────────────────────────
    from apps.tasks.permissions import assert_task_permission
    assert_task_permission(request.user, scenario.task, 'assign')

    # ── State Mutation ────────────────────────────────────────────────────────
    previous_owner_id = scenario.task.assignee_id
    if intervention in ["REASSIGN", "KNOWLEDGE_TRANSFER", "PAIR", "AI_ASSIST", "WAIT"]:
        if intervention != "WAIT":
            scenario.task.assignee = candidate
            scenario.task.status = 'In Progress'
            scenario.task.save()

    scenario.status = "APPROVED"
    scenario.save()

    # ── Emit EngineEvents ─────────────────────────────────────────────────────
    event_payload = {
        "scenario_id": scenario.id,
        "intervention": intervention,
        "new_assignee": candidate.id,
        "new_assignee_name": candidate.get_full_name() or candidate.username,
        "previous_owner_id": previous_owner_id,
    }

    # Generic simulation approved event
    EngineEvent.objects.create(
        project=scenario.task.project,
        task=scenario.task,
        actor=request.user if request.user.is_authenticated else candidate,
        event_type=f"SIMULATION_APPROVED_{intervention}",
        payload=event_payload
    )

    # Specific TASK_REASSIGNED event (if actual ownership changed)
    if intervention != "WAIT":
        EngineEvent.objects.create(
            project=scenario.task.project,
            task=scenario.task,
            actor=request.user if request.user.is_authenticated else candidate,
            event_type="TASK_REASSIGNED",
            payload={
                "task_id": scenario.task.id,
                "task_title": scenario.task.title,
                "previous_owner_id": previous_owner_id,
                "new_owner_id": candidate.id,
                "new_owner_name": candidate.get_full_name() or candidate.username,
                "approved_by": (request.user.get_full_name() or request.user.username)
                    if request.user.is_authenticated else "System",
                "reason": f"Approved intervention: {intervention}",
                "simulation_id": scenario.id,
                "task_data": TaskSerializer(scenario.task).data,
            }
        )

    # ── Notify new assignee ───────────────────────────────────────────────────
    if intervention != "WAIT":
        Notification.objects.create(
            user=candidate,
            title=f"Task assigned: {scenario.task.title}",
            content=(
                f"{scenario.task.title} has been assigned to you after an approved "
                f"{intervention.lower().replace('_', ' ')} intervention.\n"
                f"Priority: {scenario.task.priority}"
            ),
            event_type="TASK_REASSIGNED",
            link=f"/dashboard/intelligence/organization",
            read=False
        )

    # ── WebSocket Broadcast (workspace_global) ────────────────────────────────
    # CRITICAL FIX: was broadcasting to project_{id} but WorkspaceConsumer uses workspace_global
    channel_layer = get_channel_layer()
    if channel_layer:
        ws_payload = {
            "event_type": "TASK_REASSIGNED",
            "task_id": scenario.task.id,
            "new_assignee_id": candidate.id,
            "new_assignee_name": candidate.get_full_name() or candidate.username,
            "previous_owner_id": previous_owner_id,
            "scenario_id": scenario.id,
            "intervention": intervention,
            "task_data": TaskSerializer(scenario.task).data,
        }
        try:
            async_to_sync(channel_layer.group_send)(
                "workspace_global",
                {"type": "engine_event", "payload": ws_payload}
            )
        except Exception as e:
            logger.warning(f"WebSocket broadcast failed: {e}")

    return Response({
        "success": True,
        "message": f"Intervention {intervention} approved and executed.",
        "task_data": TaskSerializer(scenario.task).data,
        "new_assignee": {
            "id": candidate.id,
            "name": candidate.get_full_name() or candidate.username,
        }
    })
