import sys

filepath = r"e:\Innofusion\devcollab\frontend\src\features\devcollab-intelligence\pages\OrganizationIntelligence.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix in EngineeringGraph
old_graph_1 = """  // Key task nodes — P0/P1 only, max 6
  const keyTasks = members
    .flatMap(m => m.owned_tasks.filter(t => t.priority === 'P0' || t.priority === 'P1'))
    .slice(0, 6);
  const taskSpacing = (W - 80) / Math.max(keyTasks.length, 1);
  const taskNodes = keyTasks.map((t, i) => {
    const ownerNode = memberNodes.find(mn => mn.payload.owned_tasks.some(ot => ot.id === t.id));"""

new_graph_1 = """  // Key task nodes — P0/P1 only, max 6
  const keyTasks = members
    .flatMap(m => (m.owned_tasks || []).filter(t => t.priority === 'P0' || t.priority === 'P1'))
    .slice(0, 6);
  const taskSpacing = (W - 80) / Math.max(keyTasks.length, 1);
  const taskNodes = keyTasks.map((t, i) => {
    const ownerNode = memberNodes.find(mn => (mn.payload.owned_tasks || []).some(ot => ot.id === t.id));"""

content = content.replace(old_graph_1, new_graph_1)


# Fix in MemberInspector
old_inspector = """      <InspectorSection title="Owned Tasks">
        {member.owned_tasks.slice(0, 4).map(task => (
          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--dv-border-subtle)' }}>
            <DvBadge variant={task.priority === 'P0' ? 'danger' : task.priority === 'P1' ? 'warning' : 'muted'} size="sm">{task.priority}</DvBadge>
            <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', flex: 1 }}>{task.title}</span>
            {task.dependency_count > 0 && (
              <span style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)' }}>{task.dependency_count} deps</span>
            )}
          </div>
        ))}
      </InspectorSection>"""

new_inspector = """      <InspectorSection title="Owned Tasks">
        {!member.owned_tasks ? (
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
            NOT AVAILABLE FROM CURRENT WORKSPACE DATA
          </div>
        ) : member.owned_tasks.length === 0 ? (
          <div style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-muted)', padding: '10px 0' }}>
            No tasks currently owned
          </div>
        ) : (
          member.owned_tasks.slice(0, 4).map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--dv-border-subtle)' }}>
              <DvBadge variant={task.priority === 'P0' ? 'danger' : task.priority === 'P1' ? 'warning' : 'muted'} size="sm">{task.priority}</DvBadge>
              <span style={{ fontSize: 'var(--dv-text-xs)', color: 'var(--dv-text-secondary)', flex: 1 }}>{task.title}</span>
              {task.dependency_count > 0 && (
                <span style={{ fontSize: 9, color: 'var(--dv-text-faint)', fontFamily: 'var(--dv-font-mono)' }}>{task.dependency_count} deps</span>
              )}
            </div>
          ))
        )}
      </InspectorSection>"""

content = content.replace(old_inspector, new_inspector)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed owned_tasks accesses")
