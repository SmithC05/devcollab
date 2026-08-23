import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

import '../../styles/tokens.css';
import '../../styles/components.css';

import { DvButton } from '../../primitives/core';
import { getOrganizationIntelligenceState } from '../../data/organizationAdapter';
import { panelEnter } from '../../motion/presets';

import OrganizationTabs from './OrganizationTabs';
import ContextInspector from './ContextInspector';

export function SourceChip({ source }) {
  const isLive = source === 'LIVE';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: 'var(--dv-radius-md)',
      border: `1px solid ${isLive ? 'var(--dv-success-border)' : 'var(--dv-warning-border)'}`,
      background: isLive ? 'var(--dv-success-subtle)' : 'var(--dv-warning-subtle)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isLive ? 'var(--dv-success)' : 'var(--dv-warning)',
        animation: isLive ? 'dv-pulse 2s ease-in-out infinite' : 'none', flexShrink: 0,
      }} />
      <span style={{
        fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: isLive ? 'var(--dv-success)' : 'var(--dv-warning)',
      }}>
        {isLive ? 'LIVE STATE' : 'DEMO STATE'}
      </span>
    </div>
  );
}

export default function OrganizationIntelligence() {
  const location = useLocation();
  
  const [mode, setMode] = useState('LIVE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedNode, setSelectedNode] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const state = await getOrganizationIntelligenceState(mode);
      setData(state);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Wire realtime event engine_event
  useEffect(() => {
    if (mode !== 'LIVE') return;
    const handleEngineEvent = () => {
      fetchData(); // Invalidate and refetch
    };
    document.addEventListener('engine_event', handleEngineEvent);
    return () => {
      document.removeEventListener('engine_event', handleEngineEvent);
    };
  }, [mode, fetchData]);

  const handleSelectNode = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  if (loading && !data) {
    return <div style={{ padding: 40, color: 'var(--dv-text-secondary)' }}>Loading organization state...</div>;
  }
  if (!data) return null;

  const { systemStatus } = data;

  return (
    <div className="dv-intelligence" style={{ minHeight: '100vh', paddingBottom: 80, position: 'relative' }}>

      {/* ── Demo Banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {mode === 'DEMO' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              background: 'var(--dv-warning-subtle)', borderBottom: '1px solid var(--dv-warning-border)',
              padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--dv-warning)' }}>
              <AlertTriangle size={16} />
              <div style={{ fontSize: 'var(--dv-text-sm)' }}>
                 <strong>CONTROLLED DEMO SCENARIO</strong> &mdash; This view uses a controlled scenario. No live workspace data is being modified.
              </div>
            </div>
            <DvButton variant="outline" size="sm" style={{ borderColor: 'var(--dv-warning)' }} onClick={() => setMode('LIVE')}>
              EXIT DEMO
            </DvButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div style={{
        padding: '28px 40px 22px', borderBottom: '1px solid var(--dv-border-subtle)',
        background: 'var(--dv-bg-canvas)', position: 'sticky', top: mode === 'DEMO' ? 0 : 52, zIndex: 'var(--dv-z-sticky)',
      }}>
        <motion.div variants={panelEnter} initial="hidden" animate="visible"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--dv-text-faint)', marginBottom: 6,
            }}>Organization Intelligence</div>
            <h1 style={{ fontSize: 'var(--dv-text-2xl)', fontWeight: 700, color: 'var(--dv-text-primary)', letterSpacing: 'var(--dv-tracking-tight)', marginBottom: 4 }}>
              Connected Engineering Model
            </h1>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>
              Connected view of people, work, dependencies and engineering responsibility.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {mode === 'LIVE' && (
              <DvButton variant="outline" size="sm" onClick={() => setMode('DEMO')}>
                SIMULATE DEMO
              </DvButton>
            )}
            {mode === 'DEMO' && (
              <DvButton variant="outline" size="sm" onClick={() => setMode('LIVE')}>
                EXIT DEMO
              </DvButton>
            )}
            <SourceChip source={mode === 'DEMO' ? 'CONTROLLED DEMO STATE' : systemStatus.source} />
          </div>
        </motion.div>
      </div>

      <OrganizationTabs data={data} onSelectNode={handleSelectNode} onSyncSuccess={fetchData} />

      {/* ── Context Inspector overlay ── */}
      <AnimatePresence>
        {selectedNode && (
          <ContextInspector
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            members={data.members}
            projects={data.projects}
            responsibilities={data.responsibilities}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
