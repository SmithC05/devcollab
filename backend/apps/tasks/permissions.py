"""
Central RBAC Permission Module — Task Management
=================================================
Single source of truth for all backend task authorization.

Role hierarchy (WorkspaceMembership.role):
  OWNER     -> full task authority
  ADMIN     -> full task authority (not project ownership)
  LEAD      -> full task authority within project
  DEVELOPER -> view + move/status-change on assigned tasks ONLY

Key design principles:
  - Role always resolved from DB at request time (no cached/client-supplied role)
  - Cross-project isolation: role in Project A never grants access to Project B
  - Payload field protection: even valid PUT/PATCH payloads checked field-by-field
  - Every mutation path (TaskViewSet, AI endpoint, Simulation endpoint) imports
    get_user_role / assert_task_permission from here
"""

from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from apps.workspaces.models import WorkspaceMembership
from .models import Task

# ---------------------------------------------------------------------------
# Role constants — must match WorkspaceMembership.ROLE_CHOICES exactly
# ---------------------------------------------------------------------------
OWNER = 'OWNER'
ADMIN = 'ADMIN'
LEAD = 'LEAD'
DEVELOPER = 'DEVELOPER'

MANAGER_ROLES = frozenset({OWNER, ADMIN, LEAD})

# Fields Developers are never allowed to touch via any endpoint
DEV_RESTRICTED_FIELDS = frozenset({
    'title', 'assignee', 'priority',
    'due_date', 'labels', 'project',
})


# ---------------------------------------------------------------------------
# Core role-resolution helper — always reads from DB
# ---------------------------------------------------------------------------

def get_user_role(user, project):
    """
    Resolve authenticated user's WorkspaceMembership role for the workspace
    that owns this project.  Always reads from the database so role changes
    take effect immediately.

    Returns a role string (OWNER/ADMIN/LEAD/DEVELOPER) or None if not a member.
    """
    if not user or not user.is_authenticated:
        return None
    try:
        membership = WorkspaceMembership.objects.get(
            workspace=project.workspace,
            user=user,
        )
        return membership.role
    except WorkspaceMembership.DoesNotExist:
        return None


# ---------------------------------------------------------------------------
# Helper used by non-ViewSet mutation paths (AI, Simulation, etc.)
# ---------------------------------------------------------------------------

def assert_task_permission(user, task, action):
    """
    Hard check callable from any view or service.
    Raises PermissionDenied (→ HTTP 403) on failure.

    action values:
      'create'          - create a new task in a project
      'edit'            - change any content field
      'delete'          - delete the task
      'assign'          - set/change assignee
      'move'            - change task status (Kanban move)
      'move_own'        - change status on an assigned task (Dev-allowed subset)
    """
    role = get_user_role(user, task.project)

    if role is None:
        raise PermissionDenied('You are not a member of this workspace.')

    if role in MANAGER_ROLES:
        return  # managers pass all task actions

    # DEVELOPER restrictions
    if action in ('create', 'edit', 'delete', 'assign'):
        raise PermissionDenied(
            f'Developers cannot perform: {action}.'
        )

    if action == 'move':
        if task.assignee_id != user.id:
            raise PermissionDenied(
                'Developers can only move tasks assigned to them.'
            )

    if action == 'move_own':
        if task.assignee_id != user.id:
            raise PermissionDenied(
                'Developers can only update tasks assigned to them.'
            )


# ---------------------------------------------------------------------------
# Convenience helpers
# ---------------------------------------------------------------------------

def is_manager(user, project):
    """True if user has OWNER, ADMIN, or LEAD role."""
    return get_user_role(user, project) in MANAGER_ROLES


def is_developer(user, project):
    """True if user has DEVELOPER role."""
    return get_user_role(user, project) == DEVELOPER


def _get_project_from_request(request):
    """Resolve Project from request.data['project'] (ID sent by client)."""
    from apps.projects.models import Project
    project_id = request.data.get('project')
    if project_id is None:
        return None
    try:
        return Project.objects.select_related('workspace').get(id=project_id)
    except (Project.DoesNotExist, ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# DRF Permission Class — applied to TaskViewSet
# ---------------------------------------------------------------------------

class TaskManagementPermission(BasePermission):
    """
    Enforces role-based task CRUD for TaskViewSet.

    OWNER / ADMIN / LEAD  -> create, edit (all fields), delete, assign, move
    DEVELOPER             -> view + move/status on assigned tasks only

    Cross-project: roles are resolved against the task's own project workspace.
    A token valid in Workspace A cannot mutate a task in Workspace B.
    """
    message = 'You do not have permission to perform this action.'

    # ------------------------------------------------------------------
    # Request-level gate (before object is fetched)
    # ------------------------------------------------------------------
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = 'Authentication required.'
            return False

        # Safe reads are always allowed for authenticated users
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True

        # CREATE — must resolve project here (no object yet)
        if view.action == 'create':
            project = _get_project_from_request(request)
            if project is None:
                # Let serializer validation surface the missing-project error
                return True
            role = get_user_role(request.user, project)
            if role is None:
                self.message = 'You are not a member of this workspace.'
                return False
            if role == DEVELOPER:
                self.message = 'Developers cannot create tasks.'
                return False
            return True

        # All other mutations are checked at object level
        return True

    # ------------------------------------------------------------------
    # Object-level gate (after task is fetched from DB)
    # ------------------------------------------------------------------
    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, Task):
            return False

        # Role always resolved from DB — never from request payload
        role = get_user_role(request.user, obj.project)

        if role is None:
            self.message = 'You are not a member of this workspace.'
            return False

        # Safe reads
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True

        # Managers pass all object-level checks
        if role in MANAGER_ROLES:
            return True

        # ---- DEVELOPER restrictions ----

        # DELETE — blocked
        if view.action == 'destroy':
            self.message = 'Developers cannot delete tasks.'
            return False

        # MOVE (/tasks/{id}/move/) — only own assigned task
        if view.action == 'move':
            if obj.assignee_id != request.user.id:
                self.message = 'Developers can only move tasks assigned to them.'
                return False
            return True

        # UPDATE / PARTIAL_UPDATE — field-level enforcement
        if view.action in ('update', 'partial_update'):
            # Dev can ONLY submit 'status' changes on their own tasks
            if obj.assignee_id != request.user.id:
                self.message = 'Developers can only update tasks assigned to them.'
                return False
            forbidden = set(request.data.keys()) & DEV_RESTRICTED_FIELDS
            if forbidden:
                self.message = (
                    'Developers cannot modify: '
                    + ', '.join(sorted(forbidden)) + '.'
                )
                return False
            return True

        return False  # default deny for any unrecognised action

