"""
Comprehensive RBAC Test Suite -- Task Management
================================================
Phases covered:
  Phase 9a : Permission class unit tests (get_user_role, assert_task_permission)
  Phase 9b : HTTP API-level tests for all roles/actions
  Phase 5  : Crafted payload field-injection attempts
  Phase 7  : Cross-project / cross-workspace isolation
  Phase 8  : Role-transition (DB role change takes immediate effect)
  Phase 6  : Unauthenticated requests

Run:  python manage.py test apps.tasks.tests --verbosity=2
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.workspaces.models import Workspace, WorkspaceMembership
from apps.projects.models import Project
from apps.tasks.models import Task
from apps.tasks.permissions import (
    get_user_role, assert_task_permission,
    OWNER, ADMIN, LEAD, DEVELOPER, MANAGER_ROLES,
)
from rest_framework.exceptions import PermissionDenied


# ---------------------------------------------------------------------------
# Shared fixture mixin
# ---------------------------------------------------------------------------

class RBACFixtureMixin:
    """Creates two workspaces, projects, tasks, and five users."""

    @classmethod
    def setUpTestData(cls):
        cls.ws_owner = User.objects.create_user('rbac_owner', 'o@t.com', 'pass')
        cls.ws_admin = User.objects.create_user('rbac_admin', 'a@t.com', 'pass')
        cls.ws_lead  = User.objects.create_user('rbac_lead',  'l@t.com', 'pass')
        cls.ws_dev   = User.objects.create_user('rbac_dev',   'd@t.com', 'pass')
        cls.ws_dev2  = User.objects.create_user('rbac_dev2',  'd2@t.com', 'pass')
        cls.outsider = User.objects.create_user('rbac_out',   'x@t.com', 'pass')

        cls.ws = Workspace.objects.create(name='TestWS', slug='testws-rbac', owner=cls.ws_owner)
        WorkspaceMembership.objects.create(workspace=cls.ws, user=cls.ws_owner, role=OWNER)
        WorkspaceMembership.objects.create(workspace=cls.ws, user=cls.ws_admin, role=ADMIN)
        WorkspaceMembership.objects.create(workspace=cls.ws, user=cls.ws_lead,  role=LEAD)
        WorkspaceMembership.objects.create(workspace=cls.ws, user=cls.ws_dev,   role=DEVELOPER)
        WorkspaceMembership.objects.create(workspace=cls.ws, user=cls.ws_dev2,  role=DEVELOPER)

        cls.proj = Project.objects.create(name='Proj A', workspace=cls.ws)

        # Second workspace for cross-project tests
        cls.ws2_owner = User.objects.create_user('rbac_ws2_owner', 'ow2@t.com', 'pass')
        cls.ws2 = Workspace.objects.create(name='TestWS2', slug='testws2-rbac', owner=cls.ws2_owner)
        WorkspaceMembership.objects.create(workspace=cls.ws2, user=cls.ws2_owner, role=OWNER)
        cls.proj2 = Project.objects.create(name='Proj B', workspace=cls.ws2)

        cls.task_dev  = Task.objects.create(title='Dev Task',  project=cls.proj,  assignee=cls.ws_dev,   status='To Do')
        cls.task_dev2 = Task.objects.create(title='Dev2 Task', project=cls.proj,  assignee=cls.ws_dev2,  status='To Do')
        cls.task_ws2  = Task.objects.create(title='WS2 Task',  project=cls.proj2, assignee=cls.ws2_owner, status='To Do')

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c


# ===========================================================================
# PHASE 9-A  Permission helper unit tests
# ===========================================================================

class TestGetUserRole(RBACFixtureMixin, TestCase):
    def test_owner_role(self):   self.assertEqual(get_user_role(self.ws_owner, self.proj), OWNER)
    def test_admin_role(self):   self.assertEqual(get_user_role(self.ws_admin, self.proj), ADMIN)
    def test_lead_role(self):    self.assertEqual(get_user_role(self.ws_lead,  self.proj), LEAD)
    def test_dev_role(self):     self.assertEqual(get_user_role(self.ws_dev,   self.proj), DEVELOPER)
    def test_outsider_none(self): self.assertIsNone(get_user_role(self.outsider, self.proj))
    def test_cross_workspace_none(self): self.assertIsNone(get_user_role(self.ws_dev, self.proj2))


class TestAssertTaskPermission(RBACFixtureMixin, TestCase):
    def _pass(self, user, task, action):
        try:
            assert_task_permission(user, task, action)
        except PermissionDenied:
            self.fail(f'Unexpected PermissionDenied for {action}')

    def _block(self, user, task, action):
        with self.assertRaises(PermissionDenied):
            assert_task_permission(user, task, action)

    def test_owner_all_actions(self):
        for act in ('edit', 'delete', 'assign', 'move', 'move_own'):
            self._pass(self.ws_owner, self.task_dev, act)

    def test_admin_all_actions(self):
        for act in ('edit', 'delete', 'assign', 'move', 'move_own'):
            self._pass(self.ws_admin, self.task_dev, act)

    def test_lead_all_actions(self):
        for act in ('edit', 'delete', 'assign', 'move', 'move_own'):
            self._pass(self.ws_lead, self.task_dev, act)

    def test_dev_edit_blocked(self):         self._block(self.ws_dev, self.task_dev, 'edit')
    def test_dev_delete_blocked(self):       self._block(self.ws_dev, self.task_dev, 'delete')
    def test_dev_assign_blocked(self):       self._block(self.ws_dev, self.task_dev, 'assign')
    def test_dev_move_own_allowed(self):     self._pass(self.ws_dev,  self.task_dev, 'move')
    def test_dev_move_others_blocked(self):  self._block(self.ws_dev, self.task_dev2, 'move')
    def test_outsider_blocked(self):         self._block(self.outsider, self.task_dev, 'edit')


# ===========================================================================
# PHASE 9-B  HTTP / API-level tests
# ===========================================================================

class TestTaskCreateAPI(RBACFixtureMixin, TestCase):
    def _post(self, user, data):
        return self._client(user).post('/api/tasks/', data, format='json')

    def test_owner_can_create(self):
        r = self._post(self.ws_owner, {'title': 'T', 'project': self.proj.id, 'status': 'To Do'})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_admin_can_create(self):
        r = self._post(self.ws_admin, {'title': 'T', 'project': self.proj.id, 'status': 'To Do'})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_lead_can_create(self):
        r = self._post(self.ws_lead, {'title': 'T', 'project': self.proj.id, 'status': 'To Do'})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_dev_create_blocked_403(self):
        r = self._post(self.ws_dev, {'title': 'Hack', 'project': self.proj.id, 'status': 'To Do'})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_create_blocked_403(self):
        r = APIClient().post('/api/tasks/', {'title': 'Anon', 'project': self.proj.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_outsider_create_blocked_403(self):
        r = self._post(self.outsider, {'title': 'Out', 'project': self.proj.id, 'status': 'To Do'})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class TestTaskEditAPI(RBACFixtureMixin, TestCase):
    def _patch(self, user, task, data):
        return self._client(user).patch(f'/api/tasks/{task.id}/', data, format='json')

    def test_owner_can_edit_title(self):
        r = self._patch(self.ws_owner, self.task_dev, {'title': 'Updated'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_admin_can_edit_priority(self):
        r = self._patch(self.ws_admin, self.task_dev, {'priority': 'P0'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_lead_can_edit_title(self):
        r = self._patch(self.ws_lead, self.task_dev, {'title': 'Lead Updated'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_dev_edit_title_blocked_403(self):
        r = self._patch(self.ws_dev, self.task_dev, {'title': 'Hack'})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_dev_edit_priority_blocked_403(self):
        r = self._patch(self.ws_dev, self.task_dev, {'priority': 'P0'})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_dev_edit_due_date_blocked_403(self):
        r = self._patch(self.ws_dev, self.task_dev, {'due_date': '2026-09-01'})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_dev_edit_others_task_blocked_403(self):
        r = self._patch(self.ws_dev, self.task_dev2, {'status': 'In Progress'})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_dev_status_own_task_allowed(self):
        r = self._patch(self.ws_dev, self.task_dev, {'status': 'In Progress'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_unauthenticated_edit_blocked_403(self):
        r = APIClient().patch(f'/api/tasks/{self.task_dev.id}/', {'title': 'x'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class TestTaskDeleteAPI(RBACFixtureMixin, TestCase):
    def setUp(self):
        self.del_task = Task.objects.create(title='To Delete', project=self.proj, status='To Do')

    def _delete(self, user, task):
        return self._client(user).delete(f'/api/tasks/{task.id}/')

    def test_owner_can_delete(self):
        t = Task.objects.create(title='del_owner', project=self.proj, status='To Do')
        r = self._delete(self.ws_owner, t)
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_can_delete(self):
        t = Task.objects.create(title='del_admin', project=self.proj, status='To Do')
        r = self._delete(self.ws_admin, t)
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)

    def test_lead_can_delete(self):
        t = Task.objects.create(title='del_lead', project=self.proj, status='To Do')
        r = self._delete(self.ws_lead, t)
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)

    def test_dev_delete_blocked_403(self):
        r = self._delete(self.ws_dev, self.del_task)
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_delete_blocked_403(self):
        r = APIClient().delete(f'/api/tasks/{self.del_task.id}/')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class TestTaskMoveAPI(RBACFixtureMixin, TestCase):
    def _move(self, user, task, new_status):
        return self._client(user).post(f'/api/tasks/{task.id}/move/', {'status': new_status}, format='json')

    def test_owner_can_move_any(self):
        r = self._move(self.ws_owner, self.task_dev2, 'In Progress')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_admin_can_move_any(self):
        r = self._move(self.ws_admin, self.task_dev2, 'In Progress')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_lead_can_move_any(self):
        r = self._move(self.ws_lead, self.task_dev2, 'In Progress')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_dev_move_own_task_allowed(self):
        r = self._move(self.ws_dev, self.task_dev, 'In Progress')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_dev_move_others_task_blocked_403(self):
        r = self._move(self.ws_dev, self.task_dev2, 'In Progress')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_move_blocked_403(self):
        r = APIClient().post(f'/api/tasks/{self.task_dev.id}/move/', {'status': 'Done'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


# ===========================================================================
# PHASE 5  Crafted payload injection
# ===========================================================================

class TestCraftedPayloadProtection(RBACFixtureMixin, TestCase):

    def test_dev_cannot_inject_role_via_payload(self):
        """Client sending role=Owner in payload must not escalate permissions."""
        c = self._client(self.ws_dev)
        r = c.patch(f'/api/tasks/{self.task_dev.id}/', {'title': 'pwned', 'role': 'OWNER'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_dev_cannot_inject_mixed_forbidden_fields(self):
        c = self._client(self.ws_dev)
        r = c.patch(f'/api/tasks/{self.task_dev.id}/', {
            'status': 'In Progress', 'priority': 'P0',
            'due_date': '2026-09-01', 'assignee': self.ws_dev2.id,
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_dev_status_only_patch_allowed(self):
        c = self._client(self.ws_dev)
        r = c.patch(f'/api/tasks/{self.task_dev.id}/', {'status': 'In Progress'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_dev_full_put_blocked(self):
        c = self._client(self.ws_dev)
        r = c.put(f'/api/tasks/{self.task_dev.id}/', {
            'title': 'takeover', 'project': self.proj.id, 'status': 'Done',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


# ===========================================================================
# PHASE 7  Cross-project / cross-workspace isolation
# ===========================================================================

class TestCrossProjectIsolation(RBACFixtureMixin, TestCase):

    def test_ws_dev_cannot_edit_ws2_task(self):
        c = self._client(self.ws_dev)
        r = c.patch(f'/api/tasks/{self.task_ws2.id}/', {'status': 'Done'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_ws_owner_cannot_edit_ws2_task(self):
        c = self._client(self.ws_owner)
        r = c.patch(f'/api/tasks/{self.task_ws2.id}/', {'title': 'x'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_ws_owner_cannot_delete_ws2_task(self):
        c = self._client(self.ws_owner)
        r = c.delete(f'/api/tasks/{self.task_ws2.id}/')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_ws2_owner_can_edit_own_task(self):
        c = self._client(self.ws2_owner)
        r = c.patch(f'/api/tasks/{self.task_ws2.id}/', {'title': 'ok'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_invalid_task_id_returns_404(self):
        c = self._client(self.ws_owner)
        r = c.get('/api/tasks/999999/')
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)


# ===========================================================================
# PHASE 8  Role-transition
# ===========================================================================

class TestRoleTransition(RBACFixtureMixin, TestCase):

    def test_dev_promoted_to_lead_can_create(self):
        m = WorkspaceMembership.objects.get(workspace=self.ws, user=self.ws_dev)
        m.role = LEAD
        m.save()
        try:
            c = self._client(self.ws_dev)
            r = c.post('/api/tasks/', {'title': 'Promoted', 'project': self.proj.id, 'status': 'To Do'}, format='json')
            self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        finally:
            m.role = DEVELOPER
            m.save()

    def test_lead_demoted_to_dev_loses_create(self):
        m = WorkspaceMembership.objects.get(workspace=self.ws, user=self.ws_lead)
        m.role = DEVELOPER
        m.save()
        try:
            c = self._client(self.ws_lead)
            r = c.post('/api/tasks/', {'title': 'Demoted', 'project': self.proj.id, 'status': 'To Do'}, format='json')
            self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
        finally:
            m.role = LEAD
            m.save()

    def test_membership_removed_loses_all_access(self):
        m = WorkspaceMembership.objects.get(workspace=self.ws, user=self.ws_admin)
        m.delete()
        try:
            c = self._client(self.ws_admin)
            r = c.post('/api/tasks/', {'title': 'No access', 'project': self.proj.id, 'status': 'To Do'}, format='json')
            self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
        finally:
            WorkspaceMembership.objects.create(workspace=self.ws, user=self.ws_admin, role=ADMIN)


# ===========================================================================
# PHASE 9  Assign / Reassign
# ===========================================================================

class TestAssignReassignAPI(RBACFixtureMixin, TestCase):

    def test_owner_can_assign(self):
        c = self._client(self.ws_owner)
        r = c.patch(f'/api/tasks/{self.task_dev.id}/', {'assignee': self.ws_lead.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_admin_can_reassign(self):
        c = self._client(self.ws_admin)
        r = c.patch(f'/api/tasks/{self.task_dev.id}/', {'assignee': self.ws_dev2.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_lead_can_assign(self):
        c = self._client(self.ws_lead)
        r = c.patch(f'/api/tasks/{self.task_dev.id}/', {'assignee': self.ws_dev.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_dev_cannot_reassign_own_task(self):
        c = self._client(self.ws_dev)
        r = c.patch(f'/api/tasks/{self.task_dev.id}/', {'assignee': self.ws_dev2.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_dev_cannot_assign_others_task(self):
        c = self._client(self.ws_dev)
        r = c.patch(f'/api/tasks/{self.task_dev2.id}/', {'assignee': self.ws_dev.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
