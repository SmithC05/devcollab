import sys

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\pages\OrganizationIntelligence.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "// ─────────────────────────────────────────────────────────────────────────────\n// AGENT ANALYSIS PANEL\n// ─────────────────────────────────────────────────────────────────────────────"
end_marker = "// ─────────────────────────────────────────────────────────────────────────────\n// PROJECT INTELLIGENCE PANEL\n// ─────────────────────────────────────────────────────────────────────────────"

if start_marker not in content:
    print("Start marker not found")
    sys.exit(1)
if end_marker not in content:
    print("End marker not found")
    sys.exit(1)

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

engineering_panel_code = """// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING ANALYSIS PANEL
// ─────────────────────────────────────────────────────────────────────────────
function EngineeringAnalysisPanel({ decisionPoints, responsibilities, onViewDecisionPoints }) {
  const criticalResps = responsibilities?.filter(r => r.coverage === 'CRITICAL' || r.coverage === 'FRAGILE') || [];
  const noBackup = responsibilities?.filter(r => !r.backup) || [];
  const dpCount = decisionPoints?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DvCard style={{ padding: '20px 24px', borderColor: 'var(--dv-accent-border)', background: 'var(--dv-accent-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Brain size={14} color="var(--dv-accent)" />
          <span style={{ fontSize: 10, fontFamily: 'var(--dv-font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dv-accent)' }}>
            Engineering Analysis
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {dpCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Zap size={14} color="var(--dv-danger)" />
              <span><strong>{dpCount}</strong> decision point{dpCount > 1 ? 's' : ''} identified</span>
            </div>
          )}
          {criticalResps.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Users size={14} color="var(--dv-warning)" />
              <span><strong>{criticalResps.length}</strong> critical ownership concentration{criticalResps.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {noBackup.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-primary)', fontWeight: 500 }}>
              <Shield size={14} color="var(--dv-warning)" />
              <span><strong>{noBackup.length}</strong> responsibilit{noBackup.length > 1 ? 'ies' : 'y'} without qualified backup</span>
            </div>
          )}
          {dpCount === 0 && criticalResps.length === 0 && noBackup.length === 0 && (
            <div style={{ fontSize: 'var(--dv-text-sm)', color: 'var(--dv-text-secondary)' }}>
              No critical risks identified.
            </div>
          )}
        </div>

        {dpCount > 0 && (
          <DvButton
             variant="outline"
             size="sm"
             style={{ width: '100%', borderColor: 'var(--dv-accent)', color: 'var(--dv-text-primary)' }}
             onClick={onViewDecisionPoints}
          >
             VIEW DECISION POINTS
          </DvButton>
        )}
      </DvCard>
    </div>
  );
}

"""

content = content[:start_idx] + engineering_panel_code + content[end_idx:]

usage_target = """              <div style={{ position: 'sticky', top: 160 }}>
                <SectionLabel label="Agent Analysis" icon={Brain} />
                <AgentAnalysisPanel
                  agentActivity={agentActivity}
                  analysisSummary={analysisSummary}
                  decisionPoints={decisionPoints}
                  org={org}
                />
              </div>"""
usage_replacement = """              <div style={{ position: 'sticky', top: 160 }}>
                <SectionLabel label="Engineering Analysis" icon={Brain} />
                <EngineeringAnalysisPanel
                  decisionPoints={decisionPoints}
                  responsibilities={responsibilities}
                  onViewDecisionPoints={() => {
                    const dpEl = document.getElementById('decision-concentration');
                    if (dpEl) {
                      dpEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                />
              </div>"""

if usage_target not in content:
    print("Usage target not found")
else:
    content = content.replace(usage_target, usage_replacement)

content = content.replace(
    '<SectionLabel label="Decision Concentration" icon={AlertTriangle} />',
    '<SectionLabel id="decision-concentration" label="Decision Concentration" icon={AlertTriangle} />'
)

# 4. Remove ProvenancePip from MemberIntelligenceCard, DependencyChain, and Decision Concentration
# Capacity
content = content.replace('<ProvenancePip prov="DERIVED" />', '')
# Responsibility
content = content.replace('<div style={{ marginTop: 3 }}><ProvenancePip prov="REAL_DB" /></div>', '')
# DependencyChain
content = content.replace('<ProvenancePip prov={dep.provenance} />', '')
# Decision Concentration evidence
content = content.replace('<ProvenancePip prov={ev.provenance} />', '')


with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
