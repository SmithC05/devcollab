import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const apiClient = async (endpoint, options = {}) => {
  const { accessToken } = useAuthStore.getState();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: options.credentials || 'include',
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid, force logout
      useAuthStore.setState({ isAuthenticated: false, user: null, accessToken: null, sessionToken: null });
      // Redirect to login (unless we are already there)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'API request failed');
  }

  return response.json();
};
