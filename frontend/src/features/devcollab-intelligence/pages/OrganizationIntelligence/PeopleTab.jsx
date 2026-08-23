import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, GitBranch, GitMerge, Loader2, ArrowLeft, Code2, CheckCircle2 } from 'lucide-react';
import { SectionLabel, cap } from './shared';
import { DvCard, DvBadge, DvAvatar, DvProgressBar, DvProgressRing, DvButton } from '../../primitives/core';
import { availabilityToVariant, contextLabelToVariant, getMemberEvidence, summarizeMemberEvidence, compareTaskCandidates, getUnassignedTasks, recommendAndAssignTask } from '../../data/organizationAdapter';
import EngineeringGraph from './EngineeringGraph';
import { fadeUp, staggerChildren, slideIn } from '../../motion/presets';

const AVAIL_COLORS = {
  AVAILABLE: 'var(--dv-success)', IDLE: 'var(--dv-text-faint)',
  BUSY: 'var(--dv-warning)', OVERLOADED: 'var(--dv-danger)',
  UNAVAILABLE: 'var(--dv-danger)',
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
            {member.project_contexts?.slice(0, 1).map(ctx => (
              <div key={ctx.project_id}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <DvProgressRing value={ctx.context_score} max={100} size={38} stroke={3}
                    variant={ctx.context_score >= 70 ? 'recommended' : ctx.context_score >= 40 ? 'warning' : 'danger'} />
                </div>
                <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-predicted)', fontWeight: 700 }}>{ctx.context_score}%</div>
                <div style={{ fontSize: 8, color: 'var(--dv-text-faint)', marginTop: 2 }}>{ctx.project_name}</div>
              </div>
            )) || <div style={{ fontSize: 9, color: 'var(--dv-text-muted)', marginTop: 12 }}>N/A</div>}
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
      </DvCard>
    </motion.div>
  );
}

