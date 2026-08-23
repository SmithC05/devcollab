import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { GitBranch, AlertCircle, Unplug } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

export default function DeveloperProfileSettings() {
  const { user, initFromServer } = useAuthStore();
  const [error, setError] = useState('');

  const handleConnect = () => {
    // Save current path to return here after OAuth flow
    sessionStorage.setItem('auth_return_url', window.location.pathname);
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    // BUG FIX: Don't double encode the return_url, just encode the entire next parameter
    const nextPath = encodeURIComponent(`/api/auth/oauth/callback/?return_url=${window.location.pathname}`);
    window.location.href = `${baseUrl}/accounts/github/login/?process=connect&next=${nextPath}`;
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/integrations/github/disconnect/', {
        method: 'POST',
      });
      if (res.ok) {
        await initFromServer();
      }
    } catch (e) {
      setError('Failed to disconnect');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-[16px] font-semibold text-[var(--fg)] mb-1">GITHUB ENGINEERING PROFILE</h2>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Connect your GitHub account to enable engineering-context analysis.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-md flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-[var(--surface-item)] border border-[var(--border-subtle)] rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--fg)]">
              <GitBranch size={20} />
            </div>
            <div>
              <div className="text-[14px] font-medium text-[var(--fg)]">GitHub</div>
              <div className="text-[13px] text-[var(--text-muted)]">
                {user?.github_connected ? `@${user?.github_username || 'connected'}` : 'Not connected'}
              </div>
            </div>
          </div>
          
          <div>
            {!user?.github_connected ? (
              <Button onClick={handleConnect} variant="primary" icon={GitBranch} iconSize={14}>
                CONNECT GITHUB
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-[12px] text-[var(--text-muted)] text-right">
                  <div className="text-[var(--text-secondary)] font-medium">CONNECTED</div>
                  {user?.last_sync_at && (
                    <div className="text-[11px] mt-0.5">
                      Evidence analyzed {timeAgo(user.last_sync_at)}
                    </div>
                  )}
                </div>
                <Button onClick={handleDisconnect} variant="danger" icon={Unplug} iconSize={14}>
                  DISCONNECT
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
