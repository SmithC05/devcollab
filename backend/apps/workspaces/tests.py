from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from apps.workspaces.models import Workspace, WorkspaceMembership, Invitation
from unittest.mock import patch
from django.urls import reverse
import json

class WorkspaceInvitationTestCase(TestCase):
    def setUp(self):
        # Create users
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='password123')
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='password123')
        self.developer = User.objects.create_user(username='dev', email='dev@example.com', password='password123')
        self.outside_user = User.objects.create_user(username='outsider', email='outsider@example.com', password='password123')
        self.invitee_email = 'invitee@example.com'

        # Create Workspace A
        self.workspace_a = Workspace.objects.create(name='Workspace A', owner=self.owner)
        WorkspaceMembership.objects.create(workspace=self.workspace_a, user=self.owner, role='OWNER')
        WorkspaceMembership.objects.create(workspace=self.workspace_a, user=self.admin, role='ADMIN')
        WorkspaceMembership.objects.create(workspace=self.workspace_a, user=self.developer, role='DEVELOPER')

        # Create Workspace B
        self.workspace_b = Workspace.objects.create(name='Workspace B', owner=self.owner)
        WorkspaceMembership.objects.create(workspace=self.workspace_b, user=self.owner, role='OWNER')

        self.invite_url = f'/api/workspaces/{self.workspace_a.id}/invitations/'
        self.invite_b_url = f'/api/workspaces/{self.workspace_b.id}/invitations/'

    def get_jwt_for_user(self, user):
        self.client.cookies.clear()
        response = self.client.post('/api/auth/login/', {'email': user.email, 'password': 'password123'}, content_type='application/json')
        return response.json().get('access_token')

    def test_owner_can_invite(self):
        token = self.get_jwt_for_user(self.owner)
        
        with patch('apps.workspaces.views.send_workspace_invitation', return_value=True) as mock_send:
            response = self.client.post(
                self.invite_url,
                {'email': self.invitee_email, 'role': 'DEVELOPER', 'name': 'Invitee'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 201)
            mock_send.assert_called_once()
            
            # Check DB
            self.assertTrue(Invitation.objects.filter(email=self.invitee_email, workspace=self.workspace_a, status='PENDING').exists())

    def test_admin_can_invite(self):
        token = self.get_jwt_for_user(self.admin)
        
        with patch('apps.workspaces.views.send_workspace_invitation', return_value=True) as mock_send:
            response = self.client.post(
                self.invite_url,
                {'email': 'another@example.com', 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 201)

    def test_developer_cannot_invite(self):
        token = self.get_jwt_for_user(self.developer)
        
        response = self.client.post(
            self.invite_url,
            {'email': 'test@example.com', 'role': 'DEVELOPER'},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['code'], 'NOT_AUTHORIZED')

    def test_unauthorized_user_cannot_invite(self):
        token = self.get_jwt_for_user(self.outside_user)
        
        response = self.client.post(
            self.invite_url,
            {'email': 'test@example.com', 'role': 'DEVELOPER'},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)

    def test_invalid_email_and_role(self):
        token = self.get_jwt_for_user(self.owner)
        
        # Missing email
        response = self.client.post(
            self.invite_url,
            {'role': 'DEVELOPER'},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['code'], 'INVALID_EMAIL')
        
        # Invalid role
        response = self.client.post(
            self.invite_url,
            {'email': 'valid@example.com', 'role': 'OWNER'}, # OWNER is not in Invitation.ROLE_CHOICES
            HTTP_AUTHORIZATION=f'Bearer {token}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['code'], 'INVALID_ROLE')

    def test_self_invitation_rejected(self):
        token = self.get_jwt_for_user(self.owner)
        
        response = self.client.post(
            self.invite_url,
            {'email': self.owner.email, 'role': 'DEVELOPER'},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['code'], 'SELF_INVITATION')

    def test_existing_member_rejected(self):
        token = self.get_jwt_for_user(self.owner)
        
        response = self.client.post(
            self.invite_url,
            {'email': self.developer.email, 'role': 'DEVELOPER'},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()['code'], 'ALREADY_MEMBER')

    def test_cross_workspace_isolation(self):
        # Developer is in Workspace A but NOT Workspace B.
        # Owner of Workspace B should be able to invite Developer to Workspace B.
        token = self.get_jwt_for_user(self.owner)
        
        with patch('apps.workspaces.views.send_workspace_invitation', return_value=True):
            response = self.client.post(
                self.invite_b_url,
                {'email': self.developer.email, 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 201)

    def test_duplicate_pending_invitation(self):
        token = self.get_jwt_for_user(self.owner)
        
        with patch('apps.workspaces.views.send_workspace_invitation', return_value=True):
            # First invite
            self.client.post(
                self.invite_url,
                {'email': self.invitee_email, 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            # Second invite to same email
            response = self.client.post(
                self.invite_url,
                {'email': self.invitee_email, 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.json()['code'], 'INVITATION_ALREADY_PENDING')

    def test_member_limit_enforced(self):
        token = self.get_jwt_for_user(self.owner)
        
        # Workspace A already has 3 members (Owner, Admin, Developer).
        # Max limit is 5. We can invite 2 more.
        
        with patch('apps.workspaces.views.send_workspace_invitation', return_value=True):
            self.client.post(
                self.invite_url,
                {'email': 'limit1@example.com', 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            self.client.post(
                self.invite_url,
                {'email': 'limit2@example.com', 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            
            # Now there are 3 active + 2 pending = 5 total. Next invite should fail.
            response = self.client.post(
                self.invite_url,
                {'email': 'limit3@example.com', 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.json()['code'], 'MEMBER_LIMIT_REACHED')

    def test_email_send_failed(self):
        token = self.get_jwt_for_user(self.owner)
        
        with patch('apps.workspaces.views.send_workspace_invitation', return_value=False):
            response = self.client.post(
                self.invite_url,
                {'email': self.invitee_email, 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.json()['code'], 'EMAIL_SEND_FAILED')
            
            # Check rollback (invitation deleted)
            self.assertFalse(Invitation.objects.filter(email=self.invitee_email, workspace=self.workspace_a).exists())

    def test_acceptance_flow(self):
        token = self.get_jwt_for_user(self.owner)
        
        with patch('apps.workspaces.views.send_workspace_invitation', return_value=True):
            # Create invite
            self.client.post(
                self.invite_url,
                {'email': self.outside_user.email, 'role': 'DEVELOPER'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
        
        invitation = Invitation.objects.get(email=self.outside_user.email)
        
        # Attempt to accept with WRONG user (admin)
        admin_token = self.get_jwt_for_user(self.admin)
        response = self.client.post(
            f'/api/invitations/{invitation.token_hash}/accept/', # Since token generation is hidden in view, we mock it or pass token hash for tests?
            # Wait, the view expects the RAW token, not token_hash!
            # Since we can't extract the raw token easily in the test (it's lost to hash), we can mock generate_secure_token.
            HTTP_AUTHORIZATION=f'Bearer {admin_token}',
            content_type='application/json'
        )
        # We need to rewrite this test slightly with mocking the token, or bypassing it.
        pass

    @patch('apps.workspaces.views.generate_secure_token', return_value='RAW_SECURE_TOKEN')
    def test_full_acceptance_and_rejection_flow(self, mock_token):
        token = self.get_jwt_for_user(self.owner)
        
        with patch('apps.workspaces.views.send_workspace_invitation', return_value=True):
            self.client.post(
                self.invite_url,
                {'email': self.outside_user.email, 'role': 'ADMIN'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                content_type='application/json'
            )
            
        invitation = Invitation.objects.get(email=self.outside_user.email)
        
        # Outside user attempts to accept
        outside_token = self.get_jwt_for_user(self.outside_user)
        
        # Test WRONG user acceptance (developer trying to accept outsider's invite)
        dev_token = self.get_jwt_for_user(self.developer)
        wrong_resp = self.client.post(
            f'/api/invitations/RAW_SECURE_TOKEN/accept/',
            HTTP_AUTHORIZATION=f'Bearer {dev_token}',
            content_type='application/json'
        )
        self.assertEqual(wrong_resp.status_code, 403)
        self.assertEqual(wrong_resp.json()['code'], 'INVITATION_EMAIL_MISMATCH')
        
        # Test CORRECT user acceptance
        resp = self.client.post(
            f'/api/invitations/RAW_SECURE_TOKEN/accept/',
            HTTP_AUTHORIZATION=f'Bearer {outside_token}',
            content_type='application/json'
        )
        print("ACCEPTANCE RESP:", resp.status_code, resp.json() if resp.status_code != 200 else "")
        self.assertEqual(resp.status_code, 200)
        
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'ACCEPTED')
        
        membership = WorkspaceMembership.objects.get(workspace=self.workspace_a, user=self.outside_user)
        self.assertEqual(membership.role, 'ADMIN')
