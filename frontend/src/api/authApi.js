const BASE_URL = 'http://localhost:8000/api';

export const authApi = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed');
      }
      return response.json();
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      const { useAuthStore } = await import('../stores/authStore');
      const { sessionToken } = useAuthStore.getState();
      const response = await fetch(`${BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    } catch (error) {
      throw error;
    }
  }
};
