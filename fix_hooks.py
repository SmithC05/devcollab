import sys

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\pages\OrganizationIntelligence.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """  if (loading && !data) {
    return <div style={{ padding: 40, color: 'var(--dv-text-secondary)' }}>Loading organization state...</div>;
  }
  if (!data) return null;

  const { organization: org, members, projects, responsibilities, dependencies,
          decisionPoints, systemStatus } = data;

  // Build graph node selectors
  const handleSelectNode = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const sortedMembers = useMemo(() =>
    [...members].sort((a, b) => b.capacity_pct - a.capacity_pct), [members]);"""


new_code = """  // Build graph node selectors
  const handleSelectNode = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const sortedMembers = useMemo(() =>
    data?.members ? [...data.members].sort((a, b) => b.capacity_pct - a.capacity_pct) : [], [data?.members]);

  if (loading && !data) {
    return <div style={{ padding: 40, color: 'var(--dv-text-secondary)' }}>Loading organization state...</div>;
  }
  if (!data) return null;

  const { organization: org, members, projects, responsibilities, dependencies,
          decisionPoints, systemStatus } = data;"""

content = content.replace(old_code, new_code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed hooks order")
