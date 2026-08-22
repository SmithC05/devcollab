import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROLES } from '../utils/constants';

const ProtectedRoute = ({ requireWorkspace = false }) => {
  const { isAuthenticated, user, workspace } = useAuthStore();

  if (!isAuthenticated) {
    // State A: Not authenticated -> /login
    return <Navigate to="/login" replace />;
  }

  if (requireWorkspace && !workspace) {
    // State B: Authenticated but no workspace -> /onboarding
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireWorkspace && workspace) {
    // If we're trying to access /onboarding but already have a workspace,
    // we should ideally go to dashboard. But this might block intentional
    // navigation to /onboarding if the user wants to join another workspace.
    // For this mock phase, we'll let them visit /onboarding if they explicitly navigate there,
    // but the main logic is handled in Login redirect.
  }

  return <Outlet />;
};

export default ProtectedRoute;
