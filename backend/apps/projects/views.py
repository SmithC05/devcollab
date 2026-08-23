from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.projects.models import Project, WikiPage, Snippet
from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.workspaces.permissions import check_workspace_role
from rest_framework.exceptions import PermissionDenied
from apps.tasks.models import Task
from django.utils import timezone
import razorpay
from django.conf import settings
from datetime import timedelta
from django.db.models import Count
from django.contrib.auth import get_user_model

User = get_user_model()


# ─── helpers ──────────────────────────────────────────────────────────────────

def _get_project_or_404(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    is_allowed, err = check_workspace_role(
        request.user, 
        project.workspace_id, 
        ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER']
    )
    if not is_allowed:
        raise PermissionDenied(err)
    return project

def _serialize_wiki_page(page):
    return {
        'id': page.id,
        'title': page.title,
        'content': page.content,
        'created_by': page.created_by.get_full_name() or page.created_by.username if page.created_by else None,
        'updated_by': page.updated_by.get_full_name() or page.updated_by.username if page.updated_by else None,
        'created_at': page.created_at.isoformat(),
        'updated_at': page.updated_at.isoformat(),
    }

def _serialize_snippet(s):
    return {
        'id': s.id,
        'title': s.title,
        'description': s.description,
        'language': s.language,
        'code': s.code,
        'tags': s.tags or [],
        'created_by': s.created_by.get_full_name() or s.created_by.username if s.created_by else None,
        'updated_by': s.updated_by.get_full_name() or s.updated_by.username if s.updated_by else None,
        'created_at': s.created_at.isoformat(),
        'updated_at': s.updated_at.isoformat(),
    }


# ─── project stats ─────────────────────────────────────────────────────────────

class ProjectStatsView(APIView):
    def get(self, request, project_id):
        project = _get_project_or_404(request, project_id)
        tasks = Task.objects.filter(project=project)
        total    = tasks.count()
        done     = tasks.filter(status='Done').count()
        in_prog  = tasks.filter(status='In Progress').count()
        in_rev   = tasks.filter(status='In Review').count()
        todo     = tasks.filter(status='To Do').count()
        blocked  = tasks.filter(status='Blocked').count()
        progress = round((done / total * 100)) if total > 0 else 0

        members_count = project.workspace.memberships.count()

        return Response({
            'project_id': project.id,
            'project_name': project.name,
            'total': total,
            'done': done,
            'in_progress': in_prog,
            'in_review': in_rev,
            'to_do': todo,
            'blocked': blocked,
            'completion_pct': progress,
            'members_count': members_count,
        })


# ─── wiki pages ───────────────────────────────────────────────────────────────

class WikiPageListView(APIView):
    def get(self, request, project_id):
        project = _get_project_or_404(request, project_id)
        pages = project.wiki_pages.all()
        return Response([_serialize_wiki_page(p) for p in pages])

    def post(self, request, project_id):
        project = _get_project_or_404(request, project_id)
        user = request.user if request.user.is_authenticated else None
        title = request.data.get('title', 'Untitled Page')
        content = request.data.get('content', '')
        page = WikiPage.objects.create(
            project=project,
            title=title,
            content=content,
            created_by=user,
            updated_by=user,
        )
        return Response(_serialize_wiki_page(page), status=status.HTTP_201_CREATED)


class WikiPageDetailView(APIView):
    def get(self, request, project_id, page_id):
        project = _get_project_or_404(request, project_id)
        page = get_object_or_404(WikiPage, id=page_id, project=project)
        return Response(_serialize_wiki_page(page))

    def put(self, request, project_id, page_id):
        project = _get_project_or_404(request, project_id)
        page = get_object_or_404(WikiPage, id=page_id, project=project)
        user = request.user if request.user.is_authenticated else None
        if 'title' in request.data:
            page.title = request.data['title']
        if 'content' in request.data:
            page.content = request.data['content']
        page.updated_by = user
        page.save()
        return Response(_serialize_wiki_page(page))

    def delete(self, request, project_id, page_id):
        project = _get_project_or_404(request, project_id)
        page = get_object_or_404(WikiPage, id=page_id, project=project)
        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── snippets ─────────────────────────────────────────────────────────────────

class SnippetListView(APIView):
    def get(self, request, project_id):
        project = _get_project_or_404(request, project_id)
        snippets = project.snippets.all()
        return Response([_serialize_snippet(s) for s in snippets])

    def post(self, request, project_id):
        project = _get_project_or_404(request, project_id)
        user = request.user if request.user.is_authenticated else None
        data = request.data
        if not data.get('title') or not data.get('code'):
            return Response({'error': 'title and code are required'}, status=400)
        tags = data.get('tags', [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]
        snippet = Snippet.objects.create(
            project=project,
            title=data['title'],
            description=data.get('description', ''),
            language=data.get('language', 'javascript'),
            code=data['code'],
            tags=tags,
            created_by=user,
            updated_by=user,
        )
        return Response(_serialize_snippet(snippet), status=status.HTTP_201_CREATED)


class SnippetDetailView(APIView):
    def put(self, request, project_id, snippet_id):
        project = _get_project_or_404(request, project_id)
        snippet = get_object_or_404(Snippet, id=snippet_id, project=project)
        user = request.user if request.user.is_authenticated else None
        data = request.data
        if 'title' in data:      snippet.title       = data['title']
        if 'description' in data: snippet.description = data['description']
        if 'language' in data:   snippet.language    = data['language']
        if 'code' in data:       snippet.code        = data['code']
        if 'tags' in data:
            tags = data['tags']
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(',') if t.strip()]
            snippet.tags = tags
        snippet.updated_by = user
        snippet.save()
        return Response(_serialize_snippet(snippet))

    def delete(self, request, project_id, snippet_id):
        project = _get_project_or_404(request, project_id)
        snippet = get_object_or_404(Snippet, id=snippet_id, project=project)
        snippet.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── workspace members (fixed: uses actual role from WorkspaceMembership) ─────

class WorkspaceOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace:
            return Response({
                "workspace_name": "Workspace", "user_name": "User",
                "total_projects": 0, "tasks_pending": 0, "tasks_completed": 0,
                "active_projects_user": 0, "top_priority_tasks": [],
                "my_projects": [], "notifications": [], "recent_projects": [],
                "recent_activity": [], "tasks_completed_7_days": [],
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
            pending_tasks = user_tasks.exclude(status=Task.StatusChoices.DONE).order_by('priority', 'due_date')[:5]
            for pt in pending_tasks:
                top_priority_tasks_data.append({
                    "id": pt.id, "title": pt.title,
                    "status": pt.status, "priority": pt.priority
                })

        for p in projects.order_by('-updated_at')[:5]:
            p_tasks = p.tasks.all()
            total_tasks = p_tasks.count()
            completed = p_tasks.filter(status=Task.StatusChoices.DONE).count()
            open_tasks = total_tasks - completed
            progress = int((completed / total_tasks * 100)) if total_tasks > 0 else 0
            my_projects_data.append({
                "id": p.id, "name": p.name, "status": "Active",
                "tasks_open": open_tasks, "tasks_completed": completed, "progress": progress
            })

        for p in Project.objects.filter(workspace=workspace).order_by('-updated_at')[:3]:
            recent_projects_data.append({
                "id": p.id, "name": p.name,
                "tasks_count": p.tasks.count(), "updated_at": p.updated_at
            })

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
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response([])
        projects = Project.objects.filter(workspace=workspace)
        data = []
        for p in projects:
            tasks = p.tasks.all()
            total_tasks = tasks.count()
            completed = tasks.filter(status='Done').count()
            progress = int((completed / total_tasks * 100)) if total_tasks > 0 else 0
            data.append({
                "id": p.id, "name": p.name,
                "description": f"Project for {p.name}",
                "status": "Active" if p.is_active else "Archived",
                "members_count": workspace.memberships.count(),
                "tasks_count": total_tasks, "progress": progress,
                "updated_at": p.updated_at
            })
        return Response(data)

    def post(self, request):
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace:
            owner = request.user if request.user.is_authenticated else None
            if not owner:
                from django.contrib.auth.models import User
                owner = User.objects.first()
                
            workspace = Workspace.objects.create(name="Default Workspace", owner=owner)
            if owner:
                from apps.workspaces.models import WorkspaceMembership
                WorkspaceMembership.objects.create(workspace=workspace, user=owner, role='OWNER')
        
        # Enforce free plan limit
        current_project_count = Project.objects.filter(workspace=workspace).count()
        if current_project_count >= 100: # Increased from 3 for local testing
            return Response(
                {"error": "You've reached the 100-project limit on the Free plan. Upgrade to Pro for unlimited projects."},
                status=403
            )
        name = request.data.get('name')
        if not name or not str(name).strip():
            return Response({"error": "Project name is required"}, status=400)
        project = Project.objects.create(name=str(name).strip(), workspace=workspace)
        
        from apps.realtime.services import EventService
        EventService.record_activity(
            event_type='PROJECT_CREATED',
            actor=request.user,
            workspace=workspace,
            project=project,
            payload={"name": project.name}
        )
        
        return Response({
            "id": project.id, "name": project.name,
            "description": f"Project for {project.name}",
            "status": "Active",
            "members_count": workspace.memberships.count(),
            "tasks_count": 0,
            "progress": 0,
            "updated_at": project.updated_at
        }, status=201)


class WorkspaceActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.workspaces.permissions import get_current_workspace
        from apps.realtime.models import EngineEvent
        from django.utils import timezone
        import datetime
        from django.db.models import Count
        from django.db.models.functions import TruncDate

        workspace = get_current_workspace(request)
        if not workspace: return Response({"error": "Workspace not found"}, status=404)
        
        # Stats
        total_events = EngineEvent.objects.filter(workspace=workspace).count()
        today = timezone.now().date()
        today_events = EngineEvent.objects.filter(workspace=workspace, timestamp__date=today).count()
        projects = Project.objects.filter(workspace=workspace, is_active=True).count()
        
        # 14-day Heatmap
        fourteen_days_ago = today - datetime.timedelta(days=13)
        daily_counts = EngineEvent.objects.filter(
            workspace=workspace, 
            timestamp__date__gte=fourteen_days_ago
        ).annotate(date=TruncDate('timestamp')).values('date').annotate(count=Count('id')).order_by('date')
        
        count_map = {item['date']: item['count'] for item in daily_counts if item['date']}
        heatmap = []
        for i in range(14):
            day = fourteen_days_ago + datetime.timedelta(days=i)
            heatmap.append({
                "date": day.isoformat(),
                "count": count_map.get(day, 0)
            })
            
        # Recent Activity (last 20)
        recent_events = EngineEvent.objects.filter(workspace=workspace).order_by('-timestamp')[:20]
        recent_activity = []
        for event in recent_events:
            actor_name = "System"
            avatar_url = None
            if event.actor:
                actor_name = f"{event.actor.first_name} {event.actor.last_name}".strip() or event.actor.username
                try:
                    from apps.authentication.models import UserProfile
                    profile = UserProfile.objects.filter(user=event.actor).first()
                    if profile and profile.avatar_url:
                        avatar_url = profile.avatar_url
                        if avatar_url.startswith('/'):
                            backend_url = request.build_absolute_uri('/').rstrip('/')
                            avatar_url = f"{backend_url}{avatar_url}"
                except Exception:
                    pass
                    
            # Generate human-readable action text
            action_text = "performed an action"
            target = event.project.name if event.project else workspace.name
            
            if event.event_type == 'TASK_CREATED':
                action_text = f"created task '{event.task.title if event.task else 'Unknown'}'"
            elif event.event_type == 'TASK_UPDATED':
                action_text = f"updated task '{event.task.title if event.task else 'Unknown'}'"
            elif event.event_type == 'TASK_ASSIGNED':
                assignee_id = event.payload.get('task_data', {}).get('assignee')
                if assignee_id and assignee_id == (event.actor.id if event.actor else None):
                    action_text = f"self-assigned task '{event.task.title if event.task else 'Unknown'}'"
                else:
                    action_text = f"assigned task '{event.task.title if event.task else 'Unknown'}'"
            elif event.event_type == 'TASK_UNASSIGNED':
                action_text = f"removed assignee from task '{event.task.title if event.task else 'Unknown'}'"
            elif event.event_type == 'TASK_MOVED' or event.event_type == 'TASK_STATUS_CHANGED':
                new_status = event.payload.get('new_status', 'Unknown')
                action_text = f"moved task '{event.task.title if event.task else 'Unknown'}' to {new_status}"
            elif event.event_type == 'PROJECT_CREATED':
                action_text = f"created project '{event.project.name if event.project else 'Unknown'}'"
            elif event.event_type == 'MEMBER_INVITED':
                invited_name = event.payload.get('name') or event.payload.get('email', 'someone')
                action_text = f"invited {invited_name} to the workspace"
            elif event.event_type == 'MEMBER_JOINED':
                action_text = "joined the workspace"
                
            recent_activity.append({
                "id": event.id,
                "actor": actor_name,
                "avatar": avatar_url,
                "action": action_text,
                "target": target,
                "timestamp": event.timestamp.isoformat(),
                "event_type": event.event_type
            })

        return Response({
            "total_events": total_events, 
            "today_events": today_events,
            "active_projects": projects, 
            "recent_activity": recent_activity, 
            "heatmap": heatmap
        })

class WorkspaceMembersView(APIView):
    """Fixed: uses actual WorkspaceMembership.role instead of is_superuser heuristic."""
    def get(self, request):
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
            data.append({
                "id": m.id,
                "name": f"{m.first_name} {m.last_name}".strip() or m.username,
                "email": m.email,
                "role": membership.role,
                "avatar_url": avatar_url,
                "status": "Active",
                "joined_at": membership.created_at.isoformat() if hasattr(membership, 'created_at') and membership.created_at else None,
                "last_active": "Just now"
            })

        # Pending invitations
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
        except Exception:
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
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response({})
        projects_count = Project.objects.filter(workspace=workspace).count()
        members_count = workspace.memberships.count()
        
        is_pro = workspace.plan == 'PRO'
        
        return Response({
            "plan": workspace.plan,
            "usage": {
                "projects": projects_count,
                "projects_limit": 999 if is_pro else 3,
                "members": members_count,
                "members_limit": 999 if is_pro else 5
            }
        })


class WorkspaceSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response({})
        return Response({
            "name": workspace.name,
            "slug": workspace.slug or workspace.name.lower().replace(" ", "-"),
            "description": "Development Workspace"
        })


    def put(self, request):
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if workspace:
            workspace.name = request.data.get('name', workspace.name)
            if 'slug' in request.data:
                workspace.slug = request.data['slug']
            workspace.save()
        return Response({"status": "success"})

    def delete(self, request):
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if workspace:
            if workspace.owner != request.user:
                return Response({"error": "Only the workspace owner can delete it."}, status=403)
            workspace.delete()
        return Response(status=204)

class WorkspaceLeaveView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from apps.workspaces.permissions import get_current_workspace
        workspace = get_current_workspace(request)
        if not workspace: return Response(status=404)
        
        from apps.workspaces.models import WorkspaceMembership
        membership = WorkspaceMembership.objects.filter(workspace=workspace, user=request.user).first()
        if membership:
            if membership.role == 'OWNER':
                return Response({"error": "Owner cannot leave workspace. Transfer ownership or delete it instead."}, status=400)
            membership.delete()
        return Response(status=204)

class CreateRazorpayOrderView(APIView):
    def post(self, request):
        workspace = Workspace.objects.first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=404)
            
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        amount = 99900 # 999 INR in paise
        
        data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"receipt_{workspace.id}_{int(timezone.now().timestamp())}",
            "notes": {
                "workspace_id": workspace.id
            }
        }
        
        try:
            payment = client.order.create(data=data)
            
            # Record transaction
            PaymentTransaction.objects.create(
                workspace=workspace,
                razorpay_order_id=payment['id'],
                amount=999.00,
                currency="INR",
                status="CREATED"
            )
            
            return Response({
                "order_id": payment['id'],
                "amount": amount,
                "currency": "INR",
                "key_id": settings.RAZORPAY_KEY_ID
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class VerifyRazorpayPaymentView(APIView):
    def post(self, request):
        data = request.data
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_signature = data.get('razorpay_signature')
        
        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return Response({"error": "Missing payment parameters"}, status=400)
            
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            
            transaction = PaymentTransaction.objects.filter(razorpay_order_id=razorpay_order_id).first()
            if transaction:
                transaction.status = "SUCCESS"
                transaction.razorpay_payment_id = razorpay_payment_id
                transaction.razorpay_signature = razorpay_signature
                transaction.save()
                
                # Upgrade plan
                workspace = transaction.workspace
                workspace.plan = 'PRO'
                workspace.save()
                
            return Response({"success": True})
        except razorpay.errors.SignatureVerificationError:
            transaction = PaymentTransaction.objects.filter(razorpay_order_id=razorpay_order_id).first()
            if transaction:
                transaction.status = "FAILED"
                transaction.save()
            return Response({"error": "Invalid signature"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

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


from apps.projects.models import ProjectMembership
from apps.realtime.services import EventService

class ProjectMemberListView(APIView):
    def get(self, request, project_id):
        project = _get_project_or_404(request, project_id)
        
        # Get users who are in this project
        project_members = ProjectMembership.objects.filter(project=project).select_related('user')
        
        results = []
        for pm in project_members:
            # Get their workspace membership to find their role
            try:
                ws_member = WorkspaceMembership.objects.get(workspace=project.workspace, user=pm.user)
                results.append({
                    "id": pm.user.id,
                    "name": pm.user.get_full_name() or pm.user.username,
                    "email": pm.user.email,
                    "username": pm.user.username,
                    "role": ws_member.role,
                    "status": "Active",
                    "added_at": pm.created_at.isoformat()
                })
            except WorkspaceMembership.DoesNotExist:
                pass
                
        return Response(results)

    def post(self, request, project_id):
        project = _get_project_or_404(request, project_id)
        user_id = request.data.get("user_id")
        
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        target_user = get_object_or_404(User, id=user_id)
        
        # Verify target user is an active workspace member
        try:
            ws_membership = WorkspaceMembership.objects.get(workspace=project.workspace, user=target_user)
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "User is not a member of this workspace"}, status=status.HTTP_403_FORBIDDEN)
            
        # Verify not already in project
        if ProjectMembership.objects.filter(project=project, user=target_user).exists():
            return Response({"error": "User is already a member of this project"}, status=status.HTTP_400_BAD_REQUEST)
            
        pm = ProjectMembership.objects.create(
            project=project,
            user=target_user,
            added_by=request.user
        )
        
        # Create Activity / Notification
        EventService.record_activity(
            event_type="MEMBER_ADDED_TO_PROJECT",
            actor=request.user,
            workspace=project.workspace,
            project=project,
            payload={
                "details": f"Added {target_user.get_full_name() or target_user.username} to {project.name}"
            }
        )
        
        EventService.send_notification(
            user=target_user,
            title="Added to Project",
            content=f"You were added to the project '{project.name}' by {request.user.get_full_name() or request.user.username}.",
            event_type="PROJECT_INVITATION",
            workspace=project.workspace,
            project=project,
            link=f"/projects/{project.id}"
        )
        
        return Response({"success": True, "message": "User added to project"}, status=status.HTTP_201_CREATED)


class ProjectMemberDetailView(APIView):
    def delete(self, request, project_id, user_id):
        project = _get_project_or_404(request, project_id)
        pm = get_object_or_404(ProjectMembership, project=project, user_id=user_id)
        pm.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
