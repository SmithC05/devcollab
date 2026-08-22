import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { useTaskStore, COLUMNS } from '../../stores/taskStore';
import { useActivityStore } from '../../stores/activityStore';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { useAuthStore } from '../../store/authStore';

function DeleteZone() {
  const { isOver, setNodeRef } = useDroppable({ id: 'delete-zone' });
  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'fixed', bottom: '32px', right: '32px',
        width: '220px', height: '140px', borderRadius: '16px',
        background: isOver ? 'rgba(255, 74, 74, 0.15)' : 'rgba(15, 15, 15, 0.95)',
        border: `2px dashed ${isOver ? '#ff4a4a' : '#333'}`,
        color: isOver ? '#ff4a4a' : '#888',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        transition: 'all 0.2s',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Trash2 size={32} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: isOver ? '#ff4a4a' : '#e5e5e5' }}>
          {isOver ? 'Release to permanently delete' : 'Delete Task'}
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
          Drop to delete task
        </p>
      </div>
    </div>
  );
}

export default function KanbanView() {
  const { columns, moveTask, reorderTask, deleteTask } = useTaskStore();
  const { addEvent } = useActivityStore();
  const { can } = useAuthStore();
  const [activeTask, setActiveTask] = useState(null);
  const [modalTask, setModalTask] = useState(null); // null = closed, false = new, obj = edit
  const [newTaskColumn, setNewTaskColumn] = useState('todo');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = ({ active }) => {
    if (!can('task.move')) return;
    const task = Object.values(columns).flat().find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = ({ active, over }) => {
    const task = activeTask;
    setActiveTask(null);
    if (!can('task.move') || !over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    if (overId === 'delete-zone') {
      if (can('task.delete')) {
        deleteTask(activeId);
        addEvent({ type: 'task', user: 'You', action: `deleted task "${task?.title}"` });
      }
      return;
    }

    // Find source column
    const fromColId = Object.keys(columns).find((colId) =>
      columns[colId].some((t) => t.id === activeId)
    );
    if (!fromColId) return;

    // Determine target column (could be column id OR another task's column)
    const toColId = COLUMNS.map((c) => c.id).includes(overId)
      ? overId
      : Object.keys(columns).find((colId) => columns[colId].some((t) => t.id === overId));

    if (!toColId) return;

    if (fromColId === toColId) {
      // Reorder within same column
      const tasks = columns[fromColId];
      const oldIndex = tasks.findIndex((t) => t.id === activeId);
      const newIndex = tasks.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTask(fromColId, oldIndex, newIndex);
      }
    } else {
      // Move to different column
      const toTasks = columns[toColId];
      const toIndex = toTasks.findIndex((t) => t.id === overId);
      moveTask(activeId, fromColId, toColId, toIndex >= 0 ? toIndex : undefined);
    }
  };

  const openNewTask = (columnId) => {
    setNewTaskColumn(columnId);
    setModalTask(false);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'flex', gap: '16px',
          overflowX: 'auto', paddingBottom: '12px',
          alignItems: 'flex-start',
        }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={columns[col.id] || []}
              onTaskClick={(task) => setModalTask(task)}
              onAddTask={openNewTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div style={{ opacity: 0.9, transform: 'rotate(2deg)' }}>
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
        
        {activeTask && can('task.delete') && <DeleteZone />}
      </DndContext>

      {/* Task Modal — edit (modalTask is an object) */}
      {modalTask && (
        <TaskModal task={modalTask} onClose={() => setModalTask(null)} />
      )}

      {/* Task Modal — create (modalTask is false) */}
      {modalTask === false && (
        <TaskModal defaultColumnId={newTaskColumn} onClose={() => setModalTask(null)} />
      )}
    </>
  );
}
