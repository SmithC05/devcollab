import { create } from 'zustand';
import { nanoid } from 'nanoid';

const EMPTY_TASKS = {
  todo: [],
  inprogress: [],
  inreview: [],
  done: [],
};

export const COLUMNS = [
  { id: 'todo',       label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'inreview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
];

// All grayscale — no color accents
export const PRIORITY_COLORS = {
  P0: { bg: 'rgba(255,255,255,0.08)', text: '#f5f5f5', border: 'rgba(255,255,255,0.2)' },
  P1: { bg: 'rgba(255,255,255,0.05)', text: '#bbb',    border: 'rgba(255,255,255,0.12)' },
  P2: { bg: 'rgba(255,255,255,0.03)', text: '#888',    border: 'rgba(255,255,255,0.08)' },
};

export const useTaskStore = create((set, get) => ({
  columns: EMPTY_TASKS,

  addTask: (columnId, taskData) => {
    const task = {
      id: `task-${nanoid(6)}`,
      columnId,
      createdAt: new Date().toISOString(),
      priority: 'P2',
      labels: [],
      assignee: '',
      dueDate: '',
      description: '',
      ...taskData,
    };
    set((state) => ({
      columns: { ...state.columns, [columnId]: [...state.columns[columnId], task] },
    }));
    return task;
  },

  updateTask: (taskId, updates) => {
    const cols = get().columns;
    const newCols = {};
    for (const [colId, tasks] of Object.entries(cols)) {
      newCols[colId] = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    }
    set({ columns: newCols });
  },

  deleteTask: (taskId) => {
    const cols = get().columns;
    const newCols = {};
    for (const [colId, tasks] of Object.entries(cols)) {
      newCols[colId] = tasks.filter((t) => t.id !== taskId);
    }
    set({ columns: newCols });
  },

  setTasks: (tasks) => {
    const cols = { todo: [], inprogress: [], inreview: [], done: [] };
    tasks.forEach(t => {
      // Map API STATUS to columnId
      let colId = 'todo';
      if (t.status === 'TODO') colId = 'todo';
      else if (t.status === 'IN_PROGRESS') colId = 'inprogress';
      else if (t.status === 'IN_REVIEW') colId = 'inreview';
      else if (t.status === 'DONE') colId = 'done';
      
      const mappedTask = {
        ...t,
        id: t.id.toString(),
        columnId: colId,
        assigneeName: t.assignee_details?.username || '',
      };
      
      cols[colId].push(mappedTask);
    });
    // Sort columns by position
    Object.keys(cols).forEach(colId => {
      cols[colId].sort((a, b) => a.position - b.position);
    });
    set({ columns: cols });
  },

  fetchTasks: async (projectId) => {
    const { taskApi } = await import('../api/taskApi');
    try {
      const data = await taskApi.getTasks(projectId);
      get().setTasks(data);
    } catch (e) {
      console.error(e);
    }
  },

  syncEngineEvent: (payload) => {
    const { task_id, new_status, new_position, task_data } = payload;
    // For simplicity, just fetch all tasks if we get an event
    // In a fully optimized app we would do targeted surgical updates
    // Because we need project_id to fetch, and we might not have it here easily
    // Let's implement targeted update:
    let toColId = 'todo';
    if (new_status === 'TODO') toColId = 'todo';
    else if (new_status === 'IN_PROGRESS') toColId = 'inprogress';
    else if (new_status === 'IN_REVIEW') toColId = 'inreview';
    else if (new_status === 'DONE') toColId = 'done';

    const cols = { ...get().columns };
    
    // Remove from old column if exists
    let found = false;
    let mappedTask = {
      ...task_data,
      id: task_data.id.toString(),
      columnId: toColId,
      assigneeName: task_data.assignee_details?.username || '',
    };
    
    for (const [cId, tasks] of Object.entries(cols)) {
      const idx = tasks.findIndex(t => t.id === task_id.toString());
      if (idx !== -1) {
        if (!found) {
          mappedTask = { ...tasks[idx], ...mappedTask };
          found = true;
        }
        cols[cId] = tasks.filter(t => t.id !== task_id.toString());
      }
    }
    
    // Add to new column and sort
    cols[toColId] = [...cols[toColId], mappedTask].sort((a, b) => a.position - b.position);
    set({ columns: cols });
  },

  moveTask: async (taskId, fromColId, toColId, toIndex) => {
    // 1. Optimistic update
    const cols = { ...get().columns };
    const fromTasks = [...cols[fromColId]];
    const taskIdx = fromTasks.findIndex((t) => t.id === taskId);
    if (taskIdx === -1) return;
    
    const [task] = fromTasks.splice(taskIdx, 1);
    task.columnId = toColId;
    const toTasks = [...cols[toColId]];
    const insertAt = toIndex != null ? toIndex : toTasks.length;
    toTasks.splice(insertAt, 0, task);
    
    // Calculate new position
    let newPos = 0;
    if (toTasks.length > 1) {
      if (insertAt === 0) {
        newPos = (toTasks[1].position || 0) - 1.0;
      } else if (insertAt === toTasks.length - 1) {
        newPos = (toTasks[insertAt - 1].position || 0) + 1.0;
      } else {
        const prev = toTasks[insertAt - 1].position || 0;
        const next = toTasks[insertAt + 1].position || 0;
        newPos = (prev + next) / 2.0;
      }
    } else {
      newPos = 1.0;
    }
    task.position = newPos;
    
    set({ columns: { ...cols, [fromColId]: fromTasks, [toColId]: toTasks } });

    // 2. Map colId to STATUS
    let status = 'TODO';
    if (toColId === 'todo') status = 'TODO';
    else if (toColId === 'inprogress') status = 'IN_PROGRESS';
    else if (toColId === 'inreview') status = 'IN_REVIEW';
    else if (toColId === 'done') status = 'DONE';

    // 3. API Call
    try {
      const { taskApi } = await import('../api/taskApi');
      await taskApi.moveTask(taskId, status, newPos);
    } catch (e) {
      console.error('Failed to move task:', e);
      // rollback could be implemented here
    }
  },

  reorderTask: async (colId, fromIndex, toIndex) => {
    const tasks = [...get().columns[colId]];
    const [task] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, task);
    
    // Calc new pos
    let newPos = 0;
    if (tasks.length > 1) {
      if (toIndex === 0) {
        newPos = (tasks[1].position || 0) - 1.0;
      } else if (toIndex === tasks.length - 1) {
        newPos = (tasks[toIndex - 1].position || 0) + 1.0;
      } else {
        const prev = tasks[toIndex - 1].position || 0;
        const next = tasks[toIndex + 1].position || 0;
        newPos = (prev + next) / 2.0;
      }
    }
    task.position = newPos;
    
    set((state) => ({ columns: { ...state.columns, [colId]: tasks } }));

    // API Call
    let status = 'TODO';
    if (colId === 'todo') status = 'TODO';
    else if (colId === 'inprogress') status = 'IN_PROGRESS';
    else if (colId === 'inreview') status = 'IN_REVIEW';
    else if (colId === 'done') status = 'DONE';

    try {
      const { taskApi } = await import('../api/taskApi');
      await taskApi.moveTask(task.id, status, newPos);
    } catch (e) {
      console.error('Failed to reorder task:', e);
    }
  },

  getAllTasks: () => Object.values(get().columns).flat(),
}));
