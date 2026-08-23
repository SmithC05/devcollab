/**
 * IncidentResponse — Phase 4
 * Route: /dashboard/intelligence/incident
 *
 * Production Incident → AI Understanding → Engineering Impact Analysis →
 * Responsible Engineers → Historical Knowledge → What-If Simulation →
 * Recommendation → Human Approval → Real Engineering Action
 *
 * Architecture:
 * - All data comes from real backend endpoints
 * - Reuses existing simulation engine, SimulationResults, ApprovalPanel
 * - WebSocket updates trigger re-evaluation warnings
 * - No fake data in LIVE mode
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Activity, ArrowRight, Brain, CheckCircle,
  ChevronRight, Clock, Database, Eye, GitBranch, Globe,
  Link2, RefreshCw, Send, Shield, Users, X, Zap,
  BookOpen, Cpu, Radio, Target, BarChart2, AlertCircle,
  Info, UserCheck, Layers,
} from 'lucide-react';

import '../styles/tokens.css';
import '../styles/components.css';

import {
  DvBadge, DvCard, DvButton, DvDivider, DvAvatar,
} from '../primitives/core';

import { DvAgentStatus, DvAgentStep } from '../primitives/agent';
import { SimulationResults } from '../components/SimulationResults';

import {
  submitIncidentMessage, analyzeIncident, simulateIncidentResponse,
  approveIncidentResponse, sendIncidentUpdate,
  severityConfig, availabilityConfig, evidenceTypeLabel,
  statusConfig, timelineStepIcon, formatSystemName,
  interventionLabel, riskColor,
} from '../data/incidentAdapter';

import { fadeUp, staggerChildren, panelEnter, slideIn } from '../motion/presets';
import { useAuthStore } from '../../../stores/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const AGENT_STEPS = [
  { id: 'understand',  label: 'Incident understood' },
  { id: 'project',     label: 'Payment project identified' },
  { id: 'work',        label: 'Affected work mapped' },
  { id: 'engineers',   label: 'Responsible engineers identified' },
  { id: 'avail',       label: 'Availability checked' },
  { id: 'history',     label: 'Historical resolutions searched' },
  { id: 'evaluate',    label: 'Evaluating response options' },
];

const SUGGESTED_MESSAGES = [
  "Payment gateway is failing in production. Transactions are timing out.",
  "Payments are timing out in production.",
  "Payment gateway is down.",
  "Production payments are failing.",
  "Customers cannot complete payments.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Micro-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ label, icon: Icon, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={13} color="var(--dv-text-faint)" />}
        <span style={{
          fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dv-text-muted)',
        }}>{label}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--dv-text-faint)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const colors = { P0: 'var(--dv-danger)', P1: 'var(--dv-warning)', P2: 'var(--dv-info)', P3: 'var(--dv-text-muted)' };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: 'var(--dv-font-mono)',
      padding: '1px 5px', borderRadius: 3,
      background: `${colors[priority]}20`,
      border: `1px solid ${colors[priority]}40`,
      color: colors[priority],
    }}>{priority}</span>
  );
}

function StatusBubble({ status }) {
  const labels = { 'In Progress': 'IN PROGRESS', 'To Do': 'TO DO', 'In Review': 'IN REVIEW', 'Done': 'DONE' };
  const colors = { 'In Progress': 'var(--dv-info)', 'To Do': 'var(--dv-text-muted)', 'In Review': 'var(--dv-warning)', 'Done': 'var(--dv-success)' };
  const c = colors[status] || 'var(--dv-text-muted)';
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: 'var(--dv-font-mono)',
      padding: '1px 5px', borderRadius: 3,
      background: `${c}20`, border: `1px solid ${c}40`, color: c,
    }}>{labels[status] || status}</span>
  );
}

function AvailBadge({ availability }) {
  const cfg = availabilityConfig(availability);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: 'var(--dv-font-mono)',
      padding: '1px 5px', borderRadius: 3,
      background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, color: cfg.color,
    }}>{cfg.label.toUpperCase()}</span>
  );
}

function ContextBar({ score, level }) {
  const c = level === 'HIGH' ? 'var(--dv-success)' : level === 'MEDIUM' ? 'var(--dv-warning)' : 'var(--dv-text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--dv-bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.round(score * 100)}%`, height: '100%', background: c, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: c, fontWeight: 700 }}>
        {level}
      </span>
    </div>
  );
}

function MLBadge() {
  return (
    <span style={{
      fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
      fontFamily: 'var(--dv-font-mono)', padding: '1px 4px',
      borderRadius: 3, background: 'rgba(139,92,246,0.12)',
      border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa',
    }}>ML PREDICTION</span>
  );
}

function EvidenceTypePip({ type }) {
  const colors = {
    WIKI_PAGE: 'var(--dv-info)', SNIPPET: 'var(--dv-success)',
    ENGINEERING_EVIDENCE: 'var(--dv-warning)', PREVIOUS_INCIDENT: 'var(--dv-danger)',
  };
  const c = colors[type] || 'var(--dv-text-muted)';
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, fontFamily: 'var(--dv-font-mono)',
      padding: '1px 4px', borderRadius: 3,
      background: `${c}15`, border: `1px solid ${c}30`, color: c,
    }}>{evidenceTypeLabel(type)}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function IncidentResponse() {
  const navigate = useNavigate();
  const { activeWorkspace } = useAuthStore();

  // ── Input state ──────────────────────────────────────────────────────────
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // ── Pipeline state ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState('INPUT'); // INPUT | UNDERSTANDING | ANALYZING | READY | SIMULATING | SIMULATED | APPROVING | APPROVED | RESOLVED
  const [error, setError] = useState(null);
  const [agentStepIdx, setAgentStepIdx] = useState(-1);

  // ── Data state ───────────────────────────────────────────────────────────
  const [intent, setIntent] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [approvalResult, setApprovalResult] = useState(null);

  // ── Follow-up state ──────────────────────────────────────────────────────
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [followUpResult, setFollowUpResult] = useState(null);
  const [needsReeval, setNeedsReeval] = useState(false);

  // ── Simulation UI state ──────────────────────────────────────────────────
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState(null);

  // ── WebSocket re-eval ────────────────────────────────────────────────────
  const [wsIncidentUpdate, setWsIncidentUpdate] = useState(null);
  const wsRef = useRef(null);

  // ── WebSocket subscription ───────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/workspace/?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'engine_event' && msg.payload) {
          const et = msg.payload.event_type;
          if (et === 'INCIDENT_RESPONSE_APPROVED') {
            // Already approved — update UI
          } else if (et === 'INCIDENT_RESOLUTION' || et === 'INCIDENT_UPDATE' || et === 'INCIDENT_ESCALATION' || et === 'INCIDENT_RESPONDER_CHANGE') {
            setWsIncidentUpdate(msg.payload);
            if (msg.payload.needs_reevaluation) setNeedsReeval(true);
          }
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  // ── Step 1: Submit incident message ─────────────────────────────────────
  const handleSubmit = useCallback(async (msg) => {
    const m = (msg || message).trim();
    if (!m) return;
    setMessage(m);
    setShowSuggestions(false);
    setPhase('UNDERSTANDING');
    setError(null);
    setAgentStepIdx(0);

    try {
      // Step 1: Understand
      const intentData = await submitIncidentMessage(m);

      if (intentData.needs_clarification) {
        setIntent({ needs_clarification: true, question: intentData.clarification_question });
        setPhase('INPUT');
        return;
      }

      setIntent(intentData);
      setAgentStepIdx(1);
      setPhase('ANALYZING');

      // Step 2: Analyze
      const analysisData = await analyzeIncident(intentData);
      setAnalysis(analysisData);
      setAgentStepIdx(6);
      setPhase('READY');

      // Pre-select available candidates
      const availableCands = (analysisData.candidates || [])
        .filter(c => c.availability !== 'UNAVAILABLE')
        .slice(0, 2)
        .map(c => c.id);
      setSelectedCandidateIds(availableCands);

    } catch (e) {
      console.error('Incident pipeline error:', e);
      setError(e.message || 'An error occurred during incident analysis.');
      setPhase('INPUT');
    }
  }, [message]);

  // ── Step 3: Simulate ─────────────────────────────────────────────────────
  const handleSimulate = useCallback(async () => {
    if (!analysis || selectedCandidateIds.length === 0) return;
    setPhase('SIMULATING');
    setError(null);

    const taskIds = analysis.affected_tasks?.map(t => t.id).filter(Boolean) || [];
    if (taskIds.length === 0 && analysis.reference_task_id) {
      taskIds.push(analysis.reference_task_id);
    }

    if (taskIds.length === 0) {
      setError('No affected tasks identified for simulation.');
      setPhase('READY');
      return;
    }

    try {
      const simData = await simulateIncidentResponse({
        incidentEventId: analysis.incident_event_id,
        taskIds,
        candidateIds: selectedCandidateIds,
      });
      setSimulation(simData);
      setSelectedScenarioId(simData.scenario_id);

      // Pre-select recommendation
      if (simData.recommendation) {
        setSelectedIntervention(simData.recommendation.intervention);
        setSelectedCandidateId(simData.recommendation.candidate_id);
      }

      setPhase('SIMULATED');
    } catch (e) {
      console.error('Simulation error:', e);
      setError(e.message || 'Simulation failed.');
      setPhase('READY');
    }
  }, [analysis, selectedCandidateIds]);

  // ── Step 4: Approve ──────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!selectedScenarioId || !selectedIntervention || !selectedCandidateId) return;
    setApprovalLoading(true);
    setApprovalError(null);

    try {
      const result = await approveIncidentResponse({
        scenarioId: selectedScenarioId,
        intervention: selectedIntervention,
        candidateId: selectedCandidateId,
        incidentEventId: analysis?.incident_event_id,
      });
      setApprovalResult(result);
      setPhase('APPROVED');
    } catch (e) {
      if (e.data?.error === 'INCIDENT_STATE_CHANGED') {
        setNeedsReeval(true);
        setApprovalError(e.data?.detail || 'Incident state changed — please re-evaluate.');
      } else {
        setApprovalError(e.message || 'Approval failed.');
      }
    } finally {
      setApprovalLoading(false);
    }
  }, [selectedScenarioId, selectedIntervention, selectedCandidateId, analysis]);

  // ── Follow-up message ────────────────────────────────────────────────────
  const handleFollowUp = useCallback(async () => {
    if (!followUpMessage.trim() || !analysis?.incident_event_id) return;
    try {
      const res = await sendIncidentUpdate(analysis.incident_event_id, followUpMessage);
      setFollowUpResult(res);
      setFollowUpMessage('');
      if (res.new_status === 'RESOLVED') setPhase('RESOLVED');
      if (res.needs_reevaluation) setNeedsReeval(true);
    } catch (e) {
      console.error('Follow-up failed:', e);
    }
  }, [followUpMessage, analysis]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setPhase('INPUT');
    setMessage('');
    setIntent(null);
    setAnalysis(null);
    setSimulation(null);
    setApprovalResult(null);
    setFollowUpResult(null);
    setNeedsReeval(false);
    setWsIncidentUpdate(null);
    setError(null);
    setSelectedCandidateIds([]);
    setSelectedScenarioId(null);
    setSelectedIntervention(null);
    setSelectedCandidateId(null);
    setAgentStepIdx(-1);
    setShowSuggestions(true);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const sevCfg = intent ? severityConfig(intent.severity) : null;
  const incidentStatus = followUpResult?.new_status || 'ACTIVE';
  const statusCfg = statusConfig(incidentStatus);
  const isActive = !['APPROVED', 'RESOLVED'].includes(phase);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="dv-intelligence"
      style={{
        minHeight: '100vh',
        background: 'var(--dv-bg-canvas)',
        fontFamily: 'var(--dv-font-sans)',
      }}
    >
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px 16px',
        borderBottom: '1px solid var(--dv-border-subtle)',
        background: 'var(--dv-bg-base)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/dashboard/intelligence/organization')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--dv-text-muted)', fontSize: 12, padding: '4px 8px',
              borderRadius: 6, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--dv-text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--dv-text-muted)'}
          >
            ← Intelligence
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--dv-border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={14} color="var(--dv-danger)" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dv-text-primary)' }}>
                Incident Response
              </div>
              <div style={{ fontSize: 11, color: 'var(--dv-text-muted)' }}>
                Production Incident Intelligence
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {analysis && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6,
              background: statusCfg.color + '15',
              border: `1px solid ${statusCfg.color}30`,
            }}>
              {statusCfg.pulse && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: statusCfg.color,
                  boxShadow: `0 0 6px ${statusCfg.color}`,
                  animation: 'dv-pulse 2s ease-in-out infinite',
                  flexShrink: 0,
                }} />
              )}
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--dv-font-mono)',
                color: statusCfg.color, letterSpacing: '0.08em',
              }}>{statusCfg.label}</span>
            </div>
          )}
          {phase !== 'INPUT' && (
            <DvButton variant="ghost" size="sm" onClick={handleReset} id="incident-reset-btn">
              <RefreshCw size={12} />
              New Incident
            </DvButton>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 61px)' }}>
        {/* ── Main content ────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', maxWidth: 900 }}>
          <motion.div variants={staggerChildren} initial="hidden" animate="visible">

            {/* ── INPUT PHASE ─────────────────────────────────────────── */}
            <motion.div variants={fadeUp}>
              <DvCard style={{ marginBottom: 20 }}>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Radio size={14} color="var(--dv-danger)" />
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Report Incident
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      id="incident-message-input"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                      placeholder="Describe the incident in plain English…"
                      disabled={phase !== 'INPUT'}
                      style={{
                        flex: 1, padding: '10px 14px', fontSize: 13,
                        background: 'var(--dv-bg-surface)',
                        border: '1px solid var(--dv-border-default)',
                        borderRadius: 8, color: 'var(--dv-text-primary)',
                        fontFamily: 'var(--dv-font-sans)',
                        outline: 'none',
                        opacity: phase !== 'INPUT' ? 0.6 : 1,
                      }}
                    />
                    <DvButton
                      id="incident-submit-btn"
                      variant="danger"
                      onClick={() => handleSubmit()}
                      disabled={!message.trim() || phase !== 'INPUT'}
                    >
                      <Send size={14} />
                      Report
                    </DvButton>
                  </div>

                  {/* Clarification */}
                  <AnimatePresence>
                    {intent?.needs_clarification && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                          marginTop: 10, padding: '8px 12px', borderRadius: 6,
                          background: 'var(--dv-warning-subtle)', border: '1px solid var(--dv-warning-border)',
                          fontSize: 12, color: 'var(--dv-warning)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        <Info size={12} />
                        {intent.question}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                          marginTop: 10, padding: '8px 12px', borderRadius: 6,
                          background: 'var(--dv-danger-subtle)', border: '1px solid var(--dv-danger-border)',
                          fontSize: 12, color: 'var(--dv-danger)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        <AlertCircle size={12} />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Suggestions */}
                  {showSuggestions && phase === 'INPUT' && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 6, fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Example incidents
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {SUGGESTED_MESSAGES.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => { setMessage(s); handleSubmit(s); }}
                            style={{
                              padding: '4px 10px', fontSize: 11, borderRadius: 6,
                              background: 'var(--dv-bg-elevated)',
                              border: '1px solid var(--dv-border-subtle)',
                              color: 'var(--dv-text-secondary)', cursor: 'pointer',
                              fontFamily: 'var(--dv-font-sans)',
                              transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--dv-border-default)'; e.currentTarget.style.color = 'var(--dv-text-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dv-border-subtle)'; e.currentTarget.style.color = 'var(--dv-text-secondary)'; }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DvCard>
            </motion.div>

            {/* ── UNDERSTANDING / ANALYZING ───────────────────────────── */}
            <AnimatePresence>
              {(phase === 'UNDERSTANDING' || phase === 'ANALYZING') && (
                <motion.div
                  key="agent-status"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 20 }}
                >
                  <DvCard>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%', background: 'var(--dv-accent)',
                          boxShadow: '0 0 6px var(--dv-accent)', animation: 'dv-pulse 1.5s ease-in-out infinite',
                        }} />
                        <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          DevCollab Incident Agent
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {AGENT_STEPS.map((step, i) => (
                          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: i < agentStepIdx ? 'var(--dv-success)' : i === agentStepIdx ? 'var(--dv-accent)' : 'var(--dv-bg-elevated)',
                              border: `1px solid ${i < agentStepIdx ? 'var(--dv-success)' : i === agentStepIdx ? 'var(--dv-accent)' : 'var(--dv-border-subtle)'}`,
                            }}>
                              {i < agentStepIdx
                                ? <CheckCircle size={8} color="white" />
                                : i === agentStepIdx
                                  ? <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: 'dv-pulse 1s ease-in-out infinite' }} />
                                  : null
                              }
                            </div>
                            <span style={{
                              fontSize: 11, color: i <= agentStepIdx ? 'var(--dv-text-primary)' : 'var(--dv-text-faint)',
                              fontWeight: i === agentStepIdx ? 600 : 400,
                            }}>
                              {i < agentStepIdx ? '✓ ' : i === agentStepIdx ? '→ ' : ''}{step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DvCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── INTENT CARD ─────────────────────────────────────────── */}
            <AnimatePresence>
              {intent && !intent.needs_clarification && (
                <motion.div
                  key="intent-card"
                  variants={fadeUp} initial="hidden" animate="visible"
                  style={{ marginBottom: 20 }}
                >
                  <DvCard style={{
                    border: `1px solid ${sevCfg.border}`,
                    background: sevCfg.bg,
                  }}>
                    <div style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 800, fontFamily: 'var(--dv-font-mono)',
                              padding: '3px 8px', borderRadius: 4,
                              background: sevCfg.color + '20', border: `1px solid ${sevCfg.border}`,
                              color: sevCfg.color, letterSpacing: '0.1em',
                            }}>{intent.severity}</span>
                            <span style={{
                              fontSize: 10, fontFamily: 'var(--dv-font-mono)',
                              color: 'var(--dv-text-muted)', letterSpacing: '0.06em',
                            }}>{intent.environment}</span>
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: sevCfg.color, marginBottom: 4 }}>
                            {formatSystemName(intent.system)}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--dv-text-secondary)' }}>
                            {intent.original_message}
                          </div>
                        </div>
                        {statusCfg.pulse && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 6,
                            background: 'var(--dv-danger-subtle)', border: '1px solid var(--dv-danger-border)',
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--dv-danger)', animation: 'dv-pulse 1s ease-in-out infinite' }} />
                            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--dv-danger)', fontFamily: 'var(--dv-font-mono)', letterSpacing: '0.1em' }}>LIVE INCIDENT</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(intent.symptoms || []).map((s, i) => (
                          <span key={i} style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 4,
                            background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
                            color: 'var(--dv-text-secondary)', fontFamily: 'var(--dv-font-mono)',
                          }}>{s.replace(/_/g, ' ')}</span>
                        ))}
                        <span style={{ fontSize: 10, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', padding: '2px 4px' }}>
                          via {intent.extraction_method === 'GEMINI' ? 'Gemini' : 'keyword analysis'}
                        </span>
                      </div>
                    </div>
                  </DvCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── ANALYSIS RESULTS ────────────────────────────────────── */}
            <AnimatePresence>
              {analysis && (
                <motion.div key="analysis" variants={fadeUp} initial="hidden" animate="visible">

                  {/* Impact */}
                  <DvCard style={{ marginBottom: 20 }}>
                    <div style={{ padding: '20px 24px' }}>
                      <SectionLabel label="Engineering Impact" icon={Layers} sub="Affected work derived from real project + dependency graph" />
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        {analysis.affected_project && (
                          <div style={{
                            padding: '8px 14px', borderRadius: 8,
                            background: 'var(--dv-danger-subtle)', border: '1px solid var(--dv-danger-border)',
                          }}>
                            <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Affected Project</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dv-text-primary)' }}>{analysis.affected_project.name}</div>
                          </div>
                        )}
                      </div>

                      {/* Affected tasks */}
                      {analysis.affected_tasks?.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Affected Work
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {analysis.affected_tasks.map(task => (
                              <div key={task.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', borderRadius: 6,
                                background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <PriorityBadge priority={task.priority} />
                                  <span style={{ fontSize: 12, color: 'var(--dv-text-primary)' }}>{task.title}</span>
                                  <StatusBubble status={task.status} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {task.owner && (
                                    <span style={{ fontSize: 11, color: 'var(--dv-text-muted)' }}>{task.owner.name}</span>
                                  )}
                                  {task.downstream_count > 0 && (
                                    <span style={{
                                      fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-warning)',
                                      padding: '1px 5px', borderRadius: 3, background: 'var(--dv-warning-subtle)', border: '1px solid var(--dv-warning-border)',
                                    }}>{task.downstream_count} downstream</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blast radius */}
                      {analysis.blast_radius?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Downstream (Blast Radius)
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {analysis.blast_radius.map(t => (
                              <span key={t.id} style={{
                                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                                background: 'var(--dv-warning-subtle)', border: '1px solid var(--dv-warning-border)',
                                color: 'var(--dv-warning)',
                              }}>{t.title}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DvCard>

                  {/* Responsible Engineers */}
                  <DvCard style={{ marginBottom: 20 }}>
                    <div style={{ padding: '20px 24px' }}>
                      <SectionLabel label="Responsible Engineers" icon={Users} sub="Owners from real task assignments + PresenceSession availability" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(analysis.responsible_engineers || []).map(eng => (
                          <div key={eng.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: 8,
                            background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <DvAvatar name={eng.name} size={28} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dv-text-primary)' }}>{eng.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>
                                  {(eng.tasks || []).map(t => t.title).join(', ')}
                                </div>
                              </div>
                            </div>
                            <AvailBadge availability={eng.availability} />
                          </div>
                        ))}
                        {(analysis.responsible_engineers || []).length === 0 && (
                          <div style={{ fontSize: 12, color: 'var(--dv-text-muted)', padding: '8px 0' }}>
                            No task owners identified from real data.
                          </div>
                        )}
                      </div>
                    </div>
                  </DvCard>

                  {/* Historical Knowledge */}
                  <DvCard style={{ marginBottom: 20 }}>
                    <div style={{ padding: '20px 24px' }}>
                      <SectionLabel label="Historical Knowledge" icon={BookOpen} sub="Retrieved from WikiPage, Snippets, EngineeringEvidence, previous incidents" />

                      {/* GenAI Summary */}
                      <div style={{
                        padding: '12px 16px', borderRadius: 8, marginBottom: 14,
                        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Brain size={12} color="#a78bfa" />
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Gemini Analysis
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--dv-text-secondary)', lineHeight: 1.5 }}>
                          {analysis.genai_history_summary}
                        </div>
                      </div>

                      {/* Evidence sources */}
                      {(analysis.historical_evidence || []).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {analysis.historical_evidence.map((ev, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px',
                              borderRadius: 6, background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
                            }}>
                              <EvidenceTypePip type={ev.type} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dv-text-primary)', marginBottom: 2 }}>{ev.title}</div>
                                {ev.snippet && <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', lineHeight: 1.4 }}>{ev.snippet}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--dv-text-muted)', fontStyle: 'italic' }}>
                          No matching historical evidence found.
                        </div>
                      )}
                    </div>
                  </DvCard>

                  {/* Candidate Responders */}
                  <DvCard style={{ marginBottom: 20 }}>
                    <div style={{ padding: '20px 24px' }}>
                      <SectionLabel label="Response Candidates" icon={UserCheck}
                        sub="Sorted by availability × context score from real workspace + GitHub evidence" />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(analysis.candidates || []).map(c => {
                          const isSelected = selectedCandidateIds.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (phase !== 'READY') return;
                                setSelectedCandidateIds(prev =>
                                  prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                );
                              }}
                              style={{
                                padding: '12px 16px', borderRadius: 8, cursor: phase === 'READY' ? 'pointer' : 'default',
                                background: isSelected ? 'var(--dv-accent-subtle)' : 'var(--dv-bg-elevated)',
                                border: `1px solid ${isSelected ? 'var(--dv-accent-border)' : 'var(--dv-border-subtle)'}`,
                                transition: 'all 0.15s',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <DvAvatar name={c.name} size={28} />
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dv-text-primary)' }}>
                                      {c.name}
                                      {isSelected && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--dv-accent)', fontFamily: 'var(--dv-font-mono)' }}>SELECTED</span>}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', fontFamily: 'var(--dv-font-mono)' }}>{c.role}</div>
                                  </div>
                                </div>
                                <AvailBadge availability={c.availability} />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div>
                                  <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Context</div>
                                  <ContextBar score={c.context_score} level={c.context_level} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Workload</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ flex: 1, height: 4, background: 'var(--dv-bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                                      <div style={{ width: `${c.capacity?.capacity_pct || 0}%`, height: '100%', background: (c.capacity?.capacity_pct || 0) > 80 ? 'var(--dv-danger)' : 'var(--dv-success)', borderRadius: 2, transition: 'width 0.5s' }} />
                                    </div>
                                    <span style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)' }}>
                                      {c.capacity?.capacity_pct || 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {phase === 'READY' && (
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                          <DvButton
                            id="incident-simulate-btn"
                            variant="primary"
                            onClick={handleSimulate}
                            disabled={selectedCandidateIds.length === 0}
                          >
                            <Zap size={14} />
                            Simulate Response
                          </DvButton>
                        </div>
                      )}
                      {phase === 'SIMULATING' && (
                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--dv-text-muted)', fontSize: 12 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--dv-accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                          Running simulation engine…
                        </div>
                      )}
                    </div>
                  </DvCard>

                  {/* ── SIMULATION RESULTS ─────────────────────────────── */}
                  <AnimatePresence>
                    {simulation && (
                      <motion.div key="sim-results" variants={fadeUp} initial="hidden" animate="visible" style={{ marginBottom: 20 }}>
                        <DvCard>
                          <div style={{ padding: '20px 24px' }}>
                            <SectionLabel label="What-If Response Simulation" icon={BarChart2}
                              sub="Deterministic simulation engine — WAIT · REASSIGN · PAIR · AI_ASSIST · KNOWLEDGE_TRANSFER" />

                            {/* Intervention comparison grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                              {simulation.evaluation_results?.flatMap(cr =>
                                cr.interventions
                                  .filter(inv => !inv.error && ['WAIT', 'REASSIGN', 'PAIR', 'AI_ASSIST', 'KNOWLEDGE_TRANSFER'].includes(inv.type))
                                  .map(inv => {
                                    const isRecommended = simulation.recommendation
                                      && simulation.recommendation.candidate_id === cr.candidate_id
                                      && simulation.recommendation.intervention === inv.type;
                                    const isChosen = selectedCandidateId === cr.candidate_id && selectedIntervention === inv.type;

                                    return (
                                      <div
                                        key={`${cr.candidate_id}-${inv.type}`}
                                        onClick={() => {
                                          if (['APPROVED', 'RESOLVED'].includes(phase)) return;
                                          setSelectedIntervention(inv.type);
                                          setSelectedCandidateId(cr.candidate_id);
                                        }}
                                        style={{
                                          padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                                          background: isChosen ? 'var(--dv-accent-subtle)' : isRecommended ? 'rgba(34,197,94,0.06)' : 'var(--dv-bg-elevated)',
                                          border: `1px solid ${isChosen ? 'var(--dv-accent-border)' : isRecommended ? 'var(--dv-success-border)' : 'var(--dv-border-subtle)'}`,
                                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                          transition: 'all 0.15s',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                          <div style={{ minWidth: 120 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dv-text-primary)', fontFamily: 'var(--dv-font-mono)' }}>
                                              {interventionLabel(inv.type)}
                                              {isRecommended && <span style={{ marginLeft: 6, fontSize: 8, color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)' }}>★ RECOMMENDED</span>}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>{cr.candidate_name}</div>
                                          </div>
                                          <div style={{ display: 'flex', gap: 16 }}>
                                            <div style={{ textAlign: 'center' }}>
                                              <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', marginBottom: 2 }}>Completion</div>
                                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dv-text-primary)', fontFamily: 'var(--dv-font-mono)' }}>{inv.estimated_completion?.toFixed(1)}d</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                              <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', marginBottom: 2 }}>Risk</div>
                                              <div style={{ fontSize: 11, fontWeight: 700, color: riskColor(inv.risk), fontFamily: 'var(--dv-font-mono)' }}>{inv.risk}</div>
                                            </div>
                                            {inv.predicted_transfer_effort_hours != null && (
                                              <div style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                                  <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase' }}>Transfer</div>
                                                  <MLBadge />
                                                </div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dv-text-primary)', fontFamily: 'var(--dv-font-mono)' }}>
                                                  {inv.predicted_transfer_effort_hours?.toFixed(1)}h
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          {isChosen && <CheckCircle size={14} color="var(--dv-accent)" />}
                                        </div>
                                      </div>
                                    );
                                  })
                              )}
                            </div>

                            {/* Recommendation */}
                            {simulation.recommendation && (
                              <div style={{
                                padding: '16px 20px', borderRadius: 10,
                                background: 'rgba(34,197,94,0.06)', border: '1px solid var(--dv-success-border)',
                                marginBottom: 16,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                  <Brain size={14} color="var(--dv-success)" />
                                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    DevCollab Recommends
                                  </span>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dv-text-primary)', marginBottom: 10 }}>
                                  {interventionLabel(simulation.recommendation.intervention)} → {simulation.recommendation.candidate_name}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {(simulation.recommendation_reasons || []).map((r, i) => (
                                    <div key={i} style={{ fontSize: 11, color: 'var(--dv-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                      <span style={{ color: 'var(--dv-success)', flexShrink: 0 }}>→</span>
                                      <span>{r}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Stale-check warning */}
                            {needsReeval && (
                              <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{
                                  padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                                  background: 'var(--dv-warning-subtle)', border: '1px solid var(--dv-warning-border)',
                                  fontSize: 12, color: 'var(--dv-warning)',
                                  display: 'flex', alignItems: 'center', gap: 8,
                                }}
                              >
                                <AlertTriangle size={14} />
                                <strong>INCIDENT STATE CHANGED</strong> — Recommendation may be stale.
                                <DvButton variant="ghost" size="xs" onClick={handleReset} style={{ marginLeft: 'auto' }}>
                                  Re-Evaluate
                                </DvButton>
                              </motion.div>
                            )}

                            {/* Approval */}
                            {!['APPROVED', 'RESOLVED'].includes(phase) && !needsReeval && (
                              <div style={{
                                padding: '16px 20px', borderRadius: 10,
                                background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-default)',
                              }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dv-text-muted)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                                  Recommended Response
                                </div>
                                {selectedIntervention && selectedCandidateId && (() => {
                                  const cand = analysis?.candidates?.find(c => c.id === selectedCandidateId);
                                  return (
                                    <div style={{ marginBottom: 12 }}>
                                      <div style={{ fontSize: 12, color: 'var(--dv-text-secondary)', marginBottom: 4 }}>
                                        <strong style={{ color: 'var(--dv-text-primary)' }}>{interventionLabel(selectedIntervention)}</strong>
                                        {' → '}
                                        <strong style={{ color: 'var(--dv-text-primary)' }}>{cand?.name || `Candidate #${selectedCandidateId}`}</strong>
                                      </div>
                                      <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)' }}>
                                        Requires LEAD or ADMIN authorization · Cannot be undone without re-assignment
                                      </div>
                                    </div>
                                  );
                                })()}

                                {approvalError && (
                                  <div style={{ fontSize: 12, color: 'var(--dv-danger)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <AlertCircle size={12} />
                                    {approvalError}
                                  </div>
                                )}

                                <DvButton
                                  id="incident-approve-btn"
                                  variant="primary"
                                  onClick={handleApprove}
                                  disabled={!selectedIntervention || !selectedCandidateId || approvalLoading}
                                  style={{ width: '100%', justifyContent: 'center' }}
                                >
                                  {approvalLoading ? (
                                    <>
                                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                                      Executing…
                                    </>
                                  ) : (
                                    <>
                                      <Shield size={14} />
                                      Approve Response
                                    </>
                                  )}
                                </DvButton>
                              </div>
                            )}
                          </div>
                        </DvCard>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── APPROVED BANNER ─────────────────────────────────── */}
                  <AnimatePresence>
                    {phase === 'APPROVED' && approvalResult && (
                      <motion.div
                        key="approved"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 20 }}
                      >
                        <div style={{
                          padding: '20px 24px', borderRadius: 12,
                          background: 'var(--dv-success-subtle)', border: '1px solid var(--dv-success-border)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <CheckCircle size={20} color="var(--dv-success)" />
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dv-success)' }}>
                              Response Executed
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--dv-text-secondary)', marginBottom: 10 }}>
                            {approvalResult.message}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--dv-text-muted)', fontFamily: 'var(--dv-font-mono)' }}>
                            Task ownership updated in database · EngineEvent #{approvalResult.event_id} emitted · WebSocket broadcast sent
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── RESOLVED BANNER ──────────────────────────────────── */}
                  <AnimatePresence>
                    {phase === 'RESOLVED' && (
                      <motion.div
                        key="resolved"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 20 }}
                      >
                        <div style={{
                          padding: '16px 20px', borderRadius: 10,
                          background: 'var(--dv-success-subtle)', border: '1px solid var(--dv-success-border)',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <CheckCircle size={18} color="var(--dv-success)" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dv-success)' }}>Incident Resolved</div>
                            <div style={{ fontSize: 11, color: 'var(--dv-text-muted)' }}>Backend state indicates resolution. Incident lifecycle complete.</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── FOLLOW-UP INPUT ──────────────────────────────────── */}
                  {analysis && !['INPUT', 'UNDERSTANDING', 'ANALYZING'].includes(phase) && (
                    <DvCard style={{ marginBottom: 20 }}>
                      <div style={{ padding: '16px 20px' }}>
                        <SectionLabel label="Incident Update" icon={Activity} sub="Follow-up messages: recovery, escalation, responder change" />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            id="incident-followup-input"
                            value={followUpMessage}
                            onChange={e => setFollowUpMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleFollowUp()}
                            placeholder="e.g. Gateway recovered · Libin is now unavailable · Errors still ongoing…"
                            style={{
                              flex: 1, padding: '8px 12px', fontSize: 12,
                              background: 'var(--dv-bg-surface)', border: '1px solid var(--dv-border-default)',
                              borderRadius: 6, color: 'var(--dv-text-primary)',
                              fontFamily: 'var(--dv-font-sans)', outline: 'none',
                            }}
                          />
                          <DvButton variant="ghost" size="sm" onClick={handleFollowUp} disabled={!followUpMessage.trim()}>
                            <Send size={12} />
                            Update
                          </DvButton>
                        </div>
                        {followUpResult && (
                          <div style={{ fontSize: 11, color: 'var(--dv-text-muted)', marginTop: 8, fontFamily: 'var(--dv-font-mono)' }}>
                            Update recorded: {followUpResult.update_type} → {followUpResult.new_status}
                            {followUpResult.needs_reevaluation && (
                              <span style={{ color: 'var(--dv-warning)', marginLeft: 8 }}>⚠ Re-evaluation recommended</span>
                            )}
                          </div>
                        )}
                      </div>
                    </DvCard>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>

        {/* ── Timeline sidebar ─────────────────────────────────────────── */}
        {analysis && (
          <div style={{
            width: 260, padding: '24px 20px',
            borderLeft: '1px solid var(--dv-border-subtle)',
            background: 'var(--dv-bg-surface)', overflowY: 'auto',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
              Incident Timeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ...(analysis._timeline_cache || []),
              ].concat([]).length === 0 ? null : null}
              {/* Use the timeline from the initial analysis + any follow-ups */}
              {[
                { step: 'INCIDENT_REPORTED', ts: analysis._ts_start, label: 'Incident reported' },
                { step: 'IMPACT_IDENTIFIED', ts: null, label: `Project identified: ${analysis.affected_project?.name}` },
                { step: 'HISTORY_SEARCHED', ts: null, label: `${analysis.historical_evidence?.length || 0} historical sources searched` },
                { step: 'CANDIDATES_EVALUATED', ts: null, label: `${analysis.candidates?.length || 0} candidates evaluated` },
                ...(simulation ? [
                  { step: 'RESPONSE_SIMULATED', ts: null, label: 'Response simulations completed' },
                  { step: 'RECOMMENDATION_GENERATED', ts: null, label: `Recommended: ${interventionLabel(simulation.recommendation?.intervention || '?')} → ${simulation.recommendation?.candidate_name || '?'}` },
                ] : []),
                ...(phase === 'APPROVED' && approvalResult ? [
                  { step: 'HUMAN_APPROVED', ts: null, label: 'Human approval granted' },
                  { step: 'RESPONSE_EXECUTED', ts: null, label: `${approvalResult.updated_task?.title} ownership updated` },
                ] : []),
                ...(phase === 'RESOLVED' ? [
                  { step: 'INCIDENT_RESOLUTION', ts: null, label: 'Incident resolved' },
                ] : []),
              ].map((entry, i, arr) => (
                <div key={`${entry.step}-${i}`} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: entry.step === 'INCIDENT_REPORTED' ? 'var(--dv-danger-subtle)' : 'var(--dv-bg-elevated)',
                      border: `1px solid ${entry.step === 'INCIDENT_REPORTED' ? 'var(--dv-danger-border)' : 'var(--dv-border-subtle)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11,
                    }}>
                      {timelineStepIcon(entry.step)}
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ width: 1, flex: 1, minHeight: 16, background: 'var(--dv-border-subtle)', margin: '2px 0' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 12, flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--dv-text-primary)', fontWeight: 500, lineHeight: 1.3 }}>{entry.label}</div>
                    {entry.ts && (
                      <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', marginTop: 2 }}>
                        {new Date(entry.ts).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Spinner keyframe injection */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
