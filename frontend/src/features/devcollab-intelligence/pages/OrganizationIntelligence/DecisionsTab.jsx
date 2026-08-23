import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { SectionLabel } from './shared';
import { DvCard, DvBadge } from '../../primitives/core';
import { fadeUp, staggerChildren } from '../../motion/presets';

export default function DecisionsTab({ data, onSelectNode }) {
  const { decisionPoints, members } = data;

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <motion.div variants={fadeUp}>
        <SectionLabel id="decision-concentration" label="Decision Concentration" icon={AlertTriangle} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {decisionPoints.map(dp => {
            const affectedMember = members.find(m => m.name === dp.affected_member);
            return (
              <DvCard key={dp.id} style={{
                padding: '16px', borderColor: dp.severity === 'CRITICAL' ? 'var(--dv-danger-border)' : 'var(--dv-warning-border)',
                background: dp.severity === 'CRITICAL' ? 'var(--dv-danger-subtle)' : 'var(--dv-warning-subtle)',
                position: 'relative', overflow: 'hidden', cursor: 'pointer'
              }} onClick={() => onSelectNode?.({ id: `dp-${dp.id}`, type: 'dp', payload: dp, label: dp.severity })}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: dp.severity === 'CRITICAL' ? 'var(--dv-danger)' : 'var(--dv-warning)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <DvBadge variant={dp.severity === 'CRITICAL' ? 'danger' : 'warning'} dot size="sm">{dp.severity}</DvBadge>
                  <span style={{ fontSize: 10, color: 'var(--dv-text-muted)' }}>{dp.affected_project}</span>
                </div>
                <div style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 600, color: 'var(--dv-text-primary)', marginBottom: 6, lineHeight: 1.4 }}>{dp.trigger}</div>
                <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{dp.impact}</div>
                {dp.evidence && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {dp.evidence.map((ev, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', background: 'rgba(0,0,0,0.15)', borderRadius: 3 }}>
                        <span style={{ fontSize: 9, color: 'var(--dv-text-muted)' }}>{ev.label}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-secondary)' }}>{ev.value}</span>
                        
                      </div>
                    ))}
                  </div>
                )}
              </DvCard>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
