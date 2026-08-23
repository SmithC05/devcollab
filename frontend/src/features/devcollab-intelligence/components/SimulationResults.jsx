import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Clock, Shield, GitBranch, ArrowRight, CheckCircle, AlertTriangle, Eye, Info } from 'lucide-react';
import { DvCard, DvBadge, DvPanel, DvDivider, DvProgressBar, DvAvatar, DvButton } from '../primitives/core';
import { fadeUp, slideIn, staggerChildren } from '../motion/presets';

// Helper to format hours
const fmtHrs = (h) => (h !== null && h !== undefined ? `${h.toFixed(1)}h` : '—');

export function SimulationResults({ result }) {
  const { interventions, recommended } = result;

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 1. Recommendation Panel */}
      {recommended && (
        <motion.div variants={fadeUp}>
          <DvCard elevated style={{
            background: 'var(--dv-success-subtle)',
            border: '1px solid var(--dv-success-border)',
            padding: '24px 32px'
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ padding: 8, background: 'var(--dv-success)', borderRadius: 'var(--dv-radius-full)', color: '#000' }}>
                <CheckCircle size={16} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-success)', letterSpacing: '0.1em' }}>
                  DEVCOLLAB RECOMMENDATION
                </div>
                <div style={{ fontSize: 'var(--dv-text-xl)', fontWeight: 800, color: 'var(--dv-text-primary)' }}>
                  {recommended.type.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <DvDivider />
            {recommended.reason && recommended.reason.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', marginBottom: 12 }}>WHY THIS RESPONSE?</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recommended.reason.map((r, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', alignItems: 'flex-start' }}>
                      <ArrowRight size={14} color="var(--dv-success)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
               <DvButton variant="primary" onClick={() => onReview && onReview(recommended)}>
                 REVIEW RECOMMENDATION
               </DvButton>
            </div>
          </DvCard>
        </motion.div>
      )}

      {/* 2. Intervention Comparison */}
      <motion.div variants={fadeUp}>
        <DvCard style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Zap size={14} color="var(--dv-text-faint)" />
            <span style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, color: 'var(--dv-text-muted)', letterSpacing: '0.1em' }}>
              INTERVENTION COMPARISON
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--dv-border-subtle)' }}>
                  <th style={{ padding: '12px 16px', fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 400 }}>INTERVENTION</th>
                  <th style={{ padding: '12px 16px', fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 400 }}>CANDIDATE</th>
                  {interventions.some(i => i.estimated_completion !== undefined) && <th style={{ padding: '12px 16px', fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 400 }}>COMPLETION (EST)</th>}
                  {interventions.some(i => i.context_transfer_effort !== undefined) && <th style={{ padding: '12px 16px', fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 400 }}>TRANSFER EFFORT</th>}
                  {interventions.some(i => i.risk !== undefined) && <th style={{ padding: '12px 16px', fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 400 }}>RISK</th>}
                  {interventions.some(i => i.workload_impact !== undefined) && <th style={{ padding: '12px 16px', fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 400 }}>WORKLOAD IMPACT</th>}
                  {interventions.some(i => i.dependency_impact !== undefined) && <th style={{ padding: '12px 16px', fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 400 }}>DEP. IMPACT</th>}
                  {interventions.some(i => i.responsibility_coverage !== undefined) && <th style={{ padding: '12px 16px', fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 400 }}>COVERAGE</th>}
                </tr>
              </thead>
              <tbody>
                {interventions.map((inv, idx) => (
                  <tr key={idx} style={{ 
                    borderBottom: '1px solid var(--dv-border-subtle)', 
                    background: inv.is_recommended ? 'var(--dv-bg-elevated)' : 'transparent' 
                  }}>
                    <td style={{ padding: '16px', fontSize: 'var(--dv-text-sm)', fontWeight: inv.is_recommended ? 700 : 400, color: 'var(--dv-text-primary)' }}>
                      {inv.type.replace(/_/g, ' ')}
                      {inv.is_recommended && <DvBadge variant="success" dot style={{ marginLeft: 8 }}>Recommended</DvBadge>}
                    </td>
                    <td style={{ padding: '16px', fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                       {inv.candidate_name || '—'}
                    </td>
                    {interventions.some(i => i.estimated_completion !== undefined) && (
                      <td style={{ padding: '16px', fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} color="var(--dv-text-faint)" />
                          {inv.estimated_completion !== undefined ? fmtHrs(inv.estimated_completion) : '—'}
                        </div>
                      </td>
                    )}
                    {interventions.some(i => i.context_transfer_effort !== undefined) && (
                      <td style={{ padding: '16px', fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                        {inv.context_transfer_effort !== undefined ? fmtHrs(inv.context_transfer_effort) : '—'}
                      </td>
                    )}
                    {interventions.some(i => i.risk !== undefined) && (
                      <td style={{ padding: '16px' }}>
                        {inv.risk !== undefined ? (
                          <DvBadge variant={
                            inv.risk === 'HIGH' ? 'danger' : 
                            inv.risk === 'MEDIUM' ? 'warning' : 'success'
                          }>
                            {inv.risk}
                          </DvBadge>
                        ) : '—'}
                      </td>
                    )}
                    {interventions.some(i => i.workload_impact !== undefined) && (
                      <td style={{ padding: '16px', fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                        {inv.workload_impact || '—'}
                      </td>
                    )}
                    {interventions.some(i => i.dependency_impact !== undefined) && (
                      <td style={{ padding: '16px', fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                        {inv.dependency_impact || '—'}
                      </td>
                    )}
                    {interventions.some(i => i.responsibility_coverage !== undefined) && (
                      <td style={{ padding: '16px', fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                        {inv.responsibility_coverage || '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DvCard>
      </motion.div>

      {/* 3. ML Prediction Details (if any KT or CT is recommended/present) */}
      {recommended && recommended.predicted_transfer_effort_reduction_hours > 0 && (
        <motion.div variants={fadeUp}>
          <DvPanel title="KNOWLEDGE TRANSFER IMPACT" noPad>
             <div style={{ padding: '20px 24px', display: 'flex', gap: 32 }}>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', marginBottom: 8 }}>BASELINE EFFORT</div>
                   <div style={{ fontSize: 'var(--dv-text-xl)', color: 'var(--dv-text-primary)' }}>{fmtHrs(recommended.predicted_transfer_effort_hours)}</div>
                </div>
                <div style={{ flex: 1, borderLeft: '1px solid var(--dv-border-subtle)', paddingLeft: 32 }}>
                   <div style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-success)', marginBottom: 8 }}>PREDICTED REDUCTION</div>
                   <div style={{ fontSize: 'var(--dv-text-xl)', color: 'var(--dv-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowDown size={18} />
                      {fmtHrs(recommended.predicted_transfer_effort_reduction_hours)}
                   </div>
                </div>
             </div>
             <div style={{ background: 'var(--dv-bg-elevated)', padding: '12px 24px', fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={12} color="var(--dv-text-faint)" />
                Prediction via `knowledge_transfer_model.pkl` factoring architecture, debug guides, and tests.
             </div>
          </DvPanel>
        </motion.div>
      )}

    </motion.div>
  );
}
