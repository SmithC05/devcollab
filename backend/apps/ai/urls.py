from django.urls import path
from .views import agent_view, agent_execute_action

urlpatterns = [
    path('agent/', agent_view, name='agent_view'),
    path('execute/', agent_execute_action, name='agent_execute_action'),
]
