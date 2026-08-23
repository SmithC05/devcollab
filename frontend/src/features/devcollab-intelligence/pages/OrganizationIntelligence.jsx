/**
 * Organization Intelligence
 * Route: /intelligence/organization
 *
 * Phase 2 — Connected engineering organization graph + agent analysis.
 * READ-ONLY. No mutations. No ML inference. No simulation.
 * Observational only.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertCircle, AlertTriangle, ArrowRight, Brain,
  ChevronRight, Clock, Cpu, Database, GitBranch, Layers,
  Lock, RefreshCw, Search, Shield, TrendingUp, Users,
  X, Zap, CheckCircle, Eye, ArrowDown, Link2,
} from 'lucide-react';

import '../styles/tokens.css';
import '../styles/components.css';

import {
  DvBadge, DvCard, DvPanel, DvButton, DvDivider,
  DvProgressBar, DvProgressRing, DvAvatar, DvSkeleton,
} from '../primitives/core';
import { DvPredictionMetric } from '../primitives/engineering';

import {
  getOrganizationIntelligenceState,
  coverageToVariant, contextLabelToVariant, availabilityToVariant,
  healthToVariant, depStatusToVariant, provenanceLabel,
} from '../data/organizationAdapter';

import {
  fadeUp, staggerChildren, panelEnter, agentActivity,
  slideIn, scaleIn, scenarioTransition,
} from '../motion/presets';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function cap(pct) {
  if (pct >= 85) return 'var(--dv-danger)';
  if (pct >= 55) return 'var(--dv-warning)';
  return 'var(--dv-success)';
}

function mono(s, color = 'var(--dv-text-secondary)') {
  return <span style={{ fontFamily: 'var(--dv-font-mono)', color, fontWeight: 600, fontSize: '0.78rem' }}>{s}</span>;
}

function SectionLabel({ label, icon: Icon, right, id }) {
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

function ProvenancePip({ prov }) {
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

function SourceChip({ source }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING GRAPH — SVG-based relationship visualizer
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH_PALETTE = {
  org:     { fill: 'var(--dv-accent)', text: 'var(--dv-text-inverse)', border: 'var(--dv-accent-hover)' },
  project: { fill: 'var(--dv-bg-elevated)', text: 'var(--dv-text-primary)', border: 'var(--dv-analyzing-border)' },
  member:  { fill: 'var(--dv-bg-elevated)', text: 'var(--dv-text-primary)', border: 'var(--dv-border-default)' },
  task:    { fill: 'var(--dv-bg-surface)', text: 'var(--dv-text-secondary)', border: 'var(--dv-border-subtle)' },
  dep:     { fill: 'var(--dv-warning-subtle)', text: 'var(--dv-warning)', border: 'var(--dv-warning-border)' },
  dp:      { fill: 'var(--dv-danger-subtle)', text: 'var(--dv-danger)', border: 'var(--dv-danger-border)' },
};

const HEALTH_COLORS = {
  STABLE: 'var(--dv-success)', LOW: 'var(--dv-info)',
  MEDIUM: 'var(--dv-warning)', HIGH: 'var(--dv-danger)', CRITICAL: 'var(--dv-danger)',
};
const AVAIL_COLORS = {
  AVAILABLE: 'var(--dv-success)', IDLE: 'var(--dv-text-faint)',
  BUSY: 'var(--dv-warning)', OVERLOADED: 'var(--dv-danger)',
};

function EngineeringGraph({ members, projects, decisionPoints, onSelectNode }) {
  const [hovered, setHovered] = useState(null);
  const containerRef = useRef(null);

  // Layout: dynamic based on project/member count
  const W = 900, H = 540;
  const cx = W / 2;

  // Org node
  const orgNode = { id: 'org', type: 'org', label: 'DevCollab Engineering', x: cx, y: 48 };

  // Project nodes — fan out under org
  const projSpacing = Math.min(200, (W - 80) / Math.max(projects.length, 1));
  const projStartX = cx - ((projects.length - 1) * projSpacing) / 2;
  const projNodes = projects.map((p, i) => ({
    id: `proj-${p.id}`, type: 'project', payload: p,
    label: p.name, sublabel: p.health,
    x: projStartX + i * projSpacing, y: 148,
  }));

  // Member nodes — cluster under their primary project (most context)
  const memberNodes = members.map(m => {
    const primaryCtx = m.project_contexts.reduce(
      (best, ctx) => ctx.context_score > (best?.context_score ?? 0) ? ctx : best, null
    );
    const projNode = projNodes.find(p => p.payload.name === primaryCtx?.project_name) ?? projNodes[0];
    return {
      id: `mem-${m.id}`, type: 'member', payload: m,
      label: m.name, sublabel: m.availability,
      primaryProjId: projNode?.id,
      x: projNode ? projNode.x + (members.indexOf(m) % 2 === 0 ? -48 : 48) * Math.ceil((members.indexOf(m) + 1) / 2) : cx,
      y: 280,
    };
  });

  // Spread member X positions to avoid overlap
  const MEMBER_ROW_W = W - 80;
  const mSpacing = MEMBER_ROW_W / Math.max(members.length, 1);
  memberNodes.forEach((m, i) => {
    m.x = 40 + i * mSpacing + mSpacing / 2;
  });

  // Key task nodes — P0/P1 only, max 6
  const keyTasks = members
    .flatMap(m => (m.owned_tasks || []).filter(t => t.priority === 'P0' || t.priority === 'P1'))
    .slice(0, 6);
  const taskSpacing = (W - 80) / Math.max(keyTasks.length, 1);
  const taskNodes = keyTasks.map((t, i) => {
    const ownerNode = memberNodes.find(mn => (mn.payload.owned_tasks || []).some(ot => ot.id === t.id));
    return {
      id: `task-${t.id}`, type: 'task', payload: t,
      label: t.title, sublabel: t.priority,
      ownerId: ownerNode?.id,
      x: 40 + i * taskSpacing + taskSpacing / 2,
      y: 420,
    };
  });

  // Decision point nodes
  const dpNodes = decisionPoints.filter(dp => dp.severity === 'CRITICAL' || dp.severity === 'HIGH').slice(0, 2).map((dp, i) => ({
    id: `dp-${dp.id}`, type: 'dp', payload: dp,
    label: dp.severity, sublabel: 'Decision',
    x: W - 60 - i * 90, y: 180,
  }));

  const allNodes = [orgNode, ...projNodes, ...memberNodes, ...taskNodes, ...dpNodes];

  // Edges
  const edges = [
    // org → projects
    ...projNodes.map(p => ({ from: orgNode, to: p, style: 'accent' })),
    // proj → members (primary context)
    ...memberNodes.map(m => {
      const proj = projNodes.find(p => p.id === m.primaryProjId) ?? projNodes[0];
      return proj ? { from: proj, to: m, style: 'faint' } : null;
    }).filter(Boolean),
    // members → tasks
    ...taskNodes.map(t => {
      const owner = memberNodes.find(m => m.id === t.ownerId);
      return owner ? { from: owner, to: t, style: 'faint', label: t.payload.priority } : null;
    }).filter(Boolean),
    // dp → members
    ...dpNodes.map(dp => {
      const memName = dp.payload.affected_member;
      const mem = memberNodes.find(m => m.payload.name === memName);
      return mem ? { from: dp, to: mem, style: 'danger' } : null;
    }).filter(Boolean),
  ];

  const EDGE_STYLES = {
    accent:  { stroke: 'var(--dv-accent)',   strokeWidth: 1.5, opacity: 0.5 },
    faint:   { stroke: 'var(--dv-border-default)', strokeWidth: 1, opacity: 0.4 },
    danger:  { stroke: 'var(--dv-danger)',   strokeWidth: 1.5, opacity: 0.6 },
    warning: { stroke: 'var(--dv-warning)',  strokeWidth: 1, opacity: 0.5 },
  };

  function renderNode(node, idx) {
    const pal = GRAPH_PALETTE[node.type] ?? GRAPH_PALETTE.task;
    const isHovered = hovered === node.id;

    let rx = 6, ry = 6;
    let nw = 100, nh = 36;

    if (node.type === 'org')     { nw = 160; nh = 42; rx = 10; }
    if (node.type === 'project') { nw = 110; nh = 44; }
    if (node.type === 'member')  { nw = 88;  nh = 40; rx = 20; ry = 20; }
    if (node.type === 'task')    { nw = 100; nh = 32; }
    if (node.type === 'dp')      { nw = 70;  nh = 32; rx = 4; }

    const nx = node.x - nw / 2;
    const ny = node.y - nh / 2;

    return (
      <motion.g
        key={node.id}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.04, duration: 0.25 }}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(node.id)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => onSelectNode?.(node)}
        role="button"
        aria-label={`${node.type} node: ${node.label}`}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onSelectNode?.(node)}
      >
        {/* Node background */}
        <rect
          x={nx} y={ny} width={nw} height={nh} rx={rx} ry={ry}
          fill={node.type === 'org' ? pal.fill : 'var(--dv-bg-elevated)'}
          stroke={isHovered ? 'var(--dv-border-strong)' : pal.border}
          strokeWidth={isHovered ? 1.5 : 1}
          style={{ transition: 'stroke 0.15s, stroke-width 0.15s' }}
        />

        {/* Health/status stripe on left for projects */}
        {node.type === 'project' && (
          <rect
            x={nx} y={ny} width={3} height={nh} rx={rx} ry={0}
            fill={HEALTH_COLORS[node.payload?.health] ?? 'var(--dv-border-subtle)'}
          />
        )}

        {/* Availability dot for members */}
        {node.type === 'member' && (
          <circle
            cx={nx + nw - 8} cy={ny + 8} r={4}
            fill={AVAIL_COLORS[node.payload?.availability] ?? 'var(--dv-text-faint)'}
          />
        )}

        {/* Primary label */}
        <text
          x={node.x} y={node.y + (node.type === 'org' ? -3 : -1)}
          textAnchor="middle" dominantBaseline="middle"
          fill={node.type === 'org' ? 'white' : 'var(--dv-text-primary)'}
          fontSize={node.type === 'org' ? 11 : node.type === 'task' ? 9 : 10}
          fontWeight={node.type === 'org' ? 700 : 600}
          fontFamily="Inter, system-ui, sans-serif"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
        </text>

        {/* Sublabel */}
        {node.sublabel && node.type !== 'org' && (
          <text
            x={node.x} y={node.y + 12}
            textAnchor="middle" dominantBaseline="middle"
            fill={
              node.type === 'project' ? (HEALTH_COLORS[node.sublabel] ?? 'var(--dv-text-faint)') :
              node.type === 'member'  ? (AVAIL_COLORS[node.sublabel] ?? 'var(--dv-text-faint)')  :
              node.type === 'dp'      ? 'var(--dv-danger)' :
              'var(--dv-text-muted)'
            }
            fontSize={8}
            fontFamily="'JetBrains Mono', 'Fira Code', monospace"
            fontWeight={600}
            style={{ pointerEvents: 'none', userSelect: 'none', textTransform: 'uppercase' }}
          >
            {node.sublabel}
          </text>
        )}

        {/* Hover ring */}
        {isHovered && (
          <rect
            x={nx - 2} y={ny - 2} width={nw + 4} height={nh + 4} rx={rx + 2}
            fill="none" stroke="var(--dv-accent)" strokeWidth={1} opacity={0.4}
          />
        )}
      </motion.g>
    );
  }

  function renderEdge(edge, idx) {
    const style = EDGE_STYLES[edge.style] ?? EDGE_STYLES.faint;
    const x1 = edge.from.x, y1 = edge.from.y + (edge.from.type === 'org' ? 21 : 18);
    const x2 = edge.to.x,   y2 = edge.to.y - 18;
    const my = (y1 + y2) / 2;

    return (
      <motion.g key={`${edge.from.id}-${edge.to.id}-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + idx * 0.04 }}>
        <path
          d={`M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`}
          fill="none"
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          opacity={style.opacity}
          strokeDasharray={edge.style === 'danger' ? '4 3' : undefined}
        />
        {/* Arrowhead */}
        <polygon
          points={`${x2},${y2} ${x2 - 3},${y2 - 6} ${x2 + 3},${y2 - 6}`}
          fill={style.stroke}
          opacity={style.opacity}
        />
      </motion.g>
    );
  }

  return (
    <div ref={containerRef} style={{
      position: 'relative', borderRadius: 'var(--dv-radius-lg)',
      border: '1px solid var(--dv-border-default)',
      background: 'var(--dv-bg-surface)',
      overflow: 'hidden',
    }}>
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 16, display: 'flex', gap: 10,
        flexWrap: 'wrap', zIndex: 1,
      }}>
        {[
          { type: 'org',     label: 'Organization', color: 'var(--dv-accent)' },
          { type: 'project', label: 'Project',       color: 'var(--dv-analyzing)' },
          { type: 'member',  label: 'Member',        color: 'var(--dv-text-muted)' },
          { type: 'task',    label: 'Task',           color: 'var(--dv-border-strong)' },
          { type: 'dp',      label: 'Decision Point', color: 'var(--dv-danger)' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)' }}>{label}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', minHeight: 340 }}
        role="img"
        aria-label="Engineering organization relationship graph"
      >
        {/* Grid background */}
        <defs>
          <pattern id="org-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#org-grid)" />

        {/* Edges first so nodes sit on top */}
        {edges.map((edge, i) => renderEdge(edge, i))}

        {/* Nodes */}
        {allNodes.map((node, i) => renderNode(node, i))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT INSPECTOR — Right-side drawer
// ─────────────────────────────────────────────────────────────────────────────
function ContextInspector({ node, onClose, members, projects, responsibilities }) {
  if (!node) return null;

  const { type, payload, label } = node;

  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        variants={slideIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position:   'fixed',
          top:        0, right: 0, bottom: 0,
          width:      360,
          background: 'var(--dv-bg-canvas)',
          borderLeft: '1px solid var(--dv-border-default)',
          zIndex:     200,
          display:    'flex',
          flexDirection: 'column',
          overflowY:  'auto',
        }}
        role="dialog"
        aria-label={`Inspector: ${label}`}
      >
        {/* Header */}
        <div style={{
          padding:      '18px 20px 14px',
          borderBottom: '1px solid var(--dv-border-subtle)',
          position:     'sticky',
          top:          0,
          background:   'var(--dv-bg-canvas)',
          zIndex:       1,
          display:      'flex',
          alignItems:   'flex-start',
          gap:          10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--dv-text-faint)', marginBottom: 4,
            }}>
              {type.toUpperCase()}
            </div>
            <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>
              {label}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close inspector"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--dv-text-muted)', padding: 4, marginTop: -2,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', flex: 1 }}>
          {type === 'org'     && <OrgInspector members={members} projects={projects} />}
          {type === 'project' && <ProjectInspector project={payload} members={members} responsibilities={responsibilities} />}
          {type === 'member'  && <MemberInspector member={payload} />}
          {type === 'task'    && <TaskInspector task={payload} />}
          {type === 'dp'      && <DecisionInspector dp={payload} members={members} />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function InspectorRow({ label, value, prov }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--dv-border-subtle)' }}>
      <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>{value}</span>
        {prov && <ProvenancePip prov={prov} />}
      </div>
    </div>
  );
}

function InspectorSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--dv-text-faint)', marginBottom: 8,
      }}>{title}</div>
      {children}
    </div>
  );
}

function OrgInspector({ members, projects }) {
  return (
    <>
      <InspectorSection title="Signals">
        <InspectorRow label="Members"  value={members.length}  prov="REAL_DB" />
        <InspectorRow label="Projects" value={projects.length} prov="REAL_DB" />
        <InspectorRow label="Overloaded" value={members.filter(m => m.availability === 'OVERLOADED').length} prov="DERIVED" />
        <InspectorRow label="At-risk projects" value={projects.filter(p => p.health === 'HIGH' || p.health === 'CRITICAL').length} prov="DERIVED" />
      </InspectorSection>
    </>
  );
}

function ProjectInspector({ project, members, responsibilities }) {
  const r = (responsibilities || []).filter(r => r.project_name === project?.name);
  return project ? (
    <>
      <InspectorSection title="Health">
        <InspectorRow label="Health"          value={project.health}        prov="DERIVED" />
        <InspectorRow label="Progress"        value={`${project.progress}%`}  prov="DERIVED" />
        <InspectorRow label="Active Tasks"    value={project.active_tasks}  prov="REAL_DB" />
        <InspectorRow label="Blocked Tasks"   value={project.blocked_tasks} prov="REAL_DB" />
        <InspectorRow label="Critical Tasks"  value={project.critical_tasks}prov="REAL_DB" />
        <InspectorRow label="Knowledge Owner" value={project.knowledge_concentration} prov="DERIVED" />
      </InspectorSection>
      {r.length > 0 && (
        <InspectorSection title="Responsibility Coverage">
          {r.map(resp => (
            <div key={resp.id} style={{ marginBottom: 10, padding: '8px 10px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>{resp.title}</span>
                <DvBadge variant={coverageToVariant(resp.coverage)} size="sm">{resp.coverage}</DvBadge>
              </div>
              <div style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>
                Owner: <span style={{ color: 'var(--dv-text-secondary)' }}>{resp.owner}</span>
                {' · '}
                Backup: <span style={{ color: resp.backup ? 'var(--dv-text-secondary)' : 'var(--dv-danger)' }}>{resp.backup ?? 'None'}</span>
                {resp.backup && <span style={{ color: 'var(--dv-text-faint)' }}> ({resp.backup_context}% ctx)</span>}
              </div>
            </div>
          ))}
        </InspectorSection>
      )}
    </>
  ) : null;
}

function MemberInspector({ member }) {
  return member ? (
    <>
      <InspectorSection title="Capacity & Availability">
        <InspectorRow label="Availability" value={member.availability}   prov="DERIVED" />
        <InspectorRow label="Capacity Load" value={`${member.capacity_pct}%`} prov="DERIVED" />
        <InspectorRow label="Active Tasks"  value={member.active_task_count}   prov="REAL_DB" />
        <InspectorRow label="Critical"      value={member.critical_task_count} prov="REAL_DB" />
      </InspectorSection>
      <InspectorSection title="Project Context">
        {member.project_contexts.map(ctx => (
          <div key={ctx.project_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--dv-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)' }}>{ctx.project_name}</span>
              <DvBadge variant={contextLabelToVariant(ctx.context_label)} size="sm">{ctx.context_label}</DvBadge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {mono(`${ctx.context_score}%`, ctx.context_score >= 70 ? 'var(--dv-success)' : ctx.context_score >= 40 ? 'var(--dv-warning)' : 'var(--dv-danger)')}
              <ProvenancePip prov={ctx.provenance} />
            </div>
          </div>
        ))}
      </InspectorSection>
      <InspectorSection title="Owned Tasks">
        {!member.owned_tasks ? (
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
            NOT AVAILABLE FROM CURRENT WORKSPACE DATA
          </div>
        ) : member.owned_tasks.length === 0 ? (
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', padding: '10px 0' }}>
            No tasks currently owned
          </div>
        ) : (
          member.owned_tasks.slice(0, 4).map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--dv-border-subtle)' }}>
              <DvBadge variant={task.priority === 'P0' ? 'danger' : task.priority === 'P1' ? 'warning' : 'muted'} size="sm">{task.priority}</DvBadge>
              <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', flex: 1 }}>{task.title}</span>
              {task.dependency_count > 0 && (
                <span style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)' }}>{task.dependency_count} deps</span>
              )}
            </div>
          ))
        )}
      </InspectorSection>
    </>
  ) : null;
}

function TaskInspector({ task }) {
  return task ? (
    <>
      <InspectorSection title="Task Details">
        <InspectorRow label="Priority"    value={task.priority}    prov="REAL_DB" />
        <InspectorRow label="Status"      value={task.status}      prov="REAL_DB" />
        <InspectorRow label="Project"     value={task.project_name}prov="REAL_DB" />
        <InspectorRow label="Downstream dependencies" value={task.dependency_count} prov="SYNTHETIC_DEMO" />
      </InspectorSection>
    </>
  ) : null;
}

function DecisionInspector({ dp, members }) {
  const affectedMember = members.find(m => m.name === dp?.affected_member);
  return dp ? (
    <>
      <div style={{
        padding: '10px 14px', marginBottom: 16,
        background: 'var(--dv-danger-subtle)', border: '1px solid var(--dv-danger-border)',
        borderRadius: 'var(--dv-radius-md)',
      }}>
        <DvBadge variant="danger" dot style={{ marginBottom: 6 }}>{dp.severity}</DvBadge>
        <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', lineHeight: 1.5 }}>{dp.trigger}</div>
      </div>
      <InspectorSection title="Impact">
        <p style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', lineHeight: 1.6, margin: 0 }}>{dp.impact}</p>
      </InspectorSection>
      {dp.evidence && (
        <InspectorSection title="Evidence">
          {dp.evidence.map((ev, i) => (
            <InspectorRow key={i} label={ev.label} value={ev.value} prov={ev.provenance} />
          ))}
        </InspectorSection>
      )}
      {affectedMember && (
        <InspectorSection title="Affected Member">
          <InspectorRow label="Name"       value={affectedMember.name}             prov="REAL_DB" />
          <InspectorRow label="Capacity"   value={`${affectedMember.capacity_pct}%`}  prov="DERIVED" />
          <InspectorRow label="Availability" value={affectedMember.availability}   prov="DERIVED" />
        </InspectorSection>
      )}
    </>
  ) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER INTELLIGENCE — Capacity / Context / Responsibility
// ─────────────────────────────────────────────────────────────────────────────
function MemberIntelligenceCard({ member, responsibilities, onClick }) {
  const criticalResps = (responsibilities || []).filter(
    r => r.owner === member.name && (r.coverage === 'CRITICAL' || r.coverage === 'FRAGILE')
  );

  return (
    <motion.div variants={fadeUp}>
      <DvCard
        onClick={onClick}
        style={{
          padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14,
          transition: 'border-color 0.12s', height: '100%',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--dv-border-strong)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <DvAvatar name={member.name} size={38} />
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 9, height: 9, borderRadius: '50%',
              background: AVAIL_COLORS[member.availability] ?? 'var(--dv-text-faint)',
              border: '1.5px solid var(--dv-bg-canvas)',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{member.name}</div>
            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{member.role}</div>
          </div>
          <DvBadge variant={availabilityToVariant(member.availability)} size="sm">{member.availability}</DvBadge>
        </div>

        {/* Three dimensions: Capacity | Context | Responsibility */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>

          {/* Capacity */}
          <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
            <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Capacity</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <DvProgressRing value={member.capacity_pct} max={100} size={38} stroke={3}
                variant={member.capacity_pct >= 85 ? 'danger' : member.capacity_pct >= 55 ? 'warning' : 'recommended'} />
            </div>
            <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: cap(member.capacity_pct), fontWeight: 700 }}>
              {member.capacity_pct}%
            </div>
            
          </div>

          {/* Context — top project context */}
          <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
            <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Context</div>
            {member.project_contexts.slice(0, 1).map(ctx => (
              <div key={ctx.project_id}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <DvProgressRing value={ctx.context_score} max={100} size={38} stroke={3}
                    variant={ctx.context_score >= 70 ? 'recommended' : ctx.context_score >= 40 ? 'warning' : 'danger'} />
                </div>
                <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-predicted)', fontWeight: 700 }}>{ctx.context_score}%</div>
                <div style={{ fontSize: 8, color: 'var(--dv-text-faint)', marginTop: 2 }}>{ctx.project_name}</div>
              </div>
            ))}
            
          </div>

          {/* Responsibility */}
          <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
            <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Responsiblity</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: criticalResps.length > 0 ? 'var(--dv-danger)' : 'var(--dv-text-secondary)', lineHeight: 1, marginBottom: 4 }}>
              {member.active_task_count}
            </div>
            <div style={{ fontSize: 9, color: criticalResps.length > 0 ? 'var(--dv-danger)' : 'var(--dv-text-faint)' }}>
              {criticalResps.length > 0 ? `${criticalResps.length} critical` : 'tasks'}
            </div>
            
          </div>
        </div>

        {/* Key insight: "Available ≠ Ready" */}
        {member.availability === 'AVAILABLE' && member.project_contexts.some(c => c.context_score < 40) && (
          <div style={{
            fontSize: 10, padding: '6px 10px', borderRadius: 'var(--dv-radius-sm)',
            background: 'var(--dv-warning-subtle)', border: '1px solid var(--dv-warning-border)',
            color: 'var(--dv-warning)', lineHeight: 1.4,
          }}>
            ⚠ Available but low context on key projects
          </div>
        )}

        {/* Context bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {member.project_contexts.slice(0, 3).map(ctx => (
            <div key={ctx.project_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--dv-text-muted)', width: 72, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctx.project_name}</span>
              <div style={{ flex: 1 }}>
                <DvProgressBar value={ctx.context_score} max={100}
                  variant={ctx.context_score >= 70 ? 'recommended' : ctx.context_score >= 40 ? 'warning' : 'danger'} />
              </div>
              <DvBadge variant={contextLabelToVariant(ctx.context_label)} size="sm" style={{ flexShrink: 0, minWidth: 42, justifyContent: 'center' }}>
                {ctx.context_label}
              </DvBadge>
            </div>
          ))}
        </div>
      </DvCard>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIBILITY COVERAGE
// ─────────────────────────────────────────────────────────────────────────────
const COVERAGE_PALETTE = {
  STRONG:   { bg: 'var(--dv-success-subtle)',  border: 'var(--dv-success-border)',  text: 'var(--dv-success)',  stripe: 'var(--dv-success)' },
  PARTIAL:  { bg: 'var(--dv-warning-subtle)', border: 'var(--dv-warning-border)', text: 'var(--dv-warning)', stripe: 'var(--dv-warning)' },
  FRAGILE:  { bg: 'var(--dv-danger-subtle)',  border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)',  stripe: 'var(--dv-danger)' },
  CRITICAL: { bg: 'var(--dv-danger-subtle)',  border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)',  stripe: 'var(--dv-danger)' },
};

function ResponsibilityCard({ resp, onViewEvidence }) {
  const pal = COVERAGE_PALETTE[resp.coverage] ?? COVERAGE_PALETTE.PARTIAL;
  const isCritical = resp.coverage === 'CRITICAL' || resp.coverage === 'FRAGILE';

  return (
    <motion.div variants={fadeUp}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 'var(--dv-radius-lg)', border: `1px solid ${pal.border}`,
        background: pal.bg, padding: '14px 16px',
      }}>
        {/* Coverage stripe */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: pal.stripe }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{resp.title}</span>
              <DvBadge variant={coverageToVariant(resp.coverage)} size="sm">{resp.coverage}</DvBadge>
              <span style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginLeft: 'auto' }}>{resp.project_name}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', lineHeight: 1.5 }}>
              Owner: <strong style={{ color: 'var(--dv-text-secondary)' }}>{resp.owner}</strong>
              {'  ·  '}
              Backup: <strong style={{ color: resp.backup ? 'var(--dv-text-secondary)' : 'var(--dv-danger)' }}>
                {resp.backup ?? 'None'}
              </strong>
              {resp.backup && (
                <span style={{ color: 'var(--dv-text-faint)' }}> ({resp.backup_context}% context)</span>
              )}
              {'  ·  '}
              <span style={{ color: resp.dependency_count > 0 ? pal.text : 'var(--dv-text-faint)' }}>
                {resp.dependency_count} downstream
              </span>
            </div>
          </div>
          <button
            onClick={() => onViewEvidence?.(resp)}
            style={{
              background: 'none', border: `1px solid ${pal.border}`, borderRadius: 'var(--dv-radius-sm)',
              color: pal.text, fontSize: 9, padding: '3px 8px', cursor: 'pointer', flexShrink: 0,
              fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.05em',
            }}
          >
            EVIDENCE
          </button>
        </div>

        {/* Risk signal */}
        {isCritical && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 10, color: 'var(--dv-danger)', fontStyle: 'italic',
          }}>
            <AlertTriangle size={11} />
            {resp.backup ? `Backup context is low (${resp.backup_context}%)` : 'No qualified backup — single point of failure'}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPENDENCY CHAIN
// ─────────────────────────────────────────────────────────────────────────────
function DependencyChain({ dependencies, projectFilter }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING ANALYSIS PANEL
// ─────────────────────────────────────────────────────────────────────────────
function EngineeringAnalysisPanel({ decisionPoints, responsibilities, onViewDecisionPoints }) {
  const criticalResps = responsibilities?.filter(r => r.coverage === 'CRITICAL' || r.coverage === 'FRAGILE') || [];
  const noBackup = responsibilities?.filter(r => !r.backup) || [];
  const dpCount = decisionPoints?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DvCard style={{ padding: '20px 24px', borderColor: 'var(--dv-accent-border)', background: 'var(--dv-accent-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Brain size={14} color="var(--dv-accent)" />
          <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dv-accent)' }}>
            Engineering Analysis
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {dpCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Zap size={14} color="var(--dv-danger)" />
              <span><strong>{dpCount}</strong> decision point{dpCount > 1 ? 's' : ''} identified</span>
            </div>
          )}
          {criticalResps.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Users size={14} color="var(--dv-warning)" />
              <span><strong>{criticalResps.length}</strong> critical ownership concentration{criticalResps.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {noBackup.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Shield size={14} color="var(--dv-warning)" />
              <span><strong>{noBackup.length}</strong> responsibilit{noBackup.length > 1 ? 'ies' : 'y'} without qualified backup</span>
            </div>
          )}
          {dpCount === 0 && criticalResps.length === 0 && noBackup.length === 0 && (
            <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
              No critical risks identified.
            </div>
          )}
        </div>

        {dpCount > 0 && (
          <DvButton
             variant="outline"
             size="sm"
             style={{ width: '100%', borderColor: 'var(--dv-accent)', color: 'var(--dv-text-primary)' }}
             onClick={onViewDecisionPoints}
          >
             VIEW DECISION POINTS
          </DvButton>
        )}
      </DvCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT INTELLIGENCE PANEL
// ─────────────────────────────────────────────────────────────────────────────
function ProjectIntelligencePanel({ projects, dependencies, responsibilities, onSelectProject }) {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? null);
  const activeProject = projects.find(p => p.id === selectedProject);

  return (
    <div>
      {/* Project tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => { setSelectedProject(p.id); onSelectProject?.(p); }}
            style={{
              padding: '6px 14px', borderRadius: 'var(--dv-radius-md)', cursor: 'pointer',
              border: `1px solid ${selectedProject === p.id ? 'var(--dv-border-strong)' : 'var(--dv-border-subtle)'}`,
              background: selectedProject === p.id ? 'var(--dv-bg-overlay)' : 'var(--dv-bg-surface)',
              color: selectedProject === p.id ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)',
              fontSize: 'var(--dv-text-xs)', fontWeight: 600, transition: 'all 0.12s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: HEALTH_COLORS[p.health] ?? 'var(--dv-text-faint)', flexShrink: 0,
            }} />
            {p.name}
          </button>
        ))}
      </div>

      {activeProject && (
        <motion.div key={activeProject.id} variants={scaleIn} initial="hidden" animate="visible">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Left: signals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DvCard style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-block', width: 3, height: 28,
                    background: HEALTH_COLORS[activeProject.health] ?? 'var(--dv-border-default)',
                    borderRadius: 2,
                  }} />
                  <div>
                    <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{activeProject.name}</div>
                    <DvBadge variant={healthToVariant(activeProject.health)} dot size="sm">{activeProject.health}</DvBadge>
                  </div>
                </div>
                <DvProgressBar value={activeProject.progress} max={100}
                  variant={activeProject.health === 'HIGH' || activeProject.health === 'CRITICAL' ? 'danger' : activeProject.health === 'MEDIUM' ? 'warning' : 'recommended'} />
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                  {[
                    { label: 'Active',   value: activeProject.active_tasks,   color: 'var(--dv-text-primary)' },
                    { label: 'Blocked',  value: activeProject.blocked_tasks,   color: activeProject.blocked_tasks > 0 ? 'var(--dv-danger)' : 'var(--dv-text-muted)' },
                    { label: 'Critical', value: activeProject.critical_tasks,  color: activeProject.critical_tasks > 0 ? 'var(--dv-warning)' : 'var(--dv-text-muted)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '8px 4px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-sm)', border: '1px solid var(--dv-border-subtle)' }}>
                      <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color }}>{value}</div>
                    </div>
                  ))}
                </div>
              </DvCard>

              {/* Knowledge concentration */}
              <DvCard style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Knowledge Concentration</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DvAvatar name={activeProject.knowledge_concentration} size={28} />
                  <div>
                    <div style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{activeProject.knowledge_concentration}</div>
                    <div style={{ fontSize: 9, color: 'var(--dv-warning)' }}>Highest context owner</div>
                  </div>
                  <AlertTriangle size={13} color="var(--dv-warning)" style={{ marginLeft: 'auto' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: 'var(--dv-text-faint)', lineHeight: 1.4 }}>
                  Single-point knowledge concentration — context transfer risk if unavailable
                </div>
              </DvCard>
            </div>

            {/* Right: dependency chain */}
            <div>
              <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dependency Chain</div>
              {dependencies === null ? (
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                  NOT AVAILABLE FROM CURRENT WORKSPACE DATA
                </div>
              ) : (
                <DependencyChain dependencies={dependencies} projectFilter={activeProject.name} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE DRAWER (for responsibility coverage)
// ─────────────────────────────────────────────────────────────────────────────
function EvidenceDrawer({ resp, onClose }) {
  if (!resp) return null;
  return (
    <AnimatePresence>
      <motion.div
        variants={panelEnter} initial="hidden" animate="visible" exit="exit"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '50vh',
          background: 'var(--dv-bg-canvas)', borderTop: '1px solid var(--dv-border-default)',
          zIndex: 300, overflowY: 'auto', padding: '20px 40px',
        }}
        role="dialog" aria-label="Evidence"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Eye size={14} color="var(--dv-accent)" />
          <span style={{ fontFamily: 'var(--dv-font-mono)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dv-accent)' }}>
            EVIDENCE — {resp.title}
          </span>
          <DvBadge variant={coverageToVariant(resp.coverage)} size="sm" style={{ marginLeft: 6 }}>{resp.coverage}</DvBadge>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dv-text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Observation', value: `${resp.owner} owns ${resp.title}`,    prov: 'REAL_DB' },
            { label: 'Backup',      value: resp.backup ?? 'None',                prov: 'DERIVED' },
            { label: 'Backup Context', value: resp.backup ? `${resp.backup_context}%` : 'N/A', prov: 'DERIVED' },
            { label: 'Downstream',  value: `${resp.dependency_count} tasks`,     prov: 'SYNTHETIC_DEMO' },
          ].map(ev => (
            <div key={ev.label} style={{ padding: '12px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
              <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{ev.label}</div>
              <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-text-primary)', marginBottom: 6 }}>{ev.value}</div>
              <ProvenancePip prov={ev.prov} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)' }}>REAL</span> = directly read from DB ·
          <span style={{ color: 'var(--dv-predicted)', fontFamily: 'var(--dv-font-mono)' }}> DERIVED</span> = computed from DB values ·
          <span style={{ color: 'var(--dv-warning)', fontFamily: 'var(--dv-font-mono)' }}> DEMO</span> = controlled fixture, not from production data
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function OrganizationIntelligence() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/intelligence/demo') ? '/intelligence/demo' : '/dashboard/intelligence';
  
  const [mode, setMode] = useState('LIVE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [evidenceResp, setEvidenceResp] = useState(null);
  const [depProjectFilter, setDepProjectFilter] = useState(null);

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

  // Build graph node selectors
  const handleSelectNode = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const sortedMembers = useMemo(() =>
    data?.members ? [...data.members].sort((a, b) => b.capacity_pct - a.capacity_pct) : [], [data?.members]);

  if (loading && !data) {
    return <div style={{ padding: 40, color: 'var(--dv-text-secondary)' }}>Loading organization state...</div>;
  }
  if (!data) return null;

  const { organization: org, members, projects, responsibilities, dependencies,
          decisionPoints, systemStatus } = data;

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

      {/* ── Context Summary Bar ─────────────────────────────── */}
      <div style={{ padding: '16px 40px', borderBottom: '1px solid var(--dv-border-subtle)', background: 'var(--dv-bg-surface)' }}>
        <motion.div variants={staggerChildren} initial="hidden" animate="visible"
          style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {[
            { label: 'Members',        value: org.member_count,        icon: Users,      color: 'var(--dv-text-primary)' },
            { label: 'Projects',       value: org.project_count,       icon: Layers,     color: 'var(--dv-accent)' },
            { label: 'Active Tasks',   value: org.active_task_count,   icon: Activity,   color: 'var(--dv-text-primary)' },
            { label: 'Dependencies',   value: org.dependency_count,    icon: Link2,      color: 'var(--dv-warning)' },
            { label: 'Decision Points',value: org.decision_point_count,icon: Zap,        color: org.decision_point_count > 0 ? 'var(--dv-danger)' : 'var(--dv-text-muted)' },
          ].map(({ label, value, icon: Icon, color }, i, arr) => (
            <motion.div key={label} variants={fadeUp}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 20px',
                borderRight: i < arr.length - 1 ? '1px solid var(--dv-border-subtle)' : 'none',
              }}>
              <Icon size={14} color="var(--dv-text-faint)" />
              <div>
                <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color, lineHeight: 1 }}>{value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Page Content ────────────────────────────────────── */}
      <div style={{ padding: '28px 40px', maxWidth: 1440, margin: '0 auto' }}>
        <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── Section A+E: Engineering Graph + Agent Analysis ── */}
          <motion.div variants={fadeUp}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
              <div>
                <SectionLabel label="Engineering Graph" icon={GitBranch}
                  right={<span style={{ fontSize: 10, color: 'var(--dv-text-faint)' }}>Click any node to inspect</span>} />
                <EngineeringGraph
                  members={members}
                  projects={projects}
                  decisionPoints={decisionPoints}
                  onSelectNode={handleSelectNode}
                />
              </div>
              <div style={{ position: 'sticky', top: 160 }}>
                <SectionLabel label="Engineering Analysis" icon={Brain} />
                <EngineeringAnalysisPanel
                  decisionPoints={decisionPoints}
                  responsibilities={responsibilities}
                  onViewDecisionPoints={() => {
                    const dpEl = document.getElementById('decision-concentration');
                    if (dpEl) {
                      dpEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* ── Section C: Member Intelligence ── */}
          <motion.div variants={fadeUp}>
            <SectionLabel
              label="Member Intelligence"
              icon={Users}
              right={
                <span style={{ fontSize: 10, color: 'var(--dv-warning)', fontStyle: 'italic' }}>
                  Available ≠ Ready to absorb work
                </span>
              }
            />
            <motion.div variants={staggerChildren} initial="hidden" animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {sortedMembers.map(member => (
                <MemberIntelligenceCard
                  key={member.id}
                  member={member}
                  responsibilities={responsibilities}
                  onClick={() => handleSelectNode({ id: `mem-${member.id}`, type: 'member', payload: member, label: member.name })}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* ── Section D: Project Intelligence ── */}
          <motion.div variants={fadeUp}>
            <SectionLabel label="Project Intelligence" icon={Layers} />
            <DvCard style={{ padding: '20px' }}>
              <ProjectIntelligencePanel
                projects={projects}
                dependencies={dependencies}
                responsibilities={responsibilities}
                onSelectProject={p => setDepProjectFilter(p.name)}
              />
            </DvCard>
          </motion.div>

          {/* ── Responsibility Coverage ── */}
          <motion.div variants={fadeUp}>
            <SectionLabel
              label="Responsibility Coverage"
              icon={Shield}
              right={
                <div style={{ display: 'flex', gap: 8 }}>
                  {['STRONG', 'PARTIAL', 'FRAGILE', 'CRITICAL'].map(cov => (
                    <div key={cov} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 1, background: COVERAGE_PALETTE[cov]?.stripe ?? 'var(--dv-border-default)', flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)' }}>{cov}</span>
                    </div>
                  ))}
                </div>
              }
            />
            {responsibilities === null ? (
              <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                NOT AVAILABLE FROM CURRENT WORKSPACE DATA
              </div>
            ) : (
              <motion.div variants={staggerChildren} initial="hidden" animate="visible"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {responsibilities.map(resp => (
                  <ResponsibilityCard key={resp.id} resp={resp} onViewEvidence={r => setEvidenceResp(r)} />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* ── Dependency Intelligence ── */}
          <motion.div variants={fadeUp}>
            <SectionLabel label="Dependency Intelligence" icon={Link2}
              right={<span style={{ fontSize: 10, color: 'var(--dv-text-faint)' }}>Observational only</span>} />
            <DvCard style={{ padding: '16px 20px' }}>
              {dependencies === null ? (
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                  NOT AVAILABLE FROM CURRENT WORKSPACE DATA
                </div>
              ) : (
                <>
              <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setDepProjectFilter(null)}
                  style={{
                    padding: '4px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--dv-radius-sm)',
                    border: `1px solid ${!depProjectFilter ? 'var(--dv-border-strong)' : 'var(--dv-border-subtle)'}`,
                    background: !depProjectFilter ? 'var(--dv-bg-elevated)' : 'transparent',
                    color: !depProjectFilter ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)',
                  }}>
                  All
                </button>
                {projects.map(p => (
                  <button key={p.id}
                    onClick={() => setDepProjectFilter(p.name)}
                    style={{
                      padding: '4px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--dv-radius-sm)',
                      border: `1px solid ${depProjectFilter === p.name ? 'var(--dv-border-strong)' : 'var(--dv-border-subtle)'}`,
                      background: depProjectFilter === p.name ? 'var(--dv-bg-elevated)' : 'transparent',
                      color: depProjectFilter === p.name ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)',
                    }}>
                    {p.name}
                  </button>
                ))}
              </div>
              <DependencyChain dependencies={dependencies} projectFilter={depProjectFilter} />
                </>
              )}
            </DvCard>
          </motion.div>

          {/* ── Decision Concentration ── */}
          <motion.div variants={fadeUp}>
            <SectionLabel id="decision-concentration" label="Decision Concentration" icon={AlertTriangle} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {decisionPoints.map(dp => {
                const affectedMember = members.find(m => m.name === dp.affected_member);
                return (
                  <DvCard key={dp.id} style={{
                    padding: '16px', borderColor: dp.severity === 'CRITICAL' ? 'var(--dv-danger-border)' : 'var(--dv-warning-border)',
                    background: dp.severity === 'CRITICAL' ? 'var(--dv-danger-subtle)' : 'var(--dv-warning-subtle)',
                    position: 'relative', overflow: 'hidden', cursor: 'pointer'
                  }} onClick={() => navigate(`${prefix}/decision/${dp.id}`)}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: dp.severity === 'CRITICAL' ? 'var(--dv-danger)' : 'var(--dv-warning)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <DvBadge variant={dp.severity === 'CRITICAL' ? 'danger' : 'warning'} dot size="sm">{dp.severity}</DvBadge>
                      <span style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>{dp.affected_project}</span>
                    </div>
                    <div style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 600, color: 'var(--dv-text-primary)', marginBottom: 6, lineHeight: 1.4 }}>{dp.trigger}</div>
                    <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{dp.impact}</div>
                    {dp.evidence && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {dp.evidence.map((ev, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', background: 'rgba(0,0,0,0.15)', borderRadius: 3 }}>
                            <span style={{ fontSize: 9, color: 'var(--dv-text-muted)' }}>{ev.label}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-secondary)' }}>{ev.value}</span>
                            
                          </div>
                        ))}
                      </div>
                    )}
                  </DvCard>
                );
              })}
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* ── Context Inspector overlay ── */}
      <AnimatePresence>
        {selectedNode && (
          <ContextInspector
            key={selectedNode.id}
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            members={members}
            projects={projects}
            responsibilities={responsibilities}
          />
        )}
      </AnimatePresence>

      {/* ── Evidence drawer ── */}
      <AnimatePresence>
        {evidenceResp && (
          <EvidenceDrawer
            resp={evidenceResp}
            onClose={() => setEvidenceResp(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
