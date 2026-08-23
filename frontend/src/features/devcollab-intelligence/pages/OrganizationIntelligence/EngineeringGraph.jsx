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

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function EngineeringGraph({ members, projects, decisionPoints, onSelectNode }) {
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

function InspectorRow({ label, value, prov, rationale }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--dv-border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: rationale ? 4 : 0 }}>
        <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>{value}</span>
          {prov && <ProvenancePip prov={prov} />}
        </div>
      </div>
      {rationale && (
        <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', lineHeight: 1.4 }}>
          {rationale}
        </div>
      )}
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

