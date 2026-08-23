import { apiClient } from './client';

export const invitationApi = {
  createInvitation: async (workspaceId, data) => {
    return await apiClient(`/workspaces/${workspaceId}/invitations/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  getInvitation: async (token) => {
    return await apiClient(`/invitations/${token}/`);
  },
  
  acceptInvitation: async (token) => {
    return await apiClient(`/invitations/${token}/accept/`, { method: 'POST' });
  },
  
  rejectInvitation: async (token) => {
    return await apiClient(`/invitations/${token}/reject/`, { method: 'POST' });
  }
};
