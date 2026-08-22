import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

MOCK_WORKSPACES = {
    "DEVTEAM001": {
        "id": "workspace-001",
        "name": "DevCollab Engineering",
        "slug": "devcollab-engineering",
        "ownerId": "mock-owner-001"
    },
    "HACK2026": {
        "id": "workspace-002",
        "name": "Hackathon Team",
        "slug": "hackathon-team",
        "ownerId": "mock-owner-002"
    }
}

@csrf_exempt
def create_workspace(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            slug = data.get('slug')
            owner_id = data.get('ownerId')
            
            if not name or not slug:
                return JsonResponse({"success": False, "error": "Name and slug are required"}, status=400)
                
            # Simulate basic validation
            for ws in MOCK_WORKSPACES.values():
                if ws['slug'] == slug:
                    return JsonResponse({"success": False, "error": "Workspace slug already exists"}, status=400)
            
            # Create mock workspace
            import uuid
            workspace_id = f"workspace-{str(uuid.uuid4())[:8]}"
            
            workspace = {
                "id": workspace_id,
                "name": name,
                "slug": slug,
                "ownerId": owner_id
            }
            
            return JsonResponse({
                "success": True,
                "message": "Workspace created successfully",
                "workspace": workspace,
                "membership": {
                    "role": "owner"
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
                
            workspace = MOCK_WORKSPACES.get(invite_code)
            if not workspace:
                return JsonResponse({"success": False, "error": "Invalid invite code"}, status=404)
                
            return JsonResponse({
                "success": True,
                "message": "Joined workspace successfully",
                "workspace": {
                    "id": workspace["id"],
                    "name": workspace["name"],
                    "slug": workspace["slug"]
                },
                "membership": {
                    "role": "member"
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)
