import { useState } from 'react';
import { LayoutGrid, List, Calendar, Plus } from 'lucide-react';
import KanbanView from '../../components/board/KanbanView';
import ListView from '../../components/board/ListView';
import CalendarView from '../../components/board/CalendarView';
import TaskModal from '../../components/board/TaskModal';
import { useAuthStore } from '../../stores/authStore';

const VIEWS = [
  { id: 'board',    label: 'Board',    icon: LayoutGrid },
  { id: 'list',     label: 'List',     icon: List },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

export default function ProjectBoardPage() {
  const { can } = useAuthStore();
  const [activeView, setActiveView] = useState('board');
  const [showNewTask, setShowNewTask] = useState(false);
  const [modalTask, setModalTask] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080808', color: '#f5f5f5', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f5f5f5', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Tasks</h1>
          <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>Manage and track your sprint deliverables.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                  border: 'none', cursor: 'pointer', transition: 'all 120ms',
                  background: activeView === id ? '#1e1e1e' : 'transparent',
                  color: activeView === id ? '#f5f5f5' : '#555',
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
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '8px', background: '#f5f5f5', color: '#080808', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
            >
              <Plus size={15} strokeWidth={2.5} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        {activeView === 'board' && <KanbanView />}
        {activeView === 'list' && <ListView onTaskClick={(task) => setModalTask(task)} />}
        {activeView === 'calendar' && <CalendarView onTaskClick={(task) => setModalTask(task)} />}
      </div>

      {showNewTask && <TaskModal defaultColumnId="todo" onClose={() => setShowNewTask(false)} />}
      {modalTask && <TaskModal task={modalTask} onClose={() => setModalTask(null)} />}
    </div>
  );
}
