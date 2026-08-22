// src/hooks/useTheme.js
// Reads themeStore and syncs the 'dark' class on <html>.
// Call this hook once at the top-level (App.jsx).

import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return { theme, toggleTheme, setTheme, isDark: theme === 'dark' };
}
