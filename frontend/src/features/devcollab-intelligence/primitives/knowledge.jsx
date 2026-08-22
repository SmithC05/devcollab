/**
 * DevCollab Intelligence — Knowledge Transfer Primitives
 * Visual components for handoff coverage and transfer impact.
 * No prediction logic — visual only.
 */

import { DvCard, DvProgressBar, DvBadge, DvDivider } from './core';

// ── DvKnowledgePackage ────────────────────────────────────────────────────
export function DvKnowledgePackage({ items = [], title = 'Knowledge Handoff', className = '' }) {
  return (
    <DvCard className={`dv-knowledge-package ${className}`}>
      <div className="dv-knowledge-package-title">{title}</div>
      <DvDivider />
      <div className="dv-knowledge-package-items">
        {items.map((item, i) => (
          <DvKnowledgeItem key={i} label={item.label} covered={item.covered} />
        ))}
      </div>
    </DvCard>
  );
}

// ── DvKnowledgeItem ───────────────────────────────────────────────────────
export function DvKnowledgeItem({ label, covered = false, detail, className = '' }) {
  return (
    <div className={`dv-knowledge-item ${className}`}>
      <span
        className={`dv-knowledge-item-check ${covered ? 'dv-check-covered' : 'dv-check-missing'}`}
        aria-label={covered ? 'Covered' : 'Not covered'}
      >
        {covered ? '✓' : '○'}
      </span>
      <span className="dv-knowledge-item-label">{label}</span>
      {detail && <span className="dv-knowledge-item-detail">{detail}</span>}
    </div>
  );
}

// ── DvHandoffCoverage ─────────────────────────────────────────────────────
export function DvHandoffCoverage({ covered = 0, total = 0, className = '' }) {
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const variant = pct >= 80 ? 'recommended' : pct >= 50 ? 'warning' : 'danger';
  return (
    <div className={`dv-handoff-coverage ${className}`}>
      <div className="dv-handoff-coverage-header">
        <span className="dv-handoff-coverage-label">Coverage</span>
        <span className="dv-handoff-coverage-value">{covered}/{total} areas</span>
      </div>
      <DvProgressBar value={pct} max={100} variant={variant} label={`${pct}% coverage`} />
      <div className="dv-handoff-coverage-pct">{pct}%</div>
    </div>
  );
}

// ── DvTransferImpact ──────────────────────────────────────────────────────
export function DvTransferImpact({ before, after, unit = 'h', className = '' }) {
  const reduction = before - after;
  const reductionPct = before > 0 ? Math.round((reduction / before) * 100) : 0;
  return (
    <DvCard className={`dv-transfer-impact ${className}`}>
      <div className="dv-transfer-impact-title">Transfer Impact</div>
      <DvDivider />
      <div className="dv-transfer-impact-metrics">
        <div className="dv-transfer-impact-metric">
          <span className="dv-transfer-impact-label">Without handoff</span>
          <span className="dv-transfer-impact-value dv-mono dv-text-danger">{before}{unit}</span>
        </div>
        <div className="dv-transfer-impact-metric">
          <span className="dv-transfer-impact-label">With handoff</span>
          <span className="dv-transfer-impact-value dv-mono dv-text-recommended">{after}{unit}</span>
        </div>
        <DvDivider />
        <div className="dv-transfer-impact-metric dv-transfer-impact-reduction">
          <span className="dv-transfer-impact-label">Reduction</span>
          <span className="dv-transfer-impact-value dv-mono">↓ {reduction.toFixed(1)}{unit} ({reductionPct}%)</span>
        </div>
      </div>
    </DvCard>
  );
}

// ── DvBeforeAfterMetric ───────────────────────────────────────────────────
export function DvBeforeAfterMetric({ label, before, after, unit, className = '' }) {
  const improved = after < before;
  return (
    <div className={`dv-before-after ${className}`}>
      <div className="dv-before-after-label">{label}</div>
      <div className="dv-before-after-values">
        <div className="dv-before-after-item">
          <span className="dv-before-after-caption">Before</span>
          <span className="dv-before-after-value dv-mono">{before}{unit}</span>
        </div>
        <span className="dv-before-after-arrow" aria-hidden="true">→</span>
        <div className="dv-before-after-item">
          <span className="dv-before-after-caption">After</span>
          <span className={`dv-before-after-value dv-mono ${improved ? 'dv-text-recommended' : 'dv-text-danger'}`}>
            {after}{unit}
          </span>
        </div>
      </div>
    </div>
  );
}
