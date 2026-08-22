// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/authService';
import * as workspaceService from '../services/workspaceService';
import { ROLES } from '../data/mockData';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      activeWorkspace: null, 
      workspaces: [],
      role: null, // derived from activeWorkspace membership
      isLoading: false,
      error: null,

      // ── Actions ──────────────────────────────────────────────────────────

      /**
       * Used to hydrate the store properly after a page refresh,
       * ensuring we have the latest user and workspace data.
       */
      init: async () => {
        const { user, activeWorkspace } = get();
        if (user && user.id) {
          // Re-fetch the user to ensure we have the latest data
          const freshUser = authService.getUserById(user.id);
          if (freshUser) {
            set({ user: freshUser });
            await get().refreshWorkspaces();
            
            // Re-select the active workspace if it exists to refresh role
            if (activeWorkspace) {
              get().setActiveWorkspace(activeWorkspace.id);
            }
          } else {
            // User no longer exists in mock DB
            get().logout();
          }
        }
      },

      refreshWorkspaces: async () => {
        const { user } = get();
        if (user) {
          const wss = await workspaceService.getUserWorkspaces(user.id);
          set({ workspaces: wss });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authService.login(email, password);
          const workspaces = await workspaceService.getUserWorkspaces(user.id);
          
          set({
            user,
            workspaces,
            activeWorkspace: null,
            role: ROLES.USER, // default role before a workspace is selected
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (err) {
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authService.register(name, email, password);
          
          set({
            user,
            workspaces: [],
            activeWorkspace: null,
            role: ROLES.USER,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (err) {
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      logout: async () => {
        await authService.logout().catch(() => {});
        set({
          user: null,
          role: null,
          activeWorkspace: null,
          workspaces: [],
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      setActiveWorkspace: (workspaceId) => {
        const { workspaces, user } = get();
        const workspace = workspaces.find(w => w.id === workspaceId);
        
        if (workspace && user) {
          const membership = workspace.members.find(m => m.userId === user.id);
          set({ 
            activeWorkspace: workspace,
            role: membership ? membership.role : ROLES.USER 
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'devcollab_session',
      // Only persist safe fields — never persist passwords
      // We persist the whole user object because we stripped passwords in authService
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeWorkspace: state.activeWorkspace,
      }),
    }
  )
);

// Call init once when the store is imported to hydrate from localStorage
if (typeof window !== 'undefined') {
  useAuthStore.getState().init();
}
