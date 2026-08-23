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
    // BUG-11 FIX: Previously this could fire BEFORE initFromServer() set
    // isLoading=true (if the ref guard ran slightly before the async set),
    // causing an immediate /login redirect.  Now we require both:
    //   1. hasInitialized.current is true (we've called initFromServer)
    //   2. isLoading is false (it finished)
    if (!hasInitialized.current || isLoading) return;

    if (isAuthenticated) {
      // BUG-05/BUG-11 FIX: Backend now sets auth_return_url as a short-lived
      // cookie (non-httpOnly) instead of a query param.  Read it here.
      const getCookieValue = (name) => {
        const match = document.cookie.split('; ').find(r => r.startsWith(name + '='));
        return match ? decodeURIComponent(match.split('=')[1]) : null;
      };

      const returnUrl = getCookieValue('auth_return_url') || sessionStorage.getItem('auth_return_url');

      if (returnUrl) {
        // Clear both sources
        document.cookie = 'auth_return_url=; Max-Age=0; path=/';
        sessionStorage.removeItem('auth_return_url');

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
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, workspaces, navigate, activeWorkspace, setActiveWorkspace]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[var(--bg)]  "
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-[var(--text-primary)]  ">
        <Loader2 size={32} className="animate-spin text-[var(--text-primary)]  " />
        <p className="text-[15px] text-[var(--text-secondary)]">Completing sign in...</p>
      </div>
    </div>
  );
}
