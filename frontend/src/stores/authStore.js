import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';
import { workspaceApi } from '../api/workspaceApi';

export const ROLES = ['Owner', 'Admin', 'Lead', 'Dev'];

export const PERMISSIONS = {
  // Project
  'project.view':      ['Owner', 'Admin', 'Lead', 'Dev'],
  'project.settings':  ['Owner', 'Admin'],
  'project.delete':    ['Owner'],
  'project.ownership': ['Owner'],

  // Task / Board
  'task.view':      ['Owner', 'Admin', 'Lead', 'Dev'],
  'task.create':    ['Owner', 'Admin', 'Lead', 'Dev'],
  'task.edit':      ['Owner', 'Admin', 'Lead', 'Dev'],
  'task.delete':    ['Owner', 'Admin', 'Lead'],
  'task.move':      ['Owner', 'Admin', 'Lead', 'Dev'],
  'task.assign':    ['Owner', 'Admin', 'Lead'],
  'board.manage':   ['Owner', 'Admin'],

  // Members
  'member.view':        ['Owner', 'Admin', 'Lead', 'Dev'],
  'member.add':         ['Owner', 'Admin'],
  'member.remove':      ['Owner', 'Admin'],
  'member.role.change': ['Owner', 'Admin'],

  // Knowledge (Wiki & Snippets)
  'wiki.view':    ['Owner', 'Admin', 'Lead', 'Dev'],
  'wiki.create':  ['Owner', 'Admin', 'Lead', 'Dev'],
  'wiki.edit':    ['Owner', 'Admin', 'Lead', 'Dev'],
  'wiki.delete':  ['Owner', 'Admin', 'Lead'],
  
  'snippet.view':   ['Owner', 'Admin', 'Lead', 'Dev'],
  'snippet.create': ['Owner', 'Admin', 'Lead', 'Dev'],
  'snippet.edit':   ['Owner', 'Admin', 'Lead', 'Dev'],
  'snippet.delete': ['Owner', 'Admin', 'Lead'],

  // Editor
  'editor.view':        ['Owner', 'Admin', 'Lead', 'Dev'],
  'editor.edit':        ['Owner', 'Admin', 'Lead', 'Dev'],
  'editor.file.create': ['Owner', 'Admin', 'Lead', 'Dev'],
  'editor.file.rename': ['Owner', 'Admin', 'Lead', 'Dev'],
  'editor.file.delete': ['Owner', 'Admin', 'Lead', 'Dev'],

  // Chat
  'chat.view':      ['Owner', 'Admin', 'Lead', 'Dev'],
  'chat.send':      ['Owner', 'Admin', 'Lead', 'Dev'],
  'channel.create': ['Owner', 'Admin', 'Lead'],

  // AI
  'ai.view':    ['Owner', 'Admin', 'Lead', 'Dev'],
  'ai.use':     ['Owner', 'Admin', 'Lead', 'Dev'],
  'ai.execute': ['Owner', 'Admin', 'Lead', 'Dev'],
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
      workspacePlan: 'FREE',
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

            // Auto-select workspace: if there's only one, pick it automatically.
            // If the previously active workspace still exists in the list, keep it.
            const currentActive = get().activeWorkspace;
            let nextActive = currentActive;
            if (currentActive) {
              const stillExists = fetchedWorkspaces.some((w) => w.id === currentActive.id);
              if (!stillExists) nextActive = null;
            }
            if (!nextActive && fetchedWorkspaces.length === 1) {
              nextActive = fetchedWorkspaces[0];
            }

            set({
              isAuthenticated: true,
              user: data.user,
              workspaces: fetchedWorkspaces,
              activeWorkspace: nextActive,
              role: nextActive?.role ?? get().role,
              // Store the fresh access_token returned by /api/auth/me/ so that
              // the Authorization header can be sent on POST requests regardless
              // of login method (email/password or OAuth).
              accessToken: data.access_token || null,
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

          // Auto-select the workspace if there is exactly one — so the X-Workspace-Id
          // header is sent immediately without requiring the user to visit /select-workspace.
          const autoWorkspace = fetchedWorkspaces.length === 1 ? fetchedWorkspaces[0] : null;

          set({
            isAuthenticated: true,
            user: data.user,
            workspaces: fetchedWorkspaces,
            activeWorkspace: autoWorkspace,
            role: autoWorkspace?.role ?? null,
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

          // Auto-select if exactly one workspace exists (e.g., invited before registering)
          const autoWorkspace = fetchedWorkspaces.length === 1 ? fetchedWorkspaces[0] : null;

          set({
            isAuthenticated: true,
            user: data.user,
            workspaces: fetchedWorkspaces,
            activeWorkspace: autoWorkspace,
            role: autoWorkspace?.role ?? null,
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
            workspacePlan: 'FREE',
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
          const roleMap = {
            OWNER: 'Owner',
            ADMIN: 'Admin',
            LEAD: 'Lead',
            DEVELOPER: 'Dev',
            MEMBER: 'Dev',
          };
          const normalizedRole = roleMap[ws.role?.toUpperCase()] || ws.role || 'Dev';
          set({ 
            activeWorkspace: { ...ws, role: normalizedRole }, 
            role: normalizedRole, 
            workspacePlan: (ws.plan || 'FREE').toUpperCase() 
          });
        }
      },

      setWorkspace: (workspace) => set({
        activeWorkspace: workspace,
        role: workspace?.role,
        workspacePlan: (workspace?.plan || 'FREE').toUpperCase(),
      }),
      
      setRole: (role) => set({ role }),

      upgradeWorkspaceToPro: () => set((state) => {
        const activeWorkspace = state.activeWorkspace
          ? { ...state.activeWorkspace, plan: 'PRO' }
          : state.activeWorkspace;

        const workspaces = state.workspaces.map((workspace) => (
          state.activeWorkspace && workspace.id === state.activeWorkspace.id
            ? { ...workspace, plan: 'PRO' }
            : workspace
        ));

        return {
          activeWorkspace,
          workspaces,
          workspacePlan: 'PRO',
        };
      }),

      downgradeWorkspaceToFree: () => set((state) => {
        const activeWorkspace = state.activeWorkspace
          ? { ...state.activeWorkspace, plan: 'FREE' }
          : state.activeWorkspace;

        const workspaces = state.workspaces.map((workspace) => (
          state.activeWorkspace && workspace.id === state.activeWorkspace.id
            ? { ...workspace, plan: 'FREE' }
            : workspace
        ));

        return {
          activeWorkspace,
          workspaces,
          workspacePlan: 'FREE',
        };
      }),

      can: (action) => {
        const currentRole = get().role || 'Dev';
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
