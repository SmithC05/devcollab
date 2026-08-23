/**
 * Decision Point — Data Adapter
 *
 * Provides the data contract for the Decision Point page.
 * Source: DEMO_STATE (controlled fixture).
 *
 * API replacement point:
 *   Replace getDecisionPointState(id) to fetch from a real endpoint.
 *   All UI components are data-driven — no hardcoded narrative.
 *
 * Provenance tags:
 *   REAL_DB        — read directly from Django DB
 *   DERIVED        — computed/heuristic from real DB values
 *   SYNTHETIC_DEMO — plausible fixture; not from the DB
 */

// ── Decision catalogue (keyed by id) ──────────────────────────────────────
// Multiple decision points so :id routing works for any dp

const DECISIONS = {
  'dp1': buildOverloadedOwnerDP(),
  'dp2': buildNoBackupDP(),
  'dp3': buildAtRiskDependencyDP(),
};

export function getDecisionPointState(id = 'dp1') {
  const dp = DECISIONS[id] ?? DECISIONS['dp1'];
  return { ...dp, systemStatus: { source: 'DEMO', agent_status: 'READY_FOR_SIMULATION' } };
}

// ── Decision type: ENGINEER_OVERLOADED ────────────────────────────────────
function buildOverloadedOwnerDP() {
  return {
    decision: {
      id:          'dp1',
      severity:    'HIGH',
      type:        'ENGINEER_OVERLOADED',
      title:       'Payment API — Critical Owner Overloaded',
      description: 'Smith is overloaded with 5 active tasks including 2 P0 items. The Payment API, a critical dependency for 3 downstream tasks, is at risk of delivery delay.',
      project:     'Payments',
      task:        'Payment API',
      detected_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    },

    trigger: {
      label:       'Owner Overloaded',
      type:        'OVERLOADED',
      before: {
        member:      'Smith',
        status:      'ACTIVE',
        capacity:    72,
        role:        'Payment API owner',
        provenance:  'REAL_DB',
      },
      after: {
        member:      'Smith',
        status:      'OVERLOADED',
        capacity:    91,
        role:        'Payment API owner',
        provenance:  'DERIVED',
      },
    },

    whyItMatters: {
      text: 'Payment API is a critical dependency for Gateway Tests and Security Review. Smith currently holds the highest task-specific context for the service (92%). His overloaded state creates ownership and context-transfer pressure on 3 downstream tasks.',
      evidence: [
        { label: 'Smith context score',          value: '92%',    prov: 'DERIVED' },
        { label: 'Downstream dependency count',   value: '3',      prov: 'SYNTHETIC_DEMO' },
        { label: 'Smith capacity',                value: '91%',    prov: 'DERIVED' },
        { label: 'P0 tasks owned',                value: '2',      prov: 'REAL_DB' },
      ],
    },

    impactMap: {
      project:      { name: 'Payments', health: 'HIGH', provenance: 'DERIVED' },
      task:         { name: 'Payment API', priority: 'P0', status: 'In Progress', provenance: 'REAL_DB' },
      owner:        { name: 'Smith', status: 'OVERLOADED', capacity: 91, provenance: 'DERIVED' },
      deadline:     { label: '18h remaining', value: 18, unit: 'hours', provenance: 'SYNTHETIC_DEMO' },
      downstream:   [
        { name: 'Gateway Tests',   status: 'AT_RISK', owner: 'Ankush', provenance: 'SYNTHETIC_DEMO' },
        { name: 'Security Review', status: 'AT_RISK', owner: 'Riya',   provenance: 'SYNTHETIC_DEMO' },
        { name: 'Deployment',      status: 'BLOCKED', owner: 'Karthik',provenance: 'SYNTHETIC_DEMO' },
      ],
      responsibilities: [
        { name: 'Payment API', coverage: 'FRAGILE', provenance: 'DERIVED' },
      ],
      availableMembers: [
        { name: 'Rahul', capacity: 62, status: 'BUSY',      contextScore: 38, contextLabel: 'MEDIUM', provenance: 'DERIVED' },
        { name: 'Riya',  capacity: 58, status: 'BUSY',      contextScore: 44, contextLabel: 'MEDIUM', provenance: 'DERIVED' },
        { name: 'Karthik',capacity:20, status: 'AVAILABLE', contextScore: 15, contextLabel: 'LOW',    provenance: 'DERIVED' },
      ],
      aiWorkers: [
        { name: 'Coding Agent',   status: 'AVAILABLE', capability: 'Implementation support' },
        { name: 'Test Agent',     status: 'AVAILABLE', capability: 'Automated test generation' },
        { name: 'Review Agent',   status: 'STANDBY',   capability: 'Code review assistance' },
      ],
    },

    engineeringSnapshot: {
      owner: {
        name: 'Smith', capacity: 91, contextScore: 92, status: 'OVERLOADED',
        active_tasks: 5, critical_tasks: 2, provenance: 'DERIVED',
      },
      candidates: [
        { name: 'Rahul',   capacity: 62, contextScore: 38, status: 'BUSY',      provenance: 'DERIVED' },
        { name: 'Riya',    capacity: 58, contextScore: 44, status: 'BUSY',      provenance: 'DERIVED' },
        { name: 'Karthik', capacity: 20, contextScore: 15, status: 'AVAILABLE', provenance: 'DERIVED' },
      ],
    },

    knowledgeConcentration: {
      task:             'Payment API',
      primaryOwner:     'Smith',
      primaryContext:   92,
      backup:           'Rahul',
      backupContext:    38,
      backupLabel:      'MEDIUM',
      critical:         true,
      provenance:       'DERIVED',
    },

    responsibilityCoverage: {
      task:             'Payment API',
      owner:            'Smith',
      ownerStatus:      'OVERLOADED',
      backup:           'Rahul',
      backupContext:    38,
      dependencyCount:  3,
      coverage:         'FRAGILE',
      provenance:       'DERIVED',
    },

    dependencyChain: [
      { id: 'd1', name: 'Payment API',    status: 'IN_PROGRESS', owner: 'Smith',  isAffected: true,  provenance: 'REAL_DB' },
      { id: 'd2', name: 'Gateway Tests',  status: 'AT_RISK',     owner: 'Ankush', isAffected: true,  provenance: 'SYNTHETIC_DEMO' },
      { id: 'd3', name: 'Security Review',status: 'AT_RISK',     owner: 'Riya',   isAffected: true,  provenance: 'SYNTHETIC_DEMO' },
      { id: 'd4', name: 'Deployment',     status: 'BLOCKED',     owner: 'Karthik',isAffected: true,  provenance: 'SYNTHETIC_DEMO' },
    ],

    agentActivity: [
      { id: 'a1', tool: 'get_task_state',         label: 'Trigger identified',              status: 'done',    detail: 'Payment API — Smith overloaded' },
      { id: 'a2', tool: 'get_task_context',        label: 'Task ownership inspected',        status: 'done',    detail: 'Smith: 92% context · P0 priority' },
      { id: 'a3', tool: 'get_team_presence',       label: 'Team availability checked',       status: 'done',    detail: '1 overloaded · 2 busy · 1 available' },
      { id: 'a4', tool: 'get_developer_profile',   label: 'Workload inspected',              status: 'done',    detail: 'Smith: 91% capacity · 5 active tasks' },
      { id: 'a5', tool: 'get_task_dependencies',   label: 'Dependency chain mapped',         status: 'done',    detail: '3 downstream tasks identified' },
      { id: 'a6', tool: 'check_responsibility',    label: 'Responsibility coverage checked', status: 'done',    detail: 'FRAGILE — backup context is 38%' },
      { id: 'a7', tool: 'get_ai_workers',          label: 'AI workers inspected',            status: 'done',    detail: 'Coding Agent · Test Agent available' },
      { id: 'a8', tool: 'prepare_simulation',      label: 'Preparing simulation inputs',     status: 'running', detail: 'Building scenario parameters…' },
    ],

    scenarioDefaults: {
      duration_hours:        72,
      duration_options:      [24, 48, 72],
      candidates:            ['Rahul', 'Riya'],
      interventionOptions: [
        { id: 'WAIT',              label: 'Wait',              description: 'Monitor — no immediate action' },
        { id: 'REASSIGN',          label: 'Reassign',          description: 'Transfer task ownership to a candidate' },
        { id: 'PAIR',              label: 'Pair Engineer',     description: 'Assign a co-owner to share the load' },
        { id: 'AI_ASSIST',         label: 'AI Assist',         description: 'Deploy Coding Agent to accelerate progress' },
        { id: 'KNOWLEDGE_TRANSFER',label: 'Knowledge Transfer',description: 'Structured handoff to backup engineer' },
      ],
      objectives: [
        { id: 'minimize_delay',     label: 'Minimize delivery delay' },
        { id: 'minimize_transfer',  label: 'Minimize context-transfer effort' },
        { id: 'protect_ownership',  label: 'Protect critical responsibilities' },
        { id: 'minimize_workload',  label: 'Minimize workload disruption' },
      ],
      predictionInputLabels: [
        'Task complexity', 'Repository familiarity', 'Dependency familiarity',
        'Project familiarity', 'Technology familiarity', 'Current workload', 'Handoff quality',
      ],
    },

    evidence: [
      { label: 'Owner availability',     source: 'REAL_DB',        value: 'Smith — OVERLOADED (91% capacity)' },
      { label: 'Task ownership',         source: 'REAL_DB',        value: 'Smith owns Payment API' },
      { label: 'Task priority',          source: 'REAL_DB',        value: 'P0 — Critical' },
      { label: 'Dependency relationships',source:'SYNTHETIC_DEMO', value: '3 downstream tasks' },
      { label: 'Context score',          source: 'DERIVED',        value: 'Smith: 92% on Payment API' },
      { label: 'Backup context',         source: 'DERIVED',        value: 'Rahul: 38% on Payment API' },
      { label: 'Deadline pressure',      source: 'SYNTHETIC_DEMO', value: '18h remaining' },
    ],
  };
}

