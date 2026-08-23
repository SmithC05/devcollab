from django.urls import path
from .views import (
    EngineeringCommandCenterView, compare_task_candidates,
    get_member_evidence, summarize_member_evidence,
    unavailability_status, recommend_and_assign, get_unassigned_tasks,
    
    # Phase 4 — Incident Intelligence
    incident_understand, incident_analyze, incident_simulate,
    incident_approve, incident_update,
)

urlpatterns = [
    path('command-center/', EngineeringCommandCenterView.as_view(), name='engineering-command-center'),
    path('compare/', compare_task_candidates, name='compare_task_candidates'),
    path('members/<int:pk>/evidence/', get_member_evidence, name='get_member_evidence'),
    path('members/<int:pk>/summarize/', summarize_member_evidence, name='summarize_member_evidence'),
    path('recommend-assign/', recommend_and_assign, name='recommend_and_assign'),
    path('unassigned-tasks/', get_unassigned_tasks, name='get_unassigned_tasks'),
    # Phase 3: Unavailability status + blast radius
    path('unavailability-status/<int:user_id>/', unavailability_status, name='unavailability_status'),

    # Phase 4 — Incident Intelligence
    path('incident/understand/', incident_understand, name='incident_understand'),
    path('incident/analyze/', incident_analyze, name='incident_analyze'),
    path('incident/simulate/', incident_simulate, name='incident_simulate'),
    path('incident/approve/', incident_approve, name='incident_approve'),
    path('incident/<int:event_id>/update/', incident_update, name='incident_update'),
]
