from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.ai.agent import run_agent
from apps.tasks.models import Task
from apps.realtime.models import EngineEvent
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json

@api_view(['POST'])
def agent_view(request):
    """
    Endpoint for the AI Agent.
    Accepts project_id and a natural language message.
    """
    project_id = request.data.get("project_id")
    message = request.data.get("message")
    
    if not project_id or not message:
        return Response({"error": "project_id and message are required"}, status=400)
        
    try:
        response_data = run_agent(int(project_id), message, request.user)
        return Response(response_data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def agent_execute_action(request):
    """
    Executes an action recommended by the AI and approved by the user.
    """
    action_type = request.data.get("action")
    params = request.data.get("params", {})
    
    if action_type == "assign_task":
        task_id = params.get("task_id")
        user_id = params.get("user_id")
        
        try:
            task = Task.objects.select_related('project__workspace').get(id=task_id)
            # RBAC: only OWNER/ADMIN/LEAD may assign tasks via AI actions
            from apps.tasks.permissions import assert_task_permission
            assert_task_permission(request.user, task, 'assign')
            task.assignee_id = user_id
            task.save()
            
            # Emit EngineEvent
            EngineEvent.objects.create(
                event_type="TASK_ASSIGNED",
                project_id=task.project_id,
                task_id=task.id,
                actor_id=request.user.id if request.user.is_authenticated else None,
                payload={"new_assignee_id": user_id, "ai_assisted": True}
            )
            
            # Broadcast via WebSocket
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "workspace_global",
                    {
                        "type": "engine_event",
                        "payload": {
                            "event_type": "TASK_ASSIGNED",
                            "task_id": task.id,
                            "new_assignee_id": user_id,
                            "ai_assisted": True
                        }
                    }
                )
                
            return Response({"status": "success", "message": "Task reassigned successfully"})
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)
            
    return Response({"error": "Unknown action type"}, status=400)


@api_view(['POST'])
def declare_unavailable_view(request):
    """
    Direct endpoint to declare the current user unavailable.
    Bypasses the agent loop — used by the AI Assistant quick-action button.
    """
    duration_hours = request.data.get("duration_hours")
    scope = request.data.get("scope", "CRITICAL_WORK")
    original_message = request.data.get("original_message", "")
    project_id = request.data.get("project_id")

    if not duration_hours:
        return Response({"error": "duration_hours is required"}, status=400)

    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)

    from apps.ai.tools import declare_unavailable_core
    result_json = declare_unavailable_core(
        duration_hours=int(duration_hours),
        scope=scope,
        original_message=original_message,
        user=request.user,
        project_id=int(project_id) if project_id else None
    )
    import json as _json
    result = _json.loads(result_json)

    if result.get("error"):
        return Response({"error": result["error"]}, status=500)

    return Response({
        "success": True,
        **result
    })


@api_view(['POST'])
def demo_reset_view(request):
    """
    Safely resets the Phase 3 demo state:
    - Sets Smith's PresenceSession back to ACTIVE
    - Marks all EVALUATED SimulationScenarios triggered by Smith as REJECTED
    - Restores Payment Gateway Auth task to unassigned or original owner
    - Broadcasts presence update via WebSocket
    """
    from apps.realtime.models import PresenceSession, Notification
    from apps.simulations.models import SimulationScenario
    from django.contrib.auth import get_user_model
    User_model = get_user_model()

    try:
        smith = User_model.objects.get(username="Smith")
    except User_model.DoesNotExist:
        return Response({"error": "Smith user not found"}, status=404)

    # Reset PresenceSession
    PresenceSession.objects.filter(user=smith, status='UNAVAILABLE').update(
        status='ACTIVE',
        unavailable_until=None,
        unavailable_reason='',
    )

    # Reset simulation scenarios triggered by Smith
    rejected = SimulationScenario.objects.filter(
        unavailable_member=smith,
        status="EVALUATED"
    ).update(status="REJECTED")

    # Reset the demo task if it was created/modified for demo
    task = Task.objects.filter(title='Payment Gateway Auth').first()
    if task:
        # Restore to unassigned (as it would be before Smith claimed it)
        task.assignee = None
        task.save()

    # Broadcast presence restore
    channel_layer = get_channel_layer()
    if channel_layer:
        try:
            async_to_sync(channel_layer.group_send)(
                "workspace_global",
                {
                    "type": "engine_event",
                    "payload": {
                        "event_type": "PRESENCE_RESTORED",
                        "user_id": smith.id,
                        "username": smith.username,
                        "status": "ACTIVE",
                    }
                }
            )
        except Exception:
            pass

    return Response({
        "success": True,
        "message": "Demo state reset. Smith is ACTIVE, simulation scenarios cleared.",
        "scenarios_rejected": rejected,
        "task_reset": task.title if task else None,
    })

