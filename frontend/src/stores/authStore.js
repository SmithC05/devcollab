import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';
import { workspaceApi } from '../api/workspaceApi';

export const ROLES = ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'];

export const PERMISSIONS = {
  // Project
  'project.view':      ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'project.settings':  ['OWNER', 'ADMIN'],
  'project.delete':    ['OWNER'],
  'project.ownership': ['OWNER'],

  // Task / Board
  'task.view':      ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'task.create':    ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'task.edit':      ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'task.delete':    ['OWNER', 'ADMIN', 'LEAD'],
  'task.move':      ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'task.assign':    ['OWNER', 'ADMIN', 'LEAD'],
  'board.manage':   ['OWNER', 'ADMIN'],

  // Members
  'member.view':        ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'member.add':         ['OWNER', 'ADMIN'],
  'member.remove':      ['OWNER', 'ADMIN'],
  'member.role.change': ['OWNER', 'ADMIN'],

  // Knowledge (Wiki & Snippets)
  'wiki.view':    ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'wiki.create':  ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'wiki.edit':    ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'wiki.delete':  ['OWNER', 'ADMIN', 'LEAD'],
  
  'snippet.view':   ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'snippet.create': ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'snippet.edit':   ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'snippet.delete': ['OWNER', 'ADMIN', 'LEAD'],

  // Editor
  'editor.view':        ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'editor.edit':        ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'editor.file.create': ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'editor.file.rename': ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'editor.file.delete': ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],

  // Chat
  'chat.view':      ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'chat.send':      ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'channel.create': ['OWNER', 'ADMIN', 'LEAD'],

  // AI
  'ai.view':    ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'ai.use':     ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
  'ai.execute': ['OWNER', 'ADMIN', 'LEAD', 'DEVELOPER'],
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
      // L-04 FIX: null is the correct default — null role means "not in a workspace yet".
      // Previously 'Owner' was hardcoded, bypassing all real permission checks.
      role: null,
      activeWorkspace: null,
      sessionToken: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      initFromServer: async () => {
        set({ isLoading: true });
        try {
          const data = await authApi.me();
          if (data.success && data.user) {
            let fetchedWorkspaces = [];
            try {
              const wsData = await workspaceApi.getWorkspaces();
              if (wsData.success) {
                fetchedWorkspaces = wsData.workspaces;
              }
            } catch (e) {
              console.error("Failed to fetch workspaces during init", e);
            }

            set({
              isAuthenticated: true,
              user: data.user,
              workspaces: fetchedWorkspaces,
              isLoading: false,
            });
          } else {
            set({ isLoading: false, isAuthenticated: false });
          }
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(email, password);
          set({ 
            sessionToken: data.session_token,
            accessToken: data.access_token 
          });
          
          let fetchedWorkspaces = [];
          try {
            const wsData = await workspaceApi.getWorkspaces();
            if (wsData.success) {
              fetchedWorkspaces = wsData.workspaces;
            }
          } catch (e) {
            console.error("Failed to fetch workspaces during login", e);
          }

          set({
            isAuthenticated: true,
            user: data.user,
            workspaces: fetchedWorkspaces,
            sessionToken: data.session_token,
            accessToken: data.access_token,
            isLoading: false,
          });
          return { success: true, data };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.register(name, email, password);
          set({ 
            sessionToken: data.session_token,
            accessToken: data.access_token 
          });

          let fetchedWorkspaces = [];
          try {
            const wsData = await workspaceApi.getWorkspaces();
            if (wsData.success) {
              fetchedWorkspaces = wsData.workspaces;
            }
          } catch (e) {
            console.error("Failed to fetch workspaces during register", e);
          }

          set({
            isAuthenticated: true,
            user: data.user,
            workspaces: fetchedWorkspaces,
            sessionToken: data.session_token,
            accessToken: data.access_token,
            isLoading: false,
          });
          return { success: true, data };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      loginWithGoogle: () => {
        // BUG-03 FIX: Use env var so this works in staging/production
        const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        window.location.href = `${base}/accounts/google/login/`;
      },

      loginWithGitHub: () => {
        // BUG-03 FIX: Use env var so this works in staging/production
        const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        window.location.href = `${base}/accounts/github/login/`;
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
            activeWorkspace: null,
            workspaces: [],
            sessionToken: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      workspaces: [],
      addWorkspace: (workspace, role) => {
        const newWorkspaceData = {
           ...workspace,
           role: role
        };
        set((state) => ({
           workspaces: [...state.workspaces, newWorkspaceData],
        }));
      },
      refreshWorkspaces: async () => {
        try {
          const wsData = await workspaceApi.getWorkspaces();
          if (wsData.success) {
            const freshWorkspaces = wsData.workspaces;
            set((state) => {
              // Keep activeWorkspace if it still exists in the refreshed list
              const stillExists = freshWorkspaces.some(
                (w) => w.id === state.activeWorkspace?.id
              );
              return {
                workspaces: freshWorkspaces,
                activeWorkspace: stillExists ? state.activeWorkspace : null,
              };
            });
          }
        } catch (e) {
          console.error("Failed to refresh workspaces", e);
        }
      },

      setActiveWorkspace: (workspaceId) => {
        const ws = get().workspaces.find(w => w.id === workspaceId);
        if (ws) {
          // BUG-08 FIX: Backend sends uppercase roles (OWNER, DEVELOPER, ADMIN, LEAD)
          // Store the exact uppercase role from the backend
          const normalizedRole = ws.role?.toUpperCase() || 'DEVELOPER';
          set({ activeWorkspace: { ...ws, role: normalizedRole }, role: normalizedRole });
        }
      },

      setWorkspace: (workspace) => {
        const normalizedRole = workspace?.role?.toUpperCase() || 'DEVELOPER';
        set({ 
          activeWorkspace: workspace ? { ...workspace, role: normalizedRole } : null, 
          role: workspace ? normalizedRole : null 
        });
      },
      
      can: (action) => {
        const currentRole = get().role || 'DEVELOPER';
        return hasPermission(currentRole, action);
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      }
    }),
    {
      name: 'devcollab_auth',
    }
  )
);
