// src/store/themeStore.js
// Zustand theme state. Persisted to localStorage.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // 'dark' | 'light'
      theme: 'dark',

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'devcollab_theme',
    }
  )
);