// ── Decision type: NO_BACKUP ───────────────────────────────────────────────
function buildNoBackupDP() {
  return {
    decision: {
      id:          'dp2',
      severity:    'CRITICAL',
      type:        'NO_BACKUP',
      title:       'Security Review — No Qualified Backup',
      description: 'Riya owns Security Review (P0) with 2 downstream dependencies and no engineer with adequate context as backup.',
      project:     'Payments',
      task:        'Security Review',
      detected_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    },
    trigger: {
      label: 'No Qualified Backup',
      type:  'NO_BACKUP',
      before: { member: 'Riya', status: 'ACTIVE', capacity: 45, role: 'Security Review owner', provenance: 'REAL_DB' },
      after:  { member: 'Riya', status: 'BUSY',   capacity: 58, role: 'Security Review owner — no backup',  provenance: 'DERIVED' },
    },
    whyItMatters: {
      text: 'Security Review is a P0 task blocking Deployment. Riya is the sole owner with no engineer holding adequate context. Any disruption to Riya creates a single-point-of-failure risk for the Payments release.',
      evidence: [
        { label: 'Riya context score', value: '44%', prov: 'DERIVED' },
        { label: 'Available backup',   value: 'None with >40% context', prov: 'DERIVED' },
        { label: 'Downstream tasks',   value: '2', prov: 'SYNTHETIC_DEMO' },
        { label: 'Priority',           value: 'P0', prov: 'REAL_DB' },
      ],
    },
    impactMap: {
      project:  { name: 'Payments', health: 'CRITICAL', provenance: 'DERIVED' },
      task:     { name: 'Security Review', priority: 'P0', status: 'To Do', provenance: 'REAL_DB' },
      owner:    { name: 'Riya', status: 'BUSY', capacity: 58, provenance: 'DERIVED' },
      deadline: { label: '36h remaining', value: 36, unit: 'hours', provenance: 'SYNTHETIC_DEMO' },
      downstream: [
        { name: 'Deployment', status: 'BLOCKED', owner: 'Karthik', provenance: 'SYNTHETIC_DEMO' },
      ],
      responsibilities: [{ name: 'Security Review', coverage: 'CRITICAL', provenance: 'DERIVED' }],
      availableMembers: [
        { name: 'Smith', capacity: 91, status: 'OVERLOADED', contextScore: 15, contextLabel: 'LOW', provenance: 'DERIVED' },
        { name: 'Rahul', capacity: 62, status: 'BUSY',       contextScore: 12, contextLabel: 'LOW', provenance: 'DERIVED' },
      ],
      aiWorkers: [
        { name: 'Review Agent',  status: 'AVAILABLE', capability: 'Code review assistance' },
        { name: 'Test Agent',    status: 'AVAILABLE', capability: 'Test generation' },
      ],
    },
    engineeringSnapshot: {
      owner: { name: 'Riya', capacity: 58, contextScore: 44, status: 'BUSY', active_tasks: 3, critical_tasks: 1, provenance: 'DERIVED' },
      candidates: [
        { name: 'Smith', capacity: 91, contextScore: 15, status: 'OVERLOADED', provenance: 'DERIVED' },
        { name: 'Rahul', capacity: 62, contextScore: 12, status: 'BUSY',       provenance: 'DERIVED' },
      ],
    },
    knowledgeConcentration: {
      task: 'Security Review', primaryOwner: 'Riya', primaryContext: 44,
      backup: null, backupContext: 0, backupLabel: 'NONE', critical: true, provenance: 'DERIVED',
    },
    responsibilityCoverage: {
      task: 'Security Review', owner: 'Riya', ownerStatus: 'BUSY',
      backup: null, backupContext: 0, dependencyCount: 2, coverage: 'CRITICAL', provenance: 'DERIVED',
    },
    dependencyChain: [
      { id: 'd1', name: 'Security Review', status: 'TO_DO',   owner: 'Riya',   isAffected: true, provenance: 'REAL_DB' },
      { id: 'd2', name: 'Deployment',      status: 'BLOCKED', owner: 'Karthik',isAffected: true, provenance: 'SYNTHETIC_DEMO' },
    ],
    agentActivity: [
      { id: 'a1', tool: 'get_task_state',     label: 'Trigger identified',            status: 'done',    detail: 'Security Review — no backup' },
      { id: 'a2', tool: 'check_responsibility',label: 'Responsibility coverage checked',status: 'done',   detail: 'CRITICAL — no backup exists' },
      { id: 'a3', tool: 'get_team_presence',  label: 'Team availability checked',     status: 'done',    detail: 'No engineer with >40% context available' },
      { id: 'a4', tool: 'get_task_dependencies',label: 'Dependency chain mapped',     status: 'done',    detail: '1 downstream blocked task' },
      { id: 'a5', tool: 'prepare_simulation', label: 'Preparing simulation inputs',   status: 'running', detail: 'Building scenario parameters…' },
    ],
    scenarioDefaults: {
      duration_hours: 48,
      duration_options: [24, 48, 72],
      candidates: ['Smith', 'Rahul'],
      interventionOptions: [
        { id: 'WAIT',               label: 'Wait',               description: 'Monitor — no immediate action' },
        { id: 'KNOWLEDGE_TRANSFER', label: 'Knowledge Transfer', description: 'Structured handoff to candidate' },
        { id: 'AI_ASSIST',          label: 'AI Assist',          description: 'Deploy Review Agent to accelerate' },
        { id: 'PAIR',               label: 'Pair Engineer',      description: 'Assign co-reviewer with Riya' },
      ],
      objectives: [
        { id: 'minimize_delay',    label: 'Minimize delivery delay' },
        { id: 'minimize_transfer', label: 'Minimize context-transfer effort' },
        { id: 'protect_ownership', label: 'Protect critical responsibilities' },
      ],
      predictionInputLabels: [
        'Task complexity', 'Security familiarity', 'Dependency familiarity',
        'Project familiarity', 'Technology familiarity', 'Current workload', 'Handoff quality',
      ],
    },
    evidence: [
      { label: 'Task ownership', source: 'REAL_DB',        value: 'Riya owns Security Review' },
      { label: 'Task priority',  source: 'REAL_DB',        value: 'P0 — Critical' },
      { label: 'Backup',         source: 'DERIVED',        value: 'None with adequate context' },
      { label: 'Downstream',     source: 'SYNTHETIC_DEMO', value: '1 blocked task' },
      { label: 'Deadline',       source: 'SYNTHETIC_DEMO', value: '36h remaining' },
    ],
  };
}

