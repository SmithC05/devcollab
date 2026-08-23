from django.urls import path
from .views import sync_github_view, evidence_view, disconnect_github_view

urlpatterns = [
    path('sync/', sync_github_view, name='github_sync'),
    path('evidence/', evidence_view, name='github_evidence'),
    path('disconnect/', disconnect_github_view, name='github_disconnect'),
]
