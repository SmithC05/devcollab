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
    return {
        "id": user.id,
        "email": user.email,
        "name": user.username
    }

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
                    session.status = 'OFFLINE'
                    session.save()
                    # In a fully strict system we might delete the token or mark it invalid,
                    # but setting status to OFFLINE is good for now.
                    # A better way is to delete it so it can't be reused.
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
    # This view is called AFTER allauth has finished its flow.
    # allauth creates the user and logs them in via django.contrib.auth.
    # So request.user will be populated.
    
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    callback_url = f"{frontend_url}/auth/callback"
    
    if request.user.is_authenticated:
        access_token = generate_access_token(request.user.id)
        refresh_token = generate_refresh_token(request.user.id)
        
        response = redirect(callback_url)
        set_auth_cookies(response, access_token, refresh_token)
        return response
    
    # If not authenticated, redirect with error
    return redirect(f"{callback_url}?error=auth_failed")
