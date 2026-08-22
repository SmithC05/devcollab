// src/store/authStore.js
import { create } from 'zustand';
import * as authService from '../services/authService';
import * as workspaceService from '../services/workspaceService';
import { ROLES } from '../data/mockData';

export { ROLES };

export const useAuthStore = create(
  (set, get) => ({
    // ── State ────────────────────────────────────────────────────────────
    user: null,
    isAuthenticated: false,
    activeWorkspace: null, 
    workspaces: [],
    role: null,
    isLoading: true, // Start true while we check session
    error: null,

    // ── Actions ──────────────────────────────────────────────────────────

    /**
     * Replaces the old local storage init.
     * Hits the backend /api/auth/me/ to validate the httpOnly cookie.
     */
    initFromServer: async () => {
      set({ isLoading: true });
      try {
        const data = await authService.getCurrentUser();
        if (data.success && data.user) {
          set({ user: data.user, isAuthenticated: true });
          await get().refreshWorkspaces();
        } else {
          get()._clearAuth();
        }
      } catch (err) {
        // Token invalid, expired, or no cookie
        get()._clearAuth();
      } finally {
        set({ isLoading: false });
      }
    },

    refreshWorkspaces: async () => {
      const { user, activeWorkspace } = get();
      if (user) {
        const wss = await workspaceService.getUserWorkspaces(user.id);
        set({ workspaces: wss });
        
        // Re-evaluate role if there is an active workspace
        if (activeWorkspace) {
          get().setActiveWorkspace(activeWorkspace.id);
        }
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

    loginWithGoogle: () => {
      authService.loginWithGoogle();
    },

    loginWithGitHub: () => {
      authService.loginWithGitHub();
    },

    logout: async () => {
      set({ isLoading: true });
      await authService.logout().catch(() => {});
      get()._clearAuth();
      set({ isLoading: false });
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
    
    _clearAuth: () => {
      set({
        user: null,
        role: null,
        activeWorkspace: null,
        workspaces: [],
        isAuthenticated: false,
        error: null,
      });
    }
  })
);

// Call init once when the store is imported to hydrate from the server
if (typeof window !== 'undefined') {
  useAuthStore.getState().initFromServer();
}
