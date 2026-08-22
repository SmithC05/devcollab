// src/App.jsx
// Thin wrapper — delegates all routing to AppRoutes.
// Theme is applied globally here via useTheme().

import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { useTheme } from './hooks/useTheme';
import { useAuthStore } from './stores/authStore';
import { useActivityTracker } from './hooks/useActivityTracker';
import './index.css';

function ThemeProvider({ children }) {
  // This ensures the dark/light class is applied to <html> at the top level
  useTheme();
  return children;
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  useActivityTracker(isAuthenticated);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}
