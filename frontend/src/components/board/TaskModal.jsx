import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useAuthStore } from '../../store/authStore';
import { X, Trash2 } from 'lucide-react';

const MEMBERS = ['Libin', 'Arjun', 'Priya', 'Rahul', 'Meera'];
const PRIORITIES = ['P0', 'P1', 'P2'];
const COLUMNS_LIST = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'inreview', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

const INPUT_STYLE = {
  background: '#0e0e0e', border: '1px solid #2a2a2a', borderRadius: '7px',
  padding: '9px 12px', fontSize: '13px', color: '#e5e5e5', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
};

const LABEL_STYLE = {
  display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em',
  textTransform: 'uppercase', color: '#444', marginBottom: '6px',
};

export default function TaskModal({ task, defaultColumnId = 'todo', onClose }) {
  const isEdit = Boolean(task);
  const { addTask, updateTask, deleteTask } = useTaskStore();
  const { can } = useAuthStore();
  
  const canEdit = can('task.edit');
  const canDelete = can('task.delete');

  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    assignee:    task?.assignee    || '',
    priority:    task?.priority    || 'P2',
    dueDate:     task?.dueDate     || '',
    labels:      task?.labels?.join(', ') || '',
    columnId:    task?.columnId    || defaultColumnId,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    const data = { ...form, labels: form.labels ? form.labels.split(',').map((l) => l.trim()).filter(Boolean) : [] };
    if (isEdit) updateTask(task.id, data);
    else addTask(data.columnId, data);
    onClose();
  };

  const handleDelete = () => { deleteTask(task.id); onClose(); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#111', border: '1px solid #1e1e1e',
        borderRadius: '12px', width: '540px', maxHeight: '90vh',
        overflow: 'auto', padding: '28px', position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f5f5f5', margin: 0 }}>
            {!canEdit ? 'Task Details' : (isEdit ? 'Edit Task' : 'Create Task')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEdit && canDelete && (
              <button onClick={handleDelete} style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                color: '#999', borderRadius: '7px', padding: '6px 10px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px',
              }}>
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: canEdit ? 1 : 0.7, pointerEvents: canEdit ? 'auto' : 'none' }}>
          <div>
            <label style={LABEL_STYLE}>Title *</label>
            <input disabled={!canEdit} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Task title..." style={INPUT_STYLE} autoFocus />
          </div>
          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea disabled={!canEdit} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What needs to be done?" rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={LABEL_STYLE}>Status</label>
              <select disabled={!canEdit} value={form.columnId} onChange={(e) => set('columnId', e.target.value)} style={INPUT_STYLE}>
                {COLUMNS_LIST.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Priority</label>
              <select disabled={!canEdit} value={form.priority} onChange={(e) => set('priority', e.target.value)} style={INPUT_STYLE}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={LABEL_STYLE}>Assignee</label>
              <select disabled={!canEdit} value={form.assignee} onChange={(e) => set('assignee', e.target.value)} style={INPUT_STYLE}>
                <option value="">Unassigned</option>
                {MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Due Date</label>
              <input disabled={!canEdit} type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} style={INPUT_STYLE} />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Labels (comma separated)</label>
            <input disabled={!canEdit} value={form.labels} onChange={(e) => set('labels', e.target.value)} placeholder="e.g. frontend, auth, bug" style={INPUT_STYLE} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #2a2a2a', background: 'transparent', color: '#888', cursor: 'pointer' }}>
            {canEdit ? 'Cancel' : 'Close'}
          </button>
          {canEdit && (
            <button onClick={handleSave} style={{ padding: '9px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, border: 'none', background: '#f5f5f5', color: '#080808', cursor: 'pointer' }}>
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
