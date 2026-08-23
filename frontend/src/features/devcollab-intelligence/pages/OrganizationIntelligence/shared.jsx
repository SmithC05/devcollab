import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, GitBranch, ArrowRight, X, Eye } from 'lucide-react';
import { useAuthStore } from '../../../../stores/authStore';
import { DvCard, DvButton, DvBadge, DvAvatar, DvProgressBar, DvProgressRing } from '../../primitives/core';
import { coverageToVariant, contextLabelToVariant, depStatusToVariant } from '../../data/organizationAdapter';
import { panelEnter, fadeUp } from '../../motion/presets';

export function cap(pct) {
  if (pct >= 85) return 'var(--dv-danger)';
  if (pct >= 55) return 'var(--dv-warning)';
  return 'var(--dv-success)';
}

export function mono(s, color = 'var(--dv-text-secondary)') {
  return <span style={{ fontFamily: 'var(--dv-font-mono)', color, fontWeight: 600, fontSize: '0.78rem' }}>{s}</span>;
}

export function SectionLabel({ label, icon: Icon, right, id }) {
  return (
    <div id={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      {Icon && <Icon size={13} color="var(--dv-text-faint)" />}
      <span style={{
        fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dv-text-muted)',
      }}>{label}</span>
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  );
}

export function ProvenancePip({ prov }) {
  const colors = {
    REAL_DB:        'var(--dv-success)',
    DERIVED:        'var(--dv-predicted)',
    SYNTHETIC_DEMO: 'var(--dv-warning)',
  };
  const labels = { REAL_DB: 'Real', DERIVED: 'Derived', SYNTHETIC_DEMO: 'Demo' };
  return (
    <span style={{
      fontSize: 9, padding: '1px 5px', borderRadius: 3,
      background: 'var(--dv-bg-elevated)', border: `1px solid ${colors[prov] ?? 'var(--dv-border-subtle)'}`,
      color: colors[prov] ?? 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
    }}>
      {labels[prov] ?? prov}
    </span>
  );
}

export function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (isNaN(diffInSeconds)) return '';
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

export function EngineeringEvidenceControl({ onSyncSuccess }) {
  const { user, initFromServer } = useAuthStore();
  const [syncing, setSyncing] = useState(false);
  const [syncStage, setSyncStage] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.github_connected) {
      loadEvidence();
    }
  }, [user?.github_connected]);

  const loadEvidence = async () => {
    try {
      const res = await fetch('/api/integrations/github/evidence/');
      const data = await res.json();
      if (data.success && data.evidence) {
        setEvidence(data.evidence);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval;
    if (user?.sync_status === 'SYNCING' || syncing) {
      interval = setInterval(async () => {
        await initFromServer();
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.sync_status !== 'SYNCING') {
          setSyncing(false);
          if (currentUser?.sync_status === 'FAILED') {
            setError('SYNC FAILED: ENGINEERING EVIDENCE UNAVAILABLE');
            setSyncStage('');
          } else {
            setSuccess(true);
            setSyncStage('ENGINEERING EVIDENCE UPDATED');
            loadEvidence();
            onSyncSuccess?.();
            setTimeout(() => setSuccess(false), 5000);
          }
          clearInterval(interval);
        } else {
           setSyncStage('GitHub connection verified\\n→ Analyzing accessible engineering evidence...');
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.sync_status, syncing, initFromServer, onSyncSuccess]);

  const handleSync = async () => {
    setError('');
    setSuccess(false);
    setSyncing(true);
    setSyncStage('ANALYZING ENGINEERING EVIDENCE\\n\\nGitHub connection verified\\n→ Analyzing accessible engineering evidence...');
    try {
      const res = await fetch('/api/integrations/github/sync/', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start sync');
      await initFromServer();
    } catch (e) {
      setError('SYNC FAILED: ENGINEERING EVIDENCE UNAVAILABLE');
      setSyncing(false);
      setSyncStage('');
    }
  };

  if (!user?.github_connected) {
    return (
       <DvCard style={{ padding: '16px 20px', marginBottom: 24, borderStyle: 'dashed' }}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div>
             <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-muted)', marginBottom: 4 }}>ENGINEERING EVIDENCE</div>
             <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>GitHub not connected. Connect in Profile Settings to analyze engineering evidence.</div>
           </div>
         </div>
       </DvCard>
    );
  }

  return (
    <DvCard style={{ padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
             <GitBranch size={14} color="var(--dv-accent)" />
             <span style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-accent)', letterSpacing: '0.05em' }}>ENGINEERING EVIDENCE</span>
           </div>
           
           {syncing || user?.sync_status === 'SYNCING' ? (
             <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, fontFamily: 'var(--dv-font-mono)' }}>
               {syncStage || 'ANALYZING ENGINEERING EVIDENCE'}
             </div>
           ) : error ? (
             <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-danger)', fontWeight: 500 }}>{error}</div>
           ) : success ? (
             <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-success)', fontWeight: 500 }}>{syncStage}</div>
           ) : (
             <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
               <span style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                 Connected to GitHub <strong style={{ color: 'var(--dv-text-primary)' }}>@{user.github_username || 'connected'}</strong>
               </span>
               {user.last_sync_at && (
                 <span style={{ fontSize: 12, color: 'var(--dv-text-muted)' }}>
                   Last analyzed: {timeAgo(user.last_sync_at)}
                 </span>
               )}
               {evidence && (
                 <span style={{ fontSize: 12, color: 'var(--dv-text-muted)' }}>
                   • {evidence.repository_count} repos • {Object.keys(evidence.technology_evidence || {}).length} tech
                 </span>
               )}
             </div>
           )}
        </div>
        
        <DvButton 
          variant="secondary" 
          onClick={handleSync} 
          disabled={syncing || user?.sync_status === 'SYNCING'}
          style={{ width: 220 }}
        >
          {syncing || user?.sync_status === 'SYNCING' ? 'ANALYZING...' : (user?.last_sync_at ? 'REFRESH EVIDENCE' : 'ANALYZE ENGINEERING EVIDENCE')}
        </DvButton>
      </div>
    </DvCard>
  );
}

export function DependencyChain({ dependencies, projectFilter }) {
  const filtered = projectFilter
    ? dependencies.filter(d => d.project === projectFilter)
    : dependencies;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {filtered.map((dep, i) => (
        <div key={dep.id}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: dep.status === 'AT_RISK' ? 'var(--dv-warning-subtle)' : 'var(--dv-bg-elevated)',
            borderRadius: 'var(--dv-radius-md)',
            border: `1px solid ${dep.status === 'AT_RISK' ? 'var(--dv-warning-border)' : dep.status === 'BLOCKED' ? 'var(--dv-danger-border)' : 'var(--dv-border-subtle)'}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>{dep.upstream}</span>
                <ArrowRight size={10} color="var(--dv-text-faint)" />
                <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)' }}>{dep.downstream}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: 'var(--dv-text-faint)' }}>Owner: {dep.owner}</span>
                <DvBadge variant={depStatusToVariant(dep.status)} size="sm">{dep.status}</DvBadge>
                
              </div>
            </div>
            {dep.status === 'AT_RISK' && <AlertTriangle size={14} color="var(--dv-warning)" />}
          </div>
          {i < filtered.length - 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 24, height: 14 }}>
              <div style={{ width: 1, height: '100%', background: 'var(--dv-border-default)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
