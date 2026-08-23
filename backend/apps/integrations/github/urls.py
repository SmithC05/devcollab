from django.urls import path
from .views import sync_github_view, evidence_view, disconnect_github_view

urlpatterns = [
    path('sync/', sync_github_view, name='github_sync'),
    path('sync/<int:user_id>/', sync_github_view, name='github_sync_user'),
    path('evidence/', evidence_view, name='github_evidence'),
    path('evidence/<int:user_id>/', evidence_view, name='github_evidence_user'),
    path('disconnect/', disconnect_github_view, name='github_disconnect'),
]
