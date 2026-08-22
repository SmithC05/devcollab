/**
 * Engineering Command Center
 * Route: /intelligence
 *
 * Phase 1 — Organization-level engineering state console.
 * Uses real backend data via commandCenterAdapter.js.
 * Falls back to DEMO state if unauthenticated or API unreachable.
 *
 * READ-ONLY. No mutations. No ML calls. No simulation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, Brain, CheckCircle, ChevronRight,
  Clock, Eye, Layers, Lock, RefreshCw, Shield, TrendingUp,
  UserX, Users, Zap, AlertCircle, Database, BarChart2,
  GitBranch, Cpu, Radio, MoreHorizontal,
} from 'lucide-react';

import '../styles/tokens.css';
import '../styles/components.css';

import {
  DvBadge, DvStatusBadge, DvCard, DvPanel, DvStack, DvGrid,
  DvButton, DvDivider, DvProgressBar, DvProgressRing,
  DvAvatar, DvAvatarStack, DvSkeleton, DvEmptyState, DvMetric,
} from '../primitives/core';
import {
  DvMemberStatus, DvCapacityBar, DvRiskIndicator, DvContextIndicator,
  DvPredictionMetric, DvEventItem,
} from '../primitives/engineering';
import {
  DvAgentStatus, DvAgentActivity, DvAgentStep,
} from '../primitives/agent';

import {
  fetchCommandCenterState, buildDemoFallbackState,
  projectHealthToVariant, availabilityToVariant,
  severityToVariant, decisionTypeToLabel, decisionTypeToIcon,
} from '../data/commandCenterAdapter';

import { fadeUp, staggerChildren, panelEnter } from '../motion/presets';
import { useAuthStore } from '../../../stores/authStore';

// ── Icon lookup ────────────────────────────────────────────────────────────
const ICON_MAP = { Zap, AlertTriangle, Lock, UserX, Activity, Clock, TrendingUp, AlertCircle, Eye };
function DpIcon({ name, size = 16 }) {
  const C = ICON_MAP[name] || AlertCircle;
  return <C size={size} />;
}

// ── Formatting ─────────────────────────────────────────────────────────────
function fmtSyncTime(iso) {
  if (!iso) return '–';
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 5)  return 'just now';
  if (secs < 60) return `${secs}s ago`;
  return `${Math.round(secs / 60)}m ago`;
}

function fmtCapacityColor(pct) {
  if (pct >= 85) return 'var(--dv-danger)';
  if (pct >= 55) return 'var(--dv-warning)';
  return 'var(--dv-success)';
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── Source Chip ────────────────────────────────────────────────────────────
function SourceChip({ source }) {
  const isLive = source === 'LIVE';
  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      gap:           6,
      padding:       '4px 10px',
      borderRadius:  'var(--dv-radius-md)',
      border:        `1px solid ${isLive ? 'var(--dv-success-border)' : 'var(--dv-warning-border)'}`,
      background:    isLive ? 'var(--dv-success-subtle)' : 'var(--dv-warning-subtle)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isLive ? 'var(--dv-success)' : 'var(--dv-warning)',
        boxShadow: isLive ? '0 0 6px var(--dv-success)' : 'none',
        animation: isLive ? 'dv-pulse 2s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }} />
      <span style={{
        fontSize:      10,
        fontFamily:    'var(--dv-font-mono)',
        fontWeight:    700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         isLive ? 'var(--dv-success)' : 'var(--dv-warning)',
      }}>
        {isLive ? 'LIVE STATE' : 'DEMO STATE'}
      </span>
    </div>
  );
}

// ── Org Metric Card ────────────────────────────────────────────────────────
function OrgMetricCard({ label, value, icon: Icon, variant = 'default', onClick }) {
  const variantColor = {
    default:  'var(--dv-text-primary)',
    danger:   'var(--dv-danger)',
    warning:  'var(--dv-warning)',
    success:  'var(--dv-success)',
    accent:   'var(--dv-accent)',
    predicted:'var(--dv-predicted)',
  }[variant] || 'var(--dv-text-primary)';

  return (
    <DvCard
      onClick={onClick}
      style={{
        padding:     '20px 20px 18px',
        cursor:      onClick ? 'pointer' : 'default',
        transition:  'border-color 0.12s, background 0.12s',
        display:     'flex',
        flexDirection:'column',
        gap:         12,
        userSelect:  'none',
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.borderColor = 'var(--dv-border-strong)'; e.currentTarget.style.background = 'var(--dv-bg-elevated)'; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {Icon && <Icon size={14} color="var(--dv-text-muted)" />}
        <span style={{
          fontSize:       9,
          fontFamily:     'var(--dv-font-mono)',
          fontWeight:     700,
          letterSpacing:  '0.1em',
          textTransform:  'uppercase',
          color:          'var(--dv-text-faint)',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize:      'var(--dv-text-4xl)',
        fontWeight:    700,
        fontFamily:    'var(--dv-font-mono)',
        letterSpacing: 'var(--dv-tracking-tight)',
        color:         variantColor,
        lineHeight:    1,
      }}>
        {value ?? '–'}
      </div>
    </DvCard>
  );
}

// ── Project Row ────────────────────────────────────────────────────────────
function ProjectRow({ project, isLast, onClick }) {
  const healthVariant = projectHealthToVariant(project.health);

  return (
    <motion.div
      variants={fadeUp}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          16,
        padding:      '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--dv-border-subtle)',
        cursor:       'pointer',
        transition:   'background 0.12s',
      }}
      whileHover={{ backgroundColor: 'var(--dv-bg-elevated)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      aria-label={`${project.name} — ${project.health}`}
    >
      {/* Health indicator */}
      <div style={{
        width:         3,
        height:        36,
        borderRadius:  'var(--dv-radius-full)',
        background: {
          STABLE:   'var(--dv-success)',
          LOW:      'var(--dv-info)',
          MEDIUM:   'var(--dv-warning)',
          HIGH:     'var(--dv-danger)',
          CRITICAL: 'var(--dv-danger)',
        }[project.health] || 'var(--dv-text-faint)',
        flexShrink: 0,
      }} />

      {/* Name + progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-text-primary)', truncate: true }}>
            {project.name}
          </span>
          {!project.is_active && (
            <DvBadge variant="muted" size="sm">Archived</DvBadge>
          )}
        </div>
        <div style={{ width: '100%', maxWidth: 220 }}>
          <DvProgressBar value={project.progress} max={100} variant={healthVariant === 'danger' ? 'danger' : healthVariant === 'warning' ? 'warning' : 'recommended'} />
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', marginBottom: 2 }}>Active</div>
          <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-primary)' }}>{project.active_tasks}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', marginBottom: 2 }}>Blocked</div>
          <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: project.blocked_tasks > 0 ? 'var(--dv-danger)' : 'var(--dv-text-muted)' }}>{project.blocked_tasks}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', marginBottom: 2 }}>Progress</div>
          <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-secondary)' }}>{project.progress}%</div>
        </div>
      </div>

      {/* Avatars */}
      <DvAvatarStack names={project.members.map(m => m.name)} max={3} size={24} />

      {/* Health badge */}
      <DvBadge variant={healthVariant} dot style={{ flexShrink: 0, minWidth: 72, justifyContent: 'center' }}>
        {project.health}
      </DvBadge>

      <ChevronRight size={14} color="var(--dv-text-faint)" style={{ flexShrink: 0 }} />
    </motion.div>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────
