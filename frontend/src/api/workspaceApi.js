import { apiClient } from './client';

export const workspaceApi = {
  getWorkspaces: async () => {
    return await apiClient('/workspaces/', {
      method: 'GET',
    });
  },

  createWorkspace: async (name, slug) => {
    // Backend uses request.user as owner — no need to pass ownerId
    return await apiClient('/workspaces/', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
  },

  // BUG-10 FIX: Removed userId param — backend now uses request.user
  joinWorkspace: async (inviteCode) => {
    return await apiClient('/workspaces/join/', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },

  // BUG-18 FIX: Workspace-scoped legacy endpoints — pass workspace_id so the
  // backend _get_user_workspace() helper filters correctly per user.
  getOverview: async (workspaceId) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return await apiClient(`/workspace/overview/${q}`, { method: 'GET' });
  },

  getProjects: async (workspaceId) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return await apiClient(`/workspace/projects/${q}`, { method: 'GET' });
  },

  createProject: async (workspaceId, name) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return await apiClient(`/workspace/projects/${q}`, {
      method: 'POST',
      body: JSON.stringify({ name, workspace_id: workspaceId }),
    });
  },

  getActivity: async (workspaceId) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return await apiClient(`/workspace/activity/${q}`, { method: 'GET' });
  },

  getMembers: async (workspaceId) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return await apiClient(`/workspace/members/${q}`, { method: 'GET' });
  },

  getBilling: async (workspaceId) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return await apiClient(`/workspace/billing/${q}`, { method: 'GET' });
  },

  getSettings: async (workspaceId) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return await apiClient(`/workspace/settings/${q}`, { method: 'GET' });
  },

  updateSettings: async (workspaceId, data) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return await apiClient(`/workspace/settings/${q}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, workspace_id: workspaceId }),
    });
  },
};

