import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTaskStore, COLUMNS } from '../../stores/taskStore';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { useAuthStore } from '../../stores/authStore';

export default function KanbanView() {
  const { columns, moveTask, reorderTask } = useTaskStore();
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
    setActiveTask(null);
    if (!can('task.move') || !over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

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
