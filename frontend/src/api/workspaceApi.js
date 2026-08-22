const BASE_URL = 'http://localhost:8000/api';

export const workspaceApi = {
  createWorkspace: async (name, slug, ownerId) => {
    try {
      const response = await fetch(`${BASE_URL}/workspaces/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, ownerId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create workspace');
      }
      return response.json();
    } catch (error) {
      throw error;
    }
  },

  joinWorkspace: async (inviteCode, userId) => {
    try {
      const response = await fetch(`${BASE_URL}/workspaces/join/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, userId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join workspace');
      }
      return response.json();
    } catch (error) {
      throw error;
    }
  }
};
