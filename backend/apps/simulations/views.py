import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.tasks.models import Task
from apps.realtime.models import EngineEvent
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from engine.simulation.core import run_simulation
from .models import SimulationScenario

User = get_user_model()

@api_view(['POST'])
def evaluate_scenario(request):
    """
    Read-only evaluation of interventions across multiple candidates.
    Does NOT mutate engineering state or emit EngineEvents.
    """
    data = request.data
    task_id = data.get('task_id')
    trigger = data.get('trigger', 'MANUAL_EVALUATION')
    candidate_ids = data.get('candidate_ids', [])
    is_demo = data.get('is_demo', False)
    
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)
        
    evaluation_results = []
    
    for c_id in candidate_ids:
        # run_simulation executes read-only deterministic scoring across all interventions
        results = run_simulation(task.id, c_id, is_demo)
        evaluation_results.append({
            "candidate_id": c_id,
            "interventions": results
        })
        
    scenario = SimulationScenario.objects.create(
        task=task,
        trigger=trigger,
        results={"evaluation": evaluation_results},
        status="EVALUATED"
    )
    
    return Response({
        "scenario_id": scenario.id,
        "task_id": task.id,
        "trigger": trigger,
        "candidates_evaluated": len(candidate_ids),
        "evaluation_results": evaluation_results
    })


@api_view(['POST'])
def approve_scenario(request, scenario_id):
    """
    Execution endpoint. Mutates state and fires EngineEvent/WebSocket.
    """
    data = request.data
    candidate_id = data.get('candidate_id')
    intervention = data.get('intervention')
    
    try:
        scenario = SimulationScenario.objects.get(id=scenario_id)
    except SimulationScenario.DoesNotExist:
        return Response({"error": "Scenario not found"}, status=404)
        
    if scenario.status == "APPROVED":
        return Response({"error": "Scenario already approved"}, status=400)
        
    try:
        candidate = User.objects.get(id=candidate_id)
    except User.DoesNotExist:
        return Response({"error": "Candidate not found"}, status=404)
        
    # State Mutation (For demo: REASSIGN changes owner, KNOWLEDGE_TRANSFER also changes owner but leaves trail)
    if intervention in ["REASSIGN", "KNOWLEDGE_TRANSFER"]:
        scenario.task.assignee = candidate
        scenario.task.save()
        
    scenario.status = "APPROVED"
    scenario.save()
    
    # Fire EngineEvent
    event = EngineEvent.objects.create(
        project_id=scenario.task.project_id,
        task_id=scenario.task.id,
        actor_id=request.user.id if request.user.is_authenticated else candidate.id,
        event_type=f"SIMULATION_APPROVED_{intervention}",
        payload={
            "scenario_id": scenario.id,
            "intervention": intervention,
            "new_assignee": candidate.id
        }
    )
    
    # Broadcast to WebSocket
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f"project_{scenario.task.project_id}",
            {
                "type": "engine_event",
                "event": {
                    "id": event.id,
                    "type": event.event_type,
                    "task_id": event.task_id,
                    "timestamp": event.timestamp.isoformat()
                }
            }
        )
        
    return Response({"success": True, "message": f"Intervention {intervention} approved."})
