from django.urls import path

from apps.projects.views import ProjectRepositoryMappingView

app_name = "projects"
urlpatterns = [
    path("<int:project_id>/repository-mapping/", ProjectRepositoryMappingView.as_view(), name="repository-mapping"),
]
