import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DvCard, DvButton, DvBadge } from '../primitives/core';
import { panelEnter } from '../motion/presets';

export default function DecisionRequiredModal({ decisionPoint, onClose }) {
  const navigate = useNavigate();
  if (!decisionPoint) return null;
  
  const { affected_member, affected_tasks, downstream_impact, candidates } = decisionPoint;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <motion.div variants={panelEnter} initial="hidden" animate="visible" style={{ width: '100%', maxWidth: 600 }}>
        <DvCard style={{ overflow: 'hidden' }}>
          
          <div style={{ background: 'var(--dv-danger-subtle)', padding: '20px 24px', borderBottom: '1px solid var(--dv-danger-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle color="var(--dv-danger)" size={24} />
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--dv-danger)' }}>DECISION REQUIRED</div>
              <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 600, color: 'var(--dv-danger-text)' }}>
                {affected_member.username} is unavailable for {affected_member.duration_days} days.
              </div>
            </div>
          </div>
          
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Affected</div>
              {affected_tasks.map(task => (
                <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)', borderRadius: 'var(--dv-radius-md)', marginBottom: 8 }}>
                  <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600 }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <DvBadge variant={task.priority === 'P0' ? 'danger' : 'warning'} size="sm">{task.priority}</DvBadge>
                    <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)' }}>{affected_member.username}</span>
                  </div>
                </div>
              ))}
            </div>

            {downstream_impact && downstream_impact.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Downstream</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {downstream_impact.map(t => (
                    <div key={t.task_id} style={{ fontSize: 'var(--dv-text-xs)', padding: '4px 8px', background: 'var(--dv-bg-subtle)', borderRadius: 'var(--dv-radius-sm)', color: 'var(--dv-text-secondary)', border: '1px solid var(--dv-border-subtle)' }}>
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate Overview</div>
              <div style={{ fontSize: 'var(--dv-text-sm)' }}>
                {candidates && candidates.map(c => c.username).join(' / ')}
              </div>
            </div>
            
            <div style={{ padding: '16px', background: 'var(--dv-bg-subtle)', borderRadius: 'var(--dv-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600 }}>Current state</div>
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)' }}>No mutation has occurred.</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <DvButton variant="ghost" onClick={onClose}>Dismiss</DvButton>
                <DvButton variant="primary" onClick={() => navigate(`/dashboard/intelligence/simulation/task/${affected_tasks[0]?.id}`)} icon={Zap}>REVIEW DECISION</DvButton>
              </div>
            </div>
          </div>
          
        </DvCard>
      </motion.div>
    </div>
  );
}
