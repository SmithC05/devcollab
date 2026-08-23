from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.projects.models import Project
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.tasks.models import Task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count


def _get_user_workspace(request):
    """
    BUG-01 FIX: Previously all views used Workspace.objects.first() which returned
    the same workspace for ALL users regardless of their actual membership.
    Resolves workspace safely from ?workspace_id= query param + membership check.
    Falls back to the user's first workspace if no ID is provided.
    Returns (workspace, membership) or (None, None).
    """
    user = request.user
    workspace_id = request.query_params.get('workspace_id') or request.data.get('workspace_id')
    if workspace_id:
        try:
            membership = WorkspaceMembership.objects.select_related('workspace').get(
                workspace_id=workspace_id,
                user=user
            )
            return membership.workspace, membership
        except WorkspaceMembership.DoesNotExist:
            return None, None
    else:
        membership = WorkspaceMembership.objects.select_related('workspace').filter(
            user=user
        ).order_by('created_at').first()
        if membership:
            return membership.workspace, membership
        return None, None

class WorkspaceOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
<<<<<<< HEAD
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
=======
        workspace, membership = _get_user_workspace(request)
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
        if not workspace:
            return Response({
                "workspace_name": "Workspace",
                "user_name": "User",
                "total_projects": 0,
                "tasks_pending": 0,
                "tasks_completed": 0,
                "active_projects_user": 0,
                "top_priority_tasks": [],
                "my_projects": [],
                "notifications": [],
                "recent_projects": [],
                "recent_activity": [],
                "tasks_completed_7_days": [],
                "task_status_distribution": {}
            })
            
        projects = Project.objects.filter(workspace=workspace, is_active=True)
        active_projects_count = projects.count()
        total_projects_count = Project.objects.filter(workspace=workspace).count()

        user = request.user
        
        top_priority_tasks_data = []
        my_projects_data = []
        recent_projects_data = []

        user_tasks = Task.objects.filter(project__workspace=workspace, assignee=user)
        tasks_pending_count = user_tasks.exclude(status=Task.StatusChoices.DONE).count()
        tasks_completed_count = user_tasks.filter(status=Task.StatusChoices.DONE).count()
            
        # Top Priority Tasks
        pending_tasks = user_tasks.exclude(status=Task.StatusChoices.DONE).order_by('priority', 'due_date')[:5]
        for pt in pending_tasks:
            top_priority_tasks_data.append({
                "id": pt.id,
                "title": pt.title,
                "status": pt.status,
                "priority": pt.priority
            })
        
        # My Projects (since all workspace projects are user's projects for now)
        for p in projects.order_by('-updated_at')[:5]:
            p_tasks = p.tasks.all()
            total_tasks = p_tasks.count()
            completed = p_tasks.filter(status=Task.StatusChoices.DONE).count()
            open_tasks = total_tasks - completed
            progress = int((completed / total_tasks * 100)) if total_tasks > 0 else 0
            
            my_projects_data.append({
                "id": p.id,
                "name": p.name,
                "status": "Active",
                "tasks_open": open_tasks,
                "tasks_completed": completed,
                "progress": progress
            })
            
        # Recent Projects
        for p in Project.objects.filter(workspace=workspace).order_by('-updated_at')[:3]:
            recent_projects_data.append({
                "id": p.id,
                "name": p.name,
                "tasks_count": p.tasks.count(),
                "updated_at": p.updated_at
            })

        # Chart Data
        tasks = Task.objects.filter(project__in=projects)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=6)
        completed_tasks = tasks.filter(status=Task.StatusChoices.DONE, completed_at__gte=start_date)
        
        date_counts = {}
        for i in range(7):
            d = (start_date + timedelta(days=i)).date()
            date_counts[d.strftime('%Y-%m-%d')] = 0
            
        for t in completed_tasks:
            if t.completed_at:
                date_str = t.completed_at.date().strftime('%Y-%m-%d')
                if date_str in date_counts:
                    date_counts[date_str] += 1
                    
        tasks_completed_7_days = [{"date": k, "count": v} for k, v in date_counts.items()]
        
        distribution = {}
        for choice in Task.StatusChoices.choices:
            distribution[choice[0]] = tasks.filter(status=choice[0]).count()
            
        return Response({
            "workspace_name": workspace.name,
            "user_name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "total_projects": total_projects_count,
            "tasks_pending": tasks_pending_count,
            "tasks_completed": tasks_completed_count,
            "active_projects_user": active_projects_count,
            "top_priority_tasks": top_priority_tasks_data,
            "my_projects": my_projects_data,
            "notifications": [],
            "recent_projects": recent_projects_data,
            "recent_activity": [],
            "tasks_completed_7_days": tasks_completed_7_days,
            "task_status_distribution": distribution
        })

class ProjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
<<<<<<< HEAD
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response([])
=======
        workspace, _ = _get_user_workspace(request)
        if not workspace:
            return Response([])
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
        projects = Project.objects.filter(workspace=workspace)
        data = []
        for p in projects:
            tasks = p.tasks.all()
            total_tasks = tasks.count()
            completed = tasks.filter(status='Done').count()
            progress = int((completed / total_tasks * 100)) if total_tasks > 0 else 0
            data.append({
                "id": p.id,
                "name": p.name,
                "description": f"Project for {p.name}",
                "status": "Active" if p.is_active else "Archived",
                "members_count": workspace.memberships.count(),
                "tasks_count": total_tasks,
                "progress": progress,
                "updated_at": p.updated_at
            })
        return Response(data)

    def post(self, request):
<<<<<<< HEAD
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace:
            return Response({"error": "Workspace not found."}, status=404)
=======
        workspace, _ = _get_user_workspace(request)
        if not workspace:
            workspace = Workspace.objects.create(
                name="Default Workspace",
                owner=request.user
            )
            WorkspaceMembership.objects.create(
                workspace=workspace,
                user=request.user,
                role='OWNER'
            )
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
        
        # Enforce free plan limit
        current_project_count = Project.objects.filter(workspace=workspace).count()
        if current_project_count >= 3:
            return Response(
                {"error": "You've reached the 3-project limit on the Free plan. Upgrade to Pro for unlimited projects."},
                status=403
            )
            
        name = request.data.get('name')
        if not name or not str(name).strip():
            return Response({"error": "Project name is required"}, status=400)
            
        project = Project.objects.create(
            name=str(name).strip(),
            workspace=workspace
        )
        
        return Response({
            "id": project.id,
            "name": project.name,
            "description": f"Project for {project.name}",
            "status": "Active",
            "members_count": workspace.memberships.count(),
            "members_count": workspace.memberships.count(),
            "tasks_count": 0,
            "progress": 0,
            "updated_at": project.updated_at
        }, status=201)

class WorkspaceActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
<<<<<<< HEAD
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response({})
        projects = Project.objects.filter(workspace=workspace, is_active=True).count()
=======
        workspace, _ = _get_user_workspace(request)
        if not workspace:
            return Response({})
        projects_count = Project.objects.filter(workspace=workspace, is_active=True).count()
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
        return Response({
            "total_events": 0,
            "today_events": 0,
            "active_projects": projects_count,
            "recent_activity": [],
            "heatmap": []
        })

from apps.workspaces.permissions import check_workspace_role

class WorkspaceMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
<<<<<<< HEAD
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response([])
        data = []
        for membership in workspace.memberships.select_related('user').all():
            m = membership.user
            # Fetch avatar URL and make it absolute if relative
            avatar_url = ''
            try:
                from apps.authentication.models import UserProfile
                from django.conf import settings
                profile = UserProfile.objects.filter(user=m).first()
                if profile and profile.avatar_url:
                    avatar_url = profile.avatar_url
                    if avatar_url.startswith('/'):
                        backend_url = request.build_absolute_uri('/').rstrip('/')
                        avatar_url = f"{backend_url}{avatar_url}"
            except Exception:
                pass
=======
        workspace, _ = _get_user_workspace(request)
        if not workspace:
            return Response([])
        data = []
        for mem in workspace.memberships.select_related('user').all():
            m = mem.user
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
            data.append({
                "id": m.id,
                "name": f"{m.first_name} {m.last_name}".strip() or m.username,
                "email": m.email,
<<<<<<< HEAD
                "role": membership.role,
                "avatar_url": avatar_url,
=======
                "role": mem.role,
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
                "status": "Active",
                "joined_at": membership.created_at.isoformat() if membership.created_at else None,
                "last_active": "Just now"
            })
            
        # Fetch pending invitations
        try:
            from apps.workspaces.models import Invitation
            invitations = Invitation.objects.filter(workspace_id=workspace.id, status='PENDING')
            for inv in invitations:
                data.append({
                    "id": f"inv_{inv.id}",
                    "name": inv.name or "Pending Invite",
                    "email": inv.email,
                    "role": inv.role,
                    "status": "Pending",
                    "joined_at": None,
                    "last_active": "Sent just now"
                })
        except ImportError:
            pass
            
        return Response(data)

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from apps.workspaces.views import MiddlewareAuthentication

