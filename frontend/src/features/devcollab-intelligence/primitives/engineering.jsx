/**
 * DevCollab Intelligence — Engineering Intelligence Primitives
 * Visual components for domain-specific engineering signals.
 * Visual only — no business logic.
 */

import { DvBadge, DvProgressBar, DvProgressRing, DvTooltip } from './core';

// ── DvMemberStatus ────────────────────────────────────────────────────────
export function DvMemberStatus({ name, role, status = 'available', avatar, className = '' }) {
  const statusClass = {
    available:   'dv-member-status-available',
    busy:        'dv-member-status-busy',
    overloaded:  'dv-member-status-overloaded',
    unavailable: 'dv-member-status-unavailable',
  };
  const statusLabel = {
    available:   'Available',
    busy:        'At Capacity',
    overloaded:  'Overloaded',
    unavailable: 'Unavailable',
  };

  return (
    <div className={`dv-member-status ${className}`}>
      <div className={`dv-member-status-indicator ${statusClass[status] || ''}`} aria-hidden="true" />
      <div className="dv-member-status-info">
        <div className="dv-member-status-name">{name}</div>
        {role && <div className="dv-member-status-role">{role}</div>}
      </div>
      <span className={`dv-member-status-label ${statusClass[status] || ''}`}>
        {statusLabel[status] || status}
      </span>
    </div>
  );
}

// ── DvCapacityBar ────────────────────────────────────────────────────────
export function DvCapacityBar({ value = 0, max = 100, label, className = '' }) {
  const variant =
    value >= 90 ? 'danger' :
    value >= 70 ? 'warning' :
    'recommended';
  return (
    <div className={`dv-capacity-bar ${className}`}>
      {label && <div className="dv-capacity-bar-label">{label}</div>}
      <div className="dv-capacity-bar-track-wrapper">
        <DvProgressBar value={value} max={max} variant={variant} label={`Capacity: ${value}%`} />
        <span className="dv-capacity-bar-value">{value}%</span>
      </div>
    </div>
  );
}

// ── DvWorkloadIndicator ───────────────────────────────────────────────────
export function DvWorkloadIndicator({ tasks = 0, maxTasks = 10, className = '' }) {
  return (
    <div className={`dv-workload ${className}`} aria-label={`${tasks} of ${maxTasks} tasks`}>
      {Array.from({ length: maxTasks }).map((_, i) => (
        <div key={i} className={`dv-workload-pip ${i < tasks ? 'dv-workload-pip-filled' : ''}`} />
      ))}
    </div>
  );
}

// ── DvContextIndicator ────────────────────────────────────────────────────
export function DvContextIndicator({ value = 0, label = 'Context', className = '' }) {
  const variant =
    value >= 80 ? 'recommended' :
    value >= 50 ? 'warning' :
    'danger';
  return (
    <div className={`dv-context-indicator ${className}`}>
      <DvProgressRing value={value} max={100} size={36} stroke={3} variant={variant} />
      <div className="dv-context-indicator-info">
        <div className="dv-context-indicator-label">{label}</div>
        <div className="dv-context-indicator-value">{value}%</div>
      </div>
    </div>
  );
}

// ── DvOwnershipIndicator ──────────────────────────────────────────────────
export function DvOwnershipIndicator({ hasOwner, ownerName, className = '' }) {
  return (
    <div className={`dv-ownership ${className}`}>
      <div className={`dv-ownership-dot ${hasOwner ? 'dv-ownership-dot-owned' : 'dv-ownership-dot-unowned'}`} aria-hidden="true" />
      <span className="dv-ownership-label">
        {hasOwner ? ownerName || 'Owned' : 'Unowned'}
      </span>
    </div>
  );
}

// ── DvDependencyIndicator ─────────────────────────────────────────────────
export function DvDependencyIndicator({ count = 0, blockedBy = 0, className = '' }) {
  return (
    <div className={`dv-dependency ${className}`} aria-label={`${count} dependencies, ${blockedBy} blocking`}>
      <span className="dv-dependency-total">{count} deps</span>
      {blockedBy > 0 && (
        <span className="dv-dependency-blocked">{blockedBy} blocking</span>
      )}
    </div>
  );
}

