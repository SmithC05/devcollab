import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutGrid, List, Calendar, Plus } from 'lucide-react';
import KanbanView from '../../components/board/KanbanView';
import TaskModal from '../../components/board/TaskModal';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';

const VIEWS = [
  { id: 'board',    label: 'Board',    icon: LayoutGrid },
  { id: 'list',     label: 'List',     icon: List },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

export default function ProjectBoardPage() {
  const { projectId } = useParams();
  const { can } = useAuthStore();
  const [activeView, setActiveView] = useState('board');
  const [showNewTask, setShowNewTask] = useState(false);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const syncEngineEvent = useTaskStore(state => state.syncEngineEvent);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  useEffect(() => {
    const handleEngineEvent = (e) => {
      const payload = e.detail;
      if (payload.task_id) {
        syncEngineEvent(payload);
      }
    };
    document.addEventListener('engine_event', handleEngineEvent);
    return () => {
      document.removeEventListener('engine_event', handleEngineEvent);
    };
  }, [syncEngineEvent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--surface-hover)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Tasks</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Manage and track your sprint deliverables.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-raised)', border: '1px solid var(--surface-hover)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                  border: 'none', cursor: 'pointer', transition: 'all 120ms',
                  background: activeView === id ? 'var(--surface-hover)' : 'transparent',
                  color: activeView === id ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* New Task */}
          {can('task.create') && (
            <button
              onClick={() => setShowNewTask(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '8px', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
            >
              <Plus size={15} strokeWidth={2.5} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        {activeView === 'board' && <KanbanView />}
        {activeView !== 'board' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--focus-ring)', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>{activeView.charAt(0).toUpperCase() + activeView.slice(1)} view</span>
            <span style={{ fontSize: '13px' }}>Coming soon — switch to Board.</span>
          </div>
        )}
      </div>

      {showNewTask && <TaskModal defaultColumnId="todo" onClose={() => setShowNewTask(false)} />}
    </div>
  );
}
