from functools import wraps
from django.http import JsonResponse
from apps.workspaces.models import WorkspaceMembership

def require_workspace_role(allowed_roles):
    """
    Decorator for API endpoints that require a specific workspace role.
    Assumes `workspace_id` is passed as a kwarg in the URL, or can be derived.
    For this prototype, if workspace_id is not provided, it falls back to the first workspace.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({"error": "Authentication required"}, status=401)
                
            workspace_id = kwargs.get('workspace_id')
            
            if workspace_id:
                membership = WorkspaceMembership.objects.filter(workspace_id=workspace_id, user=request.user).first()
            else:
                membership = WorkspaceMembership.objects.filter(user=request.user).first()
                
            if not membership:
                return JsonResponse({"error": "You are not a member of this workspace"}, status=403)
                
            if membership.role not in allowed_roles:
                return JsonResponse({"error": f"Requires one of the following roles: {', '.join(allowed_roles)}"}, status=403)
                
            # Pass the membership role into the request for downstream use if needed
            request.workspace_role = membership.role
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

# Reusable helpers for class-based views
def check_workspace_role(user, workspace_id, allowed_roles):
    if not user.is_authenticated:
        return False, "Authentication required"
        
    if workspace_id:
        membership = WorkspaceMembership.objects.filter(workspace_id=workspace_id, user=user).first()
    else:
        # Fallback for legacy calls that don't pass workspace_id
        return False, "Workspace ID is required"
        
    if not membership:
        return False, "You are not a member of this workspace"
        
    if membership.role not in allowed_roles:
        return False, f"Requires one of the following roles: {', '.join(allowed_roles)}"
        
    return True, None

from rest_framework.exceptions import PermissionDenied

def get_current_workspace(request):
    """
    Extracts X-Workspace-Id from the request headers and validates that the
    authenticated user is a member of that workspace.

    If the header is missing, falls back to the user's first workspace membership
    instead of raising 403 — this prevents errors on page refresh or when the
    frontend store hasn't yet set activeWorkspace (e.g. right after login).

    Raises PermissionDenied only if the user is not authenticated, or if the
    provided workspace ID is invalid / the user is not a member of it.
    """
    if not request.user.is_authenticated:
        raise PermissionDenied("Authentication required")

    # In Django request.META, custom headers like X-Workspace-Id become HTTP_X_WORKSPACE_ID
    workspace_id = request.META.get('HTTP_X_WORKSPACE_ID')

    if not workspace_id:
        # Fallback: use the user's first workspace membership
        membership = WorkspaceMembership.objects.select_related('workspace').filter(
            user=request.user
        ).order_by('created_at').first()
        if membership:
            return membership.workspace
        # User has no workspaces at all — return None so views can handle gracefully
        return None

    try:
        membership = WorkspaceMembership.objects.select_related('workspace').get(
            user=request.user,
            workspace_id=workspace_id
        )
        return membership.workspace
    except WorkspaceMembership.DoesNotExist:
        raise PermissionDenied(f"You are not a member of workspace {workspace_id} or it does not exist.")
    except ValueError:
        raise PermissionDenied("Invalid workspace ID format.")
