// src/routes/AppRoutes.jsx
// All application routes with guards.
// Route guard logic:
//   Not authenticated → /login
//   Authenticated, no workspaces → /onboarding
//   Authenticated, has workspaces, no active → /select-workspace
//   Authenticated, activeWorkspace exists → /dashboard

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/LoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import SelectWorkspacePage from '../pages/SelectWorkspacePage';
import DashboardPlaceholder from '../pages/DashboardPlaceholder';

// ── Guards ────────────────────────────────────────────────────────────────

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, workspaces } = useAuthStore();
  
  if (isAuthenticated) {
    if (workspaces?.length > 0) return <Navigate to="/select-workspace" replace />;
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
}

function RequireOnboarding({ children }) {
  const { isAuthenticated, workspaces } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (workspaces?.length > 0) return <Navigate to="/select-workspace" replace />;
  
  return children;
}

function RequireSelectWorkspace({ children }) {
  const { isAuthenticated, workspaces } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!workspaces || workspaces.length === 0) return <Navigate to="/onboarding" replace />;
  
  return children;
}

function RequireWorkspace({ children }) {
  const { isAuthenticated, workspaces, activeWorkspace } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!workspaces || workspaces.length === 0) return <Navigate to="/onboarding" replace />;
  if (!activeWorkspace) return <Navigate to="/select-workspace" replace />;
  
  return children;
}

// ── Routes ────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public (login/register in one shell) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {/* Onboarding — needs auth, no workspaces yet */}
      <Route
        path="/onboarding"
        element={
          <RequireOnboarding>
            <OnboardingPage />
          </RequireOnboarding>
        }
      />

      {/* Select Workspace — needs auth + at least one workspace */}
      <Route
        path="/select-workspace"
        element={
          <RequireSelectWorkspace>
            <SelectWorkspacePage />
          </RequireSelectWorkspace>
        }
      />

      {/* Dashboard — needs auth + activeWorkspace */}
      <Route
        path="/dashboard"
        element={
          <RequireWorkspace>
            <DashboardPlaceholder />
          </RequireWorkspace>
        }
      />

      {/* Legacy project routes — keep working (protected) */}
      <Route
        path="/projects/*"
        element={
          <RequireWorkspace>
            <DashboardPlaceholder />
          </RequireWorkspace>
        }
      />

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