// ── DvRiskIndicator ───────────────────────────────────────────────────────
export function DvRiskIndicator({ level = 'low', label, className = '' }) {
  const riskMap = {
    low:      { class: 'dv-risk-low',      label: label || 'Low Risk'      },
    medium:   { class: 'dv-risk-medium',   label: label || 'Medium Risk'   },
    high:     { class: 'dv-risk-high',     label: label || 'High Risk'     },
    critical: { class: 'dv-risk-critical', label: label || 'Critical Risk' },
  };
  const r = riskMap[level] || riskMap.low;
  return (
    <div className={`dv-risk ${r.class} ${className}`} role="status" aria-label={r.label}>
      <div className="dv-risk-dot" aria-hidden="true" />
      <span className="dv-risk-label">{r.label}</span>
    </div>
  );
}

// ── DvResponsibilityIndicator ─────────────────────────────────────────────
export function DvResponsibilityIndicator({ coverage = 0, className = '' }) {
  const variant =
    coverage >= 80 ? 'good' :
    coverage >= 50 ? 'partial' :
    'gap';
  const label =
    variant === 'good'    ? 'Covered'       :
    variant === 'partial' ? 'Partial'       :
                            'Gap Detected';
  return (
    <div className={`dv-responsibility dv-responsibility-${variant} ${className}`}>
      {label} ({coverage}%)
    </div>
  );
}

// ── DvDecisionPointBadge ──────────────────────────────────────────────────
export function DvDecisionPointBadge({ active = false, label = 'Decision Point', className = '' }) {
  return (
    <div className={`dv-decision-badge ${active ? 'dv-decision-badge-active' : ''} ${className}`}>
      <div className="dv-decision-badge-dot" aria-hidden="true" />
      {label}
    </div>
  );
}

// ── DvInterventionBadge ───────────────────────────────────────────────────
export function DvInterventionBadge({ type, className = '' }) {
  const typeMap = {
    REASSIGN:          { label: 'Reassign',         class: 'dv-intervention-reassign'  },
    PAIR:              { label: 'Pair Engineer',     class: 'dv-intervention-pair'      },
    KNOWLEDGE_TRANSFER:{ label: 'Knowledge Transfer', class: 'dv-intervention-kt'      },
    ESCALATE:          { label: 'Escalate',          class: 'dv-intervention-escalate'  },
  };
  const t = typeMap[type] || { label: type, class: '' };
  return (
    <span className={`dv-intervention-badge ${t.class} ${className}`}>{t.label}</span>
  );
}

// ── DvPredictionMetric ────────────────────────────────────────────────────
export function DvPredictionMetric({ label, value, unit, provenance = 'REAL_DB', className = '' }) {
  const provClass = {
    REAL_DB:       'dv-provenance-real',
    DERIVED:       'dv-provenance-derived',
    SYNTHETIC_DEMO:'dv-provenance-synthetic',
  };
  const provLabel = {
    REAL_DB:       'Real',
    DERIVED:       'Derived',
    SYNTHETIC_DEMO:'Demo',
  };
  return (
    <div className={`dv-prediction-metric ${className}`}>
      <div className="dv-prediction-metric-label">{label}</div>
      <div className="dv-prediction-metric-value">
        <span className="dv-mono">{value}</span>
        {unit && <span className="dv-prediction-metric-unit"> {unit}</span>}
      </div>
      <span className={`dv-provenance ${provClass[provenance] || ''}`} aria-label={`Source: ${provLabel[provenance]}`}>
        {provLabel[provenance] || provenance}
      </span>
    </div>
  );
}

// ── DvEvidenceItem ────────────────────────────────────────────────────────
export function DvEvidenceItem({ label, value, provenance = 'REAL_DB', className = '' }) {
  const provClass = {
    REAL_DB:       'dv-provenance-real',
    DERIVED:       'dv-provenance-derived',
    SYNTHETIC_DEMO:'dv-provenance-synthetic',
  };
  const provLabel = { REAL_DB: 'Real', DERIVED: 'Derived', SYNTHETIC_DEMO: 'Demo' };
  return (
    <div className={`dv-evidence-item ${className}`}>
      <span className="dv-evidence-label">{label}</span>
      <span className="dv-evidence-value">{value}</span>
      <span className={`dv-provenance ${provClass[provenance] || ''}`}>{provLabel[provenance] || provenance}</span>
    </div>
  );
}

// ── DvEventItem ───────────────────────────────────────────────────────────
export function DvEventItem({ type, label, timestamp, status, className = '' }) {
  return (
    <div className={`dv-event-item ${className}`}>
      <div className="dv-event-type dv-mono">{type}</div>
      <div className="dv-event-label">{label}</div>
      {timestamp && <div className="dv-event-timestamp dv-mono">{timestamp}</div>}
      {status && <div className={`dv-event-status dv-event-status-${status}`}>{status}</div>}
    </div>
  );
}
