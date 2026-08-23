from django.urls import path
from .views import agent_view, agent_execute_action, declare_unavailable_view, demo_reset_view

urlpatterns = [
    path('agent/', agent_view, name='agent_view'),
    path('execute/', agent_execute_action, name='agent_execute_action'),
    # Phase 3: Direct unavailability declaration (bypasses agent loop)
    path('declare/', declare_unavailable_view, name='declare_unavailable'),
    # Phase 3: Demo state reset
    path('demo-reset/', demo_reset_view, name='demo_reset'),
]
