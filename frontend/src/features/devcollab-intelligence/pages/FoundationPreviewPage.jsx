/**
 * DevCollab Intelligence — Foundation Preview Page
 * Route: /intelligence/foundation-preview
 *
 * Showcases the complete design system.
 * Uses clearly labeled DESIGN PREVIEW content.
 * Does NOT call production APIs or mutate any state.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowRight, Brain, CheckCircle, ChevronRight,
  Clock, Code, Cpu, Database, Eye, GitBranch, Layers, Loader,
  Network, Play, Shield, Sparkles, Terminal, TrendingDown, Users, Zap,
} from 'lucide-react';

import '../styles/tokens.css';
import '../styles/components.css';

// Core Primitives
import {
  DvButton, DvIconButton, DvCard, DvPanel, DvStack, DvGrid,
  DvBadge, DvStatusBadge, DvMetric, DvMetricCard,
  DvAvatar, DvAvatarStack, DvDivider, DvProgressBar, DvProgressRing,
  DvSkeleton, DvEmptyState, DvTabs, DvTooltip,
} from '../primitives/core';

// Engineering Primitives
import {
  DvMemberStatus, DvCapacityBar, DvWorkloadIndicator, DvContextIndicator,
  DvOwnershipIndicator, DvDependencyIndicator, DvRiskIndicator,
  DvResponsibilityIndicator, DvDecisionPointBadge, DvInterventionBadge,
  DvPredictionMetric, DvEvidenceItem, DvEventItem,
} from '../primitives/engineering';

// Agent Primitives
import {
  DvAgentStatus, DvAgentActivity, DvAgentStep, DvAgentToolCall,
  DvAgentObservation, DvAgentPrediction, DvAgentSimulation,
  DvAgentRecommendation, DvAgentApproval, DvAgentExecution,
} from '../primitives/agent';

// Simulation Primitives
import {
  DvScenarioHeader, DvScenarioVariable, DvSimulationCard, DvInterventionOption,
  DvSimulationMetric, DvImpactDelta, DvScenarioComparison, DvFutureStateIndicator,
} from '../primitives/simulation';

// Knowledge Primitives
import {
  DvKnowledgePackage, DvHandoffCoverage, DvTransferImpact, DvBeforeAfterMetric,
} from '../primitives/knowledge';

import { fadeUp, panelEnter, staggerChildren } from '../motion/presets';

// ── Preview Section Wrapper ───────────────────────────────────────────────
function Section({ title, id, children, description }) {
  return (
    <motion.section
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      style={{ marginBottom: 64 }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily:    'var(--dv-font-mono)',
          fontSize:      'var(--dv-text-xs)',
          color:         'var(--dv-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom:  8,
          fontWeight:    600,
        }}>
          Design Preview
        </div>
        <h2 style={{
          fontSize:      'var(--dv-text-xl)',
          fontWeight:    600,
          color:         'var(--dv-text-primary)',
          letterSpacing: 'var(--dv-tracking-tight)',
          marginBottom:  description ? 8 : 0,
        }}>
          {title}
        </h2>
        {description && (
          <p style={{
            fontSize:    'var(--dv-text-sm)',
            color:       'var(--dv-text-muted)',
            lineHeight:  'var(--dv-leading-relaxed)',
            maxWidth:    640,
          }}>
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </motion.section>
  );
}

// ── Preview Row ───────────────────────────────────────────────────────────
function Row({ label, children, mono = false }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {label && (
        <div style={{
          fontSize:      'var(--dv-text-xs)',
          color:         'var(--dv-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily:    mono ? 'var(--dv-font-mono)' : 'var(--dv-font-sans)',
          marginBottom:  12,
          fontWeight:    500,
        }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {children}
      </div>
    </div>
  );
}

// ── DEMO DATA ─────────────────────────────────────────────────────────────
const DEMO_AGENT_STEPS = [
  { label: 'Reading engineering state',       status: 'done',    detail: 'Project: Payment API v3' },
  { label: 'Inspecting active projects',      status: 'done'    },
  { label: 'Evaluating member capacity',      status: 'done'    },
  { label: 'Mapping task dependencies',       status: 'done',    detail: '14 dependencies mapped' },
  { label: 'Estimating task context',         status: 'done'    },
  { label: 'Predicting transfer effort',      status: 'running', detail: 'context_transfer_model.pkl' },
  { label: 'Evaluating knowledge-transfer benefit', status: 'pending' },
  { label: 'Simulating interventions',        status: 'pending' },
  { label: 'Preparing recommendation',        status: 'pending' },
];

const DEMO_KT_ITEMS = [
  { label: 'System architecture',     covered: true  },
  { label: 'Key files & modules',     covered: true  },
  { label: 'Known issues & workarounds', covered: true },
  { label: 'Debugging paths',         covered: true  },
  { label: 'Recent decisions',        covered: false },
  { label: 'Testing strategy',        covered: false },
  { label: 'Deployment process',      covered: true  },
];

const DEMO_COMPARISON_METRICS = [
  { label: 'Transfer effort',  before: '6.8h', after: '4.4h', unit: '',  delta: '2.4h', positive: true  },
  { label: 'Risk level',       before: 'High', after: 'Medium', unit: '', delta: '',    positive: true  },
  { label: 'Ownership gap',    before: 'Open', after: 'Covered', unit: '',delta: '',   positive: true  },
];

// ── Main Component ────────────────────────────────────────────────────────
export default function FoundationPreviewPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIntervention, setSelectedIntervention] = useState('REASSIGN');
  const [approving, setApproving] = useState(false);

  return (
    <div className="dv-intelligence" style={{ padding: '48px 40px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <motion.div variants={panelEnter} initial="hidden" animate="visible" style={{ marginBottom: 64 }}>
        <div style={{
          fontFamily:    'var(--dv-font-mono)',
          fontSize:      'var(--dv-text-xs)',
          color:         'var(--dv-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom:  12,
          fontWeight:    600,
        }}>
          Foundation Preview · Design System v0
        </div>
        <h1 style={{
          fontSize:      'var(--dv-text-display)',
          fontWeight:    700,
          color:         'var(--dv-text-primary)',
          letterSpacing: 'var(--dv-tracking-tight)',
          lineHeight:    'var(--dv-leading-tight)',
          marginBottom:  16,
        }}>
          DevCollab Intelligence
        </h1>
        <p style={{
          fontSize:   'var(--dv-text-lg)',
          color:      'var(--dv-text-secondary)',
          lineHeight: 'var(--dv-leading-relaxed)',
          maxWidth:   680,
          marginBottom: 32,
        }}>
          A premium engineering decision console. This page demonstrates the isolated
          UI foundation — design tokens, motion system, and all visual primitives.
          No production data is used. No APIs are called.
        </p>

        {/* Flow chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', color: 'var(--dv-text-muted)', fontSize: 'var(--dv-text-xs)' }}>
          {['REAL STATE','LLM ANALYSIS','ML PREDICTION','SIMULATION','RECOMMENDATION','APPROVAL','EXECUTION','STATE UPDATE'].map((s, i, arr) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DvBadge variant={
                s === 'REAL STATE'     ? 'observed'    :
                s === 'LLM ANALYSIS'   ? 'analyzing'   :
                s === 'ML PREDICTION'  ? 'predicted'   :
                s === 'SIMULATION'     ? 'simulated'   :
                s === 'RECOMMENDATION' ? 'recommended' :
                s === 'APPROVAL'       ? 'warning'     :
                s === 'EXECUTION'      ? 'approved'    : 'executed'
              }>{s}</DvBadge>
              {i < arr.length - 1 && <span style={{ opacity: 0.3 }}>→</span>}
            </span>
          ))}
        </div>
      </motion.div>

      <DvDivider style={{ marginBottom: 64 }} />

      {/* ══════════════════════════════════════════ */}
      {/* 1. TYPOGRAPHY */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Typography" id="typography" description="The complete type scale. Monospace is used selectively for technical values, IDs, and system state.">
        <DvCard style={{ padding: '32px' }}>
          <DvStack gap={6}>
            <div>
              <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Display</div>
              <div style={{ fontSize: 'var(--dv-text-display)', fontWeight: 700, letterSpacing: 'var(--dv-tracking-tight)', lineHeight: 1.1 }}>
                Engineering Intelligence
              </div>
            </div>
            <DvDivider />
            <div>
              <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Page Title</div>
              <div style={{ fontSize: 'var(--dv-text-4xl)', fontWeight: 600, letterSpacing: 'var(--dv-tracking-tight)' }}>
                Decision Console
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Section Title</div>
              <div style={{ fontSize: 'var(--dv-text-2xl)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>
                Active Simulations
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Body / Label / Metadata</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 'var(--dv-text-md)', color: 'var(--dv-text-primary)', lineHeight: 'var(--dv-leading-relaxed)' }}>
                  The model estimates 6.8 hours of context transfer effort for this reassignment.
                </div>
                <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                  Secondary — Supporting detail, descriptions, and explanations.
                </div>
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)' }}>
                  Metadata — Timestamps, IDs, and supplemental values.
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Monospace (Technical)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <code className="dv-mono" style={{ fontSize: 'var(--dv-text-2xl)', fontWeight: 700, color: 'var(--dv-predicted)' }}>6.8h</code>
                <code className="dv-mono" style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>context_transfer_model.pkl</code>
                <code className="dv-mono" style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)' }}>sim_7f3a2b · 2026-08-22T23:42:00Z</code>
                <code className="dv-mono" style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-accent)' }}>REASSIGN · predict_context_transfer · evaluate_simulation</code>
              </div>
            </div>
          </DvStack>
        </DvCard>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 2. BUTTONS */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Buttons" id="buttons">
        <DvCard style={{ padding: 24 }}>
          <Row label="Variants">
            <DvButton variant="primary"  icon={Play}>Approve</DvButton>
            <DvButton variant="outline"  icon={Eye}>Inspect</DvButton>
            <DvButton variant="ghost"    icon={ChevronRight}>Details</DvButton>
            <DvButton variant="success"  icon={CheckCircle}>Confirm</DvButton>
            <DvButton variant="danger"   icon={AlertTriangle}>Reject</DvButton>
          </Row>
          <Row label="Sizes">
            <DvButton size="sm">Small</DvButton>
            <DvButton size="md">Medium</DvButton>
            <DvButton size="lg">Large</DvButton>
            <DvButton disabled>Disabled</DvButton>
          </Row>
          <Row label="Icon Buttons">
            <DvIconButton icon={Brain}    label="Analyze"  size="sm" />
            <DvIconButton icon={Network}  label="Network"  size="md" />
            <DvIconButton icon={Terminal} label="Terminal" size="lg" />
          </Row>
        </DvCard>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 3. BADGES & STATUS */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Intelligence State Badges" id="badges" description="Every state in the decision pipeline has a distinct visual token.">
        <DvCard style={{ padding: 24 }}>
          <Row label="State Badges">
            <DvBadge variant="observed">Observed</DvBadge>
            <DvBadge variant="analyzing">Analyzing</DvBadge>
            <DvBadge variant="predicted">Predicted</DvBadge>
            <DvBadge variant="simulated">Simulated</DvBadge>
            <DvBadge variant="recommended">Recommended</DvBadge>
            <DvBadge variant="approved">Approved</DvBadge>
            <DvBadge variant="executed">Executed</DvBadge>
          </Row>
          <Row label="Semantic Badges">
            <DvBadge variant="success">Success</DvBadge>
            <DvBadge variant="warning">Warning</DvBadge>
            <DvBadge variant="danger">Danger</DvBadge>
            <DvBadge variant="info">Info</DvBadge>
            <DvBadge variant="muted">Muted</DvBadge>
          </Row>
          <Row label="Dot Badges">
            <DvBadge variant="observed" dot>Active</DvBadge>
            <DvBadge variant="analyzing" dot>Processing</DvBadge>
            <DvBadge variant="danger" dot>Critical</DvBadge>
          </Row>
          <Row label="Status Badges (Automation)">
            {['IDLE','ANALYZING','PREDICTING','SIMULATING','WAITING_FOR_APPROVAL','EXECUTING','COMPLETED','FAILED'].map(s => (
              <DvStatusBadge key={s} status={s} />
            ))}
          </Row>
          <Row label="Provenance">
            <span className="dv-provenance dv-provenance-real">Real</span>
            <span className="dv-provenance dv-provenance-derived">Derived</span>
            <span className="dv-provenance dv-provenance-synthetic-demo">Demo</span>
          </Row>
          <Row label="Intervention Types">
            <DvInterventionBadge type="REASSIGN" />
            <DvInterventionBadge type="PAIR" />
            <DvInterventionBadge type="KNOWLEDGE_TRANSFER" />
            <DvInterventionBadge type="ESCALATE" />
          </Row>
        </DvCard>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 4. METRICS */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Metric Cards" id="metrics" description="High-density numeric display for engineering intelligence signals.">
        <DvGrid cols={4} gap={4}>
          <DvMetricCard label="Transfer Effort" value="6.8" unit="h" sub="Predicted · context_transfer_model" status="PREDICTED" icon={Clock} />
          <DvMetricCard label="KT Reduction"    value="2.4" unit="h" sub="With knowledge handoff"          status="SIMULATED" icon={TrendingDown} />
          <DvMetricCard label="Context Score"   value="72"  unit="%" sub="Current assignee coverage"       status="OBSERVED" icon={Brain} />
          <DvMetricCard label="Task Risk"       value="High"        sub="Based on dependency graph"        status="ANALYZING" icon={AlertTriangle} />
        </DvGrid>
        <div style={{ marginTop: 16 }}>
          <Row label="Inline Metrics">
            <DvMetric label="Transfer Effort" value="6.8" unit="h" delta="2.4h" deltaPositive />
            <DvMetric label="Handoff Coverage" value="71" unit="%" />
            <DvMetric label="Risk Score" value="0.82" delta="0.18" deltaPositive={false} />
          </Row>
          <Row label="Progress Rings">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <DvProgressRing value={72} max={100} size={48} variant="recommended" />
                <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', marginTop: 4 }}>Context</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <DvProgressRing value={43} max={100} size={48} variant="warning" />
                <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', marginTop: 4 }}>Coverage</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <DvProgressRing value={92} max={100} size={48} variant="danger" />
                <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', marginTop: 4 }}>Capacity</div>
              </div>
            </div>
            <div style={{ flex: 1, maxWidth: 300 }}>
              <DvProgressBar value={72} max={100} variant="recommended" label="Context coverage" />
              <div style={{ marginTop: 8 }}>
                <DvProgressBar value={43} max={100} variant="warning" label="Handoff coverage" />
              </div>
              <div style={{ marginTop: 8 }}>
                <DvProgressBar value={92} max={100} variant="danger" label="Capacity" />
              </div>
            </div>
          </Row>
        </div>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 5. ENGINEERING PRIMITIVES */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Engineering Primitives" id="engineering" description="Domain-specific visual signals for the engineering organization layer.">
        <DvGrid cols={2} gap={4}>
          {/* Members */}
          <DvPanel title="Member Status">
            <DvStack gap={1}>
              <DvMemberStatus name="Alex Smith"    role="Backend Engineer"  status="available"   />
              <DvMemberStatus name="Priya Sharma"  role="Frontend Engineer" status="busy"        />
              <DvMemberStatus name="Marcus Chen"   role="Full Stack"        status="overloaded"  />
              <DvMemberStatus name="Rahul Gupta"   role="Platform Lead"     status="unavailable" />
            </DvStack>
          </DvPanel>

          {/* Capacity & Workload */}
          <DvPanel title="Capacity & Workload">
            <DvStack gap={5}>
              <DvCapacityBar label="Alex Smith"   value={58} />
              <DvCapacityBar label="Priya Sharma" value={76} />
              <DvCapacityBar label="Marcus Chen"  value={94} />
              <DvDivider />
              <div>
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', marginBottom: 8 }}>Workload Indicator</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[{ name: 'Alex', tasks: 4 }, { name: 'Priya', tasks: 7 }, { name: 'Marcus', tasks: 9 }].map(m => (
                    <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', width: 50 }}>{m.name}</span>
                      <DvWorkloadIndicator tasks={m.tasks} maxTasks={10} />
                    </div>
                  ))}
                </div>
              </div>
            </DvStack>
          </DvPanel>

          {/* Risk & Ownership */}
          <DvPanel title="Risk & Ownership Signals">
            <DvStack gap={4}>
              <Row label="Risk Levels">
                <DvRiskIndicator level="low" />
                <DvRiskIndicator level="medium" />
                <DvRiskIndicator level="high" />
                <DvRiskIndicator level="critical" />
              </Row>
              <DvDivider />
              <Row label="Ownership">
                <DvOwnershipIndicator hasOwner ownerName="Alex Smith" />
                <DvOwnershipIndicator hasOwner={false} />
              </Row>
              <Row label="Dependencies">
                <DvDependencyIndicator count={8} blockedBy={2} />
                <DvDependencyIndicator count={3} blockedBy={0} />
              </Row>
              <Row label="Responsibility Coverage">
                <DvResponsibilityIndicator coverage={85} />
                <DvResponsibilityIndicator coverage={52} />
                <DvResponsibilityIndicator coverage={20} />
              </Row>
              <Row label="Decision Points">
                <DvDecisionPointBadge active />
                <DvDecisionPointBadge label="Escalation Required" active={false} />
              </Row>
            </DvStack>
          </DvPanel>

          {/* Context & Evidence */}
          <DvPanel title="Context & Evidence">
            <DvStack gap={4}>
              <div style={{ display: 'flex', gap: 16 }}>
                <DvContextIndicator value={72} label="Current Assignee" />
                <DvContextIndicator value={31} label="Candidate A" />
                <DvContextIndicator value={58} label="Candidate B" />
              </div>
              <DvDivider />
              <div>
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Evidence Items</div>
                <DvEvidenceItem label="task_complexity"       value="0.72" provenance="REAL_DB" />
                <DvEvidenceItem label="dependency_count"      value="8"    provenance="DERIVED" />
                <DvEvidenceItem label="important_files_cov"   value="0.45" provenance="SYNTHETIC_DEMO" />
                <DvEvidenceItem label="knowledge_breadth"     value="0.61" provenance="DERIVED" />
              </div>
              <DvDivider />
              <div>
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Prediction Metrics</div>
                <DvPredictionMetric label="Transfer Effort"   value="6.8" unit="h" provenance="REAL_DB" />
                <DvPredictionMetric label="KT Reduction"      value="2.4" unit="h" provenance="DERIVED" />
                <DvPredictionMetric label="Confidence"        value="0.77"         provenance="SYNTHETIC_DEMO" />
              </div>
            </DvStack>
          </DvPanel>
        </DvGrid>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 6. AGENT ACTIVITY PANEL */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Agent Activity" id="agent" description="The orchestration layer — not a chat UI. Shows automated reasoning at a high level, without exposing internal chain-of-thought.">
        <DvGrid cols={2} gap={4}>
          <DvAgentActivity
            title="DEVCOLLAB AGENT"
            status="PREDICTING"
            steps={DEMO_AGENT_STEPS}
          />

          <DvStack gap={4}>
            {/* Agent Status indicator */}
            <DvPanel title="Automation Status">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {['IDLE','ANALYZING','PREDICTING','SIMULATING','WAITING_FOR_APPROVAL','EXECUTING','COMPLETED','FAILED'].map(s => (
                  <DvAgentStatus key={s} status={s} />
                ))}
              </div>
            </DvPanel>
          </DvStack>

          {/* Tool Calls */}
          <DvPanel title="Tool Calls">
            <DvStack gap={3}>
              <DvAgentToolCall
                tool="predict_context_transfer"
                args={{ task_id: 'task_7f3a2b', candidate_id: 'dev_001' }}
                status="done"
                result={{ transfer_effort_hours: 6.8, provenance: 'REAL_DB' }}
              />
              <DvAgentToolCall
                tool="evaluate_simulation"
                args={{ task_id: 'task_7f3a2b', intervention: 'REASSIGN' }}
                status="running"
              />
              <DvAgentToolCall
                tool="approve_scenario"
                args={{ simulation_id: 'sim_001' }}
                status="pending"
              />
            </DvStack>
          </DvPanel>

          {/* Observations */}
          <DvPanel title="Agent Observations">
            <DvStack gap={1}>
              <DvAgentObservation source="WORKSPACE"  label="Active projects"          value="3" />
              <DvAgentObservation source="PROJECT"    label="Payment API v3 — status"  value="Active" />
              <DvAgentObservation source="MEMBER"     label="Alex Smith — capacity"    value="58%" />
              <DvAgentObservation source="TASK"       label="Dependencies mapped"      value="8 tasks" />
              <DvAgentObservation source="ML_MODEL"   label="Transfer effort est."     value="6.8h" />
            </DvStack>
          </DvPanel>
        </DvGrid>

        {/* Prediction & Recommendation */}
        <div style={{ marginTop: 16 }}>
          <DvGrid cols={2} gap={4}>
            <DvAgentPrediction
              model="context_transfer_model.pkl"
              target="Transfer effort for reassignment"
              value="6.8"
              unit="h"
              provenance="REAL_DB"
            />
            <DvAgentPrediction
              model="knowledge_transfer_model.pkl"
              target="Effort reduction from KT handoff"
              value="2.4"
              unit="h"
              provenance="DERIVED"
            />
          </DvGrid>
        </div>

        <div style={{ marginTop: 16 }}>
          <DvAgentRecommendation
            title="Reassign Payment API v3 from Alex Smith to Rahul Gupta with structured knowledge transfer"
            rationale="Alex Smith is projected to become unavailable in 72 hours. Rahul Gupta has 42% existing context on the Payment API domain. A structured knowledge handoff reduces transfer effort from 6.8h to 4.4h. This intervention maintains delivery continuity with minimal disruption."
            impact="↓ 2.4h transfer effort · Risk: Medium → Low · Ownership: Covered"
            interventionType="REASSIGN + KNOWLEDGE_TRANSFER"
          />
        </div>

        {/* Approval */}
        <div style={{ marginTop: 16 }}>
          <DvAgentApproval
            prompt="DevCollab Agent recommends reassigning task 'Implement OAuth flow' from Alex Smith to Rahul Gupta and initiating a structured knowledge transfer session. Approve to execute?"
            onApprove={() => { setApproving(true); setTimeout(() => setApproving(false), 2000); }}
            onReject={() => {}}
            approving={approving}
          />
        </div>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 7. SIMULATION PRIMITIVES */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Simulation Primitives" id="simulation" description="Visual components for what-if analysis. OBSERVED and SIMULATED states are always clearly distinguished.">
        <DvGrid cols={2} gap={4}>
          {/* Scenario Header & Variables */}
          <DvPanel title="Scenario" noPad>
            <div style={{ padding: '0 20px 20px' }}>
              <DvScenarioHeader
                title="What if Alex Smith becomes unavailable?"
                description="Evaluating continuity risk in the next 72 hours."
                source="SIMULATED"
              />
              <DvDivider />
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <DvScenarioVariable
                  label="Assignee availability"
                  observed="Alex Smith — Available"
                  simulated="Alex Smith — Unavailable (72h)"
                />
                <DvScenarioVariable
                  label="Task ownership"
                  observed="Owned (Alex Smith)"
                  simulated="Unowned"
                />
              </div>
            </div>
          </DvPanel>

          {/* Scenario Comparison */}
          <DvPanel title="State Comparison" noPad>
            <div style={{ padding: '0 20px 20px' }}>
              <DvScenarioComparison
                observedLabel="Current State"
                simulatedLabel="After Intervention"
                metrics={DEMO_COMPARISON_METRICS}
              />
              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <DvFutureStateIndicator timeframe="T+0" label="Current state" source="OBSERVED" />
                <DvFutureStateIndicator timeframe="T+72h" label="Unavailability event" source="SIMULATED" />
              </div>
            </div>
          </DvPanel>

          {/* Intervention Options */}
          <DvPanel title="Intervention Options">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DvInterventionOption
                type="REASSIGN"
                label="Reassign to Rahul Gupta"
                description="Transfer full ownership. Rahul has 42% existing context on Payment API."
                impact="↓ 6.8h → 4.4h effort"
                selected={selectedIntervention === 'REASSIGN'}
                recommended
                onSelect={() => setSelectedIntervention('REASSIGN')}
              />
              <DvInterventionOption
                type="PAIR"
                label="Pair Alex with Priya Sharma"
                description="Keep Alex as lead while building Priya's context. Prevents single-point failure."
                impact="↓ Risk: High → Medium"
                selected={selectedIntervention === 'PAIR'}
                onSelect={() => setSelectedIntervention('PAIR')}
              />
              <DvInterventionOption
                type="KNOWLEDGE_TRANSFER"
                label="Initiate structured KT session"
                description="Schedule knowledge handoff covering architecture, files, issues, decisions."
                impact="↓ 2.4h reduction on transfer"
                selected={selectedIntervention === 'KT'}
                onSelect={() => setSelectedIntervention('KT')}
              />
            </div>
          </DvPanel>

          {/* Simulation Metrics */}
          <DvPanel title="Simulation Metrics">
            <DvStack gap={3}>
              <DvImpactDelta value="2.4" unit="h" label="Effort saved" direction="down" />
              <DvDivider />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {DEMO_COMPARISON_METRICS.map((m, i) => (
                  <DvSimulationMetric key={i} {...m} />
                ))}
              </div>
            </DvStack>
          </DvPanel>
        </DvGrid>

        {/* Simulated vs Observed cards */}
        <div style={{ marginTop: 16 }}>
          <DvGrid cols={2} gap={4}>
            <DvSimulationCard title="Current Engineering State" source="OBSERVED">
              <DvStack gap={3}>
                <DvMemberStatus name="Alex Smith" role="Payment API owner" status="available" />
                <DvCapacityBar label="Capacity" value={58} />
              </DvStack>
            </DvSimulationCard>
            <DvSimulationCard title="After Reassignment + KT" source="SIMULATED">
              <DvStack gap={3}>
                <DvMemberStatus name="Rahul Gupta" role="New assignee" status="available" />
                <DvCapacityBar label="Projected capacity" value={74} />
              </DvStack>
            </DvSimulationCard>
          </DvGrid>
        </div>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 8. KNOWLEDGE TRANSFER PRIMITIVES */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Knowledge Transfer" id="knowledge" description="Visual representation of handoff coverage and predicted transfer impact.">
        <DvGrid cols={3} gap={4}>
          <DvKnowledgePackage items={DEMO_KT_ITEMS} title="Knowledge Handoff" />
          <DvTransferImpact before={6.8} after={4.4} unit="h" />
          <DvPanel title="Coverage & Before/After">
            <DvStack gap={5}>
              <DvHandoffCoverage covered={5} total={7} />
              <DvDivider />
              <DvBeforeAfterMetric label="Transfer effort" before={6.8} after={4.4} unit="h" />
              <DvBeforeAfterMetric label="Risk level" before="High" after="Medium" />
            </DvStack>
          </DvPanel>
        </DvGrid>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 9. CARDS & PANELS */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Cards & Panels" id="cards">
        <DvGrid cols={3} gap={4}>
          <DvCard style={{ padding: 20 }}>
            <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Default Card</div>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
              Standard surface for content grouping with default border and background.
            </p>
          </DvCard>
          <DvCard elevated style={{ padding: 20 }}>
            <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Elevated Card</div>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
              Raised surface with shadow for important content or focused context.
            </p>
          </DvCard>
          <DvCard onClick={() => {}} role="button" tabIndex={0} style={{ padding: 20 }}>
            <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Interactive Card</div>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
              Hover to see state transition. Focus-visible ring for keyboard navigation.
            </p>
          </DvCard>
        </DvGrid>
        <div style={{ marginTop: 16 }}>
          <DvPanel title="Panel Component" titleRight={<DvBadge variant="analyzing" dot>Live</DvBadge>}>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
              Panels have a formal header with title, optional right-side content,
              and a structured body area. Used for major content sections.
            </p>
          </DvPanel>
        </div>
      </Section>

      {/* ══════════════════════════════════════════ */}
      {/* 10. MISC: TABS, AVATARS, SKELETONS */}
      {/* ══════════════════════════════════════════ */}
      <Section title="Tabs, Avatars & Loading" id="misc">
        <DvCard style={{ padding: 24 }}>
          <DvStack gap={6}>
            <DvTabs
              tabs={[
                { id: 'overview', label: 'Overview', icon: Layers },
                { id: 'members',  label: 'Members',  icon: Users, count: 4 },
                { id: 'events',   label: 'Events',   icon: Activity, count: 12 },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />
            <Row label="Avatars">
              <DvAvatar name="Alex Smith"   size={40} />
              <DvAvatar name="Priya Sharma" size={40} />
              <DvAvatar name="Marcus Chen"  size={40} />
              <DvAvatarStack names={['Alex Smith', 'Priya Sharma', 'Marcus Chen', 'Rahul Gupta', 'Jane Doe']} max={3} size={32} />
            </Row>
            <Row label="Skeletons">
              <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DvSkeleton height={16} />
                <DvSkeleton height={12} width="60%" />
                <DvSkeleton height={12} width="80%" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <DvSkeleton width={40} height={40} rounded />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 120 }}>
                  <DvSkeleton height={14} />
                  <DvSkeleton height={12} width="70%" />
                </div>
              </div>
            </Row>
            <Row label="Event Items">
              <div style={{ width: '100%' }}>
                <DvEventItem type="TASK_ASSIGNED"     label="Payment API v3 assigned to Rahul Gupta" timestamp="23:42:00" status="done" />
                <DvEventItem type="KT_INITIATED"      label="Knowledge transfer session started"     timestamp="23:42:01" status="done" />
                <DvEventItem type="SIMULATION_RUN"    label="Simulation sim_7f3a2b completed"        timestamp="23:42:04" />
                <DvEventItem type="APPROVAL_PENDING"  label="Awaiting human approval for REASSIGN"  timestamp="23:42:05" />
              </div>
            </Row>
          </DvStack>
        </DvCard>
      </Section>

      {/* ── Footer ── */}
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <DvDivider />
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '32px 0 16px',
          gap:            16,
        }}>
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-faint)' }}>
            <span className="dv-mono">DevCollab Intelligence · Foundation Preview · Phase 0 Complete</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <DvBadge variant="observed">Phase 0</DvBadge>
            <DvBadge variant="muted">No production data</DvBadge>
            <DvBadge variant="muted">No API calls</DvBadge>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
