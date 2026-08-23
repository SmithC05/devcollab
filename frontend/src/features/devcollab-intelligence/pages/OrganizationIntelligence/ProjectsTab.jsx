import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, AlertTriangle } from 'lucide-react';
import { SectionLabel } from './shared';
import { DvCard, DvBadge, DvAvatar, DvProgressBar } from '../../primitives/core';
import { healthToVariant } from '../../data/organizationAdapter';
import { DependencyChain } from './shared';
import { fadeUp, scaleIn, staggerChildren } from '../../motion/presets';

const HEALTH_COLORS = {
  STABLE: 'var(--dv-success)', LOW: 'var(--dv-info)',
  MEDIUM: 'var(--dv-warning)', HIGH: 'var(--dv-danger)', CRITICAL: 'var(--dv-danger)',
};

export default function ProjectsTab({ data, onSelectNode }) {
  const { projects, dependencies } = data;
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? null);
  const activeProject = projects.find(p => p.id === selectedProject);

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <motion.div variants={fadeUp}>
        <SectionLabel label="Project Intelligence" icon={Layers} />
        <DvCard style={{ padding: '20px' }}>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p.id); onSelectNode?.({ id: `proj-${p.id}`, type: 'project', payload: p, label: p.name }); }}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--dv-radius-md)', cursor: 'pointer',
                  border: `1px solid ${selectedProject === p.id ? 'var(--dv-border-strong)' : 'var(--dv-border-subtle)'}`,
                  background: selectedProject === p.id ? 'var(--dv-bg-overlay)' : 'var(--dv-bg-surface)',
                  color: selectedProject === p.id ? 'var(--dv-text-primary)' : 'var(--dv-text-muted)',
                  fontSize: 'var(--dv-text-xs)', fontWeight: 600, transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: HEALTH_COLORS[p.health] ?? 'var(--dv-text-faint)', flexShrink: 0,
                }} />
                {p.name}
              </button>
            ))}
          </div>

          {activeProject && (
            <motion.div key={activeProject.id} variants={scaleIn} initial="hidden" animate="visible">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <DvCard style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{
                        display: 'inline-block', width: 3, height: 28,
                        background: HEALTH_COLORS[activeProject.health] ?? 'var(--dv-border-default)',
                        borderRadius: 2,
                      }} />
                      <div>
                        <div style={{ fontSize: 'var(--dv-text-md)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{activeProject.name}</div>
                        <DvBadge variant={healthToVariant(activeProject.health)} dot size="sm">{activeProject.health}</DvBadge>
                      </div>
                    </div>
                    <DvProgressBar value={activeProject.progress} max={100}
                      variant={activeProject.health === 'HIGH' || activeProject.health === 'CRITICAL' ? 'danger' : activeProject.health === 'MEDIUM' ? 'warning' : 'recommended'} />
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                      {[
                        { label: 'Active',   value: activeProject.active_tasks,   color: 'var(--dv-text-primary)' },
                        { label: 'Blocked',  value: activeProject.blocked_tasks,   color: activeProject.blocked_tasks > 0 ? 'var(--dv-danger)' : 'var(--dv-text-muted)' },
                        { label: 'Critical', value: activeProject.critical_tasks,  color: activeProject.critical_tasks > 0 ? 'var(--dv-warning)' : 'var(--dv-text-muted)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ padding: '8px 4px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-sm)', border: '1px solid var(--dv-border-subtle)' }}>
                          <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--dv-font-mono)', color }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </DvCard>

                  <DvCard style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Knowledge Concentration</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <DvAvatar name={activeProject.knowledge_concentration} size={28} />
                      <div>
                        <div style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{activeProject.knowledge_concentration}</div>
                        <div style={{ fontSize: 9, color: 'var(--dv-warning)' }}>Highest context owner</div>
                      </div>
                      <AlertTriangle size={13} color="var(--dv-warning)" style={{ marginLeft: 'auto' }} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 10, color: 'var(--dv-text-faint)', lineHeight: 1.4 }}>
                      Single-point knowledge concentration — context transfer risk if unavailable
                    </div>
                  </DvCard>
                </div>

                <div>
                  <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dependency Chain</div>
                  {dependencies === null ? (
                    <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                      NOT AVAILABLE FROM CURRENT WORKSPACE DATA
                    </div>
                  ) : (
                    <DependencyChain dependencies={dependencies} projectFilter={activeProject.name} />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </DvCard>
      </motion.div>
    </motion.div>
  );
}
