import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';

export const ROLES = ['Owner', 'Admin', 'Lead', 'Dev', 'Viewer'];

export const PERMISSIONS = {
  // Project Settings
  DELETE_PROJECT:  ['Owner'],
  ARCHIVE_PROJECT: ['Owner', 'Admin'],
  RENAME_PROJECT:  ['Owner', 'Admin'],
  VIEW_SETTINGS:   ['Owner', 'Admin'],

  // Members
  ADD_MEMBER:        ['Owner', 'Admin', 'Lead'],
  REMOVE_ADMIN:      ['Owner'],
  REMOVE_MEMBER:     ['Owner', 'Admin', 'Lead'],
  CHANGE_ROLE_ADMIN: ['Owner'],
  CHANGE_ROLE:       ['Owner', 'Admin'],

  // Board
  MANAGE_COLUMNS: ['Owner', 'Admin'],
  CREATE_TASK:    ['Owner', 'Admin', 'Lead', 'Dev'],
  EDIT_TASK:      ['Owner', 'Admin', 'Lead', 'Dev'],
  DELETE_TASK:    ['Owner', 'Admin', 'Lead'],
  MOVE_TASK:      ['Owner', 'Admin', 'Lead', 'Dev'],

  // Knowledge & Chat
  CREATE_WIKI:    ['Owner', 'Admin', 'Lead', 'Dev'],
  EDIT_WIKI:      ['Owner', 'Admin', 'Lead', 'Dev'],
  DELETE_WIKI:    ['Owner', 'Admin', 'Lead'],
  
  CREATE_SNIPPET: ['Owner', 'Admin', 'Lead', 'Dev'],
  EDIT_SNIPPET:   ['Owner', 'Admin', 'Lead', 'Dev'],
  DELETE_SNIPPET: ['Owner', 'Admin', 'Lead'],

  SEND_MESSAGE:   ['Owner', 'Admin', 'Lead', 'Dev'],
  CREATE_CHANNEL: ['Owner', 'Admin', 'Lead'],

  // Editor
  EDITOR_VIEW:        ['Owner', 'Admin', 'Lead', 'Dev', 'Viewer'],
  EDITOR_EDIT:        ['Owner', 'Admin', 'Lead', 'Dev'],
  EDITOR_CREATE_FILE: ['Owner', 'Admin', 'Lead', 'Dev'],
  EDITOR_RENAME_FILE: ['Owner', 'Admin', 'Lead', 'Dev'],
  EDITOR_DELETE_FILE: ['Owner', 'Admin', 'Lead'],
  EDITOR_SAVE:        ['Owner', 'Admin', 'Lead', 'Dev'],
};

export function hasPermission(role, action) {
  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: 'Owner', // Temporary default for RBAC simulation
      workspace: null,
      sessionToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(email, password);
          set({
            isAuthenticated: true,
            user: data.user,
            role: data.user.role,
            workspace: data.user.workspace,
            sessionToken: data.session_token,
            isLoading: false,
          });
          return { success: true, data };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // Even if backend call fails, we should clear local state
          await authApi.logout().catch(() => {});
        } finally {
          set({
            user: null,
            role: null,
            workspace: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setWorkspace: (workspace) => set({ workspace }),
      
      setRole: (role) => set({ role }),

      can: (action) => {
        const currentRole = get().role || 'Viewer';
        return hasPermission(currentRole, action);
      }
    }),
    {
      name: 'devcollab_auth',
    }
  )
);