function MemberCard({ member, onClick }) {
  const availVariant = availabilityToVariant(member.availability);
  const capColor = fmtCapacityColor(member.capacity_pct);

  return (
    <motion.div variants={fadeUp}>
      <DvCard
        onClick={onClick}
        style={{
          padding:    '16px',
          cursor:     onClick ? 'pointer' : 'default',
          transition: 'border-color 0.12s, background 0.12s',
          height:     '100%',
          display:    'flex',
          flexDirection: 'column',
          gap:        14,
        }}
        onMouseEnter={onClick ? e => { e.currentTarget.style.borderColor = 'var(--dv-border-strong)'; e.currentTarget.style.background = 'var(--dv-bg-elevated)'; } : undefined}
        onMouseLeave={onClick ? e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; } : undefined}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DvAvatar name={member.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-text-primary)', marginBottom: 2 }}>
              {member.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {member.role}
            </div>
          </div>
          <DvBadge variant={availVariant} size="sm">{member.availability}</DvBadge>
        </div>

        {/* Capacity bar — distinguished from availability */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Capacity Load
            </span>
            <span style={{ fontSize: 'var(--dv-text-xs)', fontFamily: 'var(--dv-font-mono)', fontWeight: 600, color: capColor }}>
              {member.capacity_pct}%
            </span>
          </div>
          <DvProgressBar
            value={member.capacity_pct}
            max={100}
            variant={member.capacity_pct >= 85 ? 'danger' : member.capacity_pct >= 55 ? 'warning' : 'recommended'}
          />
        </div>

        {/* Signal trio: capacity ≠ availability */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, padding: '8px 10px', background: 'var(--dv-bg-elevated)',
            borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', marginBottom: 3 }}>Tasks</div>
            <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-primary)' }}>
              {member.active_task_count}
            </div>
          </div>
          <div style={{
            flex: 1, padding: '8px 10px', background: 'var(--dv-bg-elevated)',
            borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', marginBottom: 3 }}>Critical</div>
            <div style={{
              fontSize: 'var(--dv-text-md)', fontWeight: 700, fontFamily: 'var(--dv-font-mono)',
              color: member.critical_task_count > 0 ? 'var(--dv-danger)' : 'var(--dv-text-muted)',
            }}>
              {member.critical_task_count}
            </div>
          </div>
          <div style={{
            flex: 1, padding: '8px 10px', background: 'var(--dv-bg-elevated)',
            borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', marginBottom: 3 }}>Context</div>
            <div style={{
              fontSize: 'var(--dv-text-md)', fontWeight: 700, fontFamily: 'var(--dv-font-mono)',
              color: 'var(--dv-predicted)',
            }}>
              {member.project_contexts.length > 0
                ? `${member.project_contexts[0].context_score}%`
                : '–'}
            </div>
          </div>
        </div>

        {/* Project context chips */}
        {member.project_contexts.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {member.project_contexts.map(ctx => (
              <div key={ctx.project_id} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 'var(--dv-radius-sm)',
                background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
                color: 'var(--dv-text-muted)', display: 'flex', gap: 5, alignItems: 'center',
              }}>
                <span style={{ color: 'var(--dv-predicted)', fontFamily: 'var(--dv-font-mono)' }}>{ctx.context_score}%</span>
                <span>{ctx.project_name}</span>
              </div>
            ))}
          </div>
        )}
      </DvCard>
    </motion.div>
  );
}

// ── Decision Point Card ────────────────────────────────────────────────────
function DecisionCard({ dp, onAnalyze }) {
  const variant = severityToVariant(dp.severity);
  const iconName = decisionTypeToIcon(dp.type);
  const isCritical = dp.severity === 'CRITICAL' || dp.severity === 'HIGH';

  return (
    <motion.div variants={fadeUp}>
      <DvCard style={{
        padding:     '16px 18px',
        borderColor: isCritical ? 'var(--dv-danger-border)' : 'var(--dv-warning-border)',
        background:  isCritical ? 'var(--dv-danger-subtle)' : 'var(--dv-warning-subtle)',
        display:     'flex',
        flexDirection: 'column',
        gap:         12,
        position:    'relative',
        overflow:    'visible',
      }}>
        {/* Severity stripe */}
        <div style={{
          position:     'absolute',
          left:         0, top: 0, bottom: 0,
          width:        3,
          background:   isCritical ? 'var(--dv-danger)' : 'var(--dv-warning)',
          borderRadius: 'var(--dv-radius-lg) 0 0 var(--dv-radius-lg)',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <DvBadge variant={variant} dot size="sm">{dp.severity}</DvBadge>
          <DvBadge variant="muted" size="sm">{decisionTypeToLabel(dp.type)}</DvBadge>
          {dp.affected_project && (
            <span style={{ fontSize: 11, color: 'var(--dv-text-muted)', marginLeft: 'auto' }}>
              {dp.affected_project}
            </span>
          )}
        </div>

        {/* Trigger */}
        <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 500, color: 'var(--dv-text-primary)', lineHeight: 'var(--dv-leading-snug)' }}>
          {dp.trigger}
        </div>

        {/* Impact */}
        <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', lineHeight: 'var(--dv-leading-relaxed)' }}>
          {dp.impact}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {dp.affected_member && (
            <div style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 'var(--dv-radius-sm)',
              background: 'rgba(0,0,0,0.15)', color: 'var(--dv-text-secondary)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Users size={10} />
              {dp.affected_member}
            </div>
          )}
          <div style={{ flex: 1 }} />
          <DvButton
            size="sm"
            variant="outline"
            style={{
              borderColor: isCritical ? 'var(--dv-danger-border)' : 'var(--dv-warning-border)',
              color:       isCritical ? 'var(--dv-danger)' : 'var(--dv-warning)',
            }}
            onClick={onAnalyze}
          >
            Analyze
          </DvButton>
        </div>
      </DvCard>
    </motion.div>
  );
}

// ── Agent Activity Panel ───────────────────────────────────────────────────
function AgentPanel({ status, org, lastSynced }) {
  const steps = useMemo(() => [
    { label: 'Engineering state loaded',             status: 'done',    detail: `Workspace active` },
    { label: `${org?.project_count ?? 0} projects inspected`, status: 'done' },
    { label: `${org?.member_count ?? 0} members evaluated`,   status: 'done' },
    { label: 'Task states mapped',                   status: 'done',    detail: `${org?.active_task_count ?? 0} active` },
    { label: `Decision points identified`,           status: org?.decision_point_count > 0 ? 'done' : 'running', detail: org?.decision_point_count > 0 ? `${org.decision_point_count} found` : undefined },
    { label: 'Monitoring for changes',               status: 'running', detail: 'Continuous' },
  ], [org, lastSynced]);

  return (
    <DvPanel title="DEVCOLLAB AGENT" titleRight={<DvAgentStatus status={status} />}>
      <DvStack gap={3}>
        {steps.map((step, i) => (
          <DvAgentStep key={i} label={step.label} status={step.status} detail={step.detail} />
        ))}
      </DvStack>
    </DvPanel>
  );
}

// ── AI Engine Indicator ────────────────────────────────────────────────────
function AIEngineIndicator({ agentStatus, org }) {
  return (
    <div style={{
      display:      'flex',
      flexDirection:'column',
      gap:          8,
      padding:      '12px 14px',
      background:   'var(--dv-analyzing-subtle)',
      border:       '1px solid var(--dv-analyzing-border)',
      borderRadius: 'var(--dv-radius-lg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Cpu size={12} color="var(--dv-analyzing)" />
        <span style={{
          fontSize:      10,
          fontFamily:    'var(--dv-font-mono)',
          fontWeight:    700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         'var(--dv-analyzing)',
        }}>
          AI Engine
        </span>
        <span style={{
          marginLeft:    'auto',
          width: 6, height: 6, borderRadius: '50%',
          background:    'var(--dv-analyzing)',
          boxShadow:     '0 0 6px var(--dv-analyzing)',
          animation:     'dv-pulse 1.5s ease-in-out infinite',
          flexShrink:    0,
        }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
        {[
          { label: 'Projects',        value: org?.project_count ?? '–' },
          { label: 'Members',         value: org?.member_count ?? '–' },
          { label: 'Active Tasks',    value: org?.active_task_count ?? '–' },
          { label: 'Decision Points', value: org?.decision_point_count ?? '–' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>{label}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-secondary)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function EngineeringCommandCenter() {
  const [state, setState]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick]           = useState(0);
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const prefix                    = location.pathname.startsWith('/intelligence/demo') ? '/intelligence/demo' : '/intelligence';
  const { accessToken }           = useAuthStore.getState();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchCommandCenterState(accessToken);
      setState(data);
    } catch (err) {
      console.warn('[CommandCenter] API unavailable, using demo state:', err.message);
      // Transparent fallback — clearly labeled DEMO STATE in the UI
      setState(buildDemoFallbackState());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Clock tick for "synced X ago" display — does NOT re-fetch
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const { organization: org, projects, members, decision_points, system_status } = state ?? {};

  // ── Derived sort ─────────────────────────────────────────────────────────
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, STABLE: 4 };
    return [...projects].sort((a, b) => (order[a.health] ?? 5) - (order[b.health] ?? 5));
  }, [projects]);

  const sortedMembers = useMemo(() => {
    if (!members) return [];
    const order = { OVERLOADED: 0, BUSY: 1, AVAILABLE: 2, IDLE: 3, UNAVAILABLE: 4 };
    return [...members].sort((a, b) => (order[a.availability] ?? 5) - (order[b.availability] ?? 5));
  }, [members]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dv-intelligence" style={{ minHeight: '100vh', paddingBottom: 60 }}>

      {/* ── Page Header ── */}
      <div style={{
        padding:      '28px 40px 24px',
        borderBottom: '1px solid var(--dv-border-subtle)',
        background:   'var(--dv-bg-canvas)',
        position:     'sticky',
        top:          52,
        zIndex:       'var(--dv-z-sticky)',
      }}>
        <motion.div
          variants={panelEnter}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}
        >
          {/* Title block */}
          <div>
            <div style={{
              fontSize:      10,
              fontFamily:    'var(--dv-font-mono)',
              fontWeight:    700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         'var(--dv-text-faint)',
              marginBottom:  6,
            }}>
              Engineering Command Center
            </div>
            <h1 style={{
              fontSize:      'var(--dv-text-2xl)',
              fontWeight:    700,
              color:         'var(--dv-text-primary)',
              letterSpacing: 'var(--dv-tracking-tight)',
              marginBottom:  4,
            }}>
              Organization Engineering State
            </h1>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>
              Live view of projects, capacity, and engineering pressure.
            </p>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {system_status && <SourceChip source={system_status.source} />}
            <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', whiteSpace: 'nowrap' }}>
              Synced {fmtSyncTime(system_status?.last_synced)}
            </div>
            <DvButton
              size="sm"
              variant="ghost"
              icon={RefreshCw}
              onClick={() => load(true)}
              disabled={loading || refreshing}
              style={{ opacity: refreshing ? 0.6 : 1 }}
            >
              {refreshing ? 'Syncing…' : 'Refresh'}
            </DvButton>
          </div>
        </motion.div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '32px 40px', maxWidth: 1440, margin: '0 auto' }}>
        {loading ? (
          <SkeletonState />
        ) : (
          <motion.div variants={staggerChildren} initial="hidden" animate="visible">

            {/* ── Org Summary Metrics ── */}
            <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
              <SectionLabel label="Organization Summary" icon={Database} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                <OrgMetricCard label="Members"         value={org?.member_count}         icon={Users}         variant="default" />
                <OrgMetricCard label="Projects"        value={org?.project_count}        icon={Layers}        variant="accent" />
                <OrgMetricCard label="Active Tasks"    value={org?.active_task_count}    icon={Activity}      variant="default" />
                <OrgMetricCard label="Blocked"         value={org?.blocked_task_count}   icon={Lock}          variant={org?.blocked_task_count > 0 ? 'warning' : 'default'} />
                <OrgMetricCard label="At Risk"         value={org?.at_risk_task_count}   icon={AlertTriangle} variant={org?.at_risk_task_count > 0 ? 'danger' : 'default'} />
                <OrgMetricCard label="Decisions"       value={org?.decision_point_count} icon={Zap}           variant={org?.decision_point_count > 0 ? 'danger' : 'default'} />
              </div>
            </motion.div>

            {/* ── Main Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

              {/* ── Left column ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Project Intelligence */}
                <motion.div variants={fadeUp}>
                  <DvPanel
                    title="Project Intelligence"
                    titleRight={
                      <div style={{ display: 'flex', gap: 8 }}>
                        <DvBadge variant="muted" size="sm">{sortedProjects.length} projects</DvBadge>
                        <GitBranch size={14} color="var(--dv-text-faint)" />
                      </div>
                    }
                    noPad
                  >
                    {sortedProjects.length === 0 ? (
                      <DvEmptyState title="No projects" description="No active projects in the workspace." icon={Layers} style={{ padding: 40 }} />
                    ) : (
                      <motion.div variants={staggerChildren} initial="hidden" animate="visible">
                        {sortedProjects.map((p, i) => (
                          <ProjectRow
                            key={p.id}
                            project={p}
                            isLast={i === sortedProjects.length - 1}
                            onClick={() => navigate(`${prefix}/project/${p.id}`)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </DvPanel>
                </motion.div>

                {/* Team Capacity */}
                <motion.div variants={fadeUp}>
                  <SectionLabel label="Team Capacity" icon={Users} badge="Availability ≠ Usable Capacity" />
                  <motion.div
                    variants={staggerChildren}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}
                  >
                    {sortedMembers.map(member => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onClick={() => navigate(`${prefix}/member/${member.id}`)}
                      />
                    ))}
                  </motion.div>
                </motion.div>

              </div>

              {/* ── Right sidebar ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 140 }}>

                {/* Decision Points */}
                <motion.div variants={fadeUp}>
                  <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={13} color={decision_points?.length > 0 ? 'var(--dv-danger)' : 'var(--dv-text-faint)'} />
                    <span style={{
                      fontSize:      10,
                      fontFamily:    'var(--dv-font-mono)',
                      fontWeight:    700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color:         decision_points?.length > 0 ? 'var(--dv-danger)' : 'var(--dv-text-muted)',
                    }}>
                      Decision Points
                    </span>
                    {decision_points?.length > 0 && (
                      <span style={{
                        marginLeft:  'auto',
                        fontSize:    10,
                        fontFamily:  'var(--dv-font-mono)',
                        fontWeight:  700,
                        color:       'var(--dv-danger)',
                        padding:     '1px 6px',
                        background:  'var(--dv-danger-subtle)',
                        border:      '1px solid var(--dv-danger-border)',
                        borderRadius:'var(--dv-radius-full)',
                      }}>
                        {decision_points.length}
                      </span>
                    )}
                  </div>
                  <motion.div variants={staggerChildren} initial="hidden" animate="visible">
                    {!decision_points || decision_points.length === 0 ? (
                      <DvCard style={{ padding: '20px 16px', textAlign: 'center' }}>
                        <CheckCircle size={20} color="var(--dv-success)" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', fontWeight: 500 }}>
                          No active decision points
                        </div>
                        <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', marginTop: 4 }}>
                          Engineering state is stable.
                        </div>
                      </DvCard>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {decision_points.map(dp => (
                          <DecisionCard
                            key={dp.id}
                            dp={dp}
                            onAnalyze={() => navigate(`${prefix}/decision/${dp.id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                </motion.div>

                <DvDivider />

                {/* Agent Activity */}
                <motion.div variants={fadeUp}>
                  <AgentPanel
                    status={system_status?.agent_status ?? 'IDLE'}
                    org={org}
                    lastSynced={system_status?.last_synced}
                  />
                </motion.div>

                {/* AI Engine Subsystem */}
                <motion.div variants={fadeUp}>
                  <AIEngineIndicator agentStatus={system_status?.agent_status} org={org} />
                </motion.div>

              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Section Label ──────────────────────────────────────────────────────────
function SectionLabel({ label, icon: Icon, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {Icon && <Icon size={13} color="var(--dv-text-faint)" />}
      <span style={{
        fontSize:      10,
        fontFamily:    'var(--dv-font-mono)',
        fontWeight:    700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         'var(--dv-text-muted)',
      }}>
        {label}
      </span>
      {badge && (
        <span style={{
          fontSize:    10,
          color:       'var(--dv-text-faint)',
          padding:     '1px 7px',
          borderRadius:'var(--dv-radius-full)',
          border:      '1px solid var(--dv-border-subtle)',
          marginLeft:  4,
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────
function SkeletonState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {[...Array(6)].map((_, i) => (
          <DvCard key={i} style={{ padding: '20px' }}>
            <DvSkeleton height={10} width="60%" style={{ marginBottom: 12 }} />
            <DvSkeleton height={32} width="50%" />
          </DvCard>
        ))}
      </div>
      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <DvCard style={{ height: 320, padding: 20 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <DvSkeleton width={3} height={36} />
              <DvSkeleton height={14} style={{ flex: 1 }} />
              <DvSkeleton height={14} width={80} />
            </div>
          ))}
        </DvCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <DvCard key={i} style={{ padding: '16px 18px', height: 100 }}>
              <DvSkeleton height={12} width="80%" style={{ marginBottom: 8 }} />
              <DvSkeleton height={10} width="60%" />
            </DvCard>
          ))}
        </div>
      </div>
    </div>
  );
}
