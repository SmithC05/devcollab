import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Eye, X } from 'lucide-react';
import { SectionLabel, ProvenancePip } from './shared';
import { DvBadge } from '../../primitives/core';
import { coverageToVariant } from '../../data/organizationAdapter';
import { fadeUp, staggerChildren, panelEnter } from '../../motion/presets';

const COVERAGE_PALETTE = {
  STRONG:   { bg: 'var(--dv-success-subtle)',  border: 'var(--dv-success-border)',  text: 'var(--dv-success)',  stripe: 'var(--dv-success)' },
  PARTIAL:  { bg: 'var(--dv-warning-subtle)', border: 'var(--dv-warning-border)', text: 'var(--dv-warning)', stripe: 'var(--dv-warning)' },
  FRAGILE:  { bg: 'var(--dv-danger-subtle)',  border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)',  stripe: 'var(--dv-danger)' },
  CRITICAL: { bg: 'var(--dv-danger-subtle)',  border: 'var(--dv-danger-border)',  text: 'var(--dv-danger)',  stripe: 'var(--dv-danger)' },
};

function ResponsibilityCard({ resp, onViewEvidence }) {
  const pal = COVERAGE_PALETTE[resp.coverage] ?? COVERAGE_PALETTE.PARTIAL;
  const isCritical = resp.coverage === 'CRITICAL' || resp.coverage === 'FRAGILE';

  return (
    <motion.div variants={fadeUp}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 'var(--dv-radius-lg)', border: `1px solid ${pal.border}`,
        background: pal.bg, padding: '14px 16px',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: pal.stripe }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 'var(--dv-text-xs)', fontWeight: 700, color: 'var(--dv-text-primary)' }}>{resp.title}</span>
              <DvBadge variant={coverageToVariant(resp.coverage)} size="sm">{resp.coverage}</DvBadge>
              <span style={{ fontSize: 10, color: 'var(--dv-text-faint)', marginLeft: 'auto' }}>{resp.project_name}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--dv-text-muted)', lineHeight: 1.5 }}>
              Owner: <strong style={{ color: 'var(--dv-text-secondary)' }}>{resp.owner}</strong>
              {'  ·  '}
              Backup: <strong style={{ color: resp.backup ? 'var(--dv-text-secondary)' : 'var(--dv-danger)' }}>
                {resp.backup ?? 'None'}
              </strong>
              {resp.backup && (
                <span style={{ color: 'var(--dv-text-faint)' }}> ({resp.backup_context}% context)</span>
              )}
              {'  ·  '}
              <span style={{ color: resp.dependency_count > 0 ? pal.text : 'var(--dv-text-faint)' }}>
                {resp.dependency_count} downstream
              </span>
            </div>
          </div>
          <button
            onClick={() => onViewEvidence?.(resp)}
            style={{
              background: 'none', border: `1px solid ${pal.border}`, borderRadius: 'var(--dv-radius-sm)',
              color: pal.text, fontSize: 9, padding: '3px 8px', cursor: 'pointer', flexShrink: 0,
              fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.05em',
            }}
          >
            EVIDENCE
          </button>
        </div>
        {isCritical && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 10, color: 'var(--dv-danger)', fontStyle: 'italic',
          }}>
            <AlertTriangle size={11} />
            {resp.backup ? `Backup context is low (${resp.backup_context}%)` : 'No qualified backup — single point of failure'}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EvidenceDrawer({ resp, onClose }) {
  if (!resp) return null;
  return (
    <AnimatePresence>
      <motion.div
        variants={panelEnter} initial="hidden" animate="visible" exit="exit"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '50vh',
          background: 'var(--dv-bg-canvas)', borderTop: '1px solid var(--dv-border-default)',
          zIndex: 300, overflowY: 'auto', padding: '20px 40px',
        }}
        role="dialog" aria-label="Evidence"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Eye size={14} color="var(--dv-accent)" />
          <span style={{ fontFamily: 'var(--dv-font-mono)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dv-accent)' }}>
            EVIDENCE — {resp.title}
          </span>
          <DvBadge variant={coverageToVariant(resp.coverage)} size="sm" style={{ marginLeft: 6 }}>{resp.coverage}</DvBadge>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dv-text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Observation', value: `${resp.owner} owns ${resp.title}`,    prov: 'REAL_DB', rationale: 'Verified assignment in the workspace.' },
            { label: 'Backup',      value: resp.backup ?? 'None',                prov: 'DERIVED', rationale: 'Highest context alternative.' },
            { label: 'Backup Context', value: resp.backup ? `${resp.backup_context}%` : 'N/A', prov: 'DERIVED', rationale: 'Context score of the backup engineer.' },
            { label: 'Downstream',  value: `${resp.dependency_count} tasks`,     prov: 'SYNTHETIC_DEMO', rationale: 'Tasks blocked by this responsibility.' },
          ].map(ev => (
            <div key={ev.label} style={{ padding: '12px', background: 'var(--dv-bg-elevated)', borderRadius: 'var(--dv-radius-md)', border: '1px solid var(--dv-border-subtle)' }}>
              <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{ev.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 'var(--dv-text-sm)', fontWeight: 600, color: 'var(--dv-text-primary)' }}>{ev.value}</div>
                <ProvenancePip prov={ev.prov} />
              </div>
              {ev.rationale && (
                <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', lineHeight: 1.4, borderTop: '1px solid var(--dv-border-subtle)', paddingTop: 8 }}>
                  {ev.rationale}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--dv-text-faint)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--dv-success)', fontFamily: 'var(--dv-font-mono)' }}>REAL</span> = directly read from DB ·
          <span style={{ color: 'var(--dv-predicted)', fontFamily: 'var(--dv-font-mono)' }}> DERIVED</span> = computed from DB values ·
          <span style={{ color: 'var(--dv-warning)', fontFamily: 'var(--dv-font-mono)' }}> DEMO</span> = controlled fixture, not from production data
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function WorkTab({ data }) {
  const { responsibilities } = data;
  const [evidenceResp, setEvidenceResp] = useState(null);

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <motion.div variants={fadeUp}>
        <SectionLabel
          label="Responsibility Coverage"
          icon={Shield}
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              {['STRONG', 'PARTIAL', 'FRAGILE', 'CRITICAL'].map(cov => (
                <div key={cov} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: COVERAGE_PALETTE[cov]?.stripe ?? 'var(--dv-border-default)', flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)' }}>{cov}</span>
                </div>
              ))}
            </div>
          }
        />
        {responsibilities === null ? (
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
            NOT AVAILABLE FROM CURRENT WORKSPACE DATA
          </div>
        ) : (
          <motion.div variants={staggerChildren} initial="hidden" animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {responsibilities.map(resp => (
              <ResponsibilityCard key={resp.id} resp={resp} onViewEvidence={r => setEvidenceResp(r)} />
            ))}
          </motion.div>
        )}
      </motion.div>
      <EvidenceDrawer resp={evidenceResp} onClose={() => setEvidenceResp(null)} />
    </motion.div>
  );
}
