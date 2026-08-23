/**
 * Engineering Command Center — Data Adapter
 *
 * Single interface between the backend API and the Intelligence UI.
 * Future: replace fetchCommandCenterState() implementation with a live
 * WebSocket/polling connection. The UI contract stays identical.
 *
 * API replacement point:
 *   - fetchCommandCenterState()  → GET /api/intelligence/command-center/
 *
 * Data source labeling:
 *   - system_status.source === 'LIVE'  → real DB data
 *   - system_status.source === 'DEMO'  → fixture / fallback data
 */

const API_BASE = 'http://127.0.0.1:8000/api';

// ── Fetch ──────────────────────────────────────────────────────────────────
export async function fetchCommandCenterState(authToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}/intelligence/command-center/`, { headers });
  if (!res.ok) throw new Error(`Command center API error: ${res.status}`);
  return res.json();
}

// ── Derived helpers (pure functions, no side effects) ─────────────────────

/** Returns the primary risk variant key for the design system badge. */
export function projectHealthToVariant(health) {
  return {
    STABLE:   'success',
    LOW:      'info',
    MEDIUM:   'warning',
    HIGH:     'danger',
    CRITICAL: 'danger',
  }[health] ?? 'muted';
}

/** Returns the dv-badge variant for a member availability status. */
export function availabilityToVariant(avail) {
  return {
    AVAILABLE:   'success',
    IDLE:        'muted',
    BUSY:        'warning',
    OVERLOADED:  'danger',
    UNAVAILABLE: 'muted',
  }[avail] ?? 'muted';
}

/** Maps decision point severity → DvBadge variant */
export function severityToVariant(severity) {
  return {
    CRITICAL: 'danger',
    HIGH:     'danger',
    MEDIUM:   'warning',
    LOW:      'info',
  }[severity] ?? 'muted';
}

/** Maps decision point type → human label */
export function decisionTypeToLabel(type) {
  return {
    ENGINEER_OVERLOADED:   'Engineer Overloaded',
    CRITICAL_WORK_AT_RISK: 'Critical Work At Risk',
    BLOCKED_WORK:          'Blocked Work',
    OWNER_UNAVAILABLE:     'Owner Unavailable',
    INCIDENT_RESPONSE:     'Incident Response',
    DEADLINE_COMPRESSION:  'Deadline Compression',
    SCOPE_INCREASE:        'Scope Increase',
  }[type] ?? type;
}

/** Maps decision point type → icon name string for lookup. */
export function decisionTypeToIcon(type) {
  return {
    ENGINEER_OVERLOADED:   'Zap',
    CRITICAL_WORK_AT_RISK: 'AlertTriangle',
    BLOCKED_WORK:          'Lock',
    OWNER_UNAVAILABLE:     'UserX',
    INCIDENT_RESPONSE:     'Activity',
    DEADLINE_COMPRESSION:  'Clock',
    SCOPE_INCREASE:        'TrendingUp',
  }[type] ?? 'AlertCircle';
}

/** Builds the initial DEMO fallback state used when the API is unavailable. */
export function buildDemoFallbackState() {
  const now = new Date().toISOString();
  return {
    organization: {
      member_count: 5, project_count: 3, active_project_count: 3,
      active_task_count: 24, blocked_task_count: 3, at_risk_task_count: 2,
      decision_point_count: 3,
    },
    projects: [
      {
        id: 1, name: 'Payments', is_active: true, health: 'HIGH',
        total_tasks: 12, active_tasks: 5, blocked_tasks: 2, at_risk_tasks: 1,
        done_tasks: 5, progress: 42, member_count: 3,
        members: [{ id: 1, name: 'Smith' }, { id: 2, name: 'Rahul' }, { id: 4, name: 'Riya' }],
        updated_at: now,
      },
      {
        id: 2, name: 'Platform', is_active: true, health: 'STABLE',
        total_tasks: 9, active_tasks: 4, blocked_tasks: 0, at_risk_tasks: 0,
        done_tasks: 5, progress: 56, member_count: 2,
        members: [{ id: 3, name: 'Ankush' }, { id: 5, name: 'Karthik' }],
        updated_at: now,
      },
      {
        id: 3, name: 'Analytics', is_active: true, health: 'MEDIUM',
        total_tasks: 7, active_tasks: 3, blocked_tasks: 1, at_risk_tasks: 1,
        done_tasks: 3, progress: 43, member_count: 2,
        members: [{ id: 2, name: 'Rahul' }, { id: 4, name: 'Riya' }],
        updated_at: now,
      },
    ],
    members: [
      {
        id: 1, name: 'Smith', username: 'Smith', email: 'smith@devcollab.io',
        role: 'OWNER', availability: 'OVERLOADED', capacity_pct: 91,
        active_task_count: 5, in_progress_tasks: 3, critical_task_count: 2,
        project_contexts: [{ project_id: 1, project_name: 'Payments', task_count: 4, context_score: 80 }],
      },
      {
        id: 2, name: 'Rahul', username: 'Rahul', email: 'rahul@devcollab.io',
        role: 'ADMIN', availability: 'BUSY', capacity_pct: 67,
        active_task_count: 3, in_progress_tasks: 2, critical_task_count: 0,
        project_contexts: [
          { project_id: 1, project_name: 'Payments', task_count: 2, context_score: 42 },
          { project_id: 3, project_name: 'Analytics', task_count: 1, context_score: 25 },
        ],
      },
      {
        id: 3, name: 'Ankush', username: 'Ankush', email: 'ankush@devcollab.io',
        role: 'MEMBER', availability: 'AVAILABLE', capacity_pct: 38,
        active_task_count: 2, in_progress_tasks: 1, critical_task_count: 0,
        project_contexts: [{ project_id: 2, project_name: 'Platform', task_count: 2, context_score: 55 }],
      },
      {
        id: 4, name: 'Riya', username: 'Riya', email: 'riya@devcollab.io',
        role: 'MEMBER', availability: 'BUSY', capacity_pct: 60,
        active_task_count: 3, in_progress_tasks: 2, critical_task_count: 1,
        project_contexts: [
          { project_id: 1, project_name: 'Payments', task_count: 1, context_score: 30 },
          { project_id: 3, project_name: 'Analytics', task_count: 2, context_score: 50 },
        ],
      },
      {
        id: 5, name: 'Karthik', username: 'Karthik', email: 'karthik@devcollab.io',
        role: 'MEMBER', availability: 'AVAILABLE', capacity_pct: 22,
        active_task_count: 1, in_progress_tasks: 0, critical_task_count: 0,
        project_contexts: [{ project_id: 2, project_name: 'Platform', task_count: 1, context_score: 30 }],
      },
    ],
    decision_points: [
      {
        id: 'dp-overload-1', severity: 'HIGH', type: 'ENGINEER_OVERLOADED',
        trigger: 'Smith is overloaded with 5 active tasks',
        impact: '2 critical task(s) at risk — Payments delivery blocked',
        affected_member: 'Smith', affected_project: 'Payments',
      },
      {
        id: 'dp-risk-1', severity: 'HIGH', type: 'CRITICAL_WORK_AT_RISK',
        trigger: 'P0 tasks in Payments not yet complete',
        impact: '1 critical task may miss deadline',
        affected_member: null, affected_project: 'Payments',
      },
      {
        id: 'dp-risk-3', severity: 'MEDIUM', type: 'CRITICAL_WORK_AT_RISK',
        trigger: 'P0 task in Analytics not yet complete',
        impact: '1 critical task at risk',
        affected_member: null, affected_project: 'Analytics',
      },
    ],
    system_status: { source: 'DEMO', last_synced: now, agent_status: 'MONITORING' },
  };
}