function TaskComparisonSection({ selectedMember, onAssigned }) {
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [unassignedTasks, setUnassignedTasks] = useState([]);
  const [assigning, setAssigning] = useState(null); // developer id being assigned
  const [assignedId, setAssignedId] = useState(null); // developer id that was just assigned

  // Load real unassigned tasks from the DB
  useEffect(() => {
    getUnassignedTasks().then(res => {
      if (res?.tasks) setUnassignedTasks(res.tasks);
    });
  }, []);

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

  const handleAssign = async (developer) => {
    setAssigning(developer.id);
    try {
      await recommendAndAssignTask(Number(selectedTaskId), developer.id);
      // Find the project_id for this task to redirect to its Kanban board
      const assignedTask = unassignedTasks.find(t => String(t.id) === String(selectedTaskId));
      const projectId = assignedTask?.project_id;
      setAssignedId(developer.id);
      // Remove the assigned task from the local unassigned list
      setUnassignedTasks(prev => prev.filter(t => String(t.id) !== String(selectedTaskId)));
      setSelectedTaskId('');
      setComparison(null);
      // Trigger full refresh so Intelligence stats update
      onAssigned?.();
      // Redirect to the project's Kanban board after a brief moment
      if (projectId) {
        setTimeout(() => navigate(`/projects/${projectId}/board`), 800);
      }
    } catch (err) {
      alert('Failed to assign task. Please try again.');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
      <SectionLabel label="Evaluate For Task" icon={GitMerge} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select 
          value={selectedTaskId} 
          onChange={e => setSelectedTaskId(e.target.value)}
          style={{
            background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
            color: 'var(--dv-text-primary)', padding: '8px 12px', borderRadius: 'var(--dv-radius-sm)',
            fontSize: 'var(--dv-text-sm)', flex: 1, maxWidth: 400
          }}
        >
          <option value="">{unassignedTasks.length === 0 ? '-- No unassigned tasks --' : '-- Select an Unassigned Task --'}</option>
          {unassignedTasks.map(t => (
            <option key={t.id} value={t.id}>[{t.priority}] {t.project_name} → {t.title}</option>
          ))}
        </select>
        {loading && <Loader2 className="dv-spinner" size={16} color="var(--dv-accent)" />}
      </div>

      {assignedId && (
        <div style={{
          padding: '12px 16px', background: 'var(--dv-success-subtle)',
          border: '1px solid var(--dv-success-border)', borderRadius: 'var(--dv-radius-md)',
          display: 'flex', alignItems: 'center', gap: 8, color: 'var(--dv-success)', fontSize: 'var(--dv-text-sm)', fontWeight: 600
        }}>
          <CheckCircle2 size={16} />
          Task assigned! The Kanban board and capacity stats have been updated.
        </div>
      )}

      {comparison && comparison.candidates && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 16 }}>
          {comparison.candidates.map(c => (
            <DvCard key={c.developer.id} style={{ 
              padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
              border: c.developer.id === selectedMember.id ? '1px solid var(--dv-accent)' : '1px solid var(--dv-border-subtle)',
              background: c.developer.id === selectedMember.id ? 'var(--dv-bg-elevated)' : 'var(--dv-bg-canvas)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <DvAvatar name={c.developer.name} size={40} />
                  <div>
                    <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>{c.developer.name}</div>
                    {c.developer.id === selectedMember.id && (
                      <div style={{ fontSize: 11, color: 'var(--dv-accent)', fontWeight: 500, marginTop: 2 }}>SELECTED CANDIDATE</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Context Match</div>
                  <DvBadge variant={contextLabelToVariant(c.context.level)}>{c.context.level}</DvBadge>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Key Evidence</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {c.evidence.filter(e => e.value !== null).slice(0, 3).map((e, idx) => (
                      <div key={idx} style={{ padding: '8px 10px', background: 'var(--dv-bg-canvas)', borderRadius: 'var(--dv-radius-sm)', border: '1px solid var(--dv-border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dv-text-primary)' }}>{e.feature.replace(/_/g, ' ')}</span>
                          <DvBadge variant="muted" size="sm" style={{ fontSize: 9 }}>{e.provenance}</DvBadge>
                        </div>
                        <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', lineHeight: 1.4 }}>
                          {e.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                {assignedId === c.developer.id ? (
                  <DvButton variant="success" style={{ width: '100%', opacity: 0.8 }} disabled>
                    <CheckCircle2 size={14} style={{ marginRight: 6 }} /> Assigned!
                  </DvButton>
                ) : (
                  <DvButton
                    variant="primary"
                    style={{ width: '100%' }}
                    onClick={() => handleAssign(c.developer)}
                    disabled={!!assigning}
                  >
                    {assigning === c.developer.id ? (
                      <><Loader2 size={14} className="dv-spinner" style={{ marginRight: 6 }} /> Assigning...</>
                    ) : 'Recommend for Task'}
                  </DvButton>
                )}
              </div>
            </DvCard>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AnalyzeEvidenceView({ member, onBack, onEvaluate }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await summarizeMemberEvidence(member.id);
      if (!mountedRef.current) return; // Component unmounted while waiting — discard
      setSummary(res?.summary || 'No summary available.');
    } finally {
      if (mountedRef.current) setAnalyzing(false);
    }
  };

  return (
    <motion.div variants={slideIn} initial="hidden" animate="visible" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dv-text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dv-text-primary)', margin: 0 }}>Candidate Analysis</h2>
          <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginTop: 4 }}>Analyzing engineering context for {member.name}</div>
        </div>
      </div>

      <DvCard style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DvAvatar name={member.name} size={48} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--dv-text-primary)' }}>{member.name}</div>
              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>{member.role}</div>
            </div>
          </div>
          <DvBadge variant={availabilityToVariant(member.availability)}>{member.availability} ({member.capacity_pct}% Capacity)</DvBadge>
        </div>

        <div style={{ height: 1, background: 'var(--dv-border-subtle)', margin: '4px 0' }} />

        <div>
          <SectionLabel label="Engineering Evidence" icon={Code2} />
          
          {!summary && !analyzing && (
            <div style={{ 
              padding: 32, textAlign: 'center', background: 'var(--dv-bg-elevated)', 
              borderRadius: 'var(--dv-radius-md)', border: '1px dashed var(--dv-border-strong)' 
            }}>
              <Code2 size={32} color="var(--dv-text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
              <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 500, color: 'var(--dv-text-primary)', marginBottom: 8 }}>
                Analyze GitHub History
              </div>
              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Fetch and summarize real repository evidence and technical context from {member.name}'s connected GitHub account.
              </div>
              <DvButton variant="primary" onClick={handleAnalyze} style={{ minWidth: 200 }}>
                Analyze with Gemini
              </DvButton>
            </div>
          )}

          {analyzing && (
            <div style={{ 
              padding: 40, textAlign: 'center', background: 'var(--dv-bg-elevated)', 
              borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' 
            }}>
              <Loader2 className="dv-spinner" size={32} color="var(--dv-accent)" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 500, color: 'var(--dv-text-primary)' }}>
                Analyzing Engineering Evidence...
              </div>
              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginTop: 8 }}>
                Gemini is synthesizing repository history and technical expertise.
              </div>
            </div>
          )}

          {summary && !analyzing && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ 
              padding: 24, background: 'var(--dv-success-subtle)', 
              borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-success-border)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle2 size={18} color="var(--dv-success)" />
                <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-success)' }}>Analysis Complete</span>
              </div>
              <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', lineHeight: 1.6, margin: 0 }}>
                {summary}
              </p>
            </motion.div>
          )}
        </div>

        {summary && !analyzing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
             <DvButton variant="primary" onClick={onEvaluate}>Evaluate for Unassigned Task</DvButton>
          </div>
        )}
      </DvCard>
    </motion.div>
  );
}

