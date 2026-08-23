import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function KanbanColumn({ column, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const { can } = useAuthStore();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '280px', minWidth: '280px',
      background: 'var(--surface-item)',
      border: '1px solid var(--border-subtle)',
      borderTop: '2px solid var(--border-strong)',
      borderRadius: '10px', overflow: 'hidden',
    }}>
      {/* Column Header */}
      <div style={{
        padding: '14px 16px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: isOver ? 'var(--surface-hover)' : 'var(--surface-item)',
        transition: 'background 150ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--border-strong)', display: 'inline-block' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{column.label}</span>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            background: 'var(--surface-hover)', color: 'var(--text-primary)',
            borderRadius: '999px', padding: '1px 7px',
            border: '1px solid var(--border-subtle)',
          }}>
            {tasks.length}
          </span>
        </div>
        {can('task.create') && (
          <button
            onClick={() => onAddTask(column.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '4px' }}
          >
            <Plus size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Tasks Area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, padding: '10px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          minHeight: '120px',
          background: isOver ? 'var(--surface-hover)' : 'transparent',
          transition: 'background 150ms', overflowY: 'auto',
        }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '80px', color: 'var(--border-subtle)', fontSize: '12px',
            border: '1px dashed #1e1e1e', borderRadius: '8px',
          }}>
            Drop tasks here
          </div>
        )}
        
        {can('task.create') && (
          <button
            onClick={() => onAddTask(column.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 10px', marginTop: '4px',
              background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 150ms',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'var(--surface-raised)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Plus size={14} strokeWidth={2.5} /> New task
          </button>
        )}
      </div>
    </div>
  );
}
