/**
 * Decision Point — Phase 3
 * Route: /intelligence/decision/:id
 *
 * READ-ONLY. No mutations. No ML inference. No simulation.
 * Purpose: detect → explain → prepare for simulation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, AlertCircle, ArrowDown, ArrowRight, Brain,
  ChevronRight, Clock, Eye, GitBranch, Link2, Lock, RefreshCw,
  Shield, Users, X, Zap, CheckCircle, Cpu, Activity, Target,
  BarChart2, PlayCircle, ArrowLeft, Info,
} from 'lucide-react';

import '../styles/tokens.css';
import '../styles/components.css';

import {
  DvBadge, DvCard, DvButton, DvDivider, DvAvatar,
  DvProgressBar, DvProgressRing,
} from '../primitives/core';
import { DvAgentStatus, DvAgentStep } from '../primitives/agent';

import {
  getDecisionPointState,
  severityToVariant, coverageToVariant, depStatusToVariant,
  availStatusColor, contextScoreToLabel, provenanceLabel,
  provenanceColor, relativeTime,
} from '../data/decisionAdapter';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../stores/authStore';

import {
  fadeUp, fadeIn, staggerChildren, panelEnter, slideIn,
  scaleIn, scenarioTransition, agentActivity as agentVariant,
} from '../motion/presets';

// ─────────────────────────────────────────────────────────────────────────────
// Micro-helpers
// ─────────────────────────────────────────────────────────────────────────────
const SEVERITY_COLORS = {
  LOW:      { bg: 'var(--dv-info-subtle)',    border: 'var(--dv-info-border)',    text: 'var(--dv-info)' },
  MEDIUM:   { bg: 'var(--dv-warning-subtle)', border: 'var(--dv-warning-border)', text: 'var(--dv-warning)' },
  HIGH:     { bg: 'var(--dv-danger-subtle)',  border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)' },
  CRITICAL: { bg: 'var(--dv-danger-subtle)',  border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)' },
};

const DEP_STATUS_COLORS = {
  IN_PROGRESS: { border: 'var(--dv-info-border)',    text: 'var(--dv-info)',    bg: 'var(--dv-info-subtle)' },
  AT_RISK:     { border: 'var(--dv-warning-border)', text: 'var(--dv-warning)', bg: 'var(--dv-warning-subtle)' },
  BLOCKED:     { border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)',  bg: 'var(--dv-danger-subtle)' },
  TO_DO:       { border: 'var(--dv-border-subtle)',  text: 'var(--dv-text-muted)', bg: 'transparent' },
};

function ProvenancePip({ prov }) {
  return (
    <span style={{
      fontSize: 9, padding: '1px 5px', borderRadius: 3,
      background: 'var(--dv-bg-elevated)',
      border: `1px solid ${provenanceColor(prov)}`,
      color: provenanceColor(prov),
      fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
    }}>
      {provenanceLabel(prov)}
    </span>
  );
}

function SectionLabel({ label, icon: Icon, sub, id }) {
  return (
    <div id={id} style={{ marginBottom: 16 }}>
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

function CapacityRing({ value, size = 44 }) {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  const variant = num >= 85 ? 'danger' : num >= 55 ? 'warning' : 'recommended';
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <DvProgressRing value={num} max={100} size={size} stroke={3} variant={variant} />
      <span style={{
        position: 'absolute', fontSize: 9, fontWeight: 700,
        fontFamily: 'var(--dv-font-mono)',
        color: num >= 85 ? 'var(--dv-danger)' : num >= 55 ? 'var(--dv-warning)' : 'var(--dv-success)',
      }}>
        {num}%
      </span>
    </div>
  );
}

function SourceChip({ source }) {
  const isLive = source === 'LIVE';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: 'var(--dv-radius-md)',
      border: `1px solid ${isLive ? 'var(--dv-success-border)' : 'var(--dv-warning-border)'}`,
      background: isLive ? 'var(--dv-success-subtle)' : 'var(--dv-warning-subtle)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isLive ? 'var(--dv-success)' : 'var(--dv-warning)',
        animation: isLive ? 'dv-pulse 2s ease-in-out infinite' : 'none', flexShrink: 0,
      }} />
      <span style={{
        fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: isLive ? 'var(--dv-success)' : 'var(--dv-warning)',
      }}>
        {isLive ? 'LIVE STATE' : 'DEMO STATE'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Hero Header
// ─────────────────────────────────────────────────────────────────────────────
function DecisionHero({ decision, systemStatus, onBack }) {
  const pal = SEVERITY_COLORS[decision.severity] ?? SEVERITY_COLORS.MEDIUM;
  const detectedAgo = relativeTime(decision.detected_at);

  return (
    <motion.div variants={panelEnter} initial="hidden" animate="visible">
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: pal.bg, border: `1px solid ${pal.border}`,
        borderRadius: 'var(--dv-radius-xl)', padding: '28px 36px',
        marginBottom: 24,
      }}>
        {/* Top-left severity stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: pal.text, opacity: 0.6,
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1 }}>
            {/* Row 1: type chip + ago */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <DvBadge variant={severityToVariant(decision.severity)} dot>
                  {decision.severity}
                </DvBadge>
              </motion.div>
              <span style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                DECISION POINT
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--dv-text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                Detected {detectedAgo}
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 'var(--dv-text-2xl)', fontWeight: 800, color: 'var(--dv-text-primary)',
              letterSpacing: 'var(--dv-tracking-tight)', lineHeight: 1.15, marginBottom: 10,
            }}>
              {decision.title}
            </h1>

            {/* Description */}
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', lineHeight: 1.6, marginBottom: 16, maxWidth: 680 }}>
              {decision.description}
            </p>

            {/* Signal pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--dv-radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <GitBranch size={11} color="var(--dv-text-faint)" />
                <span style={{ fontSize: 10, color: 'var(--dv-text-secondary)' }}>{decision.project}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--dv-radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Activity size={11} color="var(--dv-text-faint)" />
                <span style={{ fontSize: 10, color: 'var(--dv-text-secondary)' }}>{decision.task}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: What Changed
// ─────────────────────────────────────────────────────────────────────────────
function TriggerSection({ trigger }) {
  return (
    <DvCard style={{ padding: '20px 24px' }}>
      <SectionLabel label="What Changed?" icon={Zap} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>

        {/* Before */}
        <motion.div variants={scaleIn} initial="hidden" animate="visible"
          style={{ flex: 1, padding: '14px 16px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-default)' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-success)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>BEFORE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <DvAvatar name={trigger.before.member} size={32} />
            <div>
              <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{trigger.before.member}</div>
              <div style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>{trigger.before.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <DvBadge variant="success" dot size="sm">{trigger.before.status}</DvBadge>
            <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)' }}>{trigger.before.capacity}% capacity</span>
          </div>
          <div style={{ marginTop: 8 }}><ProvenancePip prov={trigger.before.provenance} /></div>
        </motion.div>

        {/* Arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px', gap: 4 }}>
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
            <ArrowRight size={20} color="var(--dv-text-faint)" />
          </motion.div>
          <span style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {trigger.label}
          </span>
        </div>

        {/* After */}
        <motion.div variants={scaleIn} initial="hidden" animate="visible" transition={{ delay: 0.2 }}
          style={{
            flex: 1, padding: '14px 16px', borderRadius: 'var(--dv-radius-md)',
            border: '1px solid var(--dv-danger-border)', background: 'var(--dv-danger-subtle)',
          }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-danger)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>NOW</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <DvAvatar name={trigger.after.member} size={32} />
            <div>
              <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{trigger.after.member}</div>
              <div style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>{trigger.after.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <DvBadge variant="danger" dot size="sm">{trigger.after.status}</DvBadge>
            <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-danger)' }}>{trigger.after.capacity}% capacity</span>
          </div>
          <div style={{ marginTop: 8 }}><ProvenancePip prov={trigger.after.provenance} /></div>
        </motion.div>
      </div>
    </DvCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Why This Matters
// ─────────────────────────────────────────────────────────────────────────────
function WhyItMatters({ data }) {
  return (
    <DvCard style={{ padding: '20px 24px' }}>
      <SectionLabel label="Why This Matters" icon={AlertCircle} />
      <div style={{
        padding: '14px 16px', borderRadius: 'var(--dv-radius-md)',
        background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-default)',
        marginBottom: 14,
      }}>
        <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', lineHeight: 1.7, margin: 0 }}>
          {data.text}
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {data.evidence.map((ev, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
            background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)',
            border: '1px solid var(--dv-border-subtle)',
          }}>
            <span style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>{ev.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-secondary)' }}>{ev.value}</span>
            <ProvenancePip prov={ev.prov} />
          </div>
        ))}
      </div>
    </DvCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: Impact Map
