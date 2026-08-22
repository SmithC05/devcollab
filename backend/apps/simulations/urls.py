from django.urls import path
from .views import project_state

urlpatterns = [
    path('state/<int:project_id>/', project_state, name='project-state'),
]
