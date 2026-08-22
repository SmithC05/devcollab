import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Shield, Zap, RefreshCw, ChevronLeft, 
  Settings, Clock, GitBranch, Activity, User, Target
} from 'lucide-react';

import '../styles/tokens.css';
import '../styles/components.css';

import { DvCard, DvButton, DvBadge, DvDivider, DvPanel, DvAvatar } from '../primitives/core';
import { DvAgentActivity } from '../primitives/agent';
import { getDecisionPointState, severityToVariant } from '../data/decisionAdapter';
import { fetchSimulation } from '../data/simulationAdapter';
import { SimulationResults } from '../components/SimulationResults';
import { ApprovalPanel } from '../components/ApprovalPanel';
import { fadeUp, panelEnter, staggerChildren, slideIn } from '../motion/presets';
import { taskApi } from '../../../api/taskApi';

const SIMULATION_STEPS = [
  { id: 'baseline',   label: 'Reading baseline state' },
  { id: 'scenario',   label: 'Validating scenario configuration' },
  { id: 'features',   label: 'Building prediction features' },
  { id: 'predict_ct', label: 'Predicting context transfer effort' },
  { id: 'predict_kt', label: 'Predicting knowledge-transfer benefit' },
  { id: 'evaluate',   label: 'Evaluating intervention outcomes' },
  { id: 'rank',       label: 'Ranking interventions' }
];

