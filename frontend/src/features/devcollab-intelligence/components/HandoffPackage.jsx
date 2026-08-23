import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, FileText, CheckCircle, 
  AlertTriangle, Info, GitBranch, Shield, Zap, Lock
} from 'lucide-react';
import { DvCard, DvBadge, DvDivider, DvPanel } from '../primitives/core';
import { fadeUp, staggerChildren } from '../motion/presets';

function ProvenanceBadge({ type }) {
  if (type === 'REAL_DB') {
    return (
      <DvBadge variant="success" size="sm" style={{ fontFamily: 'var(--dv-font-mono)', fontSize: 9 }}>
        <Shield size={10} style={{ marginRight: 4 }} />
        REAL_DB
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
  return null;
}

function SectionCard({ section }) {
  const [expanded, setExpanded] = useState(false);
  const isMissing = section.status === 'NOT_AVAILABLE';

  return (
    <DvCard 
      style={{ 
        marginBottom: 16, 
        borderColor: expanded ? 'var(--dv-primary-border)' : 'var(--dv-border-subtle)',
        opacity: isMissing ? 0.6 : 1
      }}
    >
      <div 
        onClick={() => !isMissing && setExpanded(!expanded)}
        style={{ 
          padding: '16px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          cursor: isMissing ? 'not-allowed' : 'pointer',
          background: expanded ? 'rgba(92, 107, 245, 0.03)' : 'transparent'
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--dv-text-base)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>
              {section.title}
            </span>
            {isMissing ? (
               <DvBadge variant="ghost" size="sm">MISSING</DvBadge>
            ) : (
               <ProvenanceBadge type={section.provenance} />
            )}
          </div>
          <div style={{ fontSize: 'var(--dv-text-sm)', color: isMissing ? 'var(--dv-text-faint)' : 'var(--dv-text-secondary)' }}>
            {section.summary}
          </div>
        </div>
        {!isMissing && (
          <div style={{ color: 'var(--dv-text-muted)', marginLeft: 16 }}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && !isMissing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <DvDivider style={{ margin: 0 }} />
            <div style={{ padding: '20px', background: 'var(--dv-bg-elevated)', borderBottomLeftRadius: 'var(--dv-radius-lg)', borderBottomRightRadius: 'var(--dv-radius-lg)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)', marginBottom: 4 }}>EVIDENCE SOURCE</div>
                  <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} /> {section.evidence}
                  </div>
                </div>
                
                {/* Future/mock regenerate button */}
                <button 
                  disabled
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--dv-border-subtle)', 
                    color: 'var(--dv-text-muted)', 
                    padding: '4px 12px', 
                    borderRadius: 'var(--dv-radius-full)',
                    fontSize: 'var(--dv-text-xs)',
                    fontFamily: 'var(--dv-font-mono)',
                    cursor: 'not-allowed',
                    opacity: 0.5
                  }}
                >
                  REGENERATE SECTION
                </button>
              </div>

              <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {section.content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DvCard>
  );
}

export function HandoffPackage({ handoff }) {
  if (!handoff) return null;

  const totalSections = handoff.sections.length;
  const completeSections = handoff.sections.filter(s => s.status === 'COMPLETE').length;

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', gap: 32 }}>
      
      {/* LEFT COL: Coverage & Metadata */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <motion.div variants={fadeUp}>
          <DvPanel title="HANDOFF QUALITY" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--dv-text-2xl)', fontWeight: 800, color: 'var(--dv-success)' }}>
                {handoff.metadata.quality}
              </span>
            </div>
            <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
              {completeSections} / {totalSections} knowledge areas covered
            </div>
          </DvPanel>
          
          <DvPanel title="HANDOFF COVERAGE" noPad>
            <div style={{ padding: '16px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {handoff.sections.map(sec => (
                  <li key={sec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--dv-text-sm)', color: sec.status === 'NOT_AVAILABLE' ? 'var(--dv-text-faint)' : 'var(--dv-text-secondary)' }}>
                      {sec.title}
                    </span>
                    {sec.status === 'COMPLETE' ? (
                      <CheckCircle size={16} color="var(--dv-success)" />
                    ) : (
                      <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', color: 'var(--dv-text-faint)' }}>MISSING</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </DvPanel>
        </motion.div>
      </div>

      {/* RIGHT COL: Sections */}
      <div style={{ flex: 1 }}>
        <motion.div variants={staggerChildren}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--dv-text-lg)', fontWeight: 600, color: 'var(--dv-text-primary)', margin: '0 0 8px 0' }}>
              Knowledge Handoff Package
            </h3>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)', margin: 0 }}>
              Generated engineering context to assist <strong>{handoff.receivingEngineer}</strong> in absorbing <strong>{handoff.task}</strong>.
            </p>
          </div>

          {handoff.sections.map((section, idx) => (
            <motion.div key={section.id} variants={fadeUp} custom={idx}>
              <SectionCard section={section} />
            </motion.div>
          ))}
        </motion.div>
      </div>

    </motion.div>
  );
}
