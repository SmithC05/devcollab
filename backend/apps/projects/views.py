from rest_framework.views import APIView
from rest_framework.response import Response
from apps.projects.models import Project
from apps.workspaces.models import Workspace
from apps.tasks.models import Task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count

class WorkspaceOverviewView(APIView):
    def get(self, request):
        workspace = Workspace.objects.first()
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
        
        user = request.user if request.user.is_authenticated else None
        
        tasks_pending_count = 0
        tasks_completed_count = 0
        top_priority_tasks_data = []
        my_projects_data = []
        recent_projects_data = []
        
        if user:
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
            "user_name": f"{request.user.first_name} {request.user.last_name}".strip() if request.user.is_authenticated else "dev collab",
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
    def get(self, request):
        workspace = Workspace.objects.first()
        if not workspace: return Response([])
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
        workspace = Workspace.objects.first()
        if not workspace:
            workspace = Workspace.objects.create(name="Default Workspace")
            if request.user.is_authenticated:
                workspace.members.add(request.user)
        
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
            "members_count": workspace.members.count(),
            "tasks_count": 0,
            "progress": 0,
            "updated_at": project.updated_at
        }, status=201)

class WorkspaceActivityView(APIView):
    def get(self, request):
        workspace = Workspace.objects.first()
        if not workspace: return Response({})
        projects = Project.objects.filter(workspace=workspace, is_active=True).count()
        return Response({
            "total_events": 0,
            "today_events": 0,
            "active_projects": projects,
            "recent_activity": [],
            "heatmap": []
        })

class WorkspaceMembersView(APIView):
    def get(self, request):
        workspace = Workspace.objects.first()
        if not workspace: return Response([])
        data = []
        for membership in workspace.memberships.select_related('user').all():
            m = membership.user
            data.append({
                "id": m.id,
                "name": f"{m.first_name} {m.last_name}".strip() or m.username,
                "email": m.email,
                "role": "Owner" if m.is_superuser else "Member",
                "status": "Active",
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
                    "last_active": "Sent just now"
                })
        except ImportError:
            pass
            
        return Response(data)

class WorkspaceBillingView(APIView):
    def get(self, request):
        workspace = Workspace.objects.first()
        if not workspace: return Response({})
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
    def get(self, request):
        workspace = Workspace.objects.first()
        if not workspace: return Response({})
        return Response({
            "name": workspace.name,
            "slug": workspace.name.lower().replace(" ", "-"),
            "description": "Development Workspace"
        })
    def put(self, request):
        workspace = Workspace.objects.first()
        if workspace:
            workspace.name = request.data.get('name', workspace.name)
            workspace.save()
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
