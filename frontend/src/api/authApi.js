import { apiClient } from './client';

export const authApi = {
  login: async (email, password) => {
    return await apiClient('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
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
