import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';

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
      role: 'Owner', // Temporary default for RBAC simulation
      activeWorkspace: null,
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
            activeWorkspace: data.user.workspace,
            sessionToken: data.session_token,
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
        return new Promise((resolve) => {
          setTimeout(() => {
            set({ isLoading: false });
            resolve({ 
              success: false, 
              error: 'Registration is disabled in this demo environment. Please sign in using one of the seeded accounts (e.g. smith@devcollab.io).' 
            });
          }, 800);
        });
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
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      workspaces: [],
      refreshWorkspaces: async () => {
        // Since we don't have a dedicated endpoint for workspaces yet, 
        // we'll populate the list with the user's active workspace from login.
        const currentUser = get().user;
        if (currentUser && currentUser.workspace) {
           set({ 
             workspaces: [{
               ...currentUser.workspace,
               members: [{ userId: currentUser.id, role: currentUser.role }]
             }]
           });
        } else {
           set({ workspaces: [] });
        }
      },

      setActiveWorkspace: (workspaceId) => {
        const ws = get().workspaces.find(w => w.id === workspaceId);
        if (ws) {
          set({ activeWorkspace: ws });
        }
      },

      setWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      
      setRole: (role) => set({ role }),

      can: (action) => {
        const currentRole = get().role || 'Dev';
        return hasPermission(currentRole, action);
      }
    }),
    {
      name: 'devcollab_auth',
    }
  )
);
