from django.urls import path
from .views import EngineeringCommandCenterView, compare_task_candidates, get_member_evidence, summarize_member_evidence, recommend_and_assign, get_unassigned_tasks

urlpatterns = [
    path('command-center/', EngineeringCommandCenterView.as_view(), name='engineering-command-center'),
    path('compare/', compare_task_candidates, name='compare_task_candidates'),
    path('members/<int:pk>/evidence/', get_member_evidence, name='get_member_evidence'),
    path('members/<int:pk>/summarize/', summarize_member_evidence, name='summarize_member_evidence'),
    path('recommend-assign/', recommend_and_assign, name='recommend_and_assign'),
    path('unassigned-tasks/', get_unassigned_tasks, name='get_unassigned_tasks'),
]
