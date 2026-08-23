import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { slideIn } from '../../motion/presets';
import { ProvenancePip, mono } from './shared';
import { DvBadge } from '../../primitives/core';
import { coverageToVariant, contextLabelToVariant, getMemberEvidence, summarizeMemberEvidence } from '../../data/organizationAdapter';

export default function ContextInspector({ node, onClose, members, projects, responsibilities }) {
  if (!node) return null;

  const { type, payload, label } = node;

  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        variants={slideIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position:   'fixed',
          top:        0, right: 0, bottom: 0,
          width:      380,
          background: 'var(--dv-bg-canvas)',
          borderLeft: '1px solid var(--dv-border-default)',
          zIndex:     200,
          display:    'flex',
          flexDirection: 'column',
          overflowY:  'auto',
        }}
        role="dialog"
        aria-label={`Inspector: ${label}`}
      >
        <div style={{
          padding:      '18px 20px 14px',
          borderBottom: '1px solid var(--dv-border-subtle)',
          position:     'sticky',
          top:          0,
          background:   'var(--dv-bg-canvas)',
          zIndex:       1,
          display:      'flex',
          alignItems:   'flex-start',
          gap:          10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--dv-text-faint)', marginBottom: 4,
            }}>
              {type.toUpperCase()}
            </div>
            <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>
              {label}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close inspector"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--dv-text-muted)', padding: 4, marginTop: -2,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', flex: 1 }}>
          {type === 'org'     && <OrgInspector members={members} projects={projects} />}
          {type === 'project' && <ProjectInspector project={payload} members={members} responsibilities={responsibilities} />}
          {type === 'member'  && <MemberInspector member={payload} />}
          {type === 'task'    && <TaskInspector task={payload} />}
          {type === 'dp'      && <DecisionInspector dp={payload} members={members} />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function InspectorRow({ label, value, prov, rationale }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--dv-border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: rationale ? 4 : 0 }}>
        <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>{value}</span>
          {prov && <ProvenancePip prov={prov} />}
        </div>
      </div>
      {rationale && (
        <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', lineHeight: 1.4 }}>
          {rationale}
        </div>
      )}
    </div>
  );
}

function InspectorSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--dv-text-faint)', marginBottom: 8,
      }}>{title}</div>
      {children}
    </div>
  );
}

function OrgInspector({ members, projects }) {
  return (
    <>
      <InspectorSection title="Signals">
        <InspectorRow label="Members"  value={members.length}  prov="REAL_DB" />
        <InspectorRow label="Projects" value={projects.length} prov="REAL_DB" />
        <InspectorRow label="Overloaded" value={members.filter(m => m.availability === 'OVERLOADED').length} prov="DERIVED" />
        <InspectorRow label="At-risk projects" value={projects.filter(p => p.health === 'HIGH' || p.health === 'CRITICAL').length} prov="DERIVED" />
      </InspectorSection>
    </>
  );
}