export default function SimulationCenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isLiveTask = location.pathname.includes('/simulation/task/');
  const prefix = location.pathname.startsWith('/intelligence/demo') ? '/intelligence/demo' : '/dashboard/intelligence';
  
  const [baseline, setBaseline] = useState(null);
  const [scenarioConfig, setScenarioConfig] = useState({
    duration: '72h',
    candidates: [] // Will hold objects { id, name }
  });
  
  const [simState, setSimState] = useState('IDLE'); // IDLE | RUNNING | DONE | ERROR
  const [simError, setSimError] = useState(null);
  const [simResults, setSimResults] = useState(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [executionComplete, setExecutionComplete] = useState(false);

  useEffect(() => {
    if (isLiveTask) {
      taskApi.getTaskEngineeringContext(id).then(data => {
        const { task, project_state, project_members } = data;
        
        // Filter out current owner
        const currentOwnerId = task.assignee?.id;
        const currentOwnerName = task.assignee?.name || task.assignee?.username || 'Unassigned';
        
        const eligibleCandidates = project_members
          .filter(m => m.id !== currentOwnerId)
          .map(m => ({ id: m.id, name: m.name || m.username }));

        setBaseline({
          isLive: true,
          project: task.project_name || `Project ${task.project_id}`,
          task: task.title,
          taskId: task.id,
          trigger: {
            label: 'OWNER_UNAVAILABLE',
            before: { member: currentOwnerName }
          }
        });
        
        setScenarioConfig(prev => ({ ...prev, candidates: eligibleCandidates }));
      }).catch(err => {
        console.error("Failed to load live task simulation context", err);
        navigate(`${prefix}`);
      });
    } else {
      // Load demo baseline state using existing data adapter
      const data = getDecisionPointState(id);
      if (!data) {
        navigate(`${prefix}`);
      } else {
        setBaseline(data);
        setScenarioConfig(prev => ({ 
          ...prev, 
          candidates: ['Rahul', 'Riya', 'Karthik'].map((name, idx) => ({ id: 1000 + idx, name }))
        }));
      }
    }
  }, [id, isLiveTask, navigate, prefix]);

  const resetScenario = () => {
    setSimState('IDLE');
    setSimResults(null);
    setSimError(null);
    setSelectedRecommendation(null);
  };

  const runSimulation = async () => {
    setSimState('RUNNING');
    setSimError(null);
    setSimResults(null);
    setActiveStepIdx(0);
    setSelectedRecommendation(null);
    setExecutionComplete(false);

    // Fake progressive agent staging for visual story
    const advanceStaging = async () => {
      for (let i = 0; i < SIMULATION_STEPS.length; i++) {
        setActiveStepIdx(i);
        await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      }
    };
    
    // Concurrently run API and staging
    try {
      const [results] = await Promise.all([
        fetchSimulation(id, baseline.trigger.label, scenarioConfig.candidates),
        advanceStaging()
      ]);
      setSimResults(results);
      setSimState('DONE');
    } catch (err) {
      console.error(err);
      setSimError(err.message || 'Simulation failed to evaluate');
      setSimState('ERROR');
    }
  };

  if (!baseline) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 0 60px 0' }}>
      
      {/* Simulation Warning Banner */}
      <div style={{ background: 'var(--dv-warning-subtle)', borderBottom: '1px solid var(--dv-warning-border)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderRadius: 'var(--dv-radius-md)' }}>
        <Shield size={16} color="var(--dv-warning)" />
        <span style={{ fontSize: '13px', color: 'var(--dv-warning-text)', fontWeight: 500 }}>
          <strong>SIMULATION MODE</strong> — This analysis is hypothetical and does not modify your workspace.
        </span>
      </div>

      {/* 1. Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <DvButton variant="ghost" size="sm" onClick={() => {
          if (baseline?.isLive) navigate('/dashboard');
          else navigate(`${prefix}/decision/${id}`);
        }}>
          <ChevronLeft size={16} /> Back
        </DvButton>
        <div style={{ width: 1, height: 16, background: 'var(--dv-border-subtle)' }} />
        <span style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', letterSpacing: '0.1em' }}>
          WHAT-IF SIMULATION CENTER
        </span>
      </div>

      <motion.div variants={staggerChildren} initial="hidden" animate="visible">
        
        {/* 2. State configuration comparison */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {/* Baseline State */}
          <motion.div variants={panelEnter} style={{ flex: 1 }}>
             <DvCard style={{ height: '100%' }}>
                <div style={{ padding: '20px 24px', background: 'var(--dv-bg-elevated)', borderBottom: '1px solid var(--dv-border-subtle)', borderTopLeftRadius: 'var(--dv-radius-lg)', borderTopRightRadius: 'var(--dv-radius-lg)' }}>
                   <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-info)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>
                     {baseline.isLive ? 'BASELINE: LIVE ENGINEERING STATE' : 'BASELINE: CONTROLLED DEMO STATE'}
                   </div>
                   <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>Observed Reality</div>
                </div>
                <div style={{ padding: '24px' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                         <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 4 }}>PROJECT</div>
                         <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <GitBranch size={12} /> {baseline.project}
                         </div>
                      </div>
                      <div>
                         <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 4 }}>TASK</div>
                         <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Activity size={12} /> {baseline.task}
                         </div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                         <DvDivider />
                      </div>
                      <div>
                         <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 4 }}>CURRENT OWNER</div>
                         <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <DvAvatar name={baseline.trigger.before.member} size={20} />
                            {baseline.trigger.before.member}
                         </div>
                      </div>
                      <div>
                         <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 4 }}>AVAILABILITY</div>
                         <div><DvBadge variant="success" dot size="sm">ACTIVE</DvBadge></div>
                      </div>
                   </div>
                </div>
             </DvCard>
          </motion.div>

          {/* Simulated Future */}
          <motion.div variants={panelEnter} style={{ flex: 1 }}>
             <DvCard style={{ height: '100%', borderColor: 'var(--dv-primary-border)', background: 'var(--dv-primary-subtle)' }}>
                <div style={{ padding: '20px 24px', background: 'rgba(92, 107, 245, 0.05)', borderBottom: '1px solid var(--dv-primary-border)', borderTopLeftRadius: 'var(--dv-radius-lg)', borderTopRightRadius: 'var(--dv-radius-lg)' }}>
                   <div style={{ fontSize: 9, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-primary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>SIMULATED FUTURE</div>
                   <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, color: 'var(--dv-primary-text)' }}>Scenario Configuration</div>
                </div>
                <div style={{ padding: '24px' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                         <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 4 }}>TRIGGER</div>
                         <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Zap size={12} color="var(--dv-danger)" /> {baseline.trigger.label}
                         </div>
                      </div>
                      <div>
                         <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 4 }}>OWNER STATUS</div>
                         <div><DvBadge variant="danger" dot size="sm">UNAVAILABLE</DvBadge></div>
                      </div>
                      <div>
                         <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 4 }}>DURATION</div>
                         <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)' }}>{scenarioConfig.duration}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                         <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginBottom: 4 }}>CANDIDATE POOL</div>
                         <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {scenarioConfig.candidates.map(c => (
                               <DvBadge key={c.id} variant="outline" size="sm">{c.name}</DvBadge>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </DvCard>
          </motion.div>
        </div>

        {/* 3. Action Bar */}
        <motion.div variants={panelEnter} style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, gap: '16px' }}>
          {simState === 'IDLE' && (
            <DvButton variant="primary" size="lg" onClick={runSimulation} icon={RefreshCw}>
              Run What-If Simulation
            </DvButton>
          )}
          {simState !== 'IDLE' && (
            <DvButton variant="ghost" size="sm" onClick={resetScenario}>
              Edit Scenario
            </DvButton>
          )}
        </motion.div>

        {/* 4. Agent Analysis Stream */}
        {simState !== 'IDLE' && (
           <motion.div variants={slideIn} style={{ marginBottom: 32 }}>
              <DvPanel title="DEVCOLLAB AGENT" noPad>
                 <div style={{ padding: '24px' }}>
                    <DvAgentActivity 
                      steps={SIMULATION_STEPS}
                      activeIndex={simState === 'DONE' ? SIMULATION_STEPS.length : activeStepIdx}
                      status={simState === 'DONE' ? 'IDLE' : simState === 'ERROR' ? 'FAILED' : 'ANALYZING'}
                    />
                 </div>
              </DvPanel>
           </motion.div>
        )}

        {/* 5. Error State */}
        {simState === 'ERROR' && (
           <motion.div variants={panelEnter}>
              <DvCard style={{ padding: '24px', background: 'var(--dv-danger-subtle)', borderColor: 'var(--dv-danger-border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Shield size={20} color="var(--dv-danger)" />
                    <span style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 700, color: 'var(--dv-danger)' }}>Simulation Unavailable</span>
                 </div>
                 <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginBottom: 16 }}>
                    {simError}
                 </div>
                 <DvButton variant="danger" size="sm" onClick={runSimulation}>Retry Simulation</DvButton>
              </DvCard>
           </motion.div>
        )}

        {/* 6. Results */}
        {simState === 'DONE' && simResults && !selectedRecommendation && (
           <SimulationResults 
              result={simResults} 
              onReview={(rec) => setSelectedRecommendation(rec)} 
           />
        )}

        {/* 7. Next Steps */}
        {simState === 'DONE' && selectedRecommendation && (
           <motion.div variants={panelEnter} style={{ marginTop: 24 }}>
             {(selectedRecommendation.type || selectedRecommendation.intervention || '').includes('KNOWLEDGE_TRANSFER') ? (
               <DvCard style={{ padding: 24, textAlign: 'center', background: 'var(--dv-bg-elevated)', borderColor: 'var(--dv-primary-border)' }}>
                 <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 600, color: 'var(--dv-primary)', marginBottom: 8 }}>Knowledge Transfer Recommended</div>
                 <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginBottom: 24 }}>
                   This intervention requires generating a structured knowledge handoff package before execution.
                 </div>
                 <DvButton variant="primary" onClick={() => navigate(`${prefix}/knowledge-transfer/${simResults.scenario_id}?candidate=${encodeURIComponent(selectedRecommendation.candidate_name || selectedRecommendation.candidate)}`)}>
                   PROCEED TO KNOWLEDGE TRANSFER <ArrowRight size={16} style={{ marginLeft: 8 }} />
                 </DvButton>
               </DvCard>
             ) : (
               <ApprovalPanel 
                  scenarioId={simResults.scenario_id}
                  baseline={baseline}
                  recommendation={selectedRecommendation}
                  onComplete={(payload) => setExecutionComplete(true)}
               />
             )}
           </motion.div>
        )}
      </motion.div>
    </div>
  );
}