// ── Decision type: AT_RISK_DEPENDENCY ─────────────────────────────────────
function buildAtRiskDependencyDP() {
  return {
    decision: {
      id:          'dp3',
      severity:    'MEDIUM',
      type:        'CRITICAL_WORK_AT_RISK',
      title:       'Analytics Pipeline — At-Risk Dependency',
      description: 'Data Pipeline Auth task is at risk, blocking Dashboard v2 delivery. Riya (owner) is at 58% capacity.',
      project:     'Analytics',
      task:        'Data Pipeline Auth',
      detected_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    },
    trigger: {
      label: 'Dependency At Risk',
      type:  'AT_RISK',
      before: { member: 'Riya', status: 'AVAILABLE', capacity: 35, role: 'Data Pipeline Auth owner', provenance: 'REAL_DB' },
      after:  { member: 'Riya', status: 'BUSY',      capacity: 58, role: 'Data Pipeline Auth owner', provenance: 'DERIVED' },
    },
    whyItMatters: {
      text: 'Data Pipeline Auth feeds directly into Dashboard v2. Riya\'s workload has increased, creating risk for the Analytics release timeline. One downstream task is already blocked.',
      evidence: [
        { label: 'Riya capacity', value: '58%', prov: 'DERIVED' },
        { label: 'Blocked tasks', value: '1', prov: 'SYNTHETIC_DEMO' },
        { label: 'At-risk chain', value: 'Data Pipeline → Dashboard', prov: 'SYNTHETIC_DEMO' },
      ],
    },
    impactMap: {
      project:  { name: 'Analytics', health: 'MEDIUM', provenance: 'DERIVED' },
      task:     { name: 'Data Pipeline Auth', priority: 'P2', status: 'To Do', provenance: 'REAL_DB' },
      owner:    { name: 'Riya', status: 'BUSY', capacity: 58, provenance: 'DERIVED' },
      deadline: { label: '72h remaining', value: 72, unit: 'hours', provenance: 'SYNTHETIC_DEMO' },
      downstream: [
        { name: 'Dashboard v2', status: 'BLOCKED', owner: 'Rahul', provenance: 'SYNTHETIC_DEMO' },
      ],
      responsibilities: [{ name: 'Data Pipeline Auth', coverage: 'PARTIAL', provenance: 'DERIVED' }],
      availableMembers: [
        { name: 'Rahul', capacity: 62, status: 'BUSY', contextScore: 55, contextLabel: 'MEDIUM', provenance: 'DERIVED' },
      ],
      aiWorkers: [
        { name: 'Coding Agent', status: 'AVAILABLE', capability: 'Implementation support' },
      ],
    },
    engineeringSnapshot: {
      owner: { name: 'Riya', capacity: 58, contextScore: 30, status: 'BUSY', active_tasks: 3, critical_tasks: 1, provenance: 'DERIVED' },
      candidates: [
        { name: 'Rahul', capacity: 62, contextScore: 55, status: 'BUSY', provenance: 'DERIVED' },
      ],
    },
    knowledgeConcentration: {
      task: 'Data Pipeline Auth', primaryOwner: 'Riya', primaryContext: 30,
      backup: 'Rahul', backupContext: 55, backupLabel: 'MEDIUM', critical: false, provenance: 'DERIVED',
    },
    responsibilityCoverage: {
      task: 'Data Pipeline Auth', owner: 'Riya', ownerStatus: 'BUSY',
      backup: 'Rahul', backupContext: 55, dependencyCount: 1, coverage: 'PARTIAL', provenance: 'DERIVED',
    },
    dependencyChain: [
      { id: 'd1', name: 'Data Pipeline Auth', status: 'AT_RISK', owner: 'Riya',  isAffected: true, provenance: 'SYNTHETIC_DEMO' },
      { id: 'd2', name: 'Dashboard v2',       status: 'BLOCKED', owner: 'Rahul', isAffected: true, provenance: 'SYNTHETIC_DEMO' },
    ],
    agentActivity: [
      { id: 'a1', tool: 'get_task_state',       label: 'Trigger identified',          status: 'done',    detail: 'Data Pipeline Auth — at risk' },
      { id: 'a2', tool: 'get_task_dependencies', label: 'Dependency chain mapped',    status: 'done',    detail: '1 blocked downstream task' },
      { id: 'a3', tool: 'get_team_presence',    label: 'Team availability checked',   status: 'done',    detail: 'Rahul available as backup' },
      { id: 'a4', tool: 'prepare_simulation',   label: 'Preparing simulation inputs', status: 'running', detail: 'Building scenario parameters…' },
    ],
    scenarioDefaults: {
      duration_hours: 48, duration_options: [24, 48, 72], candidates: ['Rahul'],
      interventionOptions: [
        { id: 'WAIT',     label: 'Wait',         description: 'Monitor — no immediate action' },
        { id: 'REASSIGN', label: 'Reassign',     description: 'Transfer to Rahul' },
        { id: 'PAIR',     label: 'Pair',         description: 'Riya + Rahul co-ownership' },
        { id: 'AI_ASSIST',label: 'AI Assist',    description: 'Deploy Coding Agent' },
      ],
      objectives: [
        { id: 'minimize_delay',    label: 'Minimize delivery delay' },
        { id: 'minimize_transfer', label: 'Minimize context-transfer effort' },
      ],
      predictionInputLabels: [
        'Task complexity', 'Pipeline familiarity', 'Dependency familiarity',
        'Current workload', 'Handoff quality',
      ],
    },
    evidence: [
      { label: 'Task ownership', source: 'REAL_DB',        value: 'Riya owns Data Pipeline Auth' },
      { label: 'Task status',    source: 'REAL_DB',        value: 'To Do' },
      { label: 'Capacity',       source: 'DERIVED',        value: 'Riya: 58%' },
      { label: 'Downstream',     source: 'SYNTHETIC_DEMO', value: '1 blocked task (Dashboard v2)' },
    ],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function severityToVariant(severity) {
  return { LOW: 'info', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' }[severity] ?? 'muted';
}

export function coverageToVariant(coverage) {
  return { STRONG: 'success', PARTIAL: 'warning', FRAGILE: 'danger', CRITICAL: 'danger' }[coverage] ?? 'muted';
}

export function depStatusToVariant(status) {
  return { IN_PROGRESS: 'info', AT_RISK: 'warning', BLOCKED: 'danger', TO_DO: 'muted', DONE: 'success' }[status] ?? 'muted';
}

export function availStatusColor(status) {
  return { AVAILABLE: 'var(--dv-success)', IDLE: 'var(--dv-text-faint)', BUSY: 'var(--dv-warning)', OVERLOADED: 'var(--dv-danger)' }[status] ?? 'var(--dv-text-faint)';
}

export function contextScoreToLabel(score) {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function provenanceLabel(prov) {
  return { REAL_DB: 'Real', DERIVED: 'Derived', SYNTHETIC_DEMO: 'Demo' }[prov] ?? prov;
}

export function provenanceColor(prov) {
  return { REAL_DB: 'var(--dv-success)', DERIVED: 'var(--dv-predicted)', SYNTHETIC_DEMO: 'var(--dv-warning)' }[prov] ?? 'var(--dv-text-faint)';
}

export function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins   = Math.floor(diffMs / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
