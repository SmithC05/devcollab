import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from apps.realtime.models import PresenceSession
from apps.workspaces.models import WorkspaceMembership
from apps.authentication.jwt_utils import (
    generate_access_token, 
    generate_refresh_token, 
    decode_token, 
    set_auth_cookies, 
    clear_auth_cookies
)

def safe_user(user):
    # BUG-16 FIX: Return a proper display name. Previously returned user.username
    # which equals the email address (set that way in register_view).
    display_name = f"{user.first_name} {user.last_name}".strip() or user.username
    data = {
        "id": user.id,
        "email": user.email,
        "name": display_name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "github_connected": False,
        "github_username": None,
        "sync_status": "NOT_SYNCED",
        "last_sync_at": None,
    }
    if hasattr(user, 'developer_profile'):
        data["github_connected"] = user.developer_profile.github_connection_status == 'CONNECTED'
        data["github_username"] = user.developer_profile.github_username
        data["sync_status"] = user.developer_profile.sync_status
        data["last_sync_at"] = user.developer_profile.last_sync_at.isoformat() if user.developer_profile.last_sync_at else None
    return data

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

            access_token = generate_access_token(user.id)
            refresh_token = generate_refresh_token(user.id)

            response = JsonResponse({
                "success": True,
                "message": "Login successful",
                "user": safe_user(user),
                "access_token": access_token,
                "session_token": session_token
            })
            set_auth_cookies(response, access_token, refresh_token)
            return response
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def register_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            name = data.get('name', '')
            
            if User.objects.filter(email=email).exists():
                return JsonResponse({"success": False, "error": "An account with this email already exists."}, status=400)
                
            # Split name into first and last
            parts = name.split(' ', 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ''
            
            user = User.objects.create_user(
                username=email, # use email as username
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            session_token = str(uuid.uuid4())
            PresenceSession.objects.create(
                user=user,
                session_token=session_token,
                status='ACTIVE'
            )
            
            access_token = generate_access_token(user.id)
            refresh_token = generate_refresh_token(user.id)
            
            response = JsonResponse({
                "success": True,
                "message": "Registration successful",
                "user": safe_user(user),
                "access_token": access_token,
                "session_token": session_token
            })
            set_auth_cookies(response, access_token, refresh_token)
            return response
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
                    # BUG-17 FIX: Removed dead session.save() that was immediately
                    # followed by session.delete() — the save was pointless.
                    session.delete()
        except Exception:
            pass

        response = JsonResponse({
            "success": True,
            "message": "Logged out successfully"
        })
        clear_auth_cookies(response)
        return response
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def me_view(request):
    if request.method == 'GET':
        if not request.user or not request.user.is_authenticated:
            return JsonResponse({"success": False, "error": "Not authenticated"}, status=401)
            
        return JsonResponse({
            "success": True,
            "user": safe_user(request.user)
        })
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def refresh_view(request):
    if request.method == 'POST':
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return JsonResponse({"success": False, "error": "No refresh token"}, status=401)
            
        try:
            payload = decode_token(refresh_token)
            user_id = payload.get('user_id')
            user = User.objects.filter(id=user_id).first()
            
            if not user:
                return JsonResponse({"success": False, "error": "Invalid user"}, status=401)
                
            access_token = generate_access_token(user.id)
            new_refresh_token = generate_refresh_token(user.id)
            
            response = JsonResponse({
                "success": True,
                "access_token": access_token
            })
            set_auth_cookies(response, access_token, new_refresh_token)
            return response
        except Exception as e:
            response = JsonResponse({"success": False, "error": "Invalid refresh token"}, status=401)
            clear_auth_cookies(response)
            return response
    return JsonResponse({"error": "Method not allowed"}, status=405)

# OAuth Callback handler
from django.shortcuts import redirect
from django.conf import settings
import urllib.parse

def oauth_callback_view(request):
    """
    Called AFTER allauth finishes the OAuth flow.
    allauth sets request.user via Django session (AuthenticationMiddleware runs
    before JWTAuthMiddleware so the session-based user is available here).

    BUG-05 FIX: Previously the return_url was encoded as a query param on the
    redirect URL, but AuthCallbackPage only read from sessionStorage — the two
    systems never connected.  Now we pass the return_url via a short-lived cookie
    so the frontend can reliably read it regardless of how the OAuth redirect lands.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:5173')
    callback_url = f"{frontend_url}/auth/callback"

    if request.user.is_authenticated:
        access_token = generate_access_token(request.user.id)
        refresh_token = generate_refresh_token(request.user.id)

        response = redirect(callback_url)
        set_auth_cookies(response, access_token, refresh_token)

        # Pass return_url via a short-lived non-httpOnly cookie so JS can read it.
        return_url = request.GET.get('return_url') or request.session.get('auth_return_url')
        if return_url:
            response.set_cookie(
                'auth_return_url',
                urllib.parse.quote(return_url),
                max_age=300,          # 5 minutes is plenty
                httponly=False,       # Must be readable by JS
                secure=getattr(settings, 'AUTH_COOKIE_SECURE', False),
                samesite='Lax',
                path='/'
            )
        return response

    # If not authenticated, redirect with error
    return redirect(f"{callback_url}?error=auth_failed")
