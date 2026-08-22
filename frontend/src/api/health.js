/**
 * api/health.js
 *
 * Thin wrapper around the backend health endpoint.
 * All backend base-URL configuration is centralised here.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

/**
 * Fetch backend health status.
 * @returns {Promise<{status: string, service: string}>}
 */
export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health/`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
