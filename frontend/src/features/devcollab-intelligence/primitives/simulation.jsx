/**
 * DevCollab Intelligence — Simulation Primitives
 * Visual components for "what-if" analysis.
 * Clearly distinguishes OBSERVED vs SIMULATED state.
 * No logic, no API calls — visual only.
 */

import { DvCard, DvBadge, DvStatusBadge, DvMetric, DvDivider } from './core';

// ── DvScenarioHeader ──────────────────────────────────────────────────────
export function DvScenarioHeader({ title, description, source = 'OBSERVED', className = '' }) {
  return (
    <div className={`dv-scenario-header ${className}`}>
      <DvBadge variant={source === 'SIMULATED' ? 'simulated' : 'observed'}>
        {source}
      </DvBadge>
      <div className="dv-scenario-header-body">
        <div className="dv-scenario-header-title">{title}</div>
        {description && <div className="dv-scenario-header-desc">{description}</div>}
      </div>
    </div>
  );
}

// ── DvScenarioVariable ────────────────────────────────────────────────────
export function DvScenarioVariable({ label, observed, simulated, className = '' }) {
  return (
    <div className={`dv-scenario-variable ${className}`}>
      <div className="dv-scenario-variable-label">{label}</div>
      <div className="dv-scenario-variable-states">
        <div className="dv-scenario-state dv-scenario-state-observed">
          <span className="dv-scenario-state-badge dv-badge dv-badge-observed">Current</span>
          <span className="dv-scenario-state-value">{observed}</span>
        </div>
        <div className="dv-scenario-state-arrow" aria-hidden="true">→</div>
        <div className="dv-scenario-state dv-scenario-state-simulated">
          <span className="dv-scenario-state-badge dv-badge dv-badge-simulated">Scenario</span>
          <span className="dv-scenario-state-value">{simulated}</span>
        </div>
      </div>
    </div>
  );
}

// ── DvScenarioInput ───────────────────────────────────────────────────────
export function DvScenarioInput({ label, value, onChange, unit, placeholder, className = '' }) {
  return (
    <div className={`dv-scenario-input ${className}`}>
      {label && <label className="dv-scenario-input-label">{label}</label>}
      <div className="dv-scenario-input-wrapper">
        <input
          className="dv-scenario-input-field"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
        {unit && <span className="dv-scenario-input-unit">{unit}</span>}
      </div>
    </div>
  );
}

// ── DvSimulationCard ──────────────────────────────────────────────────────
export function DvSimulationCard({ title, source = 'SIMULATED', children, className = '' }) {
  return (
    <DvCard className={`dv-simulation-card ${source === 'SIMULATED' ? 'dv-simulation-card-sim' : 'dv-simulation-card-obs'} ${className}`}>
      <div className="dv-simulation-card-header">
        <DvBadge variant={source === 'SIMULATED' ? 'simulated' : 'observed'}>{source}</DvBadge>
        <span className="dv-simulation-card-title">{title}</span>
      </div>
      {children}
    </DvCard>
  );
}

// ── DvInterventionOption ──────────────────────────────────────────────────
export function DvInterventionOption({
  type,
  label,
  description,
  selected = false,
  onSelect,
  impact,
  recommended = false,
  className = '',
}) {
  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect?.()}
      className={`dv-intervention-option ${selected ? 'dv-intervention-option-selected' : ''} ${recommended ? 'dv-intervention-option-recommended' : ''} ${className}`}
    >
      <div className="dv-intervention-option-header">
        <span className={`dv-intervention-badge dv-intervention-${type?.toLowerCase()}`}>{type}</span>
        {recommended && <span className="dv-badge dv-badge-recommended">Recommended</span>}
      </div>
      <div className="dv-intervention-option-label">{label}</div>
      {description && <div className="dv-intervention-option-desc">{description}</div>}
      {impact && (
        <div className="dv-intervention-option-impact">
          <span className="dv-intervention-option-impact-label">Impact</span>
          <span className="dv-intervention-option-impact-value">{impact}</span>
        </div>
      )}
    </div>
  );
}

// ── DvSimulationMetric ────────────────────────────────────────────────────
export function DvSimulationMetric({ label, before, after, unit, delta, positive = true, className = '' }) {
  return (
    <div className={`dv-simulation-metric ${className}`}>
      <div className="dv-simulation-metric-label">{label}</div>
      <div className="dv-simulation-metric-comparison">
        <span className="dv-simulation-metric-before dv-mono">{before}{unit && ` ${unit}`}</span>
        <span className="dv-simulation-metric-arrow" aria-hidden="true">→</span>
        <span className="dv-simulation-metric-after dv-mono">{after}{unit && ` ${unit}`}</span>
      </div>
      {delta !== undefined && (
        <div className={`dv-simulation-metric-delta ${positive ? 'dv-metric-delta-pos' : 'dv-metric-delta-neg'}`}>
          {positive ? '↓' : '↑'} {delta}{unit && ` ${unit}`}
        </div>
      )}
    </div>
  );
}

// ── DvImpactDelta ─────────────────────────────────────────────────────────
export function DvImpactDelta({ label, value, unit, direction = 'down', className = '' }) {
  const isPositive = direction === 'down'; // "down" = improvement in effort
  return (
    <div className={`dv-impact-delta ${isPositive ? 'dv-impact-positive' : 'dv-impact-negative'} ${className}`}>
      <span className="dv-impact-delta-arrow" aria-hidden="true">{isPositive ? '↓' : '↑'}</span>
      <span className="dv-impact-delta-value dv-mono">{value}</span>
      {unit && <span className="dv-impact-delta-unit">{unit}</span>}
      {label && <span className="dv-impact-delta-label">{label}</span>}
    </div>
  );
}

// ── DvScenarioComparison ──────────────────────────────────────────────────
export function DvScenarioComparison({ observedLabel = 'Current State', simulatedLabel = 'Simulated State', metrics = [], className = '' }) {
  return (
    <div className={`dv-scenario-comparison ${className}`}>
      <div className="dv-scenario-comparison-header">
        <div className="dv-scenario-comparison-col dv-scenario-col-observed">
          <DvBadge variant="observed">{observedLabel}</DvBadge>
        </div>
        <div className="dv-scenario-comparison-col dv-scenario-col-simulated">
          <DvBadge variant="simulated">{simulatedLabel}</DvBadge>
        </div>
      </div>
      <DvDivider />
      {metrics.map((m, i) => (
        <DvSimulationMetric
          key={i}
          label={m.label}
          before={m.before}
          after={m.after}
          unit={m.unit}
          delta={m.delta}
          positive={m.positive}
        />
      ))}
    </div>
  );
}

// ── DvFutureStateIndicator ────────────────────────────────────────────────
export function DvFutureStateIndicator({ timeframe, label, source = 'SIMULATED', className = '' }) {
  return (
    <div className={`dv-future-state ${source === 'SIMULATED' ? 'dv-future-state-sim' : ''} ${className}`}>
      <DvBadge variant={source === 'SIMULATED' ? 'simulated' : 'observed'}>{source}</DvBadge>
      {timeframe && <span className="dv-future-state-timeframe dv-mono">{timeframe}</span>}
      <span className="dv-future-state-label">{label}</span>
    </div>
  );
}
