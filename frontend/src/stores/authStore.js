import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
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
    }),
    {
      name: 'devcollab_auth',
    }
  )
);
