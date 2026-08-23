import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, GitBranch, GitMerge, Loader2 } from 'lucide-react';
import { SectionLabel, cap } from './shared';
import { DvCard, DvBadge, DvAvatar, DvProgressBar, DvProgressRing, DvButton } from '../../primitives/core';
import { availabilityToVariant, contextLabelToVariant } from '../../data/organizationAdapter';
import { compareTaskCandidates } from '../../data/organizationAdapter';
import EngineeringGraph from './EngineeringGraph';
import { fadeUp, staggerChildren } from '../../motion/presets';

const AVAIL_COLORS = {
  AVAILABLE: 'var(--dv-success)', IDLE: 'var(--dv-text-faint)',
  BUSY: 'var(--dv-warning)', OVERLOADED: 'var(--dv-danger)',
};

function MemberIntelligenceCard({ member, responsibilities, onClick }) {
  const criticalResps = (responsibilities || []).filter(
    r => r.owner === member.name && (r.coverage === 'CRITICAL' || r.coverage === 'FRAGILE')
  );

  return (
    <motion.div variants={fadeUp}>
      <DvCard
        onClick={onClick}
        style={{
          padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14,
          transition: 'border-color 0.12s', height: '100%',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--dv-border-strong)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <DvAvatar name={member.name} size={38} />
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 9, height: 9, borderRadius: '50%',
              background: AVAIL_COLORS[member.availability] ?? 'var(--dv-text-faint)',
              border: '1.5px solid var(--dv-bg-canvas)',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{member.name}</div>
            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{member.role}</div>
          </div>
          <DvBadge variant={availabilityToVariant(member.availability)} size="sm">{member.availability}</DvBadge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
            <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Capacity</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <DvProgressRing value={member.capacity_pct} max={100} size={38} stroke={3}
                variant={member.capacity_pct >= 85 ? 'danger' : member.capacity_pct >= 55 ? 'warning' : 'recommended'} />
            </div>
            <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: cap(member.capacity_pct), fontWeight: 700 }}>
              {member.capacity_pct}%
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
            <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Context</div>
            {member.project_contexts.slice(0, 1).map(ctx => (
              <div key={ctx.project_id}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <DvProgressRing value={ctx.context_score} max={100} size={38} stroke={3}
                    variant={ctx.context_score >= 70 ? 'recommended' : ctx.context_score >= 40 ? 'warning' : 'danger'} />
                </div>
                <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-predicted)', fontWeight: 700 }}>{ctx.context_score}%</div>
                <div style={{ fontSize: 8, color: 'var(--dv-text-faint)', marginTop: 2 }}>{ctx.project_name}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
            <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Responsiblity</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: criticalResps.length > 0 ? 'var(--dv-danger)' : 'var(--dv-text-secondary)', lineHeight: 1, marginBottom: 4 }}>
              {member.active_task_count}
            </div>
            <div style={{ fontSize: 9, color: criticalResps.length > 0 ? 'var(--dv-danger)' : 'var(--dv-text-faint)' }}>
              {criticalResps.length > 0 ? `${criticalResps.length} critical` : 'tasks'}
            </div>
          </div>
        </div>

        {member.availability === 'AVAILABLE' && member.project_contexts.some(c => c.context_score < 40) && (
          <div style={{
            fontSize: 10, padding: '6px 10px', borderRadius: 'var(--dv-radius-sm)',
            background: 'var(--dv-warning-subtle)', border: '1px solid var(--dv-warning-border)',
            color: 'var(--dv-warning)', lineHeight: 1.4,
          }}>
            ⚠ Available but low context on key projects
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {member.project_contexts.slice(0, 3).map(ctx => (
            <div key={ctx.project_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--dv-text-muted)', width: 72, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctx.project_name}</span>
              <div style={{ flex: 1 }}>
                <DvProgressBar value={ctx.context_score} max={100}
                  variant={ctx.context_score >= 70 ? 'recommended' : ctx.context_score >= 40 ? 'warning' : 'danger'} />
              </div>
              <DvBadge variant={contextLabelToVariant(ctx.context_label)} size="sm" style={{ flexShrink: 0, minWidth: 42, justifyContent: 'center' }}>
                {ctx.context_label}
              </DvBadge>
            </div>
          ))}
        </div>
      </DvCard>
    </motion.div>
  );
}

function TaskComparisonSection({ members }) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);

  // Extract all tasks
  const allTasks = useMemo(() => {
    const tasks = [];
    if (!members) return [];
    members.forEach(m => {
      if (m.owned_tasks) {
        m.owned_tasks.forEach(t => {
          if (!tasks.find(x => x.id === t.id)) {
            tasks.push(t);
          }
        });
      }
    });
    return tasks;
  }, [members]);

  useEffect(() => {
    if (!selectedTaskId) {
      setComparison(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    compareTaskCandidates(selectedTaskId).then(res => {
      if (!cancelled && res) {
        setComparison(res);
      }
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedTaskId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel label="Task-Specific Context Comparison" icon={GitMerge} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select 
          value={selectedTaskId} 
          onChange={e => setSelectedTaskId(e.target.value)}
          style={{
            background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
            color: 'var(--dv-text-primary)', padding: '6px 12px', borderRadius: 'var(--dv-radius-sm)',
            fontSize: 'var(--dv-text-xs)', flex: 1, maxWidth: 300
          }}
        >
          <option value="">-- Select a Task to Compare --</option>
          {allTasks.map(t => (
            <option key={t.id} value={t.id}>{t.project_name} → {t.title}</option>
          ))}
        </select>
        {loading && <Loader2 className="dv-spinner" size={14} color="var(--dv-text-faint)" />}
      </div>

      {comparison && comparison.candidates && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {comparison.candidates.map(c => (
            <DvCard key={c.developer.id} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DvAvatar name={c.developer.name} size={30} />
                  <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600 }}>{c.developer.name}</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: 8, background: 'var(--dv-bg-canvas)', borderRadius: 4, border: '1px solid var(--dv-border-subtle)' }}>
                  <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>Task-Specific Context</div>
                  <DvBadge variant={contextLabelToVariant(c.context.level)}>{c.context.level}</DvBadge>
                </div>
                <div style={{ padding: 8, background: 'var(--dv-bg-canvas)', borderRadius: 4, border: '1px solid var(--dv-border-subtle)' }}>
                  <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>Capacity</div>
                  <DvBadge variant={availabilityToVariant(c.capacity.availability)}>{c.capacity.availability}</DvBadge>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', marginBottom: 6 }}>Key Evidence</div>
                {c.evidence.filter(e => e.value !== null).slice(0, 3).map((e, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--dv-text-primary)' }}>{e.feature.replace(/_/g, ' ')}: {e.value}</div>
                      <div style={{ fontSize: 9, color: 'var(--dv-text-muted)' }}>{e.explanation}</div>
                    </div>
                    <DvBadge variant="muted" size="sm" style={{ fontSize: 8 }}>{e.provenance}</DvBadge>
                  </div>
                ))}
              </div>
            </DvCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PeopleTab({ data, onSelectNode }) {
  const { members, responsibilities, projects, decisionPoints } = data;
  
  const sortedMembers = useMemo(() =>
    members ? [...members].sort((a, b) => b.capacity_pct - a.capacity_pct) : [], [members]);

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <motion.div variants={fadeUp}>
        <SectionLabel label="Engineering Graph" icon={GitBranch} right={<span style={{ fontSize: 10, color: 'var(--dv-text-faint)' }}>Click any node to inspect</span>} />
        <EngineeringGraph members={members} projects={projects} decisionPoints={decisionPoints} onSelectNode={onSelectNode} />
      </motion.div>
      
      <motion.div variants={fadeUp}>
        <TaskComparisonSection members={members} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionLabel
          label="Member Intelligence"
          icon={Users}
          right={
            <span style={{ fontSize: 10, color: 'var(--dv-warning)', fontStyle: 'italic' }}>
              Available ≠ Ready to absorb work
            </span>
          }
        />
        <motion.div variants={staggerChildren} initial="hidden" animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {sortedMembers.map(member => (
            <MemberIntelligenceCard
              key={member.id}
              member={member}
              responsibilities={responsibilities}
              onClick={() => onSelectNode({ id: `mem-${member.id}`, type: 'member', payload: member, label: member.name })}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
