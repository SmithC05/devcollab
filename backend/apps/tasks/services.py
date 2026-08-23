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
        
        # Create EngineEvent and broadcast using EventService
        from apps.realtime.services import EventService
        event_payload = {
            'task_id': task.id,
            'old_status': old_status,
            'new_status': task.status,
            'task_data': TaskSerializer(task).data
        }
        
        EventService.record_activity(
            event_type='TASK_MOVED',
            actor=user,
            workspace=task.project.workspace,
            project=task.project,
            task=task,
            payload=event_payload
        )
        
        # Notify the assignee if someone else moved their task
        if task.assignee and task.assignee != user:
            actor_name = user.username if user else "Someone"
            EventService.send_notification(
                user=task.assignee,
                title="Task Status Changed",
                content=f"{actor_name} moved '{task.title}' to {task.status}.",
                event_type='TASK_STATUS_CHANGED',
                workspace=task.project.workspace,
                project=task.project,
                link=f"/workspace/projects/{task.project.id}?task={task.id}"
            )
        
        return task
