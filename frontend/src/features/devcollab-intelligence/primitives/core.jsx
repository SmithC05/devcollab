/**
 * DevCollab Intelligence — Core UI Primitives
 * Prefixed with "Dv" to avoid collision with existing app components.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, fadeUp, scaleIn, staggerChildren } from '../motion/presets';
import '../styles/tokens.css';

// ── DvButton ─────────────────────────────────────────────────────────────
export function DvButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  type = 'button',
  ...rest
}) {
  const variants = {
    primary:  'dv-btn-primary',
    ghost:    'dv-btn-ghost',
    outline:  'dv-btn-outline',
    danger:   'dv-btn-danger',
    success:  'dv-btn-success',
  };
  const sizes = { sm: 'dv-btn-sm', md: 'dv-btn-md', lg: 'dv-btn-lg' };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`dv-btn ${variants[variant] || ''} ${sizes[size] || ''} ${className}`}
      aria-disabled={disabled}
      {...rest}
    >
      {Icon && <Icon size={14} className="dv-btn-icon" aria-hidden="true" />}
      {children}
    </button>
  );
}

// ── DvIconButton ──────────────────────────────────────────────────────────
export function DvIconButton({ icon: Icon, label, onClick, size = 'md', variant = 'ghost', disabled = false, className = '' }) {
  const sizes = { sm: 28, md: 32, lg: 36 };
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`dv-icon-btn dv-btn-${variant} ${className}`}
      style={{ width: sizes[size], height: sizes[size] }}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} aria-hidden="true" />}
    </button>
  );
}

// ── DvCard ────────────────────────────────────────────────────────────────
export function DvCard({ children, className = '', elevated = false, onClick, role, tabIndex }) {
  return (
    <div
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      className={`dv-card ${elevated ? 'dv-card-elevated' : ''} ${onClick ? 'dv-card-interactive' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ── DvPanel ───────────────────────────────────────────────────────────────
export function DvPanel({ children, className = '', title, titleRight, noPad = false }) {
  return (
    <div className={`dv-panel ${className}`}>
      {title && (
        <div className="dv-panel-header">
          <span className="dv-panel-title">{title}</span>
          {titleRight && <div className="dv-panel-title-right">{titleRight}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'dv-panel-body'}>{children}</div>
    </div>
  );
}

// ── DvStack ───────────────────────────────────────────────────────────────
export function DvStack({ children, gap = 3, horizontal = false, align = 'start', className = '' }) {
  return (
    <div
      className={`dv-stack ${className}`}
      style={{
        display:        'flex',
        flexDirection:  horizontal ? 'row' : 'column',
        gap:            `calc(var(--dv-space-1) * ${gap})`,
        alignItems:     horizontal ? align : 'stretch',
      }}
    >
      {children}
    </div>
  );
}

// ── DvGrid ────────────────────────────────────────────────────────────────
export function DvGrid({ children, cols = 2, gap = 4, className = '' }) {
  return (
    <div
      className={`dv-grid ${className}`}
      style={{
        display:             'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap:                 `calc(var(--dv-space-1) * ${gap})`,
      }}
    >
      {children}
    </div>
  );
}

// ── DvBadge ───────────────────────────────────────────────────────────────
export function DvBadge({ children, variant = 'default', size = 'md', dot = false, className = '' }) {
  return (
    <span className={`dv-badge dv-badge-${variant} dv-badge-${size} ${className}`} aria-label={typeof children === 'string' ? children : undefined}>
      {dot && <span className="dv-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

// ── DvStatusBadge ─────────────────────────────────────────────────────────
const STATUS_MAP = {
  OBSERVED:    { label: 'Observed',    variant: 'observed'    },
  ANALYZING:   { label: 'Analyzing',   variant: 'analyzing'   },
  PREDICTED:   { label: 'Predicted',   variant: 'predicted'   },
  SIMULATED:   { label: 'Simulated',   variant: 'simulated'   },
  RECOMMENDED: { label: 'Recommended', variant: 'recommended' },
  APPROVED:    { label: 'Approved',    variant: 'approved'    },
  EXECUTED:    { label: 'Executed',    variant: 'executed'    },
  IDLE:        { label: 'Idle',        variant: 'muted'       },
  WAITING:     { label: 'Waiting',     variant: 'warning'     },
  FAILED:      { label: 'Failed',      variant: 'danger'      },
};

export function DvStatusBadge({ status, label: overrideLabel, className = '' }) {
  const def = STATUS_MAP[status] || { label: status, variant: 'default' };
  return (
    <DvBadge variant={def.variant} dot className={className}>
      {overrideLabel || def.label}
    </DvBadge>
  );
}

// ── DvMetric ─────────────────────────────────────────────────────────────
export function DvMetric({ label, value, unit, delta, deltaPositive, className = '' }) {
  return (
    <div className={`dv-metric ${className}`}>
      <div className="dv-metric-label">{label}</div>
      <div className="dv-metric-value">
        <span className="dv-metric-number">{value}</span>
        {unit && <span className="dv-metric-unit">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={`dv-metric-delta ${deltaPositive ? 'dv-metric-delta-pos' : 'dv-metric-delta-neg'}`}>
          {deltaPositive ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  );
}

// ── DvMetricCard ─────────────────────────────────────────────────────────
export function DvMetricCard({ label, value, unit, sub, status, icon: Icon, className = '' }) {
  return (
    <DvCard className={`dv-metric-card ${className}`}>
      <div className="dv-metric-card-header">
        {Icon && <Icon size={14} className="dv-metric-card-icon" aria-hidden="true" />}
        <span className="dv-metric-card-label">{label}</span>
        {status && <DvStatusBadge status={status} />}
      </div>
      <div className="dv-metric-card-value">
        {value}
        {unit && <span className="dv-metric-card-unit">{unit}</span>}
      </div>
      {sub && <div className="dv-metric-card-sub">{sub}</div>}
    </DvCard>
  );
}

// ── DvAvatar ─────────────────────────────────────────────────────────────
export function DvAvatar({ name = '', size = 32, src, className = '' }) {
  const initials = name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
  if (src) {
    return <img src={src} alt={name} className={`dv-avatar ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <div
      className={`dv-avatar dv-avatar-placeholder ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  );
}

// ── DvAvatarStack ────────────────────────────────────────────────────────
export function DvAvatarStack({ names = [], max = 3, size = 24 }) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;
  return (
    <div className="dv-avatar-stack" role="list" aria-label={`${names.length} members`}>
      {visible.map((n, i) => (
        <div key={i} style={{ zIndex: max - i }} role="listitem">
          <DvAvatar name={n} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className="dv-avatar-overflow" style={{ width: size, height: size, fontSize: size * 0.36 }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ── DvDivider ─────────────────────────────────────────────────────────────
export function DvDivider({ vertical = false, label, className = '' }) {
  if (label) {
    return (
      <div className={`dv-divider-labeled ${className}`}>
        <div className="dv-divider-line" />
        <span className="dv-divider-label">{label}</span>
        <div className="dv-divider-line" />
      </div>
    );
  }
  return <div className={`dv-divider ${vertical ? 'dv-divider-vertical' : ''} ${className}`} role="separator" />;
}

// ── DvProgressBar ─────────────────────────────────────────────────────────
export function DvProgressBar({ value = 0, max = 100, variant = 'accent', label, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`dv-progress ${className}`} role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-label={label}>
      <div className={`dv-progress-track`}>
        <motion.div
          className={`dv-progress-fill dv-progress-fill-${variant}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ── DvProgressRing ────────────────────────────────────────────────────────
export function DvProgressRing({ value = 0, max = 100, size = 40, stroke = 3, variant = 'accent', className = '' }) {
  const radius = (size - stroke * 2) / 2;
  const circ   = 2 * Math.PI * radius;
  const pct    = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} className={`dv-progress-ring ${className}`} role="img" aria-label={`${pct.toFixed(0)}%`}>
      <circle cx={size/2} cy={size/2} r={radius} strokeWidth={stroke} className="dv-progress-ring-track" />
      <motion.circle
        cx={size/2} cy={size/2} r={radius} strokeWidth={stroke}
        className={`dv-progress-ring-fill dv-progress-ring-fill-${variant}`}
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        fill="none"
      />
    </svg>
  );
}

// ── DvSkeleton ───────────────────────────────────────────────────────────
export function DvSkeleton({ width, height = 14, rounded = false, className = '' }) {
  return (
    <div
      className={`dv-skeleton ${rounded ? 'dv-skeleton-rounded' : ''} ${className}`}
      style={{ width: width || '100%', height }}
      role="status"
      aria-label="Loading..."
    />
  );
}

// ── DvEmptyState ─────────────────────────────────────────────────────────
export function DvEmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`dv-empty-state ${className}`} role="status">
      {Icon && <Icon size={28} className="dv-empty-state-icon" aria-hidden="true" />}
      <div className="dv-empty-state-title">{title}</div>
      {description && <div className="dv-empty-state-description">{description}</div>}
      {action && <div className="dv-empty-state-action">{action}</div>}
    </div>
  );
}

// ── DvErrorState ─────────────────────────────────────────────────────────
export function DvErrorState({ title = 'Something went wrong', description, retry, className = '' }) {
  return (
    <div className={`dv-error-state ${className}`} role="alert">
      <div className="dv-error-state-title">{title}</div>
      {description && <div className="dv-error-state-description">{description}</div>}
      {retry && <DvButton variant="outline" size="sm" onClick={retry}>Try again</DvButton>}
    </div>
  );
}

// ── DvTabs ────────────────────────────────────────────────────────────────
export function DvTabs({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={`dv-tabs ${className}`} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange?.(tab.id)}
          className={`dv-tab ${active === tab.id ? 'dv-tab-active' : ''}`}
        >
          {tab.icon && <tab.icon size={13} aria-hidden="true" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className="dv-tab-count">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── DvTooltip ────────────────────────────────────────────────────────────
export function DvTooltip({ children, content, className = '' }) {
  return (
    <div className={`dv-tooltip-wrapper ${className}`} data-tooltip={content}>
      {children}
    </div>
  );
}
