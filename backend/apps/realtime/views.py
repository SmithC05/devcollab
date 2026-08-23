from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EngineEvent, Notification
from .serializers import EngineEventSerializer, NotificationSerializer

class EngineEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EngineEventSerializer
    
    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        queryset = EngineEvent.objects.all().order_by('-timestamp')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(read=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post', 'patch'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read = True
        notification.save()
        return Response({'status': 'marked as read'})
        
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(read=True)
        return Response({'status': 'all marked as read'})
