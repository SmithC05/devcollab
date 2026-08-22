// src/services/authService.js
// Authentication service communicating with Django REST API

const API_BASE = 'http://127.0.0.1:8000/api/auth';

async function fetchWithCredentials(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    // Attempt auto-refresh if 401
    if (res.status === 401 && !url.includes('/refresh/')) {
      const refreshRes = await fetch(`${API_BASE}/refresh/`, {
        method: 'POST',
        credentials: 'include'
      });
      if (refreshRes.ok) {
        // Retry original request
        const retryRes = await fetch(url, {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });
        if (retryRes.ok) {
           return retryRes.json();
        }
      }
    }
    throw new Error(data.error || 'An unexpected error occurred.');
  }
  
  return data;
}

export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  return fetchWithCredentials(`${API_BASE}/login/`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function register(name, email, password) {
  if (!name || !name.trim()) throw new Error('Full name is required.');
  if (!email || !email.trim()) throw new Error('Email address is required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
  
  return fetchWithCredentials(`${API_BASE}/register/`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
}

export async function logout() {
  return fetchWithCredentials(`${API_BASE}/logout/`, {
    method: 'POST'
  });
}

export async function getCurrentUser() {
  return fetchWithCredentials(`${API_BASE}/me/`);
}

export function loginWithGoogle() {
  // Redirect to Django allauth Google provider login URL
  window.location.href = 'http://127.0.0.1:8000/accounts/google/login/';
}

export function loginWithGitHub() {
  // Redirect to Django allauth GitHub provider login URL
  window.location.href = 'http://127.0.0.1:8000/accounts/github/login/';
}

// Deprecated mock DB function. Kept temporarily to prevent authStore crash
// if it's called before we finish updating authStore.js
export function getUserById() {
  return null;
}
