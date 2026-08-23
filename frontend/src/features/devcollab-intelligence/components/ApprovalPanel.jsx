import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Shield, Zap, RefreshCw, CheckCircle, 
  GitBranch, Activity, FileText, User, UserCheck
} from 'lucide-react';

import { DvCard, DvButton, DvBadge, DvDivider, DvPanel, DvAvatar } from '../primitives/core';
import { DvAgentActivity } from '../primitives/agent';
import { approveSimulation } from '../data/simulationAdapter';
import { fadeUp, panelEnter, staggerChildren, slideIn } from '../motion/presets';

const EXECUTION_STEPS = [
  { id: 'validating', label: 'Validating action constraints' },
  { id: 'mutating',   label: 'Updating task ownership' },
  { id: 'recording',  label: 'Recording engineering event' },
  { id: 'syncing',    label: 'Synchronizing connected clients' }
];

export function ApprovalPanel({ scenarioId, baseline, recommendation, onComplete }) {
  const [execState, setExecState] = useState('PROPOSED'); // PROPOSED | EXECUTING | EXECUTED | ERROR
  const [execError, setExecError] = useState(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [engineEvent, setEngineEvent] = useState(null);

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Listen for WebSocket engine_event to transition to EXECUTED
    const handleEngineEvent = (e) => {
      const payload = e.detail;
      // Backend payload: { scenario_id, intervention, new_assignee }
      if (payload && payload.scenario_id === scenarioId && execState === 'EXECUTING') {
        setEngineEvent(payload);
        setExecState('EXECUTED');
        
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);

        if (onComplete) onComplete(payload);
      }
    };

    document.addEventListener('engine_event', handleEngineEvent);
    return () => {
      document.removeEventListener('engine_event', handleEngineEvent);
    };
  }, [scenarioId, execState, onComplete]);

  const handleApprove = async () => {
    setExecState('EXECUTING');
    setExecError(null);
    setActiveStepIdx(0);
    
    // Staged execution steps
    const advanceStaging = async () => {
      for (let i = 0; i < EXECUTION_STEPS.length; i++) {
        setActiveStepIdx(i);
        await new Promise(r => setTimeout(r, 600));
      }
    };

    try {
      // Run staging and real API call concurrently
      // We don't mark as EXECUTED here, we wait for the WebSocket event!
      await Promise.all([
        advanceStaging(),
        approveSimulation(scenarioId, recommendation.candidate_name || recommendation.candidate, recommendation.type || recommendation.intervention)
      ]);
      // After API resolves, we wait in 'syncing' state until WebSocket fires
    } catch (err) {
      console.error(err);
      setExecError(err.message || 'Execution failed');
      setExecState('ERROR');
    }
  };

  const isKnowledgeTransfer = (recommendation.type || recommendation.intervention || '').includes('KNOWLEDGE_TRANSFER');

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ marginTop: 32, position: 'relative' }}>
      
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed',
              top: 32,
              left: '50%',
              zIndex: 9999,
              background: 'var(--dv-success-subtle)',
              border: '1px solid var(--dv-success-border)',
              padding: '12px 24px',
              borderRadius: 'var(--dv-radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
          >
            <CheckCircle size={16} color="var(--dv-success)" />
            <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-success-text)' }}>
              Engineering state updated
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header & Title */}

      <motion.div variants={panelEnter} style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-primary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>
          HUMAN-IN-THE-LOOP
        </div>
        <div style={{ fontSize: 'var(--dv-text-xl)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>
          {execState === 'PROPOSED' ? 'Review & Approve' : execState === 'EXECUTING' ? 'Executing Action' : 'Execution Complete'}
        </div>
      </motion.div>

      {/* 2. State Visualization (BEFORE -> PROPOSED/AFTER) */}
      <motion.div variants={panelEnter} style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        
        {/* BEFORE */}
        <DvCard style={{ flex: 1, opacity: execState === 'EXECUTED' ? 0.6 : 1 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dv-border-subtle)', background: 'var(--dv-bg-elevated)' }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 700, letterSpacing: '0.1em' }}>OBSERVED STATE</div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <DvAvatar name={baseline.trigger.before.member} size={32} />
              <div>
                <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600 }}>{baseline.trigger.before.member}</div>
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)' }}>Owner: {baseline.task}</div>
              </div>
            </div>
            <DvBadge variant="danger" size="sm">UNAVAILABLE</DvBadge>
          </div>
        </DvCard>

        {/* Transition Arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--dv-text-muted)' }}>
          <ArrowRight size={24} />
          {execState === 'EXECUTING' && <RefreshCw size={16} className="spin" style={{ marginTop: 8 }} />}
          {execState === 'EXECUTED' && <CheckCircle size={16} color="var(--dv-success)" style={{ marginTop: 8 }} />}
        </div>

        {/* PROPOSED / AFTER */}
        <DvCard style={{ flex: 1, borderColor: execState === 'EXECUTED' ? 'var(--dv-success-border)' : 'var(--dv-primary-border)' }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid ' + (execState === 'EXECUTED' ? 'var(--dv-success-border)' : 'var(--dv-primary-border)'),
            background: execState === 'EXECUTED' ? 'var(--dv-success-subtle)' : 'var(--dv-primary-subtle)'
          }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: execState === 'EXECUTED' ? 'var(--dv-success)' : 'var(--dv-primary)', fontWeight: 700, letterSpacing: '0.1em' }}>
              {execState === 'EXECUTED' ? 'EXECUTED STATE' : 'PROPOSED STATE'}
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <DvAvatar name={recommendation.candidate} size={32} />
              <div>
                <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600 }}>{recommendation.candidate}</div>
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)' }}>Implementation: {baseline.task}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <DvBadge variant="success" size="sm">ACTIVE</DvBadge>
              {isKnowledgeTransfer && <DvBadge variant="warning" size="sm">TRANSFER PENDING</DvBadge>}
            </div>
          </div>
        </DvCard>
      </motion.div>

      {/* 3. Knowledge Transfer Plan (If applicable) */}
      {isKnowledgeTransfer && (
        <motion.div variants={panelEnter} style={{ marginBottom: 24 }}>
          <DvPanel title="KNOWLEDGE TRANSFER PLAN">
             <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginBottom: 12 }}>
                Predicted handoff artifacts for {recommendation.candidate}:
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)' }}>
                   <FileText size={16} color="var(--dv-text-muted)" />
                   <span style={{ fontSize: 'var(--dv-text-sm)' }}>Architecture Context</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)' }}>
                   <Activity size={16} color="var(--dv-text-muted)" />
                   <span style={{ fontSize: 'var(--dv-text-sm)' }}>Current Implementation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)' }}>
                   <Shield size={16} color="var(--dv-text-muted)" />
                   <span style={{ fontSize: 'var(--dv-text-sm)' }}>Known Issues & Dependencies</span>
                </div>
             </div>
          </DvPanel>
        </motion.div>
      )}

      {/* 4. Action Area */}
      {execState === 'PROPOSED' && (
        <motion.div variants={panelEnter}>
          <DvCard style={{ padding: '24px', background: 'var(--dv-bg-elevated)', borderColor: 'var(--dv-border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 600, marginBottom: 8 }}>Ready to Execute</div>
            <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginBottom: 24 }}>
              This action will change task ownership for <strong>{baseline.task}</strong> and notify {recommendation.candidate}.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
               <DvButton variant="ghost" onClick={() => setExecState('CANCELED')}>Cancel</DvButton>
               <DvButton variant="primary" onClick={handleApprove} icon={Zap}>APPROVE & EXECUTE</DvButton>
            </div>
          </DvCard>
        </motion.div>
      )}

      {/* 5. Execution State */}
      {execState === 'EXECUTING' && (
        <motion.div variants={slideIn}>
          <DvPanel title="DEVCOLLAB EXECUTION" noPad>
             <div style={{ padding: '24px' }}>
                <DvAgentActivity 
                  steps={EXECUTION_STEPS}
                  activeIndex={activeStepIdx}
                  status="ANALYZING" // using ANALYZING to show spinner
                />
             </div>
          </DvPanel>
        </motion.div>
      )}

      {/* 6. Executed State & EngineEvent */}
      {execState === 'EXECUTED' && (
        <motion.div variants={panelEnter}>
          <DvCard style={{ padding: '24px', background: 'var(--dv-success-subtle)', borderColor: 'var(--dv-success-border)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <CheckCircle size={24} color="var(--dv-success)" />
                <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, color: 'var(--dv-success-text)' }}>
                  Intervention Executed
                </div>
             </div>
             
             {engineEvent && (
               <div style={{ background: 'var(--dv-bg-base)', padding: 16, borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>ENGINE EVENT LOG</div>
                  <div style={{ display: 'grid', gap: 8, fontSize: 'var(--dv-text-sm)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--dv-text-muted)' }}>Event Type</span>
                        <span style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 11 }}>SIMULATION_APPROVED_{engineEvent.intervention}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--dv-text-muted)' }}>Scenario ID</span>
                        <span style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 11 }}>{engineEvent.scenario_id}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--dv-text-muted)' }}>New Assignee ID</span>
                        <span style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 11 }}>{engineEvent.new_assignee}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--dv-text-muted)' }}>Source</span>
                        <span style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 11 }}>APPROVED INTERVENTION</span>
                     </div>
                  </div>
               </div>
             )}
          </DvCard>
        </motion.div>
      )}

      {/* Error */}
      {execState === 'ERROR' && (
        <motion.div variants={panelEnter}>
           <DvCard style={{ padding: '24px', background: 'var(--dv-danger-subtle)', borderColor: 'var(--dv-danger-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                 <Shield size={20} color="var(--dv-danger)" />
                 <span style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, color: 'var(--dv-danger)' }}>Execution Rejected</span>
              </div>
              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
                 {execError}
              </div>
              <DvButton variant="danger" size="sm" onClick={() => setExecState('PROPOSED')} style={{ marginTop: 16 }}>Reset Action</DvButton>
           </DvCard>
        </motion.div>
      )}

    </motion.div>
  );
}
