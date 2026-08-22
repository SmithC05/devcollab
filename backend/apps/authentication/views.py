import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from apps.realtime.models import PresenceSession
from apps.workspaces.models import WorkspaceMembership

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            # We use email as username in seed script, or they are identical
            # In our seed data, email is "smith@devcollab.io", username is "Smith"
            # Let's try username first, if not found try email
            from django.contrib.auth.models import User
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.filter(username=email).first()

            if not user:
                return JsonResponse({"success": False, "error": "User not found"}, status=404)

            # Check password
            if not user.check_password(password):
                return JsonResponse({"success": False, "error": "Invalid credentials"}, status=401)

            # Generate session token and PresenceSession
            session_token = str(uuid.uuid4())
            PresenceSession.objects.create(
                user=user,
                session_token=session_token,
                status='ACTIVE'
            )

            # Get user's workspace
            membership = WorkspaceMembership.objects.filter(user=user).first()
            workspace_data = None
            role = 'user'
            if membership:
                workspace_data = {
                    "id": membership.workspace.id,
                    "name": membership.workspace.name,
                }
                role = membership.role

            user_data = {
                "id": user.id,
                "email": user.email,
                "name": user.username,
                "role": role,
                "workspace": workspace_data
            }

            return JsonResponse({
                "success": True,
                "message": "Login successful",
                "user": user_data,
                "session_token": session_token
            })
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def logout_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            session_token = data.get('session_token')
            if session_token:
                session = PresenceSession.objects.filter(session_token=session_token).first()
                if session:
                    session.status = 'OFFLINE'
                    session.save()
                    # In a fully strict system we might delete the token or mark it invalid,
                    # but setting status to OFFLINE is good for now.
                    # A better way is to delete it so it can't be reused.
                    session.delete()
        except Exception:
            pass

        return JsonResponse({
            "success": True,
            "message": "Logged out successfully"
        })
    return JsonResponse({"error": "Method not allowed"}, status=405)
