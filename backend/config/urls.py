"""
Root URL configuration for Engineering Decision Twin.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from apps.projects.views import (
    WorkspaceOverviewView, 
    ProjectListView, 
    WorkspaceActivityView, 
    WorkspaceMembersView, 
    WorkspaceBillingView, 
    WorkspaceSettingsView
)
from apps.developers.views import NotificationListView
import apps.workspaces.views

def health(request):
    """Simple health check endpoint. No authentication required."""
    return JsonResponse({"status": "ok", "service": "engineering-decision-twin"})


urlpatterns = [
    path("admin/", admin.site.urls),

    # Health check
    path("api/health/", health, name="health"),
    
    # Workspace & Notifications
    path("api/workspace/overview/", WorkspaceOverviewView.as_view(), name="workspace-overview"),
    path("api/workspace/projects/", ProjectListView.as_view(), name="workspace-projects"),
    path("api/workspace/activity/", WorkspaceActivityView.as_view(), name="workspace-activity"),
    path("api/workspace/members/", WorkspaceMembersView.as_view(), name="workspace-members"),
    path("api/workspace/billing/", WorkspaceBillingView.as_view(), name="workspace-billing"),
    path("api/workspace/settings/", WorkspaceSettingsView.as_view(), name="workspace-settings"),
    path("api/notifications/", NotificationListView.as_view(), name="notifications"),

    # App API routes (empty routers wired in — expand as apps grow)
    path("api/auth/", include("apps.authentication.urls")),
    path("accounts/", include("allauth.urls")), # Allauth (Google OAuth)
    path("api/workspaces/", include("apps.workspaces.urls")),
    
    # Invitations
    path("api/invitations/<str:token>/", apps.workspaces.views.InvitationDetailView.as_view(), name="invitation-detail"),
    path("api/invitations/<str:token>/accept/", apps.workspaces.views.AcceptInvitationView.as_view(), name="invitation-accept"),
    path("api/invitations/<str:token>/reject/", apps.workspaces.views.RejectInvitationView.as_view(), name="invitation-reject"),
    path("api/projects/", include("apps.projects.urls")),
    path("api/developers/", include("apps.developers.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/realtime/", include("apps.realtime.urls")),
    path("api/simulations/", include("apps.simulations.urls")),
    path("api/scenarios/", include("apps.scenarios.urls")),
    path("api/ai/", include("apps.ai.urls")),
    path("api/intelligence/", include("apps.intelligence.urls")),
    path("api/integrations/github/", include("apps.integrations.github.urls")),
]
