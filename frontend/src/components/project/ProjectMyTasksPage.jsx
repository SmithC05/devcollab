import { useParams } from 'react-router-dom';
import { Columns3 } from 'lucide-react';
import { useTaskStore, PRIORITY_COLORS, COLUMNS } from '../../stores/taskStore';

export default function ProjectMyTasksPage() {
  const { projectId } = useParams();
  const columns = useTaskStore(state => state.columns);
  const tasks = Object.values(columns).flat();
  
  // Hardcoded to Arjun for Developer view demo
  const myTasks = tasks.filter(t => t.assignee === 'Arjun' && t.columnId !== 'done');
  
  return (
    <div style={{ padding: '32px 36px', height: '100vh', overflow: 'auto', background: '#0e0e10', color: '#f5f5f5', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#1a1a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Columns3 size={20} color="#888" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>My Tasks</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Active work assigned directly to you in {projectId}.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {myTasks.length === 0 ? (
           <div style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px', padding: '32px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
             You have no active tasks.
           </div>
        ) : (
          myTasks.map(task => {
            const pColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.P2;
            const statusLabel = COLUMNS.find(c => c.id === task.columnId)?.label;
            
            return (
              <div key={task.id} style={{ background: '#141416', border: '1px solid #1f1f24', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>{task.id}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f5' }}>{task.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888', background: '#1a1a1e', padding: '2px 6px', borderRadius: '4px' }}>{statusLabel}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: pColor.bg, color: pColor.text, border: `1px solid ${pColor.border}` }}>
                      {task.priority}
                    </span>
                    {task.dueDate && <span style={{ fontSize: '12px', color: '#888' }}>Due: {task.dueDate}</span>}
                  </div>
                </div>
                <button style={{ padding: '8px 16px', borderRadius: '6px', background: '#e5e5e5', color: '#0e0e10', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  Open Task
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
