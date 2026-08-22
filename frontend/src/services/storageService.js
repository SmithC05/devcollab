// src/services/storageService.js
// Small utility for safe localStorage persistence

export const STORAGE_KEYS = {
  USERS: 'devcollab_users',
  WORKSPACES: 'devcollab_workspaces',
  SESSION: 'devcollab_session',
};

export function read(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
}
