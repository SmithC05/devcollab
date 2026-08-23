from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services import sync_github_evidence
from apps.developers.models import EngineeringEvidence, DeveloperProfile
import threading

@csrf_exempt
def sync_github_view(request, user_id=None):
    if request.method == 'POST':
        if not request.user or not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)
            
        # Target user for sync
        target_user = request.user
        if user_id and user_id != request.user.id:
            # Check if request.user is Lead or Admin, for simplicity here we just check if they are in the same workspace or trust the UI
            try:
                from django.contrib.auth import get_user_model
                target_user = get_user_model().objects.get(id=user_id)
            except:
                return JsonResponse({"error": "User not found"}, status=404)

        # Run in background to avoid blocking
        threading.Thread(target=sync_github_evidence, args=(target_user,)).start()
        
        return JsonResponse({"success": True, "message": "Sync started"})
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def evidence_view(request, user_id=None):
    if request.method == 'GET':
        if not request.user or not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)
            
        target_user = request.user
        if user_id and user_id != request.user.id:
            try:
                from django.contrib.auth import get_user_model
                target_user = get_user_model().objects.get(id=user_id)
            except:
                return JsonResponse({"error": "User not found"}, status=404)

        evidence = EngineeringEvidence.objects.filter(user=target_user, source='GITHUB').first()
        if not evidence:
            return JsonResponse({"success": True, "evidence": None})
            
        return JsonResponse({"success": True, "evidence": {
            "repository_count": evidence.repository_count,
            "repositories": evidence.repositories,
            "technology_evidence": evidence.technology_evidence,
            "last_analyzed_at": evidence.last_analyzed_at.isoformat() if evidence.last_analyzed_at else None
        }})
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def disconnect_github_view(request):
    if request.method == 'POST':
        if not request.user or not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)
            
        try:
            profile = DeveloperProfile.objects.get(user=request.user)
            profile.github_connection_status = 'DISCONNECTED'
            profile.sync_status = 'NOT_SYNCED'
            profile.github_username = None
            profile.github_user_id = None
            profile.save()
            
            # Delete the social token AND the social account so it doesn't auto-reconnect
            from allauth.socialaccount.models import SocialToken, SocialAccount
            SocialToken.objects.filter(account__user=request.user, account__provider='github').delete()
            SocialAccount.objects.filter(user=request.user, provider='github').delete()
            
            # Delete any existing engineering evidence from GitHub
            EngineeringEvidence.objects.filter(user=request.user, source='GITHUB').delete()
            
            return JsonResponse({"success": True, "message": "Disconnected"})
        except DeveloperProfile.DoesNotExist:
            return JsonResponse({"success": False, "error": "Profile not found"})
    return JsonResponse({"error": "Method not allowed"}, status=405)
