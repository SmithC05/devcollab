import { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayCircle, Search, Server, GitBranch, ArrowRight, Shield, Activity, Users, Database
} from 'lucide-react';

import '../styles/tokens.css';
import '../styles/components.css';

import { DvCard, DvButton, DvBadge } from '../primitives/core';

// Existing Pages
import JudgeMode from './JudgeMode';
import OrganizationIntelligence from './OrganizationIntelligence';
import DecisionPoint from './DecisionPoint';
import SimulationCenter from './SimulationCenter';
import KnowledgeTransfer from './KnowledgeTransfer';

const STEPS = [
  { id: 'STATE',          label: 'STATE' },
  { id: 'ANALYSIS',       label: 'ANALYSIS' },
  { id: 'DECISION',       label: 'DECISION' },
  { id: 'SIMULATION',     label: 'SIMULATION' },
  { id: 'RECOMMENDATION', label: 'RECOMMENDATION' },
  { id: 'KNOWLEDGE',      label: 'KNOWLEDGE' },
  { id: 'APPROVAL',       label: 'APPROVAL' },
  { id: 'EXECUTION',      label: 'EXECUTION' }
];

function WorkflowStepper({ activeStepId }) {
  const activeIndex = STEPS.findIndex(s => s.id === activeStepId);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
      background: 'var(--dv-bg-elevated)', borderBottom: '1px solid var(--dv-border-default)',
      overflowX: 'auto', whiteSpace: 'nowrap',
    }}>
      {STEPS.map((step, idx) => {
        const isCompleted = idx < activeIndex;
        const isActive = idx === activeIndex;
        const isFuture = idx > activeIndex;

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {idx > 0 && <ArrowRight size={14} color="var(--dv-text-faint)" />}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: isFuture ? 0.4 : 1,
            }}>
              {isCompleted ? (
                <span style={{ color: 'var(--dv-success)' }}>✓</span>
              ) : isActive ? (
                <span style={{ color: 'var(--dv-accent)' }}>●</span>
              ) : (
                <span style={{ color: 'var(--dv-text-faint)' }}>○</span>
              )}
              <span style={{
                fontSize: 11, fontFamily: 'var(--dv-font-mono)', fontWeight: 700,
                color: isActive ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)'
              }}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DemoStartScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>DEVCOLLAB ENGINEERING DECISION INTELLIGENCE</h1>
      <p style={{ color: 'var(--dv-text-muted)', marginBottom: 40 }}>
        Orchestration Mode. Select a starting scenario.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <DvCard style={{ padding: 32, cursor: 'pointer' }} onClick={() => navigate('/intelligence/judge')}>
          <div style={{ marginBottom: 16 }}><GitBranch size={24} color="var(--dv-accent)" /></div>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>START WITH REAL ENGINEERING SOURCE</h3>
          <p style={{ fontSize: 13, color: 'var(--dv-text-muted)', marginBottom: 24 }}>
            Ingest a live GitHub repository to construct an observable engineering state.
          </p>
          <DvButton variant="outline">[ ANALYZE REPOSITORY ]</DvButton>
        </DvCard>

        <DvCard style={{ padding: 32, cursor: 'pointer' }} onClick={() => navigate('/intelligence/decision/dp1')}>
          <div style={{ marginBottom: 16 }}><Server size={24} color="var(--dv-warning)" /></div>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>RUN CONTROLLED SCENARIO</h3>
          <p style={{ fontSize: 13, color: 'var(--dv-text-muted)', marginBottom: 24 }}>
            Demonstrate the full decision workflow with a complete engineering state.
          </p>
          <DvButton variant="primary">[ OPEN PAYMENT INCIDENT ]</DvButton>
        </DvCard>
      </div>
    </div>
  );
}

function Orchestrator() {
  const location = useLocation();
  const [activeStep, setActiveStep] = useState('STATE');

  useEffect(() => {
    const p = location.pathname;
    if (p === '/') setActiveStep('STATE');
    else if (p.includes('/judge')) setActiveStep('STATE');
    else if (p.includes('/decision')) setActiveStep('DECISION');
    else if (p.includes('/simulation')) {
      if (p.includes('/results') || location.hash.includes('results')) {
         setActiveStep('RECOMMENDATION');
      } else {
         setActiveStep('SIMULATION');
      }
    }
    else if (p.includes('/knowledge-transfer')) setActiveStep('KNOWLEDGE');
    else if (p.includes('/approval')) setActiveStep('APPROVAL');
  }, [location]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--dv-bg-base)' }}>
      {/* Premium Header */}
      <header style={{
        padding: '12px 24px', background: 'var(--dv-bg-canvas)', borderBottom: '1px solid var(--dv-border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--dv-accent)' }} />
          <span style={{ fontFamily: 'var(--dv-font-mono)', fontWeight: 700, fontSize: 13 }}>DEVCOLLAB</span>
          <span style={{ color: 'var(--dv-text-faint)' }}>|</span>
          <span style={{ fontSize: 12, color: 'var(--dv-text-muted)' }}>ENGINEERING DECISION INTELLIGENCE</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <DvBadge variant="info">SYSTEM READY</DvBadge>
          <DvBadge variant="outline">DEMO MODE</DvBadge>
        </div>
      </header>

      {/* Stepper */}
      {location.pathname !== '/' && <WorkflowStepper activeStepId={activeStep} />}

      {/* Embedded Routes */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Routes>
          <Route path="/" element={<DemoStartScreen />} />
          <Route path="/intelligence/judge" element={<JudgeMode />} />
          <Route path="/intelligence/organization" element={<OrganizationIntelligence />} />
          <Route path="/intelligence/decision/:id" element={<DecisionPoint />} />
          <Route path="/intelligence/simulation/:id" element={<SimulationCenter />} />
          <Route path="/intelligence/knowledge-transfer/:id" element={<KnowledgeTransfer />} />
        </Routes>
      </div>
    </div>
  );
}

export default function DevCollabDemoMode() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Orchestrator />
    </MemoryRouter>
  );
}