// ─────────────────────────────────────────────────────────────────────────────
function ImpactMap({ impactMap }) {
  const { project, task, owner, deadline, downstream, responsibilities, availableMembers, aiWorkers } = impactMap;

  const ImpactCard = ({ icon: Icon, label, children, accentColor }) => (
    <div style={{
      padding: '12px 14px', background: 'var(--dv-bg-elevated)',
      borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={11} color={accentColor ?? 'var(--dv-text-faint)'} />
        <span style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      {children}
    </div>
  );

  return (
    <DvCard style={{ padding: '20px 24px' }}>
      <SectionLabel label="Impacted Engineering State" icon={Target} />
      <motion.div variants={staggerChildren} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>

        <motion.div variants={fadeUp}>
          <ImpactCard icon={GitBranch} label="Project">
            <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{project.name}</div>
            <DvBadge variant={project.health === 'CRITICAL' ? 'danger' : project.health === 'HIGH' ? 'danger' : 'warning'} size="sm">{project.health}</DvBadge>
          </ImpactCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ImpactCard icon={Activity} label="Task">
            <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)', marginBottom: 4 }}>{task.name}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              <DvBadge variant={task.priority === 'P0' ? 'danger' : 'warning'} size="sm">{task.priority}</DvBadge>
              <DvBadge variant="muted" size="sm">{task.status}</DvBadge>
            </div>
          </ImpactCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ImpactCard icon={Users} label="Owner" accentColor={availStatusColor(owner.status)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <DvAvatar name={owner.name} size={24} />
              <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{owner.name}</span>
            </div>
            <DvBadge variant={owner.status === 'OVERLOADED' ? 'danger' : owner.status === 'BUSY' ? 'warning' : 'success'} dot size="sm">{owner.status}</DvBadge>
            <span style={{ marginLeft: 6, fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)' }}>{owner.capacity}%</span>
          </ImpactCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ImpactCard icon={Clock} label="Deadline" accentColor="var(--dv-warning)">
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-warning)', lineHeight: 1 }}>{deadline.value}</div>
            <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', marginTop: 2 }}>{deadline.unit} remaining</div>
            <div style={{ marginTop: 6 }}><ProvenancePip prov={deadline.provenance} /></div>
          </ImpactCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ImpactCard icon={Link2} label="Downstream" accentColor="var(--dv-danger)">
            {downstream.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < downstream.length - 1 ? '1px solid var(--dv-border-subtle)' : 'none' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: DEP_STATUS_COLORS[d.status]?.text ?? 'var(--dv-text-faint)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--dv-text-secondary)' }}>{d.name}</span>
              </div>
            ))}
          </ImpactCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ImpactCard icon={Users} label="Available Engineers">
            {availableMembers.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                <DvAvatar name={m.name} size={18} />
                <span style={{ fontSize: 10, color: 'var(--dv-text-secondary)', flex: 1 }}>{m.name}</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: m.contextScore >= 50 ? 'var(--dv-success)' : m.contextScore >= 30 ? 'var(--dv-warning)' : 'var(--dv-danger)' }}>
                  {m.contextLabel} ctx
                </span>
              </div>
            ))}
          </ImpactCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ImpactCard icon={Cpu} label="AI Workers" accentColor="var(--dv-analyzing)">
            {aiWorkers.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: w.status === 'AVAILABLE' ? 'var(--dv-success)' : 'var(--dv-text-faint)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--dv-text-secondary)' }}>{w.name}</span>
              </div>
            ))}
          </ImpactCard>
        </motion.div>
      </motion.div>
    </DvCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: Agent Analysis Panel (right column)
