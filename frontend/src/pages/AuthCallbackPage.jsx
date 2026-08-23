// src/pages/AuthCallbackPage.jsx
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function AuthCallbackPage() {
  useTheme(); // ensure theme is applied
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  
  const { initFromServer, isAuthenticated, workspaces, isLoading, activeWorkspace, setActiveWorkspace } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (error) {
      // Could show an error toast here
      navigate('/login');
      return;
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // We just returned from Google OAuth and should have cookies.
      // Re-hydrate the store from the server.
      initFromServer();
    }
  }, [error, navigate, initFromServer]);

  // Once loading finishes, redirect based on workspace state
  useEffect(() => {
    if (hasInitialized.current && !isLoading) {
      if (isAuthenticated) {
        const returnUrl = sessionStorage.getItem('auth_return_url');
        if (returnUrl) {
          sessionStorage.removeItem('auth_return_url');
          
          // Prevent AppRoutes from kicking us out if activeWorkspace was somehow lost
          if (!activeWorkspace && workspaces && workspaces.length > 0) {
            setActiveWorkspace(workspaces[0].id);
          }
          
          navigate(returnUrl, { replace: true });
          return;
        }

        if (workspaces && workspaces.length > 0) {
          navigate('/select-workspace', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        // Failed to authenticate for some reason
        navigate('/login', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, workspaces, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-white dark:text-white light:text-black">
        <Loader2 size={32} className="animate-spin text-white dark:text-white light:text-black" />
        <p className="text-[15px] text-[#A3A3A3]">Completing sign in...</p>
      </div>
    </div>
  );
}
