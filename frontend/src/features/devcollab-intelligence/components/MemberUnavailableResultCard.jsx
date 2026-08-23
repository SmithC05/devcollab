/**
 * MemberUnavailableResultCard.jsx
 * Phase 3 — Structured response card shown after "Member Suddenly Unavailable" intent.
 * Renders the blast radius, downstream chain, and decision point CTA.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, Clock, ExternalLink, GitBranch,
  Link2, RefreshCw, Shield, Users, Zap, CheckCircle, Activity,
} from 'lucide-react';

const PRIORITY_COLORS = {
  P0: { bg: '#ff1a4420', border: '#ff1a4440', text: '#ff4466' },
  P1: { bg: '#ff770020', border: '#ff770040', text: '#ff9933' },
  P2: { bg: '#7c3aed20', border: '#7c3aed40', text: '#a78bfa' },
};

function DownstreamNode({ task, depth }) {
  const pal = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.P2;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.1 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', marginLeft: depth * 16,
        background: pal.bg, border: `1px solid ${pal.border}`,
        borderRadius: 8,
      }}
    >
      <div style={{ width: 3, alignSelf: 'stretch', background: pal.text, borderRadius: 2 }} />
      <Activity size={11} color={pal.text} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', flex: 1 }}>{task.title}</span>
      <span style={{
        fontSize: 9, fontFamily: 'monospace', padding: '2px 6px',
        background: pal.bg, border: `1px solid ${pal.border}`,
        color: pal.text, borderRadius: 4, fontWeight: 700,
      }}>{task.priority}</span>
    </motion.div>
  );
}

export default function MemberUnavailableResultCard({ result, username }) {
  const navigate = useNavigate();
  const [showDownstream, setShowDownstream] = useState(false);

  const {
    unavailable_until, duration_hours, affected_task_ids = [],
    downstream_count = 0, notification_count = 0,
  } = result;

  // Friendly time formatting
  const untilDate = unavailable_until ? new Date(unavailable_until) : null;
  const untilStr = untilDate
    ? untilDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null;
  const daysLabel = duration_hours >= 24 ? `${Math.floor(duration_hours / 24)} day${Math.floor(duration_hours / 24) > 1 ? 's' : ''}` : `${duration_hours}h`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      {/* Status header stripe */}
      <div style={{
        background: 'linear-gradient(90deg, #ff1a44 0%, #ff6b4a 100%)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <AlertTriangle size={14} color="#fff" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Availability Event Recorded
        </span>
        <div style={{
          marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
          padding: '2px 10px', borderRadius: 100, fontSize: 10, color: '#fff', fontWeight: 600,
        }}>
          DECISION REQUIRED
        </div>
      </div>

      <div style={{ padding: '20px 22px' }}>
        {/* Row 1: Unavailable badge + duration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10,
            background: '#ff1a4410', border: '1px solid #ff1a4430',
          }}>
            <Shield size={14} color="#ff4466" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ff4466' }}>UNAVAILABLE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>
              {username} · {daysLabel}
            </span>
            {untilStr && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} /> Returns: {untilStr}
              </span>
            )}
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { icon: Activity, label: 'Affected Tasks', value: affected_task_ids.length, color: '#ff4466', emphasis: affected_task_ids.length > 0 },
            { icon: Link2, label: 'Downstream', value: downstream_count, color: '#ff9933', emphasis: downstream_count > 0 },
            { icon: Users, label: 'Leads Notified', value: notification_count, color: '#22c55e', emphasis: true },
          ].map(({ icon: Icon, label, value, color, emphasis }) => (
            <div key={label} style={{
              padding: '12px 14px', borderRadius: 10,
              background: emphasis ? `${color}10` : 'var(--surface-item)',
              border: `1px solid ${emphasis ? `${color}30` : 'var(--border-default)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon size={11} color={emphasis ? color : 'var(--text-muted)'} />
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: emphasis ? color : 'var(--text-secondary)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Lead notification confirmation */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
          background: '#22c55e10', border: '1px solid #22c55e30', borderRadius: 10,
          marginBottom: 16,
        }}>
          <CheckCircle size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)', marginBottom: 2 }}>
              Team Lead notified
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {notification_count > 0
                ? `${notification_count} team lead${notification_count > 1 ? 's have' : ' has'} been notified and can review the decision point.`
                : "Your availability change has been recorded. Team leads can view it in Organization Intelligence."}
            </div>
          </div>
        </div>

        {/* Downstream toggle */}
        {downstream_count > 0 && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowDownstream(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
                background: 'none', border: 'none', padding: '4px 0',
              }}
            >
              <Link2 size={11} />
              {showDownstream ? 'Hide' : 'Show'} downstream impact ({downstream_count} tasks)
              <ArrowRight size={10} style={{ transform: showDownstream ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {showDownstream && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>
                  DEPENDENCY CHAIN
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Placeholder — actual downstream tasks come from blast radius */}
                  {affected_task_ids.slice(0, 3).map((id, i) => (
                    <DownstreamNode key={id} task={{ title: `Dependent Task #${id}`, priority: 'P1' }} depth={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate('/dashboard/intelligence/organization')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
            background: 'linear-gradient(135deg, #5c6bf5 0%, #7c3aed 100%)',
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 13,
            boxShadow: '0 4px 20px rgba(92, 107, 245, 0.35)',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Zap size={15} />
          View Decision Point
          <ExternalLink size={13} />
        </button>
      </div>
    </motion.div>
  );
}
