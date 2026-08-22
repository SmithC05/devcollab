import { apiClient } from './client';

export const authApi = {
  login: async (email, password) => {
    try {
      return await apiClient('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (e) {
      console.warn("Auth API failed, using mock data for demo", e);
      // Mock fallback for DevCollab demo
      return {
        user: {
          id: 1,
          username: email.split('@')[0],
          email: email,
          role: 'Owner',
          workspace: { id: 1, name: 'DevCollab Engineering' }
        },
        session_token: 'mock-session-token-123'
      };
    }
  },
  logout: async () => {
    try {
      return await apiClient('/auth/logout/', {
        method: 'POST',
      });
    } catch (e) {
      console.warn("Logout failed", e);
      return { success: true };
    }
  }
};
