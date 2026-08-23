import sys

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\pages\OrganizationIntelligence.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix Responsibility Coverage
old_resp = """            />
            <motion.div variants={staggerChildren} initial="hidden" animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {responsibilities.map(resp => (
                <ResponsibilityCard key={resp.id} resp={resp} onViewEvidence={r => setEvidenceResp(r)} />
              ))}
            </motion.div>"""

new_resp = """            />
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
            )}"""

content = content.replace(old_resp, new_resp)

# Fix Dependency Intelligence
old_dep = """            <DvCard style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setDepProjectFilter(null)}"""

new_dep = """            <DvCard style={{ padding: '16px 20px' }}>
              {dependencies === null ? (
                <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                  NOT AVAILABLE FROM CURRENT WORKSPACE DATA
                </div>
              ) : (
                <>
              <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setDepProjectFilter(null)}"""

content = content.replace(old_dep, new_dep)

old_dep_end = """                  </button>
                ))}
              </div>
              <DependencyChain dependencies={dependencies} projectFilter={depProjectFilter} />
            </DvCard>"""

new_dep_end = """                  </button>
                ))}
              </div>
              <DependencyChain dependencies={dependencies} projectFilter={depProjectFilter} />
                </>
              )}
            </DvCard>"""

content = content.replace(old_dep_end, new_dep_end)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated sections")