function ProjectInspector({ project, members, responsibilities }) {
  const r = (responsibilities || []).filter(r => r.project_name === project?.name);
  return project ? (
    <>
      <InspectorSection title="Health">
        <InspectorRow label="Health"          value={project.health}        prov="DERIVED" />
        <InspectorRow label="Progress"        value={`${project.progress}%`}  prov="DERIVED" />
        <InspectorRow label="Active Tasks"    value={project.active_tasks}  prov="REAL_DB" />
        <InspectorRow label="Blocked Tasks"   value={project.blocked_tasks} prov="REAL_DB" />
        <InspectorRow label="Critical Tasks"  value={project.critical_tasks}prov="REAL_DB" />
        <InspectorRow label="Knowledge Owner" value={project.knowledge_concentration} prov="DERIVED" />
      </InspectorSection>
      {r.length > 0 && (
        <InspectorSection title="Responsibility Coverage">
          {r.map(resp => (
            <div key={resp.id} style={{ marginBottom: 10, padding: '8px 10px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>{resp.title}</span>
                <DvBadge variant={coverageToVariant(resp.coverage)} size="sm">{resp.coverage}</DvBadge>
              </div>
              <div style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>
                Owner: <span style={{ color: 'var(--dv-text-secondary)' }}>{resp.owner}</span>
                {' · '}
                Backup: <span style={{ color: resp.backup ? 'var(--dv-text-secondary)' : 'var(--dv-danger)' }}>{resp.backup ?? 'None'}</span>
                {resp.backup && <span style={{ color: 'var(--dv-text-faint)' }}> ({resp.backup_context}% ctx)</span>}
              </div>
            </div>
          ))}
        </InspectorSection>
      )}
    </>
  ) : null;
}

function MemberInspector({ member }) {
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('Generating summary...');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMemberEvidence(member.id).then(res => {
      if (!cancelled && res) {
        setEvidence(res);
      }
      if (!cancelled) setLoading(false);
    });
    
    // Fetch AI Summary concurrently
    summarizeMemberEvidence(member.id).then(res => {
        if (!cancelled && res) {
            setAiSummary(res.summary || 'Summary unavailable.');
        }
    });
    
    return () => { cancelled = true; };
  }, [member.id]);

  return member ? (
    <>
      <InspectorSection title="Capacity & Availability">
        <InspectorRow label="Availability" value={evidence?.capacity?.availability || member.availability}   prov="DERIVED" />
        <InspectorRow label="Capacity Load" value={`${evidence?.capacity?.capacity_pct || member.capacity_pct}%`} prov="DERIVED" />
        <InspectorRow label="Active Tasks"  value={evidence?.capacity?.active_task_count || member.active_task_count}   prov="REAL_DB" />
        <InspectorRow label="Critical"      value={evidence?.capacity?.critical_task_count || member.critical_task_count} prov="REAL_DB" />
      </InspectorSection>
      
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <Loader2 className="dv-spinner" size={24} color="var(--dv-text-faint)" />
        </div>
      ) : evidence ? (
        <>
          <InspectorSection title="AI Summary">
            <div style={{
              fontSize: 'var(--dv-text-xs)', padding: '12px', borderRadius: 'var(--dv-radius-sm)',
              background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
              color: 'var(--dv-text-secondary)', lineHeight: 1.5
            }}>
              {aiSummary}
            </div>
          </InspectorSection>
          
          <InspectorSection title="Detailed Evidence">
            {evidence.evidence && evidence.evidence.length > 0 ? (
              evidence.evidence.filter(e => e.value !== null).map((e, idx) => (
                <InspectorRow key={idx} label={e.feature.replace(/_/g, ' ')} value={e.value} prov={e.provenance} rationale={e.explanation} />
              ))
            ) : (
              <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', padding: '10px 0' }}>
                No detailed task evidence (select a task for specific context).
              </div>
            )}
          </InspectorSection>
        </>
      ) : null}

      <InspectorSection title="Owned Tasks">
        {!member.owned_tasks ? (
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
            NOT AVAILABLE FROM CURRENT WORKSPACE DATA
          </div>
        ) : member.owned_tasks.length === 0 ? (
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', padding: '10px 0' }}>
            No tasks currently owned
          </div>
        ) : (
          member.owned_tasks.slice(0, 4).map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--dv-border-subtle)' }}>
              <DvBadge variant={task.priority === 'P0' ? 'danger' : task.priority === 'P1' ? 'warning' : 'muted'} size="sm">{task.priority}</DvBadge>
              <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', flex: 1 }}>{task.title}</span>
              {task.dependency_count > 0 && (
                <span style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)' }}>{task.dependency_count} deps</span>
              )}
            </div>
          ))
        )}
      </InspectorSection>
    </>
  ) : null;
}

function TaskInspector({ task }) {
  return task ? (
    <>
      <InspectorSection title="Task Details">
        <InspectorRow label="Priority"    value={task.priority}    prov="REAL_DB" />
        <InspectorRow label="Status"      value={task.status}      prov="REAL_DB" />
        <InspectorRow label="Project"     value={task.project_name}prov="REAL_DB" />
        <InspectorRow label="Downstream dependencies" value={task.dependency_count} prov="SYNTHETIC_DEMO" />
      </InspectorSection>
    </>
  ) : null;
}

function DecisionInspector({ dp, members }) {
  const affectedMember = members.find(m => m.name === dp?.affected_member);
  return dp ? (
    <>
      <div style={{
        padding: '10px 14px', marginBottom: 16,
        background: 'var(--dv-danger-subtle)', border: '1px solid var(--dv-danger-border)',
        borderRadius: 'var(--dv-radius-md)',
      }}>
        <DvBadge variant="danger" dot style={{ marginBottom: 6 }}>{dp.severity}</DvBadge>
        <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', lineHeight: 1.5 }}>{dp.trigger}</div>
      </div>
      <InspectorSection title="Impact">
        <p style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', lineHeight: 1.6, margin: 0 }}>{dp.impact}</p>
      </InspectorSection>
      {dp.evidence && (
        <InspectorSection title="Evidence">
          {dp.evidence.map((ev, i) => (
            <InspectorRow key={i} label={ev.label} value={ev.value} prov={ev.provenance} rationale={ev.rationale} />
          ))}
        </InspectorSection>
      )}
      {affectedMember && (
        <InspectorSection title="Affected Member">
          <InspectorRow label="Name"       value={affectedMember.name}             prov="REAL_DB" />
          <InspectorRow label="Capacity"   value={`${affectedMember.capacity_pct}%`}  prov="DERIVED" />
          <InspectorRow label="Availability" value={affectedMember.availability}   prov="DERIVED" />
        </InspectorSection>
      )}
    </>
  ) : null;
}
