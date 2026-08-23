import { apiClient } from '../../../api/client';
/**
 * Organization Intelligence — Data Adapter
 *
 * Provides the data contract for the Organization Intelligence page.
 * Source: DEMO_STATE (controlled fixture derived from real seed structure).
 *
 * API replacement point:
 *   Replace getOrganizationIntelligenceState() implementation to consume
 *   a real endpoint without changing any UI component.
 *
 * Provenance tags:
 *   REAL_DB        — value read directly from Django DB
 *   DERIVED        — computed/heuristic from real DB values
 *   SYNTHETIC_DEMO — plausible fixture; not from the DB
 */

// ── Types ─────────────────────────────────────────────────────────────────
// (JSDoc shapes — no TypeScript required)

/**
 * @typedef {Object} OrgMember
 * @property {number}   id
 * @property {string}   name
 * @property {string}   username
 * @property {string}   role
 * @property {string}   availability      AVAILABLE | BUSY | OVERLOADED | IDLE
 * @property {number}   capacity_pct      0-100
 * @property {number}   active_task_count
 * @property {number}   critical_task_count
 * @property {OwnedTask[]} owned_tasks
 * @property {ProjectContext[]} project_contexts
 * @property {string}   provenance
 */

/**
 * @typedef {Object} OwnedTask
 * @property {string} id
 * @property {string} title
 * @property {string} status
 * @property {string} priority         P0|P1|P2|P3
 * @property {string} project_name
 * @property {number} dependency_count downstream tasks blocked by this
 * @property {string} provenance
 */

/**
 * @typedef {Object} ProjectContext
 * @property {number} project_id
 * @property {string} project_name
 * @property {number} context_score    0-100
 * @property {string} context_label   HIGH|MEDIUM|LOW
 * @property {string} provenance
 */

/**
 * @typedef {Object} OrgProject
 * @property {number}   id
 * @property {string}   name
 * @property {string}   health          STABLE|MEDIUM|HIGH|CRITICAL
 * @property {number}   total_tasks
 * @property {number}   active_tasks
 * @property {number}   blocked_tasks
 * @property {number}   critical_tasks
 * @property {number}   done_tasks
 * @property {number}   progress
 * @property {string[]} owner_names
 * @property {Dependency[]} dependencies
 * @property {string}   knowledge_concentration  member name with most context
 * @property {string}   provenance
 */

/**
 * @typedef {Object} Dependency
 * @property {string} id
 * @property {string} title
 * @property {string} upstream_task     task this depends on
 * @property {string} downstream_task   task blocked by this
 * @property {string} owner
 * @property {string} status            ACTIVE|BLOCKED|AT_RISK
 * @property {string} project_name
 * @property {string} provenance
 */

/**
 * @typedef {Object} Responsibility
 * @property {string} id
 * @property {string} title
 * @property {string} owner
 * @property {string} backup            member name or null
 * @property {number} backup_context    0-100
 * @property {number} dependency_count
 * @property {string} coverage          STRONG|PARTIAL|FRAGILE|CRITICAL
 * @property {string} project_name
 * @property {string} provenance
 */

/**
 * @typedef {Object} AgentToolAction
 * @property {string} id
 * @property {string} tool               internal tool name (not exposed in UI)
 * @property {string} label              human-readable action label
 * @property {string} status             done|running|pending
 * @property {string} [detail]           optional human-readable result
 */

// ── Main Adapter ──────────────────────────────────────────────────────────

