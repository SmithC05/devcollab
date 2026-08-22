"""
Root URL configuration for Engineering Decision Twin.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(request):
    """Simple health check endpoint. No authentication required."""
    return JsonResponse({"status": "ok", "service": "engineering-decision-twin"})


urlpatterns = [
    path("admin/", admin.site.urls),

    # Health check
    path("api/health/", health, name="health"),

    # App API routes (empty routers wired in — expand as apps grow)
    path("api/projects/", include("apps.projects.urls")),
    path("api/developers/", include("apps.developers.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/simulations/", include("apps.simulations.urls")),
    path("api/scenarios/", include("apps.scenarios.urls")),
]
