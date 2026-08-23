import { apiClient } from './client';

export const authApi = {
  login: async (email, password) => {
    return await apiClient('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (name, email, password) => {
    return await apiClient('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
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
  },
  me: async () => {
    return await apiClient('/auth/me/', {
      method: 'GET',
    });
  },
  updateProfile: async (data) => {
    const isFormData = data instanceof FormData;
    return await apiClient('/auth/me/', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }
};