export async function getOrganizationIntelligenceState(mode = 'LIVE') {
  if (mode === 'DEMO') {
    return buildDemoState();
  }

  try {
    const rawData = await apiClient('/intelligence/command-center/');
    
    // Explicitly map snake_case to camelCase and set null for unavailable signals
    const data = {
      organization: rawData.organization,
      projects: rawData.projects,
      members: rawData.members,
      decisionPoints: rawData.decision_points || [],
      systemStatus: rawData.system_status || { source: 'LIVE', last_synced: new Date().toISOString(), agent_status: 'IDLE' },
      responsibilities: null, 
      dependencies: null
    };
    
    return data;
  } catch (error) {
    console.error('Failed to fetch live engineering state:', error);
    // Return empty state rather than demo state on error
    return {
      organization: { member_count: 0, project_count: 0, active_task_count: 0, dependency_count: 0, decision_point_count: 0 },
      members: [],
      projects: [],
      responsibilities: null,
      dependencies: null,
      decisionPoints: [],
      agentActivity: [],
      analysisSummary: '',
      systemStatus: { source: 'LIVE DATA UNAVAILABLE', last_synced: new Date().toISOString(), agent_status: 'ERROR' },
    };
  }
}

export async function getMemberEvidence(memberId, taskId = null) {
  try {
    let url = `/intelligence/members/${memberId}/evidence/`;
    if (taskId) url += `?task_id=${taskId}`;
    return await apiClient(url);
  } catch (error) {
    console.error('Failed to fetch member evidence:', error);
    return null;
  }
}

export async function compareTaskCandidates(taskId) {
  try {
    return await apiClient(`/intelligence/compare/?task_id=${taskId}`);
  } catch (error) {
    console.error('Failed to fetch task comparison:', error);
    return null;
  }
}

// ── Demo State ────────────────────────────────────────────────────────────
// Derived from the seed script (Smith/Rahul/Ankush/Riya/Karthik, Payments project).
// Extended with plausible multi-project structure for visual richness.

