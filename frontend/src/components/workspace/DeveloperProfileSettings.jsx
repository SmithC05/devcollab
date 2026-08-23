import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { GitBranch, RefreshCw, AlertCircle, Unplug } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function DeveloperProfileSettings() {
  const { user, fetchUser } = useAuthStore();
  const [syncing, setSyncing] = useState(false);
  const [evidence, setEvidence] = useState(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [error, setError] = useState('');

  const loadEvidence = async () => {
    if (!user?.github_connected) return;
    
    setLoadingEvidence(true);
    try {
      const res = await fetch('/api/integrations/github/evidence/');
      const data = await res.json();
      if (data.success && data.evidence) {
        setEvidence(data.evidence);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvidence(false);
    }
  };

  useEffect(() => {
    if (user?.github_connected) {
      loadEvidence();
    }
  }, [user?.github_connected]);

  // Polling if syncing
  useEffect(() => {
    let interval;
    if (user?.sync_status === 'SYNCING' || syncing) {
      interval = setInterval(async () => {
        await fetchUser();
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.sync_status !== 'SYNCING') {
          setSyncing(false);
          loadEvidence();
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.sync_status, syncing, fetchUser]);

  const handleConnect = () => {
    // Save current path to return here after OAuth flow
    sessionStorage.setItem('auth_return_url', window.location.pathname);
    
    const currentPath = encodeURIComponent(window.location.pathname);
    const nextPath = encodeURIComponent(`/api/auth/oauth/callback/?return_url=${currentPath}`);
    window.location.href = `http://127.0.0.1:8000/accounts/github/login/?process=connect&next=${nextPath}`;
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/integrations/github/disconnect/', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchUser();
        setEvidence(null);
      }
    } catch (e) {
      setError('Failed to disconnect');
    }
  };

  const handleSync = async () => {
    setError('');
    setSyncing(true);
    try {
      const res = await fetch('/api/integrations/github/sync/', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to start sync');
      }
      await fetchUser();
    } catch (e) {
      setError(e.message);
      setSyncing(false);
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
              <div className="flex items-center gap-3">
                <div className="text-[12px] text-[var(--text-muted)] text-right mr-2">
                  <div className="text-[var(--text-secondary)] font-medium">Status: {user?.sync_status || 'CONNECTED'}</div>
                  {user?.last_sync_at && (
                    <div>Last analyzed: {new Date(user.last_sync_at).toLocaleString()}</div>
                  )}
                </div>
                <Button 
                  onClick={handleSync} 
                  disabled={syncing || user?.sync_status === 'SYNCING'} 
                  variant="secondary" 
                  icon={RefreshCw} 
                  iconSize={14}
                  className={syncing || user?.sync_status === 'SYNCING' ? 'opacity-70' : ''}
                >
                  {syncing || user?.sync_status === 'SYNCING' ? 'ANALYZING ENGINEERING EVIDENCE...' : 'ANALYZE GITHUB'}
                </Button>
                <Button onClick={handleDisconnect} variant="danger" icon={Unplug} iconSize={14}>
                  DISCONNECT
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {user?.github_connected && evidence && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-[14px] font-medium text-[var(--fg)]">Engineering Evidence</h3>
            <p className="text-[12px] text-[var(--text-muted)]">
              Normalized aggregates derived from observable GitHub activity.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-[var(--surface-item)] border border-[var(--border-subtle)] rounded-lg">
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Repositories</div>
              <div className="text-[18px] font-semibold text-[var(--fg)]">{evidence.repository_count}</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1">analyzed</div>
            </div>
            
            <div className="p-3 bg-[var(--surface-item)] border border-[var(--border-subtle)] rounded-lg">
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Technologies</div>
              <div className="text-[18px] font-semibold text-[var(--fg)]">{Object.keys(evidence.technology_evidence || {}).length}</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1">detected</div>
            </div>
            
            <div className="p-3 bg-[var(--surface-item)] border border-[var(--border-subtle)] rounded-lg">
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Modules</div>
              <div className="text-[18px] font-semibold text-[var(--fg)]">0</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1">detected</div>
            </div>
          </div>
          
          {Object.keys(evidence.technology_evidence || {}).length > 0 && (
            <div className="mt-6">
              <h4 className="text-[12px] font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Technology Exposure</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(evidence.technology_evidence)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([lang, bytes]) => {
                    // Very rudimentary exposure estimation
                    const exposure = bytes > 100000 ? 'HIGH' : bytes > 10000 ? 'MEDIUM' : 'LOW';
                    return (
                      <div key={lang} className="px-2 py-1 bg-[var(--surface-hover)] border border-[var(--border-strong)] rounded flex items-center gap-2">
                        <span className="text-[13px] text-[var(--fg)] font-medium">{lang}</span>
                        <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-highlight)] px-1.5 rounded">{exposure}</span>
                      </div>
                    );
                })}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
