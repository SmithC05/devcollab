import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Shield, Zap, RefreshCw, ChevronLeft, 
  GitBranch, Activity, User, Target, CheckCircle, FileText
} from 'lucide-react';

import '../styles/tokens.css';
import '../styles/components.css';

import { DvCard, DvButton, DvBadge, DvDivider, DvPanel, DvAvatar } from '../primitives/core';
import { DvAgentActivity } from '../primitives/agent';
import { fetchKnowledgeTransfer } from '../data/knowledgeAdapter';
import { HandoffPackage } from '../components/HandoffPackage';
import { ApprovalPanel } from '../components/ApprovalPanel';
import { fadeUp, panelEnter, staggerChildren, slideIn } from '../motion/presets';

// Helper to format hours
const fmtHrs = (h) => (h !== null && h !== undefined ? `${h.toFixed(1)}h` : '—');

const AGENT_STEPS = [
  { id: 'context', label: 'Reading task context' },
  { id: 'activity', label: 'Inspecting recent engineering activity' },
  { id: 'deps', label: 'Mapping dependencies' },
  { id: 'repo', label: 'Collecting repository evidence' },
  { id: 'generate', label: 'Generating knowledge handoff' }
];

export default function KnowledgeTransfer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [handoffState, setHandoffState] = useState('NOT_STARTED'); // NOT_STARTED | GENERATING | REVIEW | APPROVED
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [handoffData, setHandoffData] = useState(null);

  // We hardcode the baseline facts since this page is isolated and we don't 
  // want to bloat the demo adapter just to pass these around in this phase.
  const sourceEngineer = 'Smith';
  const receivingEngineer = 'Rahul';
  const project = 'Payments';
  const task = 'Payment API';
  
  useEffect(() => {
    // Kick off generation immediately on mount
    generateHandoff();
  }, []);

  const generateHandoff = async () => {
    setHandoffState('GENERATING');
    setActiveStepIdx(0);
    
    const advanceStaging = async () => {
      for (let i = 0; i < AGENT_STEPS.length; i++) {
        setActiveStepIdx(i);
        await new Promise(r => setTimeout(r, 600));
      }
    };

    try {
      const [data] = await Promise.all([
        fetchKnowledgeTransfer(id, sourceEngineer, receivingEngineer, task, project, { before: 6.8, after: 4.4, reduction: 2.4 }),
        advanceStaging()
      ]);
      setHandoffData(data);
      setHandoffState('REVIEW');
    } catch (e) {
      console.error(e);
      setHandoffState('FAILED');
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 0 80px 0' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DvButton variant="ghost" size="sm" onClick={() => navigate(`/intelligence/simulation/${id}`)}>
            <ChevronLeft size={16} /> Back to Simulation
          </DvButton>
          <div style={{ width: 1, height: 16, background: 'var(--dv-border-subtle)' }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', letterSpacing: '0.1em', fontWeight: 700 }}>
            KNOWLEDGE TRANSFER INTELLIGENCE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)' }}>STATUS</span>
           <DvBadge variant={handoffState === 'APPROVED' ? 'success' : handoffState === 'REVIEW' ? 'warning' : 'primary'} dot>
             {handoffState}
           </DvBadge>
        </div>
      </div>

      <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* 2. Context Gap & Impact */}
        <div style={{ display: 'flex', gap: 24 }}>
           {/* Context Gap */}
           <motion.div variants={panelEnter} style={{ flex: 1 }}>
              <DvCard style={{ height: '100%', padding: 24 }}>
                 <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', letterSpacing: '0.1em', marginBottom: 24, fontWeight: 700 }}>
                    CONTEXT GAP
                 </div>
                 
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <DvAvatar name={sourceEngineer} size={40} />
                       <div>
                          <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600 }}>{sourceEngineer}</div>
                          <div style={{ fontSize: 10, color: 'var(--dv-success)', fontWeight: 700 }}>HIGH {task.toUpperCase()} CONTEXT</div>
                       </div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', paddingLeft: 19, paddingBottom: 16, paddingTop: 16, borderLeft: '2px dashed var(--dv-border-subtle)', marginLeft: 20 }}>
                    <div style={{ 
                       background: 'var(--dv-primary-subtle)', border: '1px solid var(--dv-primary-border)', 
                       borderRadius: 'var(--dv-radius-full)', padding: '4px 12px', fontSize: 11, color: 'var(--dv-primary)', 
                       fontFamily: 'var(--dv-font-mono)', fontWeight: 700 
                    }}>
                       GENERATING KNOWLEDGE TRANSFER
                    </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <DvAvatar name={receivingEngineer} size={40} />
                       <div>
                          <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600 }}>{receivingEngineer}</div>
                          <div style={{ fontSize: 10, color: 'var(--dv-danger)', fontWeight: 700 }}>LOW {task.toUpperCase()} CONTEXT</div>
                       </div>
                    </div>
                 </div>
              </DvCard>
           </motion.div>

           {/* Impact */}
           <motion.div variants={panelEnter} style={{ flex: 1 }}>
              <DvCard style={{ height: '100%', padding: 24, background: 'var(--dv-bg-elevated)', borderColor: 'var(--dv-border-subtle)' }}>
                 <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', letterSpacing: '0.1em', marginBottom: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={14} /> PREDICTED TRANSFER IMPACT
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>Before structured handoff</span>
                       <span style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{handoffData ? fmtHrs(handoffData.simulationImpact.beforeEffort) : '6.8h'}</span>
                    </div>
                    <DvDivider style={{ margin: 0 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>After structured handoff</span>
                       <span style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, color: 'var(--dv-success)' }}>{handoffData ? fmtHrs(handoffData.simulationImpact.afterEffort) : '4.4h'}</span>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--dv-success-subtle)', borderRadius: 'var(--dv-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                       <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-success-text)' }}>Estimated reduction</span>
                       <span style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 800, color: 'var(--dv-success)' }}>{handoffData ? fmtHrs(handoffData.simulationImpact.reduction) : '2.4h'}</span>
                    </div>
                 </div>
              </DvCard>
           </motion.div>
        </div>

        {/* 3. Agent Trace (Only when generating or right after) */}
        <AnimatePresence mode="wait">
          {handoffState === 'GENERATING' && (
            <motion.div key="agent" variants={slideIn} initial="hidden" animate="visible" exit="hidden">
              <DvPanel title="DEVCOLLAB AGENT" noPad>
                <div style={{ padding: 24 }}>
                  <DvAgentActivity 
                    steps={AGENT_STEPS} 
                    activeIndex={activeStepIdx} 
                    status="ANALYZING"
                  />
                </div>
              </DvPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Handoff Package */}
        <AnimatePresence mode="wait">
          {handoffData && (handoffState === 'REVIEW' || handoffState === 'APPROVED') && (
            <motion.div key="package" variants={slideIn} initial="hidden" animate="visible">
              <HandoffPackage handoff={handoffData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Review Actions */}
        <AnimatePresence mode="wait">
          {handoffState === 'REVIEW' && (
            <motion.div key="actions" variants={fadeUp} initial="hidden" animate="visible" style={{ marginTop: 16 }}>
              <DvCard style={{ padding: 24, textAlign: 'center', background: 'var(--dv-bg-elevated)' }}>
                <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 600, marginBottom: 8 }}>Review Handoff</div>
                <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginBottom: 24 }}>
                  Please review the generated knowledge package before approving the transfer to <strong>{receivingEngineer}</strong>.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <DvButton variant="ghost" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>EDIT</DvButton>
                  <DvButton variant="primary" onClick={() => setHandoffState('APPROVED')}>APPROVE & EXECUTE</DvButton>
                </div>
              </DvCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. Success State & Execution */}
        <AnimatePresence mode="wait">
          {handoffState === 'APPROVED' && (
            <motion.div key="success" variants={fadeUp} initial="hidden" animate="visible" style={{ marginTop: 16 }}>
              <ApprovalPanel 
                scenarioId="sim_349d"
                baseline={{
                  task: 'Payment API migration',
                  trigger: { before: { member: 'Alex Smith' } }
                }}
                recommendation={{
                  intervention: 'KNOWLEDGE_TRANSFER_AND_REASSIGN',
                  candidate: receivingEngineer
                }}
                onComplete={() => {}}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