function buildDemoState() {
  const now = new Date().toISOString();

  const members = [
    {
      id: 1, name: 'Smith', username: 'Smith', role: 'Owner',
      availability: 'OVERLOADED', capacity_pct: 91,
      active_task_count: 5, critical_task_count: 2,
      provenance: 'DERIVED',
      owned_tasks: [
        { id: 't1', title: 'Payment API',      status: 'In Progress', priority: 'P0', project_name: 'Payments', dependency_count: 3, provenance: 'REAL_DB' },
        { id: 't2', title: 'Auth Gateway',     status: 'In Progress', priority: 'P1', project_name: 'Payments', dependency_count: 1, provenance: 'REAL_DB' },
        { id: 't3', title: 'Core DB Schema',   status: 'To Do',       priority: 'P1', project_name: 'Platform', dependency_count: 2, provenance: 'REAL_DB' },
        { id: 't4', title: 'Webhook Handler',  status: 'In Progress', priority: 'P2', project_name: 'Payments', dependency_count: 0, provenance: 'REAL_DB' },
        { id: 't5', title: 'API Rate Limiter', status: 'To Do',       priority: 'P2', project_name: 'Platform', dependency_count: 0, provenance: 'REAL_DB' },
      ],
      project_contexts: [
        { project_id: 1, project_name: 'Payments', context_score: 92, context_label: 'HIGH',   provenance: 'DERIVED' },
        { project_id: 2, project_name: 'Platform', context_score: 41, context_label: 'MEDIUM', provenance: 'DERIVED' },
        { project_id: 3, project_name: 'Analytics',context_score: 12, context_label: 'LOW',    provenance: 'SYNTHETIC_DEMO' },
      ],
    },
    {
      id: 2, name: 'Rahul', username: 'Rahul', role: 'Admin',
      availability: 'BUSY', capacity_pct: 62,
      active_task_count: 3, critical_task_count: 0,
      provenance: 'DERIVED',
      owned_tasks: [
        { id: 't6', title: 'Frontend Integration', status: 'In Progress', priority: 'P1', project_name: 'Payments',  dependency_count: 2, provenance: 'REAL_DB' },
        { id: 't7', title: 'Dashboard v2',         status: 'In Progress', priority: 'P2', project_name: 'Analytics', dependency_count: 0, provenance: 'REAL_DB' },
        { id: 't8', title: 'SDK Release Notes',    status: 'To Do',       priority: 'P3', project_name: 'Platform',  dependency_count: 0, provenance: 'REAL_DB' },
      ],
      project_contexts: [
        { project_id: 1, project_name: 'Payments',  context_score: 38, context_label: 'MEDIUM', provenance: 'DERIVED' },
        { project_id: 3, project_name: 'Analytics', context_score: 55, context_label: 'MEDIUM', provenance: 'DERIVED' },
        { project_id: 2, project_name: 'Platform',  context_score: 20, context_label: 'LOW',    provenance: 'SYNTHETIC_DEMO' },
      ],
    },
    {
      id: 3, name: 'Ankush', username: 'Ankush', role: 'Member',
      availability: 'AVAILABLE', capacity_pct: 28,
      active_task_count: 1, critical_task_count: 0,
      provenance: 'DERIVED',
      owned_tasks: [
        { id: 't9', title: 'Gateway Tests', status: 'To Do', priority: 'P1', project_name: 'Payments', dependency_count: 1, provenance: 'REAL_DB' },
      ],
      project_contexts: [
        { project_id: 2, project_name: 'Platform',  context_score: 60, context_label: 'HIGH',   provenance: 'DERIVED' },
        { project_id: 1, project_name: 'Payments',  context_score: 25, context_label: 'LOW',    provenance: 'DERIVED' },
      ],
    },
    {
      id: 4, name: 'Riya', username: 'Riya', role: 'Member',
      availability: 'BUSY', capacity_pct: 58,
      active_task_count: 3, critical_task_count: 1,
      provenance: 'DERIVED',
      owned_tasks: [
        { id: 't10', title: 'Security Review',    status: 'To Do',       priority: 'P0', project_name: 'Payments',  dependency_count: 2, provenance: 'REAL_DB' },
        { id: 't11', title: 'Threat Modelling',   status: 'In Progress', priority: 'P1', project_name: 'Platform',  dependency_count: 0, provenance: 'REAL_DB' },
        { id: 't12', title: 'Data Pipeline Auth', status: 'To Do',       priority: 'P2', project_name: 'Analytics', dependency_count: 1, provenance: 'REAL_DB' },
      ],
      project_contexts: [
        { project_id: 1, project_name: 'Payments',  context_score: 44, context_label: 'MEDIUM', provenance: 'DERIVED' },
        { project_id: 2, project_name: 'Platform',  context_score: 70, context_label: 'HIGH',   provenance: 'DERIVED' },
        { project_id: 3, project_name: 'Analytics', context_score: 30, context_label: 'LOW',    provenance: 'SYNTHETIC_DEMO' },
      ],
    },
    {
      id: 5, name: 'Karthik', username: 'Karthik', role: 'Member',
      availability: 'AVAILABLE', capacity_pct: 20,
      active_task_count: 1, critical_task_count: 0,
      provenance: 'DERIVED',
      owned_tasks: [
        { id: 't13', title: 'Deployment', status: 'To Do', priority: 'P2', project_name: 'Payments', dependency_count: 4, provenance: 'REAL_DB' },
      ],
      project_contexts: [
        { project_id: 2, project_name: 'Platform',  context_score: 48, context_label: 'MEDIUM', provenance: 'DERIVED' },
        { project_id: 1, project_name: 'Payments',  context_score: 15, context_label: 'LOW',    provenance: 'DERIVED' },
      ],
    },
  ];

  const projects = [
    {
      id: 1, name: 'Payments', health: 'HIGH',
      total_tasks: 12, active_tasks: 5, blocked_tasks: 2, critical_tasks: 2, done_tasks: 5,
      progress: 42,
      owner_names: ['Smith', 'Rahul'],
      knowledge_concentration: 'Smith',
      provenance: 'DERIVED',
      dependencies: [
        { id: 'd1', title: 'Payment API → Gateway Tests', upstream_task: 'Payment API', downstream_task: 'Gateway Tests',   owner: 'Smith',  status: 'ACTIVE',   project_name: 'Payments', provenance: 'SYNTHETIC_DEMO' },
        { id: 'd2', title: 'Gateway Tests → Security Review', upstream_task: 'Gateway Tests', downstream_task: 'Security Review', owner: 'Ankush', status: 'AT_RISK', project_name: 'Payments', provenance: 'SYNTHETIC_DEMO' },
        { id: 'd3', title: 'Security Review → Deployment',  upstream_task: 'Security Review', downstream_task: 'Deployment', owner: 'Riya',   status: 'ACTIVE',   project_name: 'Payments', provenance: 'SYNTHETIC_DEMO' },
      ],
    },
    {
      id: 2, name: 'Platform', health: 'STABLE',
      total_tasks: 9, active_tasks: 3, blocked_tasks: 0, critical_tasks: 0, done_tasks: 6,
      progress: 67,
      owner_names: ['Ankush', 'Karthik'],
      knowledge_concentration: 'Ankush',
      provenance: 'DERIVED',
      dependencies: [
        { id: 'd4', title: 'Core DB Schema → SDK Release', upstream_task: 'Core DB Schema', downstream_task: 'SDK Release Notes', owner: 'Smith', status: 'ACTIVE', project_name: 'Platform', provenance: 'SYNTHETIC_DEMO' },
      ],
    },
    {
      id: 3, name: 'Analytics', health: 'MEDIUM',
      total_tasks: 7, active_tasks: 3, blocked_tasks: 1, critical_tasks: 1, done_tasks: 3,
      progress: 43,
      owner_names: ['Rahul', 'Riya'],
      knowledge_concentration: 'Rahul',
      provenance: 'DERIVED',
      dependencies: [
        { id: 'd5', title: 'Data Pipeline Auth → Dashboard', upstream_task: 'Data Pipeline Auth', downstream_task: 'Dashboard v2', owner: 'Riya', status: 'AT_RISK', project_name: 'Analytics', provenance: 'SYNTHETIC_DEMO' },
      ],
    },
  ];

  const responsibilities = [
    {
      id: 'r1', title: 'Payment API', owner: 'Smith', backup: 'Rahul',
      backup_context: 38, dependency_count: 3,
      coverage: 'FRAGILE', project_name: 'Payments',
      provenance: 'DERIVED',
    },
    {
      id: 'r2', title: 'Gateway Tests', owner: 'Ankush', backup: 'Rahul',
      backup_context: 38, dependency_count: 1,
      coverage: 'PARTIAL', project_name: 'Payments',
      provenance: 'DERIVED',
    },
    {
      id: 'r3', title: 'Security Review', owner: 'Riya', backup: null,
      backup_context: 0, dependency_count: 2,
      coverage: 'CRITICAL', project_name: 'Payments',
      provenance: 'DERIVED',
    },
    {
      id: 'r4', title: 'Deployment', owner: 'Karthik', backup: 'Smith',
      backup_context: 15, dependency_count: 4,
      coverage: 'FRAGILE', project_name: 'Payments',
      provenance: 'DERIVED',
    },
    {
      id: 'r5', title: 'Core DB Schema', owner: 'Smith', backup: 'Ankush',
      backup_context: 60, dependency_count: 2,
      coverage: 'PARTIAL', project_name: 'Platform',
      provenance: 'DERIVED',
    },
  ];

  const dependencies = [
    { id: 'd1', upstream: 'Payment API',      downstream: 'Gateway Tests',   owner: 'Smith',  status: 'ACTIVE',   project: 'Payments', provenance: 'SYNTHETIC_DEMO' },
    { id: 'd2', upstream: 'Gateway Tests',    downstream: 'Security Review', owner: 'Ankush', status: 'AT_RISK',  project: 'Payments', provenance: 'SYNTHETIC_DEMO' },
    { id: 'd3', upstream: 'Security Review',  downstream: 'Deployment',      owner: 'Riya',   status: 'ACTIVE',   project: 'Payments', provenance: 'SYNTHETIC_DEMO' },
    { id: 'd4', upstream: 'Core DB Schema',   downstream: 'SDK Release',     owner: 'Smith',  status: 'ACTIVE',   project: 'Platform', provenance: 'SYNTHETIC_DEMO' },
    { id: 'd5', upstream: 'Data Pipeline Auth', downstream: 'Dashboard v2',  owner: 'Riya',   status: 'AT_RISK',  project: 'Analytics',provenance: 'SYNTHETIC_DEMO' },
  ];

  const decisionPoints = [
    {
      id: 'dp1', severity: 'HIGH', type: 'ENGINEER_OVERLOADED',
      trigger: 'Smith is overloaded (91% capacity) with 5 active tasks including 2 critical',
      impact: 'Payment API (P0) is owned by an overloaded engineer with 3 downstream dependencies',
      affected_member: 'Smith', affected_project: 'Payments',
      evidence: [
        { label: 'Capacity', value: '91%', provenance: 'DERIVED', rationale: 'Derived from member task count.' },
        { label: 'Active Tasks', value: '5', provenance: 'REAL_DB', rationale: 'Total tasks in In Progress state.' },
        { label: 'Critical Tasks', value: '2', provenance: 'REAL_DB', rationale: 'Tasks with P0 or P1 priority.' },
        { label: 'Downstream deps', value: '3', provenance: 'SYNTHETIC_DEMO', rationale: 'Demo data for downstream tasks.' },
      ],
    },
    {
      id: 'dp2', severity: 'CRITICAL', type: 'NO_BACKUP',
      trigger: 'Security Review (P0) has no qualified backup',
      impact: 'Riya owns a P0 task with 2 downstream dependencies and no backup with adequate context',
      affected_member: 'Riya', affected_project: 'Payments',
      evidence: [
        { label: 'Owner', value: 'Riya', provenance: 'REAL_DB', rationale: 'Task is assigned to Riya.' },
        { label: 'Backup', value: 'None', provenance: 'DERIVED', rationale: 'No other engineer has high context.' },
        { label: 'Priority', value: 'P0', provenance: 'REAL_DB', rationale: 'Highest priority label.' },
        { label: 'Downstream deps', value: '2', provenance: 'SYNTHETIC_DEMO', rationale: 'Demo data for downstream tasks.' },
      ],
    },
    {
      id: 'dp3', severity: 'MEDIUM', type: 'CRITICAL_WORK_AT_RISK',
      trigger: 'Analytics pipeline has blocked dependency',
      impact: 'Data Pipeline Auth → Dashboard v2 chain is at risk',
      affected_member: 'Riya', affected_project: 'Analytics',
      evidence: [
        { label: 'Blocked chain', value: 'Data Pipeline → Dashboard', provenance: 'SYNTHETIC_DEMO', rationale: 'Dependency extracted from demo state.' },
        { label: 'Owner capacity', value: '58%', provenance: 'DERIVED', rationale: 'Derived from assigned active tasks.' },
      ],
    },
  ];

  const agentActivity = [
    { id: 'a1', tool: 'get_workspace_state',   label: 'Engineering state loaded',      status: 'done',    detail: '3 projects · 5 members' },
    { id: 'a2', tool: 'get_project_state',     label: 'Reading project states',        status: 'done',    detail: 'Payments · Platform · Analytics' },
    { id: 'a3', tool: 'get_team_presence',     label: 'Checking team availability',    status: 'done',    detail: '2 overloaded · 2 busy · 2 available' },
    { id: 'a4', tool: 'get_task_context',      label: 'Inspecting task context',       status: 'done',    detail: '13 active tasks mapped' },
    { id: 'a5', tool: 'get_task_dependencies', label: 'Mapping dependencies',          status: 'done',    detail: '5 dependency chains found' },
    { id: 'a6', tool: 'get_developer_profile', label: 'Building developer profiles',   status: 'done',    detail: 'Context scores computed' },
    { id: 'a7', tool: 'check_responsibility',  label: 'Evaluating responsibility coverage', status: 'running', detail: 'Checking backup coverage…' },
    { id: 'a8', tool: 'identify_pressure',     label: 'Identifying decision pressure', status: 'pending', detail: undefined },
  ];

  const analysisSummary = buildAnalysisSummary(members, projects, responsibilities, decisionPoints);

  return {
    organization: {
      name:              'DevCollab Engineering',
      member_count:      members.length,
      project_count:     projects.length,
      active_task_count: members.reduce((s, m) => s + m.active_task_count, 0),
      dependency_count:  dependencies.length,
      decision_point_count: decisionPoints.length,
    },
    members,
    projects,
    responsibilities,
    dependencies,
    decisionPoints,
    agentActivity,
    analysisSummary,
    systemStatus: { source: 'DEMO', last_synced: now, agent_status: 'ANALYZING' },
  };
}

