from django.urls import path
from .views import EngineeringCommandCenterView, compare_task_candidates, get_member_evidence

urlpatterns = [
    path('command-center/', EngineeringCommandCenterView.as_view(), name='engineering-command-center'),
    path('compare/', compare_task_candidates, name='compare_task_candidates'),
    path('members/<int:pk>/evidence/', get_member_evidence, name='get_member_evidence'),
]
