from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EngineEventViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'events', EngineEventViewSet, basename='events')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('', include(router.urls)),
]
