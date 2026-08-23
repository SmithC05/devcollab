import sys

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\pages\OrganizationIntelligence.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update React imports to include useEffect, useCallback, useState (already there)
# Just ensure we have what we need.

# 2. Modify OrganizationIntelligence component definition
old_comp_start = """export default function OrganizationIntelligence() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/intelligence/demo') ? '/intelligence/demo' : '/dashboard/intelligence';
  const [data] = useState(() => getOrganizationIntelligenceState());
  const [selectedNode, setSelectedNode] = useState(null);
  const [evidenceResp, setEvidenceResp] = useState(null);
  const [depProjectFilter, setDepProjectFilter] = useState(null);

  const { organization: org, members, projects, responsibilities, dependencies,
          decisionPoints, agentActivity, analysisSummary, systemStatus } = data;"""

new_comp_start = """export default function OrganizationIntelligence() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/intelligence/demo') ? '/intelligence/demo' : '/dashboard/intelligence';
  
  const [mode, setMode] = useState('LIVE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [evidenceResp, setEvidenceResp] = useState(null);
  const [depProjectFilter, setDepProjectFilter] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const state = await getOrganizationIntelligenceState(mode);
      setData(state);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Wire realtime event engine_event
  useEffect(() => {
    if (mode !== 'LIVE') return;
    const handleEngineEvent = () => {
      fetchData(); // Invalidate and refetch
    };
    document.addEventListener('engine_event', handleEngineEvent);
    return () => {
      document.removeEventListener('engine_event', handleEngineEvent);
    };
  }, [mode, fetchData]);

  if (loading && !data) {
    return <div style={{ padding: 40, color: 'var(--dv-text-secondary)' }}>Loading organization state...</div>;
  }
  if (!data) return null;

  const { organization: org, members, projects, responsibilities, dependencies,
          decisionPoints, systemStatus } = data;"""

content = content.replace(old_comp_start, new_comp_start)

# 3. Update the page header and add the banner
old_header = """      {/* ── Page Header ─────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--dv-bg-canvas)', borderBottom: '1px solid var(--dv-border-default)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--dv-radius-sm)', background: 'var(--dv-accent-subtle)', border: '1px solid var(--dv-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={16} color="var(--dv-accent)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--dv-text-primary)' }}>{org.name}</h1>
            <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', marginTop: 2 }}>Organization Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <SourceChip source={systemStatus.source} />
          <DvButton variant="outline" size="sm" icon={<RefreshCw size={14} />}>
            Refresh
          </DvButton>
        </div>
      </div>"""

new_header = """      {/* ── Page Header ─────────────────────────────────────── */}
      {mode === 'DEMO' && (
        <div style={{
          background: 'var(--dv-warning-subtle)', borderBottom: '1px solid var(--dv-warning-border)',
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dv-warning)', fontFamily: 'var(--dv-font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CONTROLLED DEMO SCENARIO</div>
            <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-primary)', marginTop: 2 }}>Showing a complete simulated engineering state. No live workspace data is being modified.</div>
          </div>
          <DvButton variant="default" size="sm" onClick={() => setMode('LIVE')} style={{ background: 'var(--dv-warning)', color: 'var(--dv-bg-canvas)' }}>
            EXIT DEMO
          </DvButton>
        </div>
      )}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--dv-bg-canvas)', borderBottom: '1px solid var(--dv-border-default)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--dv-radius-sm)', background: 'var(--dv-accent-subtle)', border: '1px solid var(--dv-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={16} color="var(--dv-accent)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--dv-text-primary)' }}>{org.name}</h1>
            <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', marginTop: 2 }}>Organization Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {mode === 'LIVE' && (
            <DvButton variant="outline" size="sm" onClick={() => setMode('DEMO')} style={{ borderColor: 'var(--dv-warning)', color: 'var(--dv-warning)' }}>
              SIMULATE DEMO
            </DvButton>
          )}
          <SourceChip source={mode === 'LIVE' ? 'LIVE' : 'DEMO'} />
          <DvButton variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </DvButton>
        </div>
      </div>"""

content = content.replace(old_header, new_header)

# 4. Handle dependencies null state
old_dep = """            {/* Right: dependency chain */}
            <div>
              <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dependency Chain</div>
              <DependencyChain dependencies={dependencies} projectFilter={activeProject.name} />
            </div>"""

new_dep = """            {/* Right: dependency chain */}
            <div>
              <div style={{ fontSize: 9, color: 'var(--dv-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dependency Chain</div>
              {dependencies === null ? (
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                  NOT AVAILABLE FROM CURRENT WORKSPACE DATA
                </div>
              ) : (
                <DependencyChain dependencies={dependencies} projectFilter={activeProject.name} />
              )}
            </div>"""

content = content.replace(old_dep, new_dep)

# 5. Handle responsibilities null state
old_resp_block = """          {/* ── Section D: Responsibility Coverage ── */}
          <motion.div variants={fadeUp}>
            <SectionLabel label="Responsibility Coverage" icon={Shield} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {responsibilities.map(resp => (
                <div key={resp.id} onClick={() => setEvidenceResp(resp)} style={{ cursor: 'pointer' }}>"""

new_resp_block = """          {/* ── Section D: Responsibility Coverage ── */}
          <motion.div variants={fadeUp}>
            <SectionLabel label="Responsibility Coverage" icon={Shield} />
            {responsibilities === null ? (
              <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                NOT AVAILABLE FROM CURRENT WORKSPACE DATA
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {responsibilities.map(resp => (
                  <div key={resp.id} onClick={() => setEvidenceResp(resp)} style={{ cursor: 'pointer' }}>"""

content = content.replace(old_resp_block, new_resp_block)

# Fix the closing tags for responsibility block
old_resp_end = """                  </div>
                </div>
              ))}
            </div>
          </motion.div>"""

new_resp_end = """                  </div>
                </div>
              ))}
            </div>
            )}
          </motion.div>"""

content = content.replace(old_resp_end, new_resp_end)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated OrganizationIntelligence.jsx")
