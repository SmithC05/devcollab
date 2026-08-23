import re

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\data\organizationAdapter.js"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add import for apiClient
if "apiClient" not in content:
    content = "import { apiClient } from '../../../api/client';\n" + content

# Update getOrganizationIntelligenceState
old_func = """export function getOrganizationIntelligenceState() {
  // Future: return fetchOrganizationIntelligence(authToken);
  return buildDemoState();
}"""

new_func = """export async function getOrganizationIntelligenceState(mode = 'LIVE') {
  if (mode === 'DEMO') {
    return buildDemoState();
  }

  try {
    const data = await apiClient('/intelligence/command-center/');
    
    // Explicitly set null for unavailable signals
    data.responsibilities = null; 
    data.dependencies = null;
    
    return data;
  } catch (error) {
    console.error('Failed to fetch live engineering state:', error);
    // Return empty state rather than demo state on error
    return {
      organization: { member_count: 0, project_count: 0, active_task_count: 0, dependency_count: 0, decision_point_count: 0 },
      members: [],
      projects: [],
      responsibilities: null,
      dependencies: null,
      decisionPoints: [],
      agentActivity: [],
      analysisSummary: '',
      systemStatus: { source: 'LIVE', last_synced: new Date().toISOString(), agent_status: 'IDLE' },
    };
  }
}"""

content = content.replace(old_func, new_func)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated organizationAdapter.js")
