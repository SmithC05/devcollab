import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Mock Users for Development Phase
MOCK_USERS = {
    "user@example.com": {
        "id": "mock-user-001",
        "email": "user@example.com",
        "name": "DevCollab User",
        "role": "user",
        "workspace": None
    },
    "owner@example.com": {
        "id": "mock-owner-001",
        "email": "owner@example.com",
        "name": "DevCollab Owner",
        "role": "owner",
        "workspace": {
            "id": "workspace-001",
            "name": "DevCollab Engineering",
            "slug": "devcollab-engineering"
        }
    },
    "admin@example.com": {
        "id": "mock-admin-001",
        "email": "admin@example.com",
        "name": "DevCollab Admin",
        "role": "admin",
        "workspace": {
            "id": "workspace-001",
            "name": "DevCollab Engineering",
            "slug": "devcollab-engineering"
        }
    },
    "member@example.com": {
        "id": "mock-member-001",
        "email": "member@example.com",
        "name": "DevCollab Member",
        "role": "member",
        "workspace": {
            "id": "workspace-001",
            "name": "DevCollab Engineering",
            "slug": "devcollab-engineering"
        }
    },
    "viewer@example.com": {
        "id": "mock-viewer-001",
        "email": "viewer@example.com",
        "name": "DevCollab Viewer",
        "role": "viewer",
        "workspace": {
            "id": "workspace-001",
            "name": "DevCollab Engineering",
            "slug": "devcollab-engineering"
        }
    }
}

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            if password != 'DevCollab123':
                return JsonResponse({"success": False, "error": "Invalid credentials"}, status=401)
                
            user = MOCK_USERS.get(email)
            if not user:
                return JsonResponse({"success": False, "error": "User not found"}, status=404)
                
            return JsonResponse({
                "success": True,
                "message": "Login successful",
                "user": user
            })
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def logout_view(request):
    if request.method == 'POST':
        return JsonResponse({
            "success": True,
            "message": "Logged out successfully"
        })
    return JsonResponse({"error": "Method not allowed"}, status=405)
