import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Zap, X } from 'lucide-react';

import '../../styles/tokens.css';
import '../../styles/components.css';

import { DvButton } from '../../primitives/core';
import { getOrganizationIntelligenceState } from '../../data/organizationAdapter';
import { panelEnter } from '../../motion/presets';

import OrganizationTabs from './OrganizationTabs';
import ContextInspector from './ContextInspector';
import DecisionRequiredModal from '../../components/DecisionRequiredModal';

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
  const navigate = useNavigate();
  
  const [mode, setMode] = useState('LIVE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [decisionPoint, setDecisionPoint] = useState(null);

  const isFetchingRef = useRef(false);
  const debounceRef = useRef(null);

  // background=true means: don't flip the loading spinner (used for WebSocket-triggered refetches)
  const fetchData = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const state = await getOrganizationIntelligenceState(mode);
      setData(state);
    } catch (e) {
      console.error(e);
    } finally {
      if (!background) setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Wire realtime event engine_event — debounced so rapid WS messages
  // (presence pings, status updates) don't hammer the API or disrupt child state
  useEffect(() => {
    if (mode !== 'LIVE') return;
    const handleEngineEvent = (e) => {
      // Always handle modal-level decision points immediately
      if (e.detail && e.detail.event_type === 'DECISION_POINT_CREATED') {
        setDecisionPoint(e.detail);
      }
      // Debounce the data refetch — wait 1.5s of silence before hitting the API
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchData(true); // background=true: no loading spinner
      }, 1500);
    };
    document.addEventListener('engine_event', handleEngineEvent);
    return () => {
      document.removeEventListener('engine_event', handleEngineEvent);
      clearTimeout(debounceRef.current);
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

      {/* ── Phase 3: MEMBER_UNAVAILABLE Alert Banner ─────── */}
      <AnimatePresence>
        {unavailableBanner && mode === 'LIVE' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              background: 'var(--dv-danger-subtle)', borderBottom: '2px solid var(--dv-danger-border)',
              padding: '14px 40px', display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden'
            }}
          >
            <Zap size={16} color="var(--dv-danger)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-danger)', letterSpacing: '0.08em', marginBottom: 2 }}>
                DECISION REQUIRED — MEMBER UNAVAILABLE
              </div>
              <div style={{ fontSize: 13, color: 'var(--dv-text-secondary)' }}>
                {unavailableBanner.affected_member?.username || 'A team member'} has declared unavailability
                {unavailableBanner.affected_member?.duration_hours
                  ? ` for ${Math.floor(unavailableBanner.affected_member.duration_hours / 24)} day(s)`
                  : ''}
                . {(unavailableBanner.affected_tasks || []).length} critical task(s) require reassignment.
              </div>
            </div>
            <DvButton variant="danger" size="sm" onClick={() => navigate('/dashboard/intelligence/organization')}>
              REVIEW DECISION
            </DvButton>
            <button onClick={() => setUnavailableBanner(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dv-text-faint)', padding: 4 }}>
              <X size={14} />
            </button>
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

      <AnimatePresence>
        {decisionPoint && (
          <DecisionRequiredModal 
            decisionPoint={decisionPoint} 
            onClose={() => setDecisionPoint(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
