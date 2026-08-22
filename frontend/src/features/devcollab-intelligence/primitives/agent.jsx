/**
 * DevCollab Intelligence — Agent / AI Primitives
 * Visual orchestration-layer components.
 * This is NOT a chat UI. It is an activity/orchestration interface.
 * No business logic — visual only.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { agentActivity, staggerChildren, subtlePulse, fadeUp } from '../motion/presets';
import { DvBadge, DvStatusBadge, DvCard, DvProgressBar, DvDivider } from './core';

// ── Step status icons ─────────────────────────────────────────────────────
const StepIcon = ({ status }) => {
  const s = {
    pending:  <span className="dv-step-icon dv-step-pending" aria-label="Pending">○</span>,
    running:  <motion.span className="dv-step-icon dv-step-running" aria-label="Running" variants={subtlePulse} animate="animate">●</motion.span>,
    done:     <span className="dv-step-icon dv-step-done" aria-label="Done">✓</span>,
    failed:   <span className="dv-step-icon dv-step-failed" aria-label="Failed">✕</span>,
    skipped:  <span className="dv-step-icon dv-step-skipped" aria-label="Skipped">–</span>,
  };
  return s[status] || s.pending;
};

// ── DvAgentStatus ─────────────────────────────────────────────────────────
export function DvAgentStatus({ status = 'IDLE', className = '' }) {
  const STATUS_MAP = {
    IDLE:                { label: 'Idle',              dot: 'muted'    },
    ANALYZING:           { label: 'Analyzing',         dot: 'analyzing'},
    PREDICTING:          { label: 'Predicting',        dot: 'predicted'},
    SIMULATING:          { label: 'Simulating',        dot: 'simulated'},
    WAITING_FOR_APPROVAL:{ label: 'Awaiting Approval', dot: 'warning'  },
    EXECUTING:           { label: 'Executing',         dot: 'approved' },
    COMPLETED:           { label: 'Completed',         dot: 'success'  },
    FAILED:              { label: 'Failed',            dot: 'danger'   },
  };
  const def = STATUS_MAP[status] || STATUS_MAP.IDLE;
  return (
    <div className={`dv-agent-status ${className}`}>
      <div className={`dv-agent-status-dot dv-dot-${def.dot}`} aria-hidden="true" />
      <span className="dv-agent-status-label">{def.label}</span>
    </div>
  );
}

// ── DvAgentStep ───────────────────────────────────────────────────────────
export function DvAgentStep({ label, status = 'pending', detail, className = '' }) {
  return (
    <motion.div
      className={`dv-agent-step ${className}`}
      variants={agentActivity}
      layout
    >
      <StepIcon status={status} />
      <div className="dv-agent-step-body">
        <div className="dv-agent-step-label">{label}</div>
        {detail && <div className="dv-agent-step-detail">{detail}</div>}
      </div>
    </motion.div>
  );
}

// ── DvAgentActivity ───────────────────────────────────────────────────────
export function DvAgentActivity({ title = 'DEVCOLLAB AGENT', status = 'IDLE', steps = [], className = '' }) {
  return (
    <DvCard className={`dv-agent-activity ${className}`}>
      <div className="dv-agent-activity-header">
        <span className="dv-agent-activity-title">{title}</span>
        <DvAgentStatus status={status} />
      </div>
      <DvDivider />
      <motion.div
        className="dv-agent-activity-steps"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        {steps.length === 0 ? (
          <div className="dv-agent-activity-idle dv-text-muted">
            Waiting for engineering state…
          </div>
        ) : (
          steps.map((step, i) => (
            <DvAgentStep key={i} label={step.label} status={step.status} detail={step.detail} />
          ))
        )}
      </motion.div>
    </DvCard>
  );
}

// ── DvAgentToolCall ───────────────────────────────────────────────────────
export function DvAgentToolCall({ tool, args, result, status = 'pending', className = '' }) {
  return (
    <div className={`dv-tool-call ${className}`}>
      <div className="dv-tool-call-header">
        <span className="dv-tool-call-name dv-mono">{tool}</span>
        <span className={`dv-tool-call-status dv-tool-status-${status}`}>{status}</span>
      </div>
      {args && (
        <div className="dv-tool-call-args">
          <span className="dv-tool-call-key">args</span>
          <pre className="dv-tool-call-value dv-mono">{typeof args === 'string' ? args : JSON.stringify(args, null, 2)}</pre>
        </div>
      )}
      {result && (
        <div className="dv-tool-call-result">
          <span className="dv-tool-call-key">result</span>
          <pre className="dv-tool-call-value dv-mono">{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ── DvAgentObservation ────────────────────────────────────────────────────
export function DvAgentObservation({ source, label, value, className = '' }) {
  return (
    <div className={`dv-observation ${className}`}>
      <div className="dv-observation-source dv-badge dv-badge-observed dv-mono">{source}</div>
      <div className="dv-observation-body">
        <span className="dv-observation-label">{label}</span>
        {value && <span className="dv-observation-value">{value}</span>}
      </div>
    </div>
  );
}

// ── DvAgentPrediction ─────────────────────────────────────────────────────
export function DvAgentPrediction({ model, target, value, unit, confidence, provenance = 'REAL_DB', className = '' }) {
  return (
    <div className={`dv-agent-prediction ${className}`}>
      <div className="dv-agent-prediction-header">
        <span className="dv-badge dv-badge-predicted">Prediction</span>
        {model && <span className="dv-agent-prediction-model dv-mono">{model}</span>}
      </div>
      <div className="dv-agent-prediction-body">
        <span className="dv-agent-prediction-target">{target}</span>
        <span className="dv-agent-prediction-value dv-mono">{value}{unit && <span className="dv-agent-prediction-unit"> {unit}</span>}</span>
      </div>
      <div className="dv-agent-prediction-meta">
        {provenance && (
          <span className={`dv-provenance dv-provenance-${provenance.toLowerCase().replace('_','-')}`}>
            {provenance === 'REAL_DB' ? 'Real data' : provenance === 'DERIVED' ? 'Derived' : 'Demo'}
          </span>
        )}
      </div>
    </div>
  );
}

// ── DvAgentSimulation ─────────────────────────────────────────────────────
export function DvAgentSimulation({ scenario, interventions = [], outcome, className = '' }) {
  return (
    <div className={`dv-agent-simulation ${className}`}>
      <div className="dv-agent-simulation-header">
        <span className="dv-badge dv-badge-simulated">Simulation</span>
        {scenario && <span className="dv-agent-simulation-scenario">{scenario}</span>}
      </div>
      {interventions.length > 0 && (
        <div className="dv-agent-simulation-interventions">
          {interventions.map((iv, i) => (
            <div key={i} className="dv-agent-simulation-intervention">
              <span className="dv-intervention-badge">{iv.type}</span>
              <span className="dv-agent-simulation-intervention-label">{iv.label}</span>
            </div>
          ))}
        </div>
      )}
      {outcome && (
        <div className="dv-agent-simulation-outcome">
          <div className="dv-agent-simulation-outcome-label">Projected Outcome</div>
          <div className="dv-agent-simulation-outcome-value">{outcome}</div>
        </div>
      )}
    </div>
  );
}

// ── DvAgentRecommendation ─────────────────────────────────────────────────
export function DvAgentRecommendation({ title, rationale, impact, interventionType, className = '' }) {
  return (
    <div className={`dv-recommendation ${className}`}>
      <div className="dv-recommendation-header">
        <span className="dv-badge dv-badge-recommended">Recommendation</span>
        {interventionType && <span className="dv-intervention-badge">{interventionType}</span>}
      </div>
      <div className="dv-recommendation-title">{title}</div>
      {rationale && <div className="dv-recommendation-rationale">{rationale}</div>}
      {impact && (
        <div className="dv-recommendation-impact">
          <span className="dv-recommendation-impact-label">Projected Impact</span>
          <span className="dv-recommendation-impact-value">{impact}</span>
        </div>
      )}
    </div>
  );
}

// ── DvAgentApproval ───────────────────────────────────────────────────────
export function DvAgentApproval({ prompt, onApprove, onReject, approving = false, className = '' }) {
  return (
    <div className={`dv-approval ${className}`} role="dialog" aria-label="Approval Request">
      <div className="dv-approval-header">
        <span className="dv-badge dv-badge-warning">Awaiting Approval</span>
      </div>
      <div className="dv-approval-prompt">{prompt}</div>
      <div className="dv-approval-actions">
        <button
          type="button"
          className="dv-btn dv-btn-success dv-btn-md"
          onClick={onApprove}
          disabled={approving}
          aria-label="Approve action"
        >
          {approving ? 'Executing…' : 'Approve'}
        </button>
        <button
          type="button"
          className="dv-btn dv-btn-ghost dv-btn-md"
          onClick={onReject}
          disabled={approving}
          aria-label="Reject action"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// ── DvAgentExecution ──────────────────────────────────────────────────────
export function DvAgentExecution({ action, status = 'EXECUTING', progress, log, className = '' }) {
  return (
    <div className={`dv-execution ${className}`}>
      <div className="dv-execution-header">
        <span className="dv-badge dv-badge-approved">Executing</span>
        <span className="dv-execution-action">{action}</span>
      </div>
      {progress !== undefined && (
        <DvProgressBar value={progress} max={100} variant="approved" label="Execution progress" />
      )}
      {status === 'COMPLETED' && (
        <div className="dv-execution-done">
          <span className="dv-badge dv-badge-success">Completed</span>
        </div>
      )}
      {log && <pre className="dv-execution-log dv-mono">{log}</pre>}
    </div>
  );
}
