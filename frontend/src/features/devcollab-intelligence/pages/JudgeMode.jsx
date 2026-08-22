import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, CheckCircle, AlertTriangle, 
  Search, GitBranch, Terminal, Shield, Zap, Info, FolderGit2
} from 'lucide-react';
import { DvCard, DvButton, DvBadge, DvDivider, DvPanel, DvAvatar } from '../primitives/core';
import { DvAgentActivity } from '../primitives/agent';
import { analyzeGitHubRepository, getDemoScenarioSource } from '../data/judgeAdapter';
import { fadeUp, panelEnter, staggerChildren, slideIn } from '../motion/presets';

import '../styles/tokens.css';
import '../styles/components.css';

const INGESTION_STEPS = [
  { id: 'connect', label: 'Connecting to repository source' },
  { id: 'meta', label: 'Inspecting repository metadata' },
  { id: 'contributors', label: 'Inspecting contributors & commit activity' },
  { id: 'normalize', label: 'Normalizing engineering state' },
  { id: 'signals', label: 'Checking available intelligence signals' }
];

function ProvenanceBadge({ type }) {
  if (type === 'REAL_GITHUB' || type === 'REAL_DB') {
    return (
      <DvBadge variant="success" size="sm" style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 9 }}>
        <Shield size={10} style={{ marginRight: 4 }} />
        {type}
      </DvBadge>
    );
  }
  if (type === 'DERIVED') {
    return (
      <DvBadge variant="primary" size="sm" style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 9 }}>
        <Zap size={10} style={{ marginRight: 4 }} />
        DERIVED
      </DvBadge>
    );
  }
  if (type === 'SYNTHETIC_DEMO') {
    return (
      <DvBadge variant="warning" size="sm" style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 9 }}>
        <Lock size={10} style={{ marginRight: 4 }} />
        SYNTHETIC_DEMO
      </DvBadge>
    );
  }
  if (type === 'UNAVAILABLE') {
    return (
      <DvBadge variant="ghost" size="sm" style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 9, opacity: 0.6 }}>
        UNAVAILABLE
      </DvBadge>
    );
  }
  return null;
}