// ─────────────────────────────────────────────────────────────────────────────
function AgentPanel({ agentActivity }) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  // Simulate progressive step reveal (demo only)
  useEffect(() => {
    const doneCount = agentActivity.filter(a => a.status === 'done').length;
    setPhaseIdx(doneCount);
  }, [agentActivity]);

  const phases = [
    { label: 'DETECTED',              color: 'var(--dv-warning)' },
    { label: 'ANALYZING',             color: 'var(--dv-analyzing)' },
    { label: 'READY FOR SIMULATION',  color: 'var(--dv-success)' },
  ];

  const currentPhase = agentActivity.find(a => a.status === 'running') ? 1 : 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Status flow */}
      <DvCard style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-analyzing)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Agent Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {phases.map((ph, i) => {
            const isActive  = i === currentPhase;
            const isDone    = i < currentPhase;
            return (
              <div key={ph.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    background: isDone ? 'var(--dv-success)' : isActive ? ph.color : 'var(--dv-bg-overlay)',
                    border: `1.5px solid ${isDone ? 'var(--dv-success)' : isActive ? ph.color : 'var(--dv-border-default)'}`,
                    animation: isActive ? 'dv-pulse 2s ease-in-out infinite' : 'none',
                  }} />
                  {i < phases.length - 1 && (
                    <div style={{ width: 1, height: 20, background: isDone ? 'var(--dv-success-border)' : 'var(--dv-border-subtle)', margin: '2px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < phases.length - 1 ? 4 : 0 }}>
                  <div style={{
                    fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
                    color: isActive ? ph.color : isDone ? 'var(--dv-success)' : 'var(--dv-text-faint)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    {isDone ? '✓ ' : isActive ? '● ' : '○ '}{ph.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DvCard>

      {/* Activity steps */}
      <DvCard style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dv-analyzing)', marginBottom: 3 }}>
              DevCollab Agent
            </div>
            <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>
              Analyzing Decision Point
            </div>
          </div>
          <DvAgentStatus status="ANALYZING" />
        </div>

        <DvDivider />

        <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {agentActivity.map(step => (
            <DvAgentStep key={step.id} label={step.label} status={step.status} detail={step.detail} />
          ))}
        </motion.div>

        {/* Current focus */}
        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 'var(--dv-radius-md)',
          background: 'var(--dv-analyzing-subtle)', border: '1px solid var(--dv-analyzing-border)',
        }}>
          <div style={{ fontSize: 9, color: 'var(--dv-analyzing)', fontFamily: 'var(--dv-font-mono)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Current Focus
          </div>
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)' }}>
            Preparing intervention simulation inputs
          </div>
        </div>
      </DvCard>

      {/* Tool activity */}
      <DvCard style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dv-text-faint)', marginBottom: 10 }}>
          Tool Activity
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {agentActivity.map(step => (
            <div key={step.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
              borderRadius: 'var(--dv-radius-sm)',
              background: step.status === 'running' ? 'var(--dv-analyzing-subtle)' : 'transparent',
              border: `1px solid ${step.status === 'running' ? 'var(--dv-analyzing-border)' : 'transparent'}`,
            }}>
              <span style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 9,
                color: step.status === 'running' ? 'var(--dv-analyzing)' : step.status === 'done' ? 'var(--dv-success)' : 'var(--dv-text-faint)' }}>
                {step.status === 'running' ? '◉' : step.status === 'done' ? '✓' : '○'}
              </span>
              <span style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 9, color: 'var(--dv-text-faint)', flex: 1 }}>{step.tool}</span>
            </div>
          ))}
        </div>
      </DvCard>
    </div>
  );
}

const MemberRow = ({ m, isOwner }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
    background: isOwner ? 'var(--dv-danger-subtle)' : 'var(--dv-bg-elevated)',
    border: `1px solid ${isOwner ? 'var(--dv-danger-border)' : 'var(--dv-border-subtle)'}`,
    borderRadius: 'var(--dv-radius-md)', marginBottom: 8,
  }}>
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <DvAvatar name={m.name} size={36} />
      <span style={{
        position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%',
        background: availStatusColor(m.status), border: '1.5px solid var(--dv-bg-canvas)',
      }} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{m.name}</span>
        {isOwner && <DvBadge variant="muted" size="sm">Owner</DvBadge>}
        <DvBadge variant={m.status === 'OVERLOADED' ? 'danger' : m.status === 'BUSY' ? 'warning' : 'success'} size="sm">{m.status}</DvBadge>
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', marginBottom: 2 }}>Capacity</div>
          <DvProgressBar value={m.capacity} max={100}
            variant={m.capacity >= 85 ? 'danger' : m.capacity >= 55 ? 'warning' : 'recommended'} />
          <span style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)' }}>{m.capacity}%</span>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', marginBottom: 2 }}>Task Context</div>
          <DvProgressBar value={m.contextScore} max={100}
            variant={m.contextScore >= 70 ? 'recommended' : m.contextScore >= 40 ? 'warning' : 'danger'} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)' }}>{m.contextScore}%</span>
            <DvBadge variant={m.contextScore >= 70 ? 'success' : m.contextScore >= 40 ? 'warning' : 'danger'} size="sm">
              {contextScoreToLabel(m.contextScore)}
            </DvBadge>
          </div>
        </div>
      </div>
    </div>
    <div><ProvenancePip prov={m.provenance} /></div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Engineering State Snapshot
