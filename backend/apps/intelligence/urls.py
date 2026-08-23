from django.urls import path
from .views import (
    EngineeringCommandCenterView, compare_task_candidates,
    get_member_evidence, summarize_member_evidence,
    unavailability_status,
)

urlpatterns = [
    path('command-center/', EngineeringCommandCenterView.as_view(), name='engineering-command-center'),
    path('compare/', compare_task_candidates, name='compare_task_candidates'),
    path('members/<int:pk>/evidence/', get_member_evidence, name='get_member_evidence'),
    path('members/<int:pk>/summarize/', summarize_member_evidence, name='summarize_member_evidence'),
    # Phase 3: Unavailability status + blast radius
    path('unavailability-status/<int:user_id>/', unavailability_status, name='unavailability_status'),
]
