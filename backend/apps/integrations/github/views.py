from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services import sync_github_evidence
from apps.developers.models import EngineeringEvidence, DeveloperProfile
import threading

@csrf_exempt
def sync_github_view(request):
    if request.method == 'POST':
        if not request.user or not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)
            
        # Run in background to avoid blocking
        # In a real app we'd use celery, but threading is fine for this phase to avoid blocking the API
        threading.Thread(target=sync_github_evidence, args=(request.user,)).start()
        
        return JsonResponse({"success": True, "message": "Sync started"})
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def evidence_view(request):
    if request.method == 'GET':
        if not request.user or not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)
            
        evidence = EngineeringEvidence.objects.filter(user=request.user, source='GITHUB').first()
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
            
            # Optionally we can delete the social token
            from allauth.socialaccount.models import SocialToken
            SocialToken.objects.filter(account__user=request.user, account__provider='github').delete()
            
            return JsonResponse({"success": True, "message": "Disconnected"})
        except DeveloperProfile.DoesNotExist:
            return JsonResponse({"success": False, "error": "Profile not found"})
    return JsonResponse({"error": "Method not allowed"}, status=405)
