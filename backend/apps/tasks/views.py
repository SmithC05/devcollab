from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer
from django.shortcuts import get_object_or_404

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project_id', None)
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        # We assume the user is authenticated in a real scenario, but for hackathon Phase 1/2 we'll set to request.user if valid.
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        from .services import TaskService
        new_status = request.data.get('status')
        
        user = request.user if request.user.is_authenticated else None
        
        task = TaskService.move_task(pk, new_status, user)
        if not task:
            return Response({'error': 'Task not found or invalid'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(task)
        return Response(serializer.data)