export default function JudgeMode() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [status, setStatus] = useState('NOT_CONNECTED'); // NOT_CONNECTED | CONNECTING | ANALYZING | READY | FAILED
  const [errorMsg, setErrorMsg] = useState('');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [engineeringState, setEngineeringState] = useState(null);

  const runIngestion = async (sourceType) => {
    setStatus('CONNECTING');
    setErrorMsg('');
    setEngineeringState(null);
    setActiveStepIdx(0);

    const advanceStaging = async () => {
      for (let i = 0; i < INGESTION_STEPS.length; i++) {
        setActiveStepIdx(i);
        await new Promise(r => setTimeout(r, Math.random() * 500 + 400));
      }
    };

    try {
      let stateData;
      if (sourceType === 'DEMO') {
        [stateData] = await Promise.all([getDemoScenarioSource(), advanceStaging()]);
      } else {
        [stateData] = await Promise.all([analyzeGitHubRepository(repoUrl), advanceStaging()]);
      }
      setEngineeringState(stateData);
      setStatus('READY');
    } catch (err) {
      console.error(err);
      setStatus('FAILED');
      if (err.message.includes('NOT_FOUND')) {
        setErrorMsg('REPOSITORY ACCESS REQUIRED: The repository could not be found or is private.');
      } else if (err.message.includes('RATE_LIMITED')) {
        setErrorMsg('GITHUB RATE LIMIT EXCEEDED: Please try again later or use the demo scenario.');
      } else if (err.message.includes('INVALID_URL')) {
        setErrorMsg('INVALID URL: Please provide a valid GitHub repository URL.');
      } else {
        setErrorMsg('An unknown error occurred during ingestion.');
      }
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 0 80px 0' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--dv-text-3xl)', fontWeight: 800, color: 'var(--dv-text-primary)', marginBottom: 12 }}>
          JUDGE MODE
        </h1>
        <p style={{ fontSize: 'var(--dv-text-base)', color: 'var(--dv-text-secondary)', maxWidth: 600, margin: '0 auto' }}>
          Connect an engineering source and let DevCollab construct its current engineering state.
        </p>
      </div>

      {/* INPUT AREA */}
      <DvCard style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FolderGit2 size={20} color="var(--dv-text-muted)" style={{ position: 'absolute', left: 16, top: 16 }} />
            <input 
              type="text" 
              placeholder="https://github.com/owner/repository" 
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              disabled={status === 'CONNECTING' || status === 'ANALYZING'}
              style={{
                width: '100%', padding: '16px 16px 16px 48px',
                background: 'var(--dv-bg-elevated)', border: '1px solid var(--dv-border-subtle)',
                borderRadius: 'var(--dv-radius-md)', color: 'var(--dv-text-primary)',
                fontSize: 'var(--dv-text-base)', outline: 'none',
                fontFamily: 'var(--dv-font-mono)'
              }}
            />
          </div>
          <DvButton 
            variant="primary" 
            onClick={() => runIngestion('GITHUB')}
            disabled={!repoUrl || status === 'CONNECTING' || status === 'ANALYZING'}
            style={{ padding: '16px 24px', height: 'auto' }}
          >
            ANALYZE REPOSITORY
          </DvButton>
        </div>
        
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <DvDivider style={{ flex: 1, margin: 0 }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)' }}>OR USE DEMO BASELINE</span>
          <DvDivider style={{ flex: 1, margin: 0 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <DvButton 
            variant="ghost" 
            onClick={() => runIngestion('DEMO')}
            disabled={status === 'CONNECTING' || status === 'ANALYZING'}
          >
            <Lock size={16} style={{ marginRight: 8 }} />
            DEMO PAYMENT SCENARIO (CONTROLLED SCENARIO)
          </DvButton>
        </div>
      </DvCard>

      {/* INGESTION WORKFLOW */}
      <AnimatePresence mode="wait">
        {(status === 'CONNECTING' || status === 'ANALYZING') && (
          <motion.div key="agent" variants={slideIn} initial="hidden" animate="visible" exit="hidden" style={{ marginBottom: 24 }}>
            <DvPanel title="DEVCOLLAB AGENT" noPad>
              <div style={{ padding: 24 }}>
                <DvAgentActivity 
                  steps={INGESTION_STEPS} 
                  activeIndex={activeStepIdx} 
                  status="ANALYZING"
                />
              </div>
            </DvPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR STATE */}
      <AnimatePresence mode="wait">
        {status === 'FAILED' && (
          <motion.div key="error" variants={fadeUp} initial="hidden" animate="visible" style={{ marginBottom: 24 }}>
            <DvCard style={{ padding: 24, background: 'var(--dv-danger-subtle)', borderColor: 'var(--dv-danger-border)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--dv-danger)' }}>
                <AlertTriangle size={24} />
                <span style={{ fontWeight: 600 }}>{errorMsg}</span>
              </div>
            </DvCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* READY STATE - CONSTRUCTED DATA */}
      <AnimatePresence mode="wait">
        {status === 'READY' && engineeringState && (
          <motion.div key="ready" variants={staggerChildren} initial="hidden" animate="visible">
            
            <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <h2 style={{ fontSize: 'var(--dv-text-xl)', fontWeight: 700 }}>ENGINEERING STATE CONSTRUCTED</h2>
                 <DvBadge variant="primary" dot>
                    {engineeringState.source === 'SYNTHETIC_DEMO' ? 'CONTROLLED SCENARIO' : 'LIVE REPOSITORY'}
                 </DvBadge>
              </div>

              {/* ARCHITECTURE VISUAL EXPLANATION */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)', marginBottom: 24, fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)' }}>
                 <span>REPOSITORY</span> <ArrowRight size={12}/>
                 <span style={{ color: 'var(--dv-primary)' }}>AVAILABLE SIGNALS</span> <ArrowRight size={12}/>
                 <span style={{ color: 'var(--dv-text-primary)', fontWeight: 700 }}>NORMALIZED ENGINEERING STATE</span> <ArrowRight size={12}/>
                 <span>AI ANALYSIS</span> <ArrowRight size={12}/>
                 <span>ML PREDICTION</span> <ArrowRight size={12}/>
                 <span>SIMULATION</span>
              </div>
            </motion.div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              
              {/* LEFT COL: Overview & Signal Coverage */}
              <motion.div variants={staggerChildren} style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                 
                 <DvPanel title="REPOSITORY OVERVIEW">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 600 }}>{engineeringState.metadata.name}</div>
                       <DvDivider style={{ margin: 0 }} />
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--dv-text-secondary)', fontSize: 'var(--dv-text-sm)' }}>Branch</span>
                          <span style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 12 }}>{engineeringState.metadata.branch || 'main'}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--dv-text-secondary)', fontSize: 'var(--dv-text-sm)' }}>Language</span>
                          <span style={{ fontSize: 'var(--dv-text-sm)' }}>{engineeringState.metadata.language}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--dv-text-secondary)', fontSize: 'var(--dv-text-sm)' }}>Contributors</span>
                          <span style={{ fontSize: 'var(--dv-text-sm)' }}>{engineeringState.members.length}</span>
                       </div>
                    </div>
                 </DvPanel>

                 <DvPanel title="ENGINEERING SIGNAL COVERAGE" noPad>
                    <div style={{ padding: 16 }}>
                       <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {Object.entries(engineeringState.coverage).map(([key, val]) => (
                             <li key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 'var(--dv-text-sm)', color: val === 'UNAVAILABLE' ? 'var(--dv-text-faint)' : 'var(--dv-text-secondary)', textTransform: 'capitalize' }}>
                                   {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                                <ProvenanceBadge type={val === 'AVAILABLE' ? (engineeringState.source === 'SYNTHETIC_DEMO' ? 'SYNTHETIC_DEMO' : 'REAL_GITHUB') : val} />
                             </li>
                          ))}
                       </ul>
                    </div>
                 </DvPanel>
              </motion.div>

              {/* RIGHT COL: Extracted Entities */}
              <motion.div variants={staggerChildren} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                 
                 <DvCard style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', marginBottom: 16, fontWeight: 700 }}>
                       OBSERVED CONTRIBUTORS
                    </div>
                    {engineeringState.members.length > 0 ? (
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {engineeringState.members.slice(0, 6).map(m => (
                             <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
                                <DvAvatar name={m.name} url={m.avatar} size={32} />
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                   <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{m.name}</div>
                                   <div style={{ fontSize: 10, color: 'var(--dv-text-secondary)' }}>{m.contributions} contributions detected</div>
                                </div>
                                <ProvenanceBadge type={m.provenance} />
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-faint)' }}>NO CONTRIBUTOR DATA EXTRACTED</div>
                    )}
                 </DvCard>

                 <DvCard style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-muted)', marginBottom: 16, fontWeight: 700 }}>
                       EXTRACTED TASKS & ISSUES
                    </div>
                    {engineeringState.tasks.length > 0 ? (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {engineeringState.tasks.map(t => (
                             <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
                                <span style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 500 }}>{t.title}</span>
                                <ProvenanceBadge type={t.provenance} />
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-faint)' }}>NO ISSUE DATA EXTRACTED</div>
                    )}
                 </DvCard>

                 {/* CTA */}
                 <DvCard style={{ padding: 24, textAlign: 'center', marginTop: 16, background: 'var(--dv-bg-elevated)', borderColor: 'var(--dv-primary-border)' }}>
                    <div style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 600, marginBottom: 8, color: 'var(--dv-primary)' }}>Analysis Complete</div>
                    <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', marginBottom: 24 }}>
                       The constructed state is ready for the standard DevCollab decision intelligence pipeline.
                    </div>
                    <DvButton 
                      variant="primary" 
                      onClick={() => navigate('/intelligence/organization')}
                    >
                      OPEN ENGINEERING INTELLIGENCE <ArrowRight size={16} style={{ marginLeft: 8 }} />
                    </DvButton>
                 </DvCard>

              </motion.div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
