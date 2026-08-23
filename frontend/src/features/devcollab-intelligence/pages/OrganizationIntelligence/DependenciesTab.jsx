import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2 } from 'lucide-react';
import { SectionLabel, DependencyChain } from './shared';
import { DvCard } from '../../primitives/core';
import { fadeUp, staggerChildren } from '../../motion/presets';

export default function DependenciesTab({ data }) {
  const { dependencies, projects } = data;
  const [depProjectFilter, setDepProjectFilter] = useState(null);

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <motion.div variants={fadeUp}>
        <SectionLabel label="Dependency Intelligence" icon={Link2}
          right={<span style={{ fontSize: 10, color: 'var(--dv-text-faint)' }}>Observational only</span>} />
        <DvCard style={{ padding: '16px 20px' }}>
          {dependencies === null ? (
            <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
              NOT AVAILABLE FROM CURRENT WORKSPACE DATA
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setDepProjectFilter(null)}
                  style={{
                    padding: '4px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--dv-radius-sm)',
                    border: `1px solid ${!depProjectFilter ? 'var(--dv-border-strong)' : 'var(--dv-border-subtle)'}`,
                    background: !depProjectFilter ? 'var(--dv-bg-elevated)' : 'transparent',
                    color: !depProjectFilter ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)',
                  }}>
                  All
                </button>
                {projects.map(p => (
                  <button key={p.id}
                    onClick={() => setDepProjectFilter(p.name)}
                    style={{
                      padding: '4px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--dv-radius-sm)',
                      border: `1px solid ${depProjectFilter === p.name ? 'var(--dv-border-strong)' : 'var(--dv-border-subtle)'}`,
                      background: depProjectFilter === p.name ? 'var(--dv-bg-elevated)' : 'transparent',
                      color: depProjectFilter === p.name ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)',
                    }}>
                    {p.name}
                  </button>
                ))}
              </div>
              <DependencyChain dependencies={dependencies} projectFilter={depProjectFilter} />
            </>
          )}
        </DvCard>
      </motion.div>
    </motion.div>
  );
}
