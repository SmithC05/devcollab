import sys

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\data\organizationAdapter.js"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """  try {
    const data = await apiClient('/intelligence/command-center/');
    
    // Explicitly set null for unavailable signals
    data.responsibilities = null; 
    data.dependencies = null;
    
    return data;"""

new_block = """  try {
    const rawData = await apiClient('/intelligence/command-center/');
    
    // Explicitly map snake_case to camelCase and set null for unavailable signals
    const data = {
      organization: rawData.organization,
      projects: rawData.projects,
      members: rawData.members,
      decisionPoints: rawData.decision_points || [],
      systemStatus: rawData.system_status || { source: 'LIVE', last_synced: new Date().toISOString(), agent_status: 'IDLE' },
      responsibilities: null, 
      dependencies: null
    };
    
    return data;"""

content = content.replace(old_block, new_block)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Mapped fields successfully")