export default function PeopleTab({ data, onSelectNode, onSyncSuccess }) {
  const { members, responsibilities, projects, decisionPoints } = data;
  
  const [step, setStep] = useState('SELECT_MEMBER'); // SELECT_MEMBER, ANALYZE_EVIDENCE, COMPARE_TASKS
  const [selectedMember, setSelectedMember] = useState(null);

  const sortedMembers = useMemo(() =>
    members ? [...members].sort((a, b) => (b.capacity_pct || 0) - (a.capacity_pct || 0)) : [], [members]);

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setStep('ANALYZE_EVIDENCE');
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      {step === 'SELECT_MEMBER' && (
        <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <motion.div variants={fadeUp}>
            <SectionLabel label="Engineering Graph" icon={GitBranch} right={<span style={{ fontSize: 10, color: 'var(--dv-text-faint)' }}>Visual overview</span>} />
            <EngineeringGraph members={members} projects={projects} decisionPoints={decisionPoints} onSelectNode={onSelectNode} />
          </motion.div>
          
          <motion.div variants={fadeUp}>
            <SectionLabel
              label="Select a Member to Analyze"
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
                  onClick={() => handleMemberClick(member)}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {step === 'ANALYZE_EVIDENCE' && selectedMember && (
        <AnalyzeEvidenceView 
          member={selectedMember} 
          onBack={() => setStep('SELECT_MEMBER')} 
          onEvaluate={() => setStep('COMPARE_TASKS')}
        />
      )}

      {step === 'COMPARE_TASKS' && selectedMember && (
        <motion.div variants={slideIn} initial="hidden" animate="visible">
           <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button onClick={() => setStep('ANALYZE_EVIDENCE')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dv-text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dv-text-primary)', margin: 0 }}>Evaluate Match</h2>
              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginTop: 4 }}>Comparing {selectedMember.name}'s context against task requirements</div>
            </div>
          </div>
          <TaskComparisonSection selectedMember={selectedMember} onAssigned={onSyncSuccess} />
        </motion.div>
      )}
    </div>
  );
}
