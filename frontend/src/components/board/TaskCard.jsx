import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PRIORITY_COLORS } from '../../stores/taskStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

function AvatarInitial({ name, size = 22 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#222', border: '1px solid #333', color: '#ccc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 700, flexShrink: 0,
    }}>
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );
}

export default function TaskCard({ task, onClick }) {
  const { can } = useAuthStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id, 
    data: { type: 'task', task },
    disabled: !can('task.move')
  });
  const p = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.P2;
  const taskViewers = usePresenceStore(state => state.taskViewers[task.id]) || new Set();
  const viewersArray = Array.from(taskViewers);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        cursor: isDragging ? 'grabbing' : 'pointer',
        userSelect: 'none',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.6)' : 'none',
      }}
    >
      {/* Priority + Task ID */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px',
          background: p.bg, color: p.text, border: `1px solid ${p.border}`,
          letterSpacing: '0.04em',
        }}>
          {task.priority}
        </span>
        <span style={{ fontSize: '10px', color: '#333', fontWeight: 500 }}>
          #{task.id.slice(-4)}
        </span>
      </div>

      {/* Title */}
      <p style={{ fontSize: '13px', fontWeight: 500, color: '#e5e5e5', lineHeight: 1.4, margin: 0 }}>
        {task.title}
      </p>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {task.labels.slice(0, 3).map((label) => (
            <span key={label} style={{
              fontSize: '10px', padding: '1px 7px', borderRadius: '999px',
              background: '#181818', color: '#666', border: '1px solid #252525',
            }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Viewers & Assignee & Due */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {task.assignee
            ? <AvatarInitial name={task.assigneeName || task.assignee} size={20} />
            : <span style={{ fontSize: '11px', color: '#333' }}>Unassigned</span>
          }
          {viewersArray.length > 0 && (
            <div style={{ display: 'flex', gap: '-4px' }}>
              {viewersArray.map((userId) => (
                <div key={userId} style={{ marginLeft: '-4px', borderRadius: '50%', border: '1px solid #111', background: '#3b82f6', width: 14, height: 14 }} />
              ))}
            </div>
          )}
        </div>
        {task.dueDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#444', fontSize: '10px' }}>
            <Calendar size={11} />
            {task.dueDate}
          </div>
        )}
      </div>
    </div>
  );
}
