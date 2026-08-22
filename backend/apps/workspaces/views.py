import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .models import Workspace, WorkspaceMembership

@csrf_exempt
def workspaces_view(request):
    if request.method == 'GET':
        if not request.user.is_authenticated:
            return JsonResponse({"success": False, "error": "Not authenticated"}, status=401)
            
        memberships = WorkspaceMembership.objects.filter(user=request.user).select_related('workspace')
        
        workspaces_data = []
        for membership in memberships:
            ws = membership.workspace
            workspaces_data.append({
                "id": ws.id,
                "name": ws.name,
                "slug": ws.slug,
                "role": membership.role,
                "plan": "free", # Placeholder
                "memberCount": ws.memberships.count(),
                "projectCount": 0 # Placeholder
            })
            
        return JsonResponse({
            "success": True,
            "workspaces": workspaces_data
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            slug = data.get('slug')
            owner_id = data.get('ownerId')
            
            if not name or not slug:
                return JsonResponse({"success": False, "error": "Name and slug are required"}, status=400)
                
            if Workspace.objects.filter(slug=slug).exists():
                return JsonResponse({"success": False, "error": "Workspace slug already exists"}, status=400)
            
            owner = User.objects.filter(id=owner_id).first()
            if not owner:
                return JsonResponse({"success": False, "error": "Owner not found"}, status=400)
                
            workspace = Workspace.objects.create(
                name=name,
                slug=slug,
                owner=owner
            )
            
            WorkspaceMembership.objects.create(
                workspace=workspace,
                user=owner,
                role='OWNER'
            )
            
            workspace_data = {
                "id": workspace.id,
                "name": workspace.name,
                "slug": workspace.slug,
                "ownerId": owner.id
            }
            
            return JsonResponse({
                "success": True,
                "message": "Workspace created successfully",
                "workspace": workspace_data,
                "membership": {
                    "role": "OWNER"
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def join_workspace(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            invite_code = data.get('inviteCode')
            user_id = data.get('userId')
            
            if not invite_code:
                return JsonResponse({"success": False, "error": "Invite code is required"}, status=400)
                
            # Treat invite_code as slug for now
            workspace = Workspace.objects.filter(slug=invite_code).first()
            if not workspace:
                return JsonResponse({"success": False, "error": "Invalid invite code"}, status=404)
                
            user = User.objects.filter(id=user_id).first()
            if not user:
                return JsonResponse({"success": False, "error": "User not found"}, status=400)
                
            membership, created = WorkspaceMembership.objects.get_or_create(
                workspace=workspace,
                user=user,
                defaults={'role': 'MEMBER'}
            )
                
            return JsonResponse({
                "success": True,
                "message": "Joined workspace successfully",
                "workspace": {
                    "id": workspace.id,
                    "name": workspace.name,
                    "slug": workspace.slug
                },
                "membership": {
                    "role": membership.role
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)
