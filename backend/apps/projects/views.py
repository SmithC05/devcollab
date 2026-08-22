from rest_framework.views import APIView
from rest_framework.response import Response
from apps.projects.models import Workspace, Project
from apps.tasks.models import Task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count

class WorkspaceOverviewView(APIView):
    def get(self, request):
        # Fallback to the first workspace since auth is bypassed for now
        workspace = Workspace.objects.first()
        if not workspace:
            return Response({
                "active_projects": 0,
                "team_members": 0,
                "total_tasks": 0,
                "tasks_completed_7_days": [],
                "task_status_distribution": {}
            })
            
        projects = Project.objects.filter(workspace=workspace, is_active=True)
        active_projects_count = projects.count()
        team_members_count = workspace.members.count()
        tasks = Task.objects.filter(project__in=projects)
        total_tasks_count = tasks.count()
        
        # Last 7 days completion
        end_date = timezone.now()
        start_date = end_date - timedelta(days=6)
        completed_tasks = tasks.filter(
            status=Task.StatusChoices.DONE,
            completed_at__gte=start_date
        )
        
        # Aggregate by date
        # (A simple python loop for small dataset, sqlite doesn't support DateField TruncDate out of the box nicely in all cases without extra config)
        date_counts = {}
        for i in range(7):
            d = (start_date + timedelta(days=i)).date()
            date_counts[d.strftime('%Y-%m-%d')] = 0
            
        for t in completed_tasks:
            if t.completed_at:
                date_str = t.completed_at.date().strftime('%Y-%m-%d')
                if date_str in date_counts:
                    date_counts[date_str] += 1
                    
        tasks_completed_7_days = [
            {"date": k, "count": v} for k, v in date_counts.items()
        ]
        
        # Status distribution
        distribution = {}
        for choice in Task.StatusChoices.choices:
            distribution[choice[0]] = tasks.filter(status=choice[0]).count()
            
        return Response({
            "workspace_name": workspace.name,
            "user_name": f"{request.user.first_name} {request.user.last_name}".strip() if request.user.is_authenticated else "dev collab",
            "active_projects": active_projects_count,
            "team_members": team_members_count,
            "total_tasks": total_tasks_count,
            "tasks_completed_7_days": tasks_completed_7_days,
            "task_status_distribution": distribution
        })
