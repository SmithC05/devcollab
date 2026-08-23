/**
 * DevCollab Intelligence — Incident Response Data Adapter
 * Phase 4: Production Incident → AI Understanding → Engineering Impact →
 *          Historical Knowledge → What-If Simulation → Recommendation → Approval
 *
 * All API calls go to the existing /api/intelligence/incident/* endpoints.
 * No synthetic data in LIVE mode.
 */

import { useAuthStore } from '../../../stores/authStore';

const BASE = 'http://localhost:8000/api/intelligence';

function authHeaders() {
  const { accessToken, activeWorkspace } = useAuthStore.getState();
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
  if (activeWorkspace && activeWorkspace.id) {
    headers['X-Workspace-Id'] = activeWorkspace.id;
  }
  return headers;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { data });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Understand the incident message
// ─────────────────────────────────────────────────────────────────────────────
export async function submitIncidentMessage(message) {
  return post(`${BASE}/incident/understand/`, { message });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Analyze — blast radius, history, candidates
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeIncident(intent) {
  return post(`${BASE}/incident/analyze/`, { intent });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Simulate response interventions
// ─────────────────────────────────────────────────────────────────────────────
export async function simulateIncidentResponse({ incidentEventId, taskIds, candidateIds }) {
  return post(`${BASE}/incident/simulate/`, {
    incident_event_id: incidentEventId,
    task_ids: taskIds,
    candidate_ids: candidateIds,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Approve and execute the recommended response
// ─────────────────────────────────────────────────────────────────────────────
export async function approveIncidentResponse({ scenarioId, intervention, candidateId, incidentEventId }) {
  return post(`${BASE}/incident/approve/`, {
    scenario_id: scenarioId,
    intervention,
    candidate_id: candidateId,
    incident_event_id: incidentEventId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Send follow-up update (recovery, escalation, responder change)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendIncidentUpdate(eventId, message) {
  return post(`${BASE}/incident/${eventId}/update/`, { message });
}

// ─────────────────────────────────────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────────────────────────────────────

export function severityConfig(severity) {
  const CONFIGS = {
    CRITICAL: { color: 'var(--dv-danger)', bg: 'var(--dv-danger-subtle)', border: 'var(--dv-danger-border)', label: 'CRITICAL' },
    HIGH:     { color: 'var(--dv-warning)', bg: 'var(--dv-warning-subtle)', border: 'var(--dv-warning-border)', label: 'HIGH' },
    MEDIUM:   { color: 'var(--dv-info)', bg: 'var(--dv-info-subtle)', border: 'var(--dv-info-border)', label: 'MEDIUM' },
    LOW:      { color: 'var(--dv-success)', bg: 'var(--dv-success-subtle)', border: 'var(--dv-success-border)', label: 'LOW' },
  };
  return CONFIGS[severity] || CONFIGS.HIGH;
}

export function availabilityConfig(avail) {
  const CONFIGS = {
    AVAILABLE:   { color: 'var(--dv-success)', label: 'Available' },
    IDLE:        { color: 'var(--dv-warning)', label: 'Idle' },
    BUSY:        { color: 'var(--dv-warning)', label: 'Busy' },
    UNAVAILABLE: { color: 'var(--dv-danger)', label: 'Unavailable' },
    UNKNOWN:     { color: 'var(--dv-text-muted)', label: 'Unknown' },
  };
  return CONFIGS[avail] || CONFIGS.UNKNOWN;
}

export function evidenceTypeLabel(type) {
  return {
    WIKI_PAGE:           'Wiki',
    SNIPPET:             'Code Snippet',
    ENGINEERING_EVIDENCE:'GitHub Evidence',
    PREVIOUS_INCIDENT:   'Previous Incident',
  }[type] || type;
}

export function statusConfig(status) {
  const CONFIGS = {
    ACTIVE:              { color: 'var(--dv-danger)', label: 'LIVE INCIDENT', pulse: true },
    PARTIALLY_RESOLVED:  { color: 'var(--dv-warning)', label: 'PARTIAL RESOLUTION', pulse: false },
    RESOLVED:            { color: 'var(--dv-success)', label: 'RESOLVED', pulse: false },
  };
  return CONFIGS[status] || CONFIGS.ACTIVE;
}

export function timelineStepIcon(step) {
  const ICONS = {
    INCIDENT_REPORTED:       '🚨',
    IMPACT_IDENTIFIED:       '🗺️',
    HISTORY_SEARCHED:        '📚',
    CANDIDATES_EVALUATED:    '👥',
    RESPONSE_SIMULATED:      '⚡',
    RECOMMENDATION_GENERATED:'🧠',
    HUMAN_APPROVED:          '✅',
    RESPONSE_EXECUTED:       '⚙️',
    INCIDENT_RESOLUTION:     '✅',
    INCIDENT_UPDATE:         '📋',
    INCIDENT_ESCALATION:     '🔺',
    INCIDENT_RESPONDER_CHANGE:'🔄',
    INCIDENT_PARTIAL_RESOLUTION:'🔶',
  };
  return ICONS[step] || '•';
}

export function formatSystemName(system) {
  return system
    ? system.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Unknown System';
}

export function interventionLabel(type) {
  return {
    WAIT:              'Wait',
    REASSIGN:          'Reassign',
    PAIR:              'Pair',
    AI_ASSIST:         'AI Assist',
    PAIR_WITH_AI:      'Pair + AI',
    DE_SCOPE:          'De-scope',
    PARALLELIZE:       'Parallelize',
    KNOWLEDGE_TRANSFER:'Knowledge Transfer',
  }[type] || type;
}

export function riskColor(risk) {
  return {
    LOW:    'var(--dv-success)',
    MEDIUM: 'var(--dv-warning)',
    HIGH:   'var(--dv-danger)',
  }[risk] || 'var(--dv-text-muted)';
}
