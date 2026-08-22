import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as django_login
from django.contrib.auth.models import User
from django.conf import settings
from .jwt_utils import generate_access_token, generate_refresh_token, set_auth_cookies, clear_auth_cookies, decode_token

def safe_user(user):
    return {
        "id": f"user-{user.id}", # Frontend expects string ID format like user-xxx
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}".strip() or user.username,
        "avatarInitials": (user.first_name[:1] + user.last_name[:1]).upper() if user.first_name and user.last_name else user.username[:2].upper()
    }

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            # Since we might not have set usernames correctly, let's auth by email
            user_obj = User.objects.filter(email=email).first()
            if not user_obj:
                return JsonResponse({"success": False, "error": "Invalid email or password."}, status=401)
                
            user = authenticate(username=user_obj.username, password=password)
            if not user:
                return JsonResponse({"success": False, "error": "Invalid email or password."}, status=401)
                
            access_token = generate_access_token(user.id)
            refresh_token = generate_refresh_token(user.id)
            
            response = JsonResponse({
                "success": True,
                "message": "Login successful",
                "user": safe_user(user)
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
            
            access_token = generate_access_token(user.id)
            refresh_token = generate_refresh_token(user.id)
            
            response = JsonResponse({
                "success": True,
                "message": "Registration successful",
                "user": safe_user(user)
            })
            set_auth_cookies(response, access_token, refresh_token)
            return response
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def logout_view(request):
    if request.method == 'POST':
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
            
            response = JsonResponse({"success": True})
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
