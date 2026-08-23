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
        response_data = run_agent(int(project_id), message)
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
                    f"project_{task.project_id}",
                    {
                        "type": "broadcast_event",
                        "event_type": "engine_event",
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