// ── Analysis summary builder ───────────────────────────────────────────────
// Derives a human-readable summary from structured data.
// Does NOT use hardcoded narrative strings unrelated to the data.
function buildAnalysisSummary(members, projects, responsibilities, decisionPoints) {
  const overloaded  = members.filter(m => m.availability === 'OVERLOADED');
  const critical    = responsibilities.filter(r => r.coverage === 'CRITICAL' || r.coverage === 'FRAGILE');
  const highProject = projects.find(p => p.health === 'HIGH' || p.health === 'CRITICAL');
  const noBkp       = responsibilities.find(r => !r.backup && r.coverage === 'CRITICAL');

  let text = '';
  if (highProject) {
    const lead = highProject.knowledge_concentration;
    const leadMember = members.find(m => m.name === lead);
    text += `${highProject.name} contains a concentration of critical ownership around ${lead}. `;
    if (leadMember) {
      text += `${lead} currently holds high task-specific context (${
        leadMember.project_contexts.find(c => c.project_name === highProject.name)?.context_score ?? '?'
      }% context score) but also carries ${leadMember.capacity_pct}% workload. `;
    }
  }
  if (noBkp) {
    text += `${noBkp.title} in ${noBkp.project_name} has no qualified backup — this is a single-point-of-failure responsibility. `;
  }
  if (overloaded.length > 0) {
    text += `${overloaded.map(m => m.name).join(', ')} ${overloaded.length === 1 ? 'is' : 'are'} overloaded. `;
  }
  if (decisionPoints.length > 0) {
    text += `${decisionPoints.length} decision point${decisionPoints.length === 1 ? '' : 's'} identified require engineering leadership attention.`;
  }
  return text.trim();
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function coverageToVariant(coverage) {
  return { STRONG: 'success', PARTIAL: 'warning', FRAGILE: 'danger', CRITICAL: 'danger' }[coverage] ?? 'muted';
}

export function contextLabelToVariant(label) {
  return { HIGH: 'success', MEDIUM: 'warning', LOW: 'danger' }[label] ?? 'muted';
}

export function availabilityToVariant(avail) {
  return { AVAILABLE: 'success', IDLE: 'muted', BUSY: 'warning', OVERLOADED: 'danger' }[avail] ?? 'muted';
}

export function healthToVariant(health) {
  return { STABLE: 'success', LOW: 'info', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' }[health] ?? 'muted';
}

export function depStatusToVariant(status) {
  return { ACTIVE: 'info', BLOCKED: 'danger', AT_RISK: 'warning' }[status] ?? 'muted';
}

export function provenanceLabel(prov) {
  return { REAL_DB: 'Real', DERIVED: 'Derived', SYNTHETIC_DEMO: 'Demo' }[prov] ?? prov;
}
