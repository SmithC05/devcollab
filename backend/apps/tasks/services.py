from .models import Task
from apps.realtime.models import EngineEvent
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .serializers import TaskSerializer

class TaskService:
    @staticmethod
    def move_task(task_id, new_status, user):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return None

        old_status = task.status

        if new_status and new_status in dict(Task.StatusChoices.choices):
            task.status = new_status
        
        task.save()
        
        # Create EngineEvent
        event_payload = {
            'task_id': task.id,
            'old_status': old_status,
            'new_status': task.status,
            'task_data': TaskSerializer(task).data
        }
        
        event = EngineEvent.objects.create(
            event_type='TASK_MOVED',
            actor=user,
            project=task.project,
            task=task,
            payload=event_payload
        )
        
        # Broadcast to workspace
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'workspace_global',
            {
                'type': 'engine_event',
                'payload': event_payload
            }
        )
        
        return task
