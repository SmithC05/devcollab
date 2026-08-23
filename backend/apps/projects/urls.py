from django.urls import path
from . import views

app_name = "projects"

urlpatterns = [
    # Project stats (real task counts for a specific project)
    path('<int:project_id>/stats/', views.ProjectStatsView.as_view(), name='project-stats'),

    # Wiki pages (per-project isolated)
    path('<int:project_id>/wiki/', views.WikiPageListView.as_view(), name='wiki-list'),
    path('<int:project_id>/wiki/<int:page_id>/', views.WikiPageDetailView.as_view(), name='wiki-detail'),

    # Snippets (per-project isolated)
    path('<int:project_id>/snippets/', views.SnippetListView.as_view(), name='snippet-list'),
    path('<int:project_id>/snippets/<int:snippet_id>/', views.SnippetDetailView.as_view(), name='snippet-detail'),
]
