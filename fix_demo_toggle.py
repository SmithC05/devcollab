import sys

filepath_adapter = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\data\organizationAdapter.js"
with open(filepath_adapter, "r", encoding="utf-8") as f:
    content_adapter = f.read()

old_err = """      systemStatus: { source: 'LIVE', last_synced: new Date().toISOString(), agent_status: 'IDLE' },"""
new_err = """      systemStatus: { source: 'LIVE DATA UNAVAILABLE', last_synced: new Date().toISOString(), agent_status: 'ERROR' },"""
content_adapter = content_adapter.replace(old_err, new_err)

with open(filepath_adapter, "w", encoding="utf-8") as f:
    f.write(content_adapter)

filepath_org = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\pages\OrganizationIntelligence.jsx"
with open(filepath_org, "r", encoding="utf-8") as f:
    content_org = f.read()

old_header = """  return (
    <div className="dv-intelligence" style={{ minHeight: '100vh', paddingBottom: 80, position: 'relative' }}>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div style={{
        padding: '28px 40px 22px', borderBottom: '1px solid var(--dv-border-subtle)',
        background: 'var(--dv-bg-canvas)', position: 'sticky', top: 52, zIndex: 'var(--dv-z-sticky)',
      }}>
        <motion.div variants={panelEnter} initial="hidden" animate="visible"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--dv-text-faint)', marginBottom: 6,
            }}>Organization Intelligence</div>
            <h1 style={{ fontSize: 'var(--dv-text-2xl)', fontWeight: 700, color: 'var(--dv-text-primary)', letterSpacing: 'var(--dv-tracking-tight)', marginBottom: 4 }}>
              Connected Engineering Model
            </h1>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>
              Connected view of people, work, dependencies and engineering responsibility.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <SourceChip source={systemStatus.source} />
          </div>
        </motion.div>
      </div>"""

new_header = """  return (
    <div className="dv-intelligence" style={{ minHeight: '100vh', paddingBottom: 80, position: 'relative' }}>

      {/* ── Demo Banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {mode === 'DEMO' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              background: 'var(--dv-warning-subtle)', borderBottom: '1px solid var(--dv-warning-border)',
              padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--dv-warning)' }}>
              <AlertTriangle size={16} />
              <div style={{ fontSize: 'var(--dv-text-sm)' }}>
                 <strong>CONTROLLED DEMO SCENARIO</strong> &mdash; This view uses a controlled scenario. No live workspace data is being modified.
              </div>
            </div>
            <DvButton variant="outline" size="sm" style={{ borderColor: 'var(--dv-warning)' }} onClick={() => setMode('LIVE')}>
              EXIT DEMO
            </DvButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div style={{
        padding: '28px 40px 22px', borderBottom: '1px solid var(--dv-border-subtle)',
        background: 'var(--dv-bg-canvas)', position: 'sticky', top: mode === 'DEMO' ? 0 : 52, zIndex: 'var(--dv-z-sticky)',
      }}>
        <motion.div variants={panelEnter} initial="hidden" animate="visible"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--dv-text-faint)', marginBottom: 6,
            }}>Organization Intelligence</div>
            <h1 style={{ fontSize: 'var(--dv-text-2xl)', fontWeight: 700, color: 'var(--dv-text-primary)', letterSpacing: 'var(--dv-tracking-tight)', marginBottom: 4 }}>
              Connected Engineering Model
            </h1>
            <p style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-muted)' }}>
              Connected view of people, work, dependencies and engineering responsibility.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {mode === 'LIVE' && (
              <DvButton variant="outline" size="sm" onClick={() => setMode('DEMO')}>
                SIMULATE DEMO
              </DvButton>
            )}
            {mode === 'DEMO' && (
              <DvButton variant="outline" size="sm" onClick={() => setMode('LIVE')}>
                EXIT DEMO
              </DvButton>
            )}
            <SourceChip source={mode === 'DEMO' ? 'CONTROLLED DEMO STATE' : systemStatus.source} />
          </div>
        </motion.div>
      </div>"""

content_org = content_org.replace(old_header, new_header)

with open(filepath_org, "w", encoding="utf-8") as f:
    f.write(content_org)

print("Added DEMO mode toggle.")
