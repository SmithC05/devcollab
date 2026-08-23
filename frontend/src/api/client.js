import { useAuthStore } from '../stores/authStore';

// BUG-03 FIX: Use VITE_API_BASE_URL from .env.local instead of hardcoding localhost
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/api`;

// Mutex to prevent multiple simultaneous refresh calls when several
// requests fire concurrently after the access token has expired.
let isRefreshing = false;
let refreshQueue = []; // Callbacks waiting for the new token

function processRefreshQueue(newToken, error) {
  refreshQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve(newToken)));
  refreshQueue = [];
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    credentials: 'include', // sends the httpOnly refresh_token cookie
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Refresh failed');
  const data = await response.json();
  return data.access_token;
}

export const apiClient = async (endpoint, options = {}) => {
  const { accessToken, activeWorkspace } = useAuthStore.getState();

  const buildHeaders = (token) => {
    const headers = { ...options.headers };
    if (options.body && options.body instanceof FormData) {
      // browser will set Content-Type with boundary automatically
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (activeWorkspace && activeWorkspace.id) {
      headers['X-Workspace-Id'] = activeWorkspace.id;
    }
    return headers;
  };

  // ── First attempt ────────────────────────────────────────────────────────
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: options.credentials || 'include',
    ...options,
    headers: buildHeaders(accessToken),
  });

  if (response.status !== 401) {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || errorBody.message || 'API request failed');
    }
    return response.json();
  }

  // ── 401: access token expired — attempt silent refresh ───────────────────
  if (isRefreshing) {
    // Another request is already refreshing; queue this one.
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    }).then((newToken) =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: options.credentials || 'include',
        ...options,
        headers: buildHeaders(newToken),
      }).then((r) => {
        if (!r.ok) return r.json().then((b) => { throw new Error(b.error || b.message || 'API request failed'); });
        return r.json();
      })
    );
  }

  isRefreshing = true;
  try {
    const newToken = await refreshAccessToken();
    // Persist the new access token in the store
    useAuthStore.setState({ accessToken: newToken });
    processRefreshQueue(newToken, null);

    // Retry the original request with the fresh token
    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: options.credentials || 'include',
      ...options,
      headers: buildHeaders(newToken),
    });
    if (!retryResponse.ok) {
      const errorBody = await retryResponse.json().catch(() => ({}));
      throw new Error(errorBody.error || errorBody.message || 'API request failed');
    }
    return retryResponse.json();
  } catch (refreshError) {
    processRefreshQueue(null, refreshError);
    // Refresh token also expired — force logout
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      sessionToken: null,
      activeWorkspace: null,
    });
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  } finally {
    isRefreshing = false;
  }
};

