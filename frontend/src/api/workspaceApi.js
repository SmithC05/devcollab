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

  joinWorkspace: async (inviteCode, userId) => {
    return await apiClient('/workspaces/join/', {
      method: 'POST',
      body: JSON.stringify({ inviteCode, userId }),
    });
  }
};
