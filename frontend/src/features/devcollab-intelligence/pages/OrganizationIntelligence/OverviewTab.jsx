import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Brain, Users, Layers, Activity, Zap, Shield, Link2, AlertCircle } from 'lucide-react';
import { DvCard, DvButton, DvBadge } from '../../primitives/core';
import { EngineeringEvidenceControl, SectionLabel } from './shared';
import { staggerChildren, fadeUp, panelEnter } from '../../motion/presets';

function EngineeringAnalysisPanel({ decisionPoints, responsibilities, onViewDecisionPoints }) {
  const criticalResps = responsibilities?.filter(r => r.coverage === 'CRITICAL' || r.coverage === 'FRAGILE') || [];
  const noBackup = responsibilities?.filter(r => !r.backup) || [];
  const dpCount = decisionPoints?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DvCard style={{ padding: '20px 24px', borderColor: 'var(--dv-accent-border)', background: 'var(--dv-accent-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Brain size={14} color="var(--dv-accent)" />
          <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dv-accent)' }}>
            Engineering Analysis
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {dpCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Zap size={14} color="var(--dv-danger)" />
              <span><strong>{dpCount}</strong> decision point{dpCount > 1 ? 's' : ''} identified</span>
            </div>
          )}
          {criticalResps.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Users size={14} color="var(--dv-warning)" />
              <span><strong>{criticalResps.length}</strong> critical ownership concentration{criticalResps.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {noBackup.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Shield size={14} color="var(--dv-warning)" />
              <span><strong>{noBackup.length}</strong> responsibilit{noBackup.length > 1 ? 'ies' : 'y'} without qualified backup</span>
            </div>
          )}
          {dpCount === 0 && criticalResps.length === 0 && noBackup.length === 0 && (
            <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
              No critical risks identified.
            </div>
          )}
        </div>

        {dpCount > 0 && (
          <DvButton
             variant="outline"
             size="sm"
             style={{ width: '100%', borderColor: 'var(--dv-accent)', color: 'var(--dv-text-primary)' }}
             onClick={onViewDecisionPoints}
          >
             VIEW DECISION POINTS
          </DvButton>
        )}
      </DvCard>
    </div>
  );
}

export default function OverviewTab({ data, onSyncSuccess }) {
  const navigate = useNavigate();
  const { organization: org, projects, decisionPoints, responsibilities, members } = data;

  const criticalTasks = (projects || []).reduce((acc, p) => acc + p.critical_tasks, 0);
  const blockedTasks = (projects || []).reduce((acc, p) => acc + p.blocked_tasks, 0);
  
  const atRiskProjects = (projects || []).filter(p => p.health === 'HIGH' || p.health === 'CRITICAL');
  const overloadedMembers = (members || []).filter(m => m.availability === 'OVERLOADED');

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Evidence Control */}
      <motion.div variants={fadeUp}>
        <EngineeringEvidenceControl onSyncSuccess={onSyncSuccess} />
      </motion.div>

      {/* Metrics */}
      <motion.div variants={fadeUp}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {[
            { label: 'Members',        value: org.member_count,        icon: Users,      color: 'var(--dv-text-primary)' },
            { label: 'Projects',       value: org.project_count,       icon: Layers,     color: 'var(--dv-accent)' },
            { label: 'Active Tasks',   value: org.active_task_count,   icon: Activity,   color: 'var(--dv-text-primary)' },
            { label: 'Critical Tasks', value: criticalTasks,           icon: AlertCircle,color: criticalTasks > 0 ? 'var(--dv-warning)' : 'var(--dv-text-muted)' },
            { label: 'Blocked Tasks',  value: blockedTasks,            icon: Shield,     color: blockedTasks > 0 ? 'var(--dv-danger)' : 'var(--dv-text-muted)' },
            { label: 'Decision Pts',   value: org.decision_point_count,icon: Zap,        color: org.decision_point_count > 0 ? 'var(--dv-danger)' : 'var(--dv-text-muted)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <DvCard key={label} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Icon size={16} color="var(--dv-text-faint)" />
              <div>
                <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color, lineHeight: 1 }}>{value}</div>
              </div>
            </DvCard>
          ))}
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Left column: People and Projects to watch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <motion.div variants={fadeUp}>
            <SectionLabel label="Projects Under Pressure" icon={Layers} />
            {atRiskProjects.length === 0 ? (
              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>No projects currently under pressure.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {atRiskProjects.map(p => (
                  <DvCard key={p.id} style={{ padding: '16px', borderLeft: `3px solid var(--dv-danger)` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 'var(--dv-text-md)', fontWeight: 600 }}>{p.name}</span>
                      <DvBadge variant="danger" dot>{p.health}</DvBadge>
                    </div>
                    <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                      {p.active_tasks} active · {p.blocked_tasks > 0 ? <span style={{ color: 'var(--dv-danger)' }}>{p.blocked_tasks} blocked</span> : '0 blocked'}
                    </div>
                  </DvCard>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeUp}>
            <SectionLabel label="People Overloaded" icon={Users} />
            {overloadedMembers.length === 0 ? (
              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>No members currently overloaded.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {overloadedMembers.map(m => (
                  <DvCard key={m.id} style={{ padding: '16px', borderLeft: `3px solid var(--dv-danger)` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 'var(--dv-text-md)', fontWeight: 600 }}>{m.name}</span>
                      <DvBadge variant="danger">OVERLOADED</DvBadge>
                    </div>
                    <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                      Capacity: {m.capacity_pct}% · {m.active_task_count} active tasks
                    </div>
                  </DvCard>
                ))}
              </div>
            )}
          </motion.div>

          {/* Decision Concentration */}
          <motion.div variants={fadeUp}>
            <SectionLabel id="decision-concentration" label="Decision Signals" icon={AlertTriangle} />
            {decisionPoints.length === 0 ? (
              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>No critical decisions pending.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                {decisionPoints.map(dp => (
                  <DvCard key={dp.id} style={{
                    padding: '16px', borderColor: dp.severity === 'CRITICAL' ? 'var(--dv-danger-border)' : 'var(--dv-warning-border)',
                    background: dp.severity === 'CRITICAL' ? 'var(--dv-danger-subtle)' : 'var(--dv-warning-subtle)',
                    position: 'relative', overflow: 'hidden', cursor: 'pointer'
                  }} onClick={() => navigate(`?view=decisions`)}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: dp.severity === 'CRITICAL' ? 'var(--dv-danger)' : 'var(--dv-warning)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <DvBadge variant={dp.severity === 'CRITICAL' ? 'danger' : 'warning'} dot size="sm">{dp.severity}</DvBadge>
                      <span style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>{dp.affected_project}</span>
                    </div>
                    <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-text-primary)', marginBottom: 6, lineHeight: 1.4 }}>{dp.trigger}</div>
                    <div style={{ fontSize: 11, color: 'var(--dv-text-secondary)', lineHeight: 1.5 }}>{dp.impact}</div>
                  </DvCard>
                ))}
              </div>
            )}
          </motion.div>

        </div>

        {/* Right column: Engineering Analysis */}
        <motion.div variants={fadeUp} style={{ position: 'sticky', top: 160 }}>
          <SectionLabel label="Engineering Analysis" icon={Brain} />
          <EngineeringAnalysisPanel
            decisionPoints={decisionPoints}
            responsibilities={responsibilities}
            onViewDecisionPoints={() => navigate(`?view=decisions`)}
          />
        </motion.div>

      </div>
    </motion.div>
  );
}
