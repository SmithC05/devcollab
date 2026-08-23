from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer
from .permissions import TaskManagementPermission
from django.shortcuts import get_object_or_404

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = [TaskManagementPermission]

    def get_object(self):
        """Override to ensure has_object_permission is always called."""
        queryset = self.filter_queryset(self.get_queryset())
        obj = get_object_or_404(queryset, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        queryset = Task.objects.all()
        project_id = self.request.query_params.get('project_id')
        if project_id:
            try:
                # Try to use it as an ID
                project_id_int = int(project_id)
                queryset = queryset.filter(project_id=project_id_int)
            except ValueError:
                # If it's a string like 'Fabrication-app', filter by name
                queryset = queryset.filter(project__name=project_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("SERIALIZER ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        task = serializer.save()
        
        # Broadcast TASK_CREATED event
        from apps.realtime.models import EngineEvent
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        event_payload = {
            'task_id': task.id,
            'new_status': task.status,
            'task_data': self.get_serializer(task).data
        }
        EngineEvent.objects.create(
            event_type='TASK_CREATED',
            actor=user,
            project=task.project,
            task=task,
            payload=event_payload
        )
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'workspace_global',
            {
                'type': 'engine_event',
                'payload': {
                    'event_type': 'TASK_CREATED',
                    **event_payload
                }
            }
        )

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        task = serializer.save()
        
        # Broadcast TASK_UPDATED event
        from apps.realtime.models import EngineEvent
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        event_payload = {
            'task_id': task.id,
            'new_status': task.status,
            'task_data': self.get_serializer(task).data
        }
        EngineEvent.objects.create(
            event_type='TASK_UPDATED',
            actor=user,
            project=task.project,
            task=task,
            payload=event_payload
        )
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'workspace_global',
            {
                'type': 'engine_event',
                'payload': {
                    'event_type': 'TASK_UPDATED',
                    **event_payload
                }
            }
        )

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        # get_object() triggers has_object_permission — Dev blocked on others' tasks
        task = self.get_object()
        from .services import TaskService
        new_status = request.data.get('status')
        user = request.user if request.user.is_authenticated else None
        updated_task = TaskService.move_task(task.id, new_status, user)
        if not updated_task:
            return Response({'error': 'Task not found or invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(updated_task)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='engineering-context')
    def engineering_context(self, request, pk=None):
        task = self.get_object()
        from engine.context.state import get_project_engineering_state
        from apps.users.serializers import UserSerializer
        from apps.workspaces.models import WorkspaceMembership

        # Engineering context
        state = get_project_engineering_state(task.project_id)
        
        # Project members (Workspace members for now)
        memberships = WorkspaceMembership.objects.filter(workspace=task.project.workspace).select_related('user')
        project_members = UserSerializer([m.user for m in memberships], many=True).data

        context = {
            "task": self.get_serializer(task).data,
            "project_state": state,
            "project_members": project_members,
        }
        return Response(context)
