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

export async function getUnassignedTasks() {
  try {
    return await apiClient('/intelligence/unassigned-tasks/');
  } catch (error) {
    console.error('Failed to fetch unassigned tasks:', error);
    return { tasks: [] };
  }
}

export async function recommendAndAssignTask(taskId, developerId) {
  try {
    return await apiClient('/intelligence/recommend-assign/', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, developer_id: developerId }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to assign task:', error);
    throw error;
  }
}

export async function summarizeMemberEvidence(memberId) {
  try {
    return await apiClient(`/intelligence/members/${memberId}/summarize/`);
  } catch (error) {
    console.error('Failed to summarize member evidence:', error);
    return { summary: 'Summary unavailable.' };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function coverageToVariant(coverage) {
  return { STRONG: 'success', PARTIAL: 'warning', FRAGILE: 'danger', CRITICAL: 'danger' }[coverage] ?? 'muted';
}

export function contextLabelToVariant(label) {
  return { HIGH: 'success', MEDIUM: 'warning', LOW: 'danger' }[label] ?? 'muted';
}

export function availabilityToVariant(avail) {
  return { AVAILABLE: 'success', IDLE: 'muted', BUSY: 'warning', OVERLOADED: 'danger', UNAVAILABLE: 'danger' }[avail] ?? 'muted';
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
