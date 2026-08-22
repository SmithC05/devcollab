import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import PresenceSession

class WorkspaceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_token = self.scope['query_string'].decode().split('token=')[-1]
        
        # Verify session
        session = await self.get_session(self.session_token)
        if not session:
            await self.close()
            return
            
        self.user_id = session.user_id
        # In a real app we might use workspace_id for the group name
        self.room_group_name = 'workspace_global'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Mark as active
        await self.update_status('ACTIVE')
        
        # Broadcast presence update
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'user_id': self.user_id,
                'status': 'ACTIVE'
            }
        )

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Mark as offline
        if hasattr(self, 'session_token'):
            await self.update_status('OFFLINE')
            
            # Broadcast offline status
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.user_id,
                    'status': 'OFFLINE'
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'ping':
            await self.update_last_seen()
            await self.send(text_data=json.dumps({'type': 'pong'}))
            
        elif action == 'set_status':
            status = data.get('status')
            await self.update_status(status)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.user_id,
                    'status': status
                }
            )
            
        elif action == 'user_activity':
            await self.update_last_activity()
            
        elif action == 'task_view':
            task_id = data.get('task_id')
            status = data.get('status')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'task_view_update',
                    'user_id': self.user_id,
                    'task_id': task_id,
                    'status': status
                }
            )

    async def task_view_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_view_update',
            'user_id': event['user_id'],
            'task_id': event['task_id'],
            'status': event['status']
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'user_id': event['user_id'],
            'status': event['status']
        }))
        
    async def engine_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'engine_event',
            'payload': event['payload']
        }))

    @database_sync_to_async
    def get_session(self, token):
        try:
            return PresenceSession.objects.get(session_token=token)
        except PresenceSession.DoesNotExist:
            return None
            
    @database_sync_to_async
    def update_status(self, status):
        try:
            session = PresenceSession.objects.get(session_token=self.session_token)
            session.status = status
            session.last_seen = timezone.now()
            session.save()
        except PresenceSession.DoesNotExist:
            pass
            
    @database_sync_to_async
    def update_last_seen(self):
        try:
            session = PresenceSession.objects.get(session_token=self.session_token)
            session.last_seen = timezone.now()
            session.save()
        except PresenceSession.DoesNotExist:
            pass
            
    @database_sync_to_async
    def update_last_activity(self):
        try:
            session = PresenceSession.objects.get(session_token=self.session_token)
            session.last_activity = timezone.now()
            session.save()
        except PresenceSession.DoesNotExist:
            pass
