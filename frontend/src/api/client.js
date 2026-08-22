import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = 'http://localhost:8000/api';

export const apiClient = async (endpoint, options = {}) => {
  const { sessionToken } = useAuthStore.getState();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'API request failed');
  }

  return response.json();
};
