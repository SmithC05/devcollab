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

import hashlib
import secrets
import string
import datetime
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import Invitation, Workspace, WorkspaceMembership
from .services.email_service import send_workspace_invitation
from django.utils.decorators import method_decorator
from rest_framework.authentication import BaseAuthentication

class MiddlewareAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # We rely on the JWTAuthMiddleware to set request._request.user
        if hasattr(request._request, 'user') and request._request.user.is_authenticated:
            return (request._request.user, None)
        return None

def generate_secure_token():
    return secrets.token_urlsafe(32)

def generate_invite_code():
    code1 = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    code2 = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(2))
    return f"DVC-{code1}-{code2}"

@method_decorator(csrf_exempt, name='dispatch')
class CreateInvitationView(APIView):
    authentication_classes = [MiddlewareAuthentication]
    
    def post(self, request, workspace_id):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            workspace = Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Check permissions (must be OWNER or ADMIN)
        try:
            membership = WorkspaceMembership.objects.get(workspace=workspace, user=request.user)
            if membership.role not in ['OWNER', 'ADMIN']:
                return Response({
                    "success": False,
                    "code": "NOT_AUTHORIZED",
                    "message": "You do not have permission to invite members."
                }, status=status.HTTP_403_FORBIDDEN)
        except WorkspaceMembership.DoesNotExist:
            return Response({
                "success": False,
                "code": "NOT_AUTHORIZED",
                "message": "You are not a member of this workspace."
            }, status=status.HTTP_403_FORBIDDEN)
            
        email = request.data.get('email')
        name = request.data.get('name', '')
        role = request.data.get('role', 'DEVELOPER')
        
        if not email:
            return Response({"success": False, "code": "INVALID_EMAIL", "message": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if role not in dict(Invitation.ROLE_CHOICES):
            return Response({"success": False, "code": "INVALID_ROLE", "message": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)
            
        email = email.lower().strip()
        
        # Self-invitation check
        if request.user.email and request.user.email.lower().strip() == email:
            return Response({
                "success": False,
                "code": "SELF_INVITATION",
                "message": "You are already signed in to this workspace and cannot invite yourself."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check plan limit (Max 5 members for free plan)
        current_members = WorkspaceMembership.objects.filter(workspace=workspace).count()
        pending_invites = Invitation.objects.filter(workspace=workspace, status='PENDING').count()
        if (current_members + pending_invites) >= 5:
            return Response({
                "success": False,
                "code": "MEMBER_LIMIT_REACHED",
                "message": "This workspace has reached its member limit."
            }, status=status.HTTP_409_CONFLICT)
            
        # Check if already a member
        if WorkspaceMembership.objects.filter(workspace=workspace, user__email__iexact=email).exists():
            return Response({
                "success": False,
                "code": "ALREADY_MEMBER",
                "message": "This user is already a member of the workspace."
            }, status=status.HTTP_409_CONFLICT)
            
        # Check if already invited
        if Invitation.objects.filter(workspace=workspace, email__iexact=email, status='PENDING').exists():
            return Response({
                "success": False,
                "code": "INVITATION_ALREADY_PENDING",
                "message": "An invitation is already pending for this email."
            }, status=status.HTTP_409_CONFLICT)
            
        token = generate_secure_token()
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        invite_code = generate_invite_code()
        
        expiry_hours = getattr(settings, 'INVITATION_EXPIRY_HOURS', 72)
        expires_at = timezone.now() + datetime.timedelta(hours=expiry_hours)
        
        invitation = Invitation.objects.create(
            workspace=workspace,
            email=email,
            name=name,
            role=role,
            invited_by=request.user,
            token_hash=token_hash,
            invite_code=invite_code,
            expires_at=expires_at
        )
        
        # Send Email via Brevo Service
        inviter_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
        email_sent = send_workspace_invitation(
            recipient_email=email,
            recipient_name=name,
            workspace_name=workspace.name,
            inviter_name=inviter_name,
            role=role,
            invite_code=invite_code,
            token=token,
            expires_at_str=expires_at.strftime("%B %d, %Y")
        )
        
        if not email_sent:
            invitation.delete()
            return Response({
                "success": False,
                "code": "EMAIL_SEND_FAILED",
                "message": "Invitation could not be sent."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response({"success": True, "message": "Invitation sent successfully."}, status=status.HTTP_201_CREATED)

class InvitationDetailView(APIView):
    def get(self, request, token):
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        try:
            invitation = Invitation.objects.get(token_hash=token_hash)
        except Invitation.DoesNotExist:
            return Response({"error": "Invalid invitation"}, status=status.HTTP_404_NOT_FOUND)
            
        return Response({
            "workspace": {
                "name": invitation.workspace.name
            },
            "role": invitation.role,
            "invitedBy": f"{invitation.invited_by.first_name} {invitation.invited_by.last_name}".strip() or invitation.invited_by.username,
            "status": invitation.status,
            "email": invitation.email,
            "expiresAt": invitation.expires_at.isoformat()
        })

@method_decorator(csrf_exempt, name='dispatch')
class AcceptInvitationView(APIView):
    authentication_classes = [MiddlewareAuthentication]
    
    def post(self, request, token):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        try:
            invitation = Invitation.objects.get(token_hash=token_hash)
        except Invitation.DoesNotExist:
            return Response({"error": "Invalid invitation"}, status=status.HTTP_404_NOT_FOUND)
            
        if invitation.status != 'PENDING':
            return Response({"error": f"Invitation already {invitation.status.lower()}"}, status=status.HTTP_400_BAD_REQUEST)
            
        if invitation.expires_at < timezone.now():
            invitation.status = 'EXPIRED'
            invitation.save()
            return Response({"error": "Invitation has expired"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Verify email matches
        if request.user.email.lower() != invitation.email.lower():
            return Response({
                "success": False,
                "code": "INVITATION_EMAIL_MISMATCH",
                "message": "This invitation was sent to a different email address."
            }, status=status.HTTP_403_FORBIDDEN)
            
        workspace = invitation.workspace
        
        # Check plan limits again at acceptance
        current_members = WorkspaceMembership.objects.filter(workspace=workspace).count()
        if current_members >= 5:
            return Response({"error": "This workspace has reached its member limit."}, status=status.HTTP_403_FORBIDDEN)
            
        if WorkspaceMembership.objects.filter(workspace=workspace, user=request.user).exists():
            return Response({"error": "You are already a member of this workspace."}, status=status.HTTP_400_BAD_REQUEST)
            
        WorkspaceMembership.objects.create(
            workspace=workspace,
            user=request.user,
            role=invitation.role
        )
        
        invitation.status = 'ACCEPTED'
        # Add to the legacy project workspace as well (for prototype compatibility)
        try:
            from apps.projects.models import Workspace as LegacyWorkspace
            legacy_workspace = LegacyWorkspace.objects.first()
            if legacy_workspace:
                legacy_workspace.members.add(request.user)
        except Exception as e:
            pass
            
        invitation.accepted_at = timezone.now()
        invitation.save()
        
        return Response({
            "success": True,
            "workspace": {
                "id": workspace.id,
                "name": workspace.name,
                "slug": workspace.slug
            },
            "role": invitation.role
        })

@method_decorator(csrf_exempt, name='dispatch')
class RejectInvitationView(APIView):
    authentication_classes = [MiddlewareAuthentication]
    
    def post(self, request, token):
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        try:
            invitation = Invitation.objects.get(token_hash=token_hash)
        except Invitation.DoesNotExist:
            return Response({"error": "Invalid invitation"}, status=status.HTTP_404_NOT_FOUND)
            
        if invitation.status != 'PENDING':
            return Response({"error": f"Invitation already {invitation.status.lower()}"}, status=status.HTTP_400_BAD_REQUEST)
            
        if invitation.expires_at < timezone.now():
            invitation.status = 'EXPIRED'
            invitation.save()
            return Response({"error": "Invitation has expired"}, status=status.HTTP_400_BAD_REQUEST)
            
        invitation.status = 'REJECTED'
        invitation.rejected_at = timezone.now()
        invitation.save()
        
        return Response({"success": True})
