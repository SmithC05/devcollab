from apps.realtime.models import EngineEvent, Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class EventService:
    @staticmethod
    def record_activity(event_type, actor, workspace=None, project=None, task=None, payload=None):
        payload = payload or {}
        event = EngineEvent.objects.create(
            event_type=event_type,
            actor=actor,
            workspace=workspace,
            project=project,
            task=task,
            payload=payload
        )
        
        if workspace:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"workspace_{workspace.id}",
                {
                    "type": "engine_event",
                    "payload": {
                        "id": event.id,
                        "event_type": event.event_type,
                        "actor_id": actor.id if actor else None,
                        "workspace_id": workspace.id if workspace else None,
                        "project_id": project.id if project else None,
                        "task_id": task.id if task else None,
                        "payload": payload,
                        "timestamp": event.timestamp.isoformat()
                    }
                }
            )
        return event

    @staticmethod
    def send_notification(user, title, content, event_type, workspace=None, project=None, link="", metadata=None):
        metadata = metadata or {}
        notification = Notification.objects.create(
            user=user,
            title=title,
            content=content,
            event_type=event_type,
            workspace=workspace,
            project=project,
            link=link,
            metadata=metadata
        )
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {
                "type": "notification_event",
                "payload": {
                    "id": notification.id,
                    "title": notification.title,
                    "content": notification.content,
                    "event_type": notification.event_type,
                    "link": notification.link,
                    "workspace_id": workspace.id if workspace else None,
                    "project_id": project.id if project else None,
                    "metadata": notification.metadata,
                    "read": notification.read,
                    "created_at": notification.created_at.isoformat()
                }
            }
        )
        return notification