@method_decorator(csrf_exempt, name='dispatch')
class WorkspaceMemberDetailView(APIView):
    authentication_classes = [MiddlewareAuthentication]
    
    def delete(self, request, user_id):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)
            
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=404)
            
        # Enforce OWNER or ADMIN role
        has_permission, error_msg = check_workspace_role(request.user, workspace.id, ['OWNER', 'ADMIN'])
        if not has_permission:
            return Response({"error": error_msg}, status=403)
            
        try:
            target_membership = WorkspaceMembership.objects.get(workspace=workspace, user_id=user_id)
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found in workspace"}, status=404)
            
        # OWNER protection
        if target_membership.role == 'OWNER':
            return Response({"error": "Workspace owner cannot be removed."}, status=403)
            
        # Perform removal
        target_membership.delete()
        
        # Remove from tasks (simulate project member removal)
        tasks = Task.objects.filter(project__workspace=workspace, assignee_id=user_id)
        tasks.update(assignee=None)
        
        return Response({"success": True, "message": "Member removed successfully"})

    def put(self, request, user_id):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)
            
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=404)
            
        # Only OWNER can change roles
        has_permission, error_msg = check_workspace_role(request.user, workspace.id, ['OWNER'])
        if not has_permission:
            return Response({"error": "Only the workspace owner can change roles."}, status=403)
            
        try:
            target_membership = WorkspaceMembership.objects.get(workspace=workspace, user_id=user_id)
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found in workspace"}, status=404)
            
        # Cannot change the OWNER's role
        if target_membership.role == 'OWNER':
            return Response({"error": "Cannot change the role of the workspace owner."}, status=403)
            
        new_role = request.data.get('role')
        if not new_role or new_role not in ['ADMIN', 'LEAD', 'DEVELOPER']:
            return Response({"error": "Invalid role specified."}, status=400)
            
        target_membership.role = new_role
        target_membership.save()
        
        return Response({"success": True, "message": "Role updated successfully", "role": new_role})

class WorkspaceBillingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
<<<<<<< HEAD
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response({})
=======
        workspace, _ = _get_user_workspace(request)
        if not workspace:
            return Response({})
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
        projects_count = Project.objects.filter(workspace=workspace).count()
        members_count = workspace.memberships.count()
        return Response({
            "plan": "FREE",
            "usage": {
                "projects": projects_count,
                "projects_limit": 3,
                "members": members_count,
                "members_limit": 5
            }
        })

class WorkspaceSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
<<<<<<< HEAD
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response({})
=======
        workspace, _ = _get_user_workspace(request)
        if not workspace:
            return Response({})
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
        return Response({
            "name": workspace.name,
            "slug": workspace.slug or workspace.name.lower().replace(" ", "-"),
            "description": "Development Workspace"
        })

    def put(self, request):
<<<<<<< HEAD
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if workspace:
            workspace.name = request.data.get('name', workspace.name)
            workspace.save()
=======
        workspace, membership = _get_user_workspace(request)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=404)
        if membership and membership.role not in ['OWNER', 'ADMIN']:
            return Response({"error": "Insufficient permissions"}, status=403)
        workspace.name = request.data.get('name', workspace.name)
        workspace.save()
>>>>>>> 10b098ef335a82765d2f08f3c4029b6683a67f69
        return Response({"status": "success"})

class ProjectRepositoryMappingView(APIView):
    def get(self, request, project_id):
        from apps.projects.models import ProjectRepositoryMapping, Project
        try:
            project = Project.objects.get(id=project_id)
            mapping = ProjectRepositoryMapping.objects.get(project=project)
            return Response({
                "github_repository_full_name": mapping.github_repository_full_name,
                "active": mapping.active
            })
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except ProjectRepositoryMapping.DoesNotExist:
            return Response({"github_repository_full_name": None, "active": False})

    def post(self, request, project_id):
        from apps.projects.models import ProjectRepositoryMapping, Project
        try:
            project = Project.objects.get(id=project_id)
            repo_name = request.data.get("github_repository_full_name")
            active = request.data.get("active", True)
            
            if not repo_name:
                # If they pass empty string or None, they are un-linking
                ProjectRepositoryMapping.objects.filter(project=project).delete()
                return Response({"status": "unlinked"})
                
            mapping, _ = ProjectRepositoryMapping.objects.update_or_create(
                project=project,
                defaults={
                    "github_repository_full_name": repo_name,
                    "active": active
                }
            )
            return Response({
                "github_repository_full_name": mapping.github_repository_full_name,
                "active": mapping.active
            })
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