// ─────────────────────────────────────────────────────────────────────────────
function EngineeringSnapshot({ snapshot }) {
  const { owner, candidates } = snapshot;

  return (
    <DvCard style={{ padding: '20px 24px' }}>
      <SectionLabel label="Engineering State Snapshot" icon={BarChart2}
        sub="Observed state only — no predictions" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ padding: '2px 8px', background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-default)', borderRadius: 'var(--dv-radius-sm)', color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)', fontWeight: 700, fontSize: 9 }}>
          OBSERVED
        </span>
      </div>
      <MemberRow m={owner} isOwner />
      <DvDivider label="Candidates" />
      {candidates.map(c => <MemberRow key={c.name} m={c} />)}
    </DvCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Knowledge Concentration
// ─────────────────────────────────────────────────────────────────────────────
function KnowledgeConcentration({ data }) {
  return (
    <DvCard style={{ padding: '20px 24px' }}>
      <SectionLabel label="Knowledge Concentration" icon={Brain} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Primary owner */}
        <div style={{ padding: '14px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-default)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: data.primaryContext >= 70 ? 'var(--dv-success)' : data.primaryContext >= 40 ? 'var(--dv-warning)' : 'var(--dv-danger)' }} />
          <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Primary Context Owner</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <DvAvatar name={data.primaryOwner} size={28} />
            <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{data.primaryOwner}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CapacityRing value={data.primaryContext} size={44} />
            <div>
              <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', marginBottom: 2 }}>Context Score</div>
              <DvBadge variant={data.primaryContext >= 70 ? 'success' : 'warning'} size="sm">HIGH</DvBadge>
              <div style={{ marginTop: 4 }}><ProvenancePip prov={data.provenance} /></div>
            </div>
          </div>
        </div>

        {/* Backup */}
        <div style={{ padding: '14px', background: data.backup ? 'var(--dv-bg-elevated)' : 'var(--dv-danger-subtle)', borderRadius: 'var(--dv-radius-md)', border: `1px solid ${data.backup ? 'var(--dv-border-default)' : 'var(--dv-danger-border)'}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: data.backup ? (data.backupContext >= 40 ? 'var(--dv-warning)' : 'var(--dv-danger)') : 'var(--dv-danger)' }} />
          <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Backup / Redundancy</div>
          {data.backup ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <DvAvatar name={data.backup} size={28} />
                <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{data.backup}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CapacityRing value={data.backupContext} size={44} />
                <div>
                  <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', marginBottom: 2 }}>Context Score</div>
                  <DvBadge variant={data.backupContext >= 70 ? 'success' : data.backupContext >= 40 ? 'warning' : 'danger'} size="sm">{data.backupLabel}</DvBadge>
                  <div style={{ marginTop: 4 }}><ProvenancePip prov={data.provenance} /></div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <AlertTriangle size={18} color="var(--dv-danger)" />
              <div>
                <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-danger)' }}>No Backup</div>
                <div style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>Single point of failure</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key insight callout */}
      <div style={{
        marginTop: 14, padding: '12px 14px', borderRadius: 'var(--dv-radius-md)',
        background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
        display: 'flex', gap: 10,
      }}>
        <Info size={14} color="var(--dv-accent)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 11, color: 'var(--dv-text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
          Moving the task is not the same as transferring the knowledge required to execute it.
          Context-transfer effort will be quantified during simulation.
        </p>
      </div>
    </DvCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: Responsibility Coverage
// ─────────────────────────────────────────────────────────────────────────────
function ResponsibilityCoverage({ data }) {
  const COVERAGE_PALETTE = {
    STRONG:   { bg: 'var(--dv-success-subtle)',  border: 'var(--dv-success-border)',  text: 'var(--dv-success)',  stripe: 'var(--dv-success)' },
    PARTIAL:  { bg: 'var(--dv-warning-subtle)', border: 'var(--dv-warning-border)', text: 'var(--dv-warning)', stripe: 'var(--dv-warning)' },
    FRAGILE:  { bg: 'var(--dv-danger-subtle)',  border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)',  stripe: 'var(--dv-danger)' },
    CRITICAL: { bg: 'var(--dv-danger-subtle)',  border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)',  stripe: 'var(--dv-danger)' },
  };
  const pal = COVERAGE_PALETTE[data.coverage] ?? COVERAGE_PALETTE.PARTIAL;

  return (
    <DvCard style={{ padding: '20px 24px', borderColor: pal.border, background: pal.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Shield size={13} color={pal.text} />
        <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: pal.text }}>
          Responsibility Coverage
        </span>
        <DvBadge variant={coverageToVariant(data.coverage)} dot style={{ marginLeft: 'auto' }}>{data.coverage}</DvBadge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Task',         value: data.task,       prov: 'REAL_DB' },
          { label: 'Owner',        value: `${data.owner} — ${data.ownerStatus}`, prov: 'REAL_DB' },
          { label: 'Backup',       value: data.backup ?? 'None', prov: 'DERIVED' },
          { label: 'Backup Context', value: data.backup ? `${data.backupContext}%` : 'N/A', prov: 'DERIVED' },
          { label: 'Downstream',   value: `${data.dependencyCount} tasks`, prov: 'SYNTHETIC_DEMO' },
        ].map(row => (
          <div key={row.label} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--dv-radius-sm)', border: '1px solid rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 9, color: pal.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{row.label}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dv-text-primary)', marginBottom: 4 }}>{row.value}</div>
            <ProvenancePip prov={row.prov} />
          </div>
        ))}
      </div>
    </DvCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: Dependency Pressure
// ─────────────────────────────────────────────────────────────────────────────
function DependencyPressure({ chain }) {
  const affectedCount = chain.filter(d => d.isAffected).length;

  return (
    <DvCard style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <SectionLabel label="Dependency Pressure" icon={Link2} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <DvBadge variant="danger" size="sm">{affectedCount} affected</DvBadge>
          <DvBadge variant="warning" size="sm">Critical path</DvBadge>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 460 }}>
        {chain.map((node, i) => {
          const pal = DEP_STATUS_COLORS[node.status] ?? DEP_STATUS_COLORS.TO_DO;
          return (
            <div key={node.id}>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: i * 0.1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px',
                  background: node.isAffected ? pal.bg : 'var(--dv-bg-elevated)',
                  border: `1px solid ${node.isAffected ? pal.border : 'var(--dv-border-subtle)'}`,
                  borderRadius: 'var(--dv-radius-md)',
                }}
              >
                {/* Priority stripe */}
                <div style={{ width: 3, alignSelf: 'stretch', background: pal.text, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{node.name}</span>
                    <DvBadge variant={depStatusToVariant(node.status)} size="sm">{node.status.replace('_', ' ')}</DvBadge>
                    {node.isAffected && <DvBadge variant="danger" size="sm">AFFECTED</DvBadge>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--dv-text-faint)' }}>Owner: {node.owner}</div>
                </div>
                <ProvenancePip prov={node.provenance} />
              </motion.div>

              {i < chain.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 18px' }}>
                  <div style={{ width: 1, height: 20, background: chain[i + 1].isAffected ? 'var(--dv-danger-border)' : 'var(--dv-border-default)' }} />
                  <ArrowDown size={10} color="var(--dv-text-faint)" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DvCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: Scenario Builder ("What should DevCollab evaluate?")
// ─────────────────────────────────────────────────────────────────────────────
function ScenarioBuilder({ defaults = {}, decisionId }) {
  const durationOptions = defaults?.duration_options || [24, 48, 72];
  const candidateList = defaults?.candidates || [];
  const objectiveList = defaults?.objectives || [];
  const interventionOptions = defaults?.interventionOptions || [];

  const [duration,      setDuration]      = useState(defaults?.duration_hours || durationOptions[0] || 48);
  const [candidates,    setCandidates]    = useState(candidateList);
  const [intervention,  setIntervention]  = useState(null);
  const [objectives,    setObjectives]    = useState([objectiveList[0]?.id].filter(Boolean));
  const [ready,         setReady]         = useState(false);

  // Become "ready" once intervention is chosen
  useEffect(() => {
    setReady(!!intervention && objectives.length > 0);
  }, [intervention, objectives]);

  const toggleObjective = useCallback((id) => {
    setObjectives(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]);
  }, []);

  return (
    <DvCard style={{ padding: '24px 28px' }}>
      {/* Header: Observed state chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={14} color="var(--dv-accent)" />
          <span style={{ fontSize: 'var(--dv-text-md)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>
            What Should DevCollab Evaluate?
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 3, background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-default)', color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)', fontWeight: 700 }}>
            OBSERVED
          </span>
          <span style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)', display: 'flex', alignItems: 'center' }}>→</span>
          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 3, background: 'var(--dv-accent-subtle)', border: '1px solid var(--dv-accent-border)', color: 'var(--dv-accent)', fontFamily: 'var(--dv-font-mono)', fontWeight: 700 }}>
            SCENARIO
          </span>
        </div>
      </div>

      {/* Observed / Future distinction */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ padding: '12px 14px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-default)' }}>
          <div style={{ fontSize: 9, color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Observed</div>
          <p style={{ fontSize: 11, color: 'var(--dv-text-secondary)', lineHeight: 1.5, margin: 0 }}>
            A decision point has been detected. The current engineering state has been inspected.
          </p>
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--dv-accent-subtle)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-accent-border)' }}>
          <div style={{ fontSize: 9, color: 'var(--dv-accent)', fontFamily: 'var(--dv-font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Scenario (not yet run)</div>
          <p style={{ fontSize: 11, color: 'var(--dv-text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Assume the triggering condition persists. The simulation has not happened yet.
          </p>
        </div>
      </div>

      <DvDivider />

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Duration */}
          <div>
            <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Scenario Duration
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {durationOptions.map(h => (
                <button key={h}
                  onClick={() => setDuration(h)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--dv-radius-md)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
                    border: `1px solid ${duration === h ? 'var(--dv-accent)' : 'var(--dv-border-default)'}`,
                    background: duration === h ? 'var(--dv-accent-subtle)' : 'var(--dv-bg-elevated)',
                    color: duration === h ? 'var(--dv-accent)' : 'var(--dv-text-muted)',
                    transition: 'all 0.12s',
                  }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Candidate pool */}
          <div>
            <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Candidate Pool
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {candidateList.length === 0 ? (
                <span style={{ fontSize: 11, color: 'var(--dv-text-muted)', fontStyle: 'italic' }}>No additional candidates available</span>
              ) : (
                candidateList.map((c, idx) => {
                  const name = typeof c === 'string' ? c : (c?.name || 'Member');
                  const key = typeof c === 'object' && c?.id ? c.id : `${name}-${idx}`;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-default)', borderRadius: 'var(--dv-radius-md)' }}>
                      <DvAvatar name={name} size={18} />
                      <span style={{ fontSize: 11, color: 'var(--dv-text-secondary)', fontWeight: 600 }}>{name}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Objectives */}
          <div>
            <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Simulation Objectives
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {objectiveList.map(obj => {
                const isSelected = objectives.includes(obj.id);
                return (
                  <button key={obj.id}
                    onClick={() => toggleObjective(obj.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      cursor: 'pointer', borderRadius: 'var(--dv-radius-sm)', textAlign: 'left',
                      border: `1px solid ${isSelected ? 'var(--dv-accent-border)' : 'var(--dv-border-subtle)'}`,
                      background: isSelected ? 'var(--dv-accent-subtle)' : 'var(--dv-bg-elevated)',
                      transition: 'all 0.12s',
                    }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--dv-accent)' : 'transparent', border: `1.5px solid ${isSelected ? 'var(--dv-accent)' : 'var(--dv-border-default)'}` }}>
                      {isSelected && <span style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>✓</span>}
                    </span>
                    <span style={{ fontSize: 11, color: isSelected ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)', fontWeight: isSelected ? 600 : 400 }}>{obj.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: interventions */}
        <div>
          <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Available Interventions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {interventionOptions.map(opt => {
              const isSelected = intervention === opt.id;
              return (
                <button key={opt.id}
                  onClick={() => setIntervention(isSelected ? null : opt.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                    cursor: 'pointer', borderRadius: 'var(--dv-radius-md)', textAlign: 'left',
                    border: `1px solid ${isSelected ? 'var(--dv-accent-border)' : 'var(--dv-border-subtle)'}`,
                    background: isSelected ? 'var(--dv-accent-subtle)' : 'var(--dv-bg-elevated)',
                    transition: 'all 0.12s',
                  }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'var(--dv-accent)' : 'transparent',
                    border: `1.5px solid ${isSelected ? 'var(--dv-accent)' : 'var(--dv-border-default)'}`,
                  }}>
                    {isSelected && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? 'var(--dv-accent)' : 'var(--dv-text-secondary)', marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--dv-text-faint)' }}>{opt.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>



      {/* CTA */}
      <AnimatePresence>
        {ready && (
          <motion.div variants={scenarioTransition} initial="hidden" animate="visible" exit="exit"
            style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)' }}>✓ Scenario configured</span>
          </motion.div>
        )}
      </AnimatePresence>
    </DvCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11: Evidence
// ─────────────────────────────────────────────────────────────────────────────
function EvidenceSection({ evidence }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--dv-text-muted)', fontSize: 10, padding: '0 0 0 0',
        }}
      >
        <Eye size={12} />
        <span style={{ fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {open ? 'Hide Evidence' : 'View Evidence'}
        </span>
        <ChevronRight size={11} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div variants={panelEnter} initial="hidden" animate="visible" exit="exit" style={{ marginTop: 12 }}>
            <DvCard style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Provenance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {evidence.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < evidence.length - 1 ? '1px solid var(--dv-border-subtle)' : 'none' }}>
                    <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', flex: 1 }}>{ev.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--dv-text-secondary)', fontWeight: 600, maxWidth: 220 }}>{ev.value}</span>
                    <ProvenancePip prov={ev.source} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: 'var(--dv-text-faint)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)' }}>Real</span> = read from DB ·
                <span style={{ color: 'var(--dv-predicted)', fontFamily: 'var(--dv-font-mono)' }}> Derived</span> = computed from DB ·
                <span style={{ color: 'var(--dv-warning)', fontFamily: 'var(--dv-font-mono)' }}> Demo</span> = controlled fixture
              </div>
            </DvCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL TO ACTION
// ─────────────────────────────────────────────────────────────────────────────
function CtaSection({ decisionId, decisionSeverity, mode, task_id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/intelligence/demo') ? '/intelligence/demo' : '/dashboard/intelligence';

  return (
    <motion.div variants={scenarioTransition} initial="hidden" animate="visible"
      style={{
        padding: '28px 36px', borderRadius: 'var(--dv-radius-xl)',
        background: 'var(--dv-bg-elevated)', border: `1px solid var(--dv-border-default)`,
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          Next Step
        </div>
        <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 700, color: 'var(--dv-text-primary)', marginBottom: 6 }}>
          Run What-If Simulation
        </div>
        <p style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', margin: 0, lineHeight: 1.5 }}>
          The scenario has been configured. DevCollab will simulate possible interventions
          and compare outcomes. No action will be taken without human approval.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const isLive = mode === 'LIVE';
            const simPath = isLive ? 'task' : 'demo';
            const navId = isLive ? (task_id || decisionId) : 'dp1';
            navigate(`${prefix}/simulation/${simPath}/${navId}`);
          }}
          style={{
            padding: '10px 22px', borderRadius: 'var(--dv-radius-md)', cursor: 'pointer',
            border: 'none', background: 'var(--dv-accent)',
            color: 'white', fontSize: 'var(--dv-text-xs)', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 24px var(--dv-accent-glow)',
          }}>
          <PlayCircle size={14} />
          Run What-If Simulation
        </motion.button>
      </div>
    </motion.div>
  );
}



export default function DecisionPoint() {
  const { id } = useParams();
  const navigate        = useNavigate();
  const location        = useLocation();
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuthStore();
  const isDemoPath      = location.pathname.startsWith('/intelligence/demo');
  const isDirectSynthetic = ['dp1', 'dp2', 'dp3'].includes(id);
  const prefix          = isDemoPath ? '/intelligence/demo' : '/dashboard/intelligence';

  // Rule 2 & 3: Direct synthetic entry (/decision/dp1) starts in DEMO.
  // Real Decision Point ID (/decision/<real-id>) MUST start in LIVE.
  const [mode, setMode] = useState(isDirectSynthetic || isDemoPath ? 'DEMO' : 'LIVE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync mode whenever id or route path changes
  useEffect(() => {
    if (isDirectSynthetic || isDemoPath) {
      setMode('DEMO');
    } else {
      setMode('LIVE');
    }
  }, [id, isDirectSynthetic, isDemoPath]);

  useEffect(() => {
    if (mode === 'LIVE' && authLoading) return;
    let active = true;
    setLoading(true);
    setError(null);
    
    if (mode === 'DEMO') {
      const demoId = ['dp1', 'dp2', 'dp3'].includes(id) ? id : 'dp1';
      const mockData = getDecisionPointState(demoId);
      if (mockData) {
        if (active) {
          setData(mockData);
          setLoading(false);
        }
      } else {
        if (active) {
          setError('Invalid demo decision point');
          setLoading(false);
        }
      }
    } else {
      // LIVE MODE: Fetch real Decision Point data
      if (['dp1', 'dp2', 'dp3'].includes(id)) {
        if (active) {
          setError('Invalid decision point ID in live mode.');
          setLoading(false);
        }
        return;
      }

      if (!id) {
        // Direct entry at /decision: resolve first active real decision point from workspace state
        apiClient('/intelligence/command-center/')
          .then(cc => {
            const firstDp = cc?.decision_points?.[0];
            if (firstDp) {
              return apiClient(`/intelligence/decision/${firstDp.id}/`);
            } else {
              // Live default state from real workspace projects and members
              const activeProj = cc?.projects?.[0];
              const primaryMember = cc?.members?.[0];
              return {
                decision: {
                  id: 'live-active',
                  title: `${activeProj?.name || 'Workspace'} — Live Engineering Observation`,
                  severity: 'MEDIUM',
                  type: 'SYSTEM_OBSERVATION',
                  project: activeProj?.name || 'Workspace',
                  task: 'Active Operations',
                  description: 'Engineering decision intelligence monitoring is active. Workspace signals are stable.',
                  detected_at: new Date().toISOString(),
                },
                trigger: {
                  label: 'MONITORING ACTIVE',
                  type: 'ENGINEERING_HEALTH',
                  before: { member: primaryMember?.name || 'Team', status: 'MONITORING', capacity: 40, role: 'Engineering', provenance: 'REAL_DB' },
                  after: { member: primaryMember?.name || 'Team', status: 'STABLE', capacity: 40, role: 'Engineering', provenance: 'REAL_DB' },
                },
                engineeringSnapshot: {
                  owner: { name: primaryMember?.name || 'Engineering Lead', capacity: 40, status: 'AVAILABLE', provenance: 'REAL_DB' },
                  candidates: (cc?.members || []).slice(1).map(m => ({ id: m.id, name: m.name, capacity: m.capacity_pct || 30, status: m.availability || 'AVAILABLE', contextScore: 50 })),
                },
                scenarioDefaults: {
                  duration_hours: 48,
                  duration_options: [24, 48, 72],
                  candidates: (cc?.members || []).map(m => m.name),
                  interventionOptions: [
                    { id: 'opt1', label: 'Monitor Workload', description: 'Continuously track context score and capacity load across team members.' },
                    { id: 'opt2', label: 'Cross-Training', description: 'Promote responsibility coverage across project boundaries.' },
                  ],
                  objectives: [
                    { id: 'obj1', label: 'Maintain balanced capacity' },
                    { id: 'obj2', label: 'Prevent ownership concentration' },
                  ],
                },
                systemStatus: { source: 'LIVE', last_synced: new Date().toISOString(), agent_status: 'MONITORING' },
              };
            }
          })
          .then(res => {
            if (active && res) {
              setData(res);
              setLoading(false);
            }
          })
          .catch(err => {
            if (active) {
              console.error("Failed to load active decision point", err);
              setError(err.message || 'Failed to load');
              setLoading(false);
            }
          });
        return;
      }

      apiClient(`/intelligence/decision/${id}/`)
        .then(res => {
          if (active) {
            setData(res);
            setLoading(false);
          }
        })
        .catch(err => {
          if (active) {
            console.error("Failed to load live decision point", err);
            setError(err.message || 'Failed to load');
            setLoading(false);
          }
        });
    }
      
    return () => { active = false; };
  }, [id, mode, authLoading, accessToken]);

  const handleSimulateDemo = () => {
    // Explicit user action: enter demo mode
    setMode('DEMO');
  };

  const handleExitDemo = () => {
    // Requirement 5 & 6:
    // If entered directly from synthetic /decision/dp1: fallback to Command Center (/dashboard/intelligence)
    // If entered from a real Decision Point (/decision/<real-id>): return to LIVE mode on the same real ID
    if (isDirectSynthetic) {
      navigate('/dashboard/intelligence');
    } else {
      setMode('LIVE');
    }
  };

  if (loading) {
    return (
      <div className="dv-intelligence" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--dv-text-muted)', fontFamily: 'var(--dv-font-mono)', fontSize: 12 }}>LOADING DECISION POINT...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dv-intelligence" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ color: 'var(--dv-danger)' }}>Error: {error || 'No data found'}</div>
        <DvButton variant="outline" size="sm" onClick={() => navigate('/dashboard/intelligence')}>
          Return to Command Center
        </DvButton>
      </div>
    );
  }

  const { decision, trigger, whyItMatters, impactMap, engineeringSnapshot,
          knowledgeConcentration, responsibilityCoverage, dependencyChain,
          agentActivity, scenarioDefaults, evidence, systemStatus } = data;

  // Safe fallbacks for live data that doesn't have synthetic-only sections
  const effectiveWhyItMatters = whyItMatters || {
    text: `${decision?.title || 'Decision point detected'}. ${decision?.description || ''}`,
    evidence: (evidence || [
      { label: 'Trigger Type', value: decision?.type || 'TRIGGER', prov: 'DERIVED' },
      { label: 'Project', value: decision?.project || 'Project', prov: 'REAL_DB' },
      { label: 'Task', value: decision?.task || 'Task', prov: 'REAL_DB' },
      { label: 'Severity', value: decision?.severity || 'HIGH', prov: 'DERIVED' },
    ]).map(e => ({
      label: e.label,
      value: e.value,
      prov: e.prov || e.source || e.provenance || 'REAL_DB',
    })),
  };

  const effectiveImpactMap = impactMap || {
    project: { name: decision?.project || 'Project', health: decision?.severity || 'MEDIUM', provenance: 'REAL_DB' },
    task: { name: decision?.task || 'Task', priority: decision?.severity === 'CRITICAL' ? 'P0' : 'P1', status: 'In Progress', provenance: 'REAL_DB' },
    owner: {
      name: trigger?.after?.member || engineeringSnapshot?.owner?.name || 'Unassigned',
      status: trigger?.after?.status || engineeringSnapshot?.owner?.status || 'AVAILABLE',
      capacity: trigger?.after?.capacity ?? engineeringSnapshot?.owner?.capacity ?? 0,
      provenance: trigger?.after?.provenance || 'DERIVED',
    },
    deadline: { label: 'Active', value: 24, unit: 'hours', provenance: 'DERIVED' },
    downstream: [],
    responsibilities: [{ name: decision?.task || 'Task', coverage: decision?.severity === 'CRITICAL' ? 'CRITICAL' : 'PARTIAL', provenance: 'DERIVED' }],
    availableMembers: (engineeringSnapshot?.candidates || []).map(c => ({
      name: c.name,
      capacity: c.capacity ?? 0,
      status: c.status || 'AVAILABLE',
      contextScore: c.contextScore ?? 0,
      contextLabel: contextScoreToLabel(c.contextScore ?? 0),
      provenance: 'DERIVED',
    })),
    aiWorkers: [
      { name: 'Coding Agent', status: 'AVAILABLE', capability: 'Implementation support' },
      { name: 'Review Agent', status: 'AVAILABLE', capability: 'Code review assistance' },
    ],
  };

  const isLive = mode === 'LIVE';

  return (
    <div className="dv-intelligence" style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Demo Warning Banner */}
      <AnimatePresence>
        {!isLive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              background: 'var(--dv-warning-subtle)', borderBottom: '1px solid var(--dv-warning-border)',
              padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--dv-warning)' }}>
              <Shield size={16} />
              <div style={{ fontSize: 'var(--dv-text-sm)' }}>
                 <strong>CONTROLLED DEMO SCENARIO</strong> &mdash; This view uses a controlled scenario. No live workspace data is being modified.
              </div>
            </div>
            <DvButton variant="outline" size="sm" onClick={handleExitDemo} style={{ borderColor: 'var(--dv-warning)', color: 'var(--dv-warning)' }}>
              Exit Demo
            </DvButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sticky sub-header ── */}
      <div style={{
        padding: '10px 40px', borderBottom: '1px solid var(--dv-border-subtle)',
        background: 'var(--dv-bg-canvas)', position: 'sticky', top: isLive ? 52 : 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, color: 'var(--dv-text-muted)', fontSize: 11,
          }}>
            <ArrowLeft size={12} />
            Back
          </button>
          <span style={{ color: 'var(--dv-text-faint)' }}>/</span>
          <span style={{ fontSize: 11, color: 'var(--dv-text-secondary)' }}>Decision Point</span>
          {decision?.severity && (
            <DvBadge variant={severityToVariant(decision.severity)} size="sm" dot>{decision.severity}</DvBadge>
          )}
          <div style={{ width: 1, height: 14, background: 'var(--dv-border-subtle)' }} />
          <SourceChip source={mode} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {mode === 'LIVE' && (
            <DvButton variant="outline" size="sm" onClick={handleSimulateDemo} icon={AlertTriangle}>
              Simulate Demo
            </DvButton>
          )}
        </div>
      </div>

      {/* ── Page body ── */}
      <div style={{ padding: '24px 40px', maxWidth: 1440, margin: '0 auto' }}>
        <motion.div variants={staggerChildren} initial="hidden" animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero */}
          {decision && <DecisionHero decision={decision} systemStatus={systemStatus} onBack={() => navigate(-1)} />}

          {/* Main content layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {trigger && <motion.div variants={fadeUp}><TriggerSection trigger={trigger} /></motion.div>}
            <motion.div variants={fadeUp}><WhyItMatters data={effectiveWhyItMatters} /></motion.div>
            <motion.div variants={fadeUp}><ImpactMap impactMap={effectiveImpactMap} /></motion.div>
          </div>

          {/* Full-width: Scenario builder */}
          <motion.div variants={fadeUp}>
            <ScenarioBuilder defaults={scenarioDefaults} decisionId={id} />
          </motion.div>


          {/* CTA */}
          <motion.div variants={fadeUp}>
            <CtaSection decisionId={id} decisionSeverity={decision?.severity} mode={mode} task_id={decision?.task_id} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
