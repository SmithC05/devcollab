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

  addTask: async (columnId, taskData, projectId) => {
    // Optimistic UUID for initial UI render
    const tempId = `task-${nanoid(6)}`;
    const task = {
      id: tempId,
      columnId,
      createdAt: new Date().toISOString(),
      priority: 'P2',
      labels: [],
      assignee: '',
      dueDate: null,
      description: '',
      ...taskData,
    };
    
    // Convert columnId to STATUS string expected by backend
    let status = 'To Do';
    if (columnId === 'inprogress') status = 'In Progress';
    if (columnId === 'inreview') status = 'In Review';
    if (columnId === 'done') status = 'Done';

    set((state) => ({
      columns: { ...state.columns, [columnId]: [...state.columns[columnId], task] },
    }));

    try {
      const { taskApi } = await import('../api/taskApi');
      const payload = {
        title: task.title,
        description: task.description,
        status: status,
        priority: task.priority,
        due_date: task.dueDate || null,
      };
      if (task.assignee !== undefined) {
        payload.assignee = task.assignee;
      }

      const apiTask = await taskApi.createTask(projectId, payload);
      // We don't necessarily need to replace it here since the websocket event will bring the real ID 
      // but it's good practice to update the local ID just in case.
      set((state) => {
        const cols = { ...state.columns };
        cols[columnId] = cols[columnId].map(t => t.id === tempId ? { ...t, id: apiTask.id.toString() } : t);
        return { columns: cols };
      });
    } catch (e) {
      console.error('Failed to create task:', e);
      // Rollback
      set((state) => ({
        columns: { ...state.columns, [columnId]: state.columns[columnId].filter(t => t.id !== tempId) },
      }));
    }
    return task;
  },

  updateTask: async (taskId, updates) => {
    // Optimistic update
    const cols = get().columns;
    const newCols = {};
    for (const [colId, tasks] of Object.entries(cols)) {
      newCols[colId] = tasks.map((t) => (t.id === taskId.toString() ? { ...t, ...updates } : t));
    }
    set({ columns: newCols });

    try {
      // Map frontend fields to backend fields if necessary
      let backendUpdates = { ...updates };
      if (updates.dueDate !== undefined) backendUpdates.due_date = updates.dueDate || null;
      if (updates.columnId) {
        if (updates.columnId === 'todo') backendUpdates.status = 'To Do';
        if (updates.columnId === 'inprogress') backendUpdates.status = 'In Progress';
        if (updates.columnId === 'inreview') backendUpdates.status = 'In Review';
        if (updates.columnId === 'done') backendUpdates.status = 'Done';
      }

      const { taskApi } = await import('../api/taskApi');
      // If it's a temporary ID, we can't update it yet. It should be resolved soon by WebSocket.
      if (!taskId.toString().startsWith('task-')) {
        await taskApi.updateTask(taskId, backendUpdates);
      }
    } catch (e) {
      console.error('Failed to update task:', e);
    }
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
      if (t.status === 'To Do') colId = 'todo';
      else if (t.status === 'In Progress') colId = 'inprogress';
      else if (t.status === 'In Review') colId = 'inreview';
      else if (t.status === 'Done') colId = 'done';
      
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
    const { event_type, task_id, new_status, new_position, task_data, new_assignee_id, new_assignee_name } = payload;
    
    // Ignore if task_data is missing
    if (!task_data) {
      // For TASK_REASSIGNED without full task_data: do a lightweight assignee patch
      if ((event_type === 'TASK_REASSIGNED' || event_type === 'TASK_ASSIGNED') && task_id) {
        const cols = { ...get().columns };
        let updated = false;
        for (const [colId, tasks] of Object.entries(cols)) {
          const idx = tasks.findIndex(t => t.id === task_id.toString());
          if (idx !== -1) {
            const updatedTask = {
              ...tasks[idx],
              assignee: new_assignee_id,
              assigneeName: new_assignee_name || tasks[idx].assigneeName,
            };
            cols[colId] = [...tasks.slice(0, idx), updatedTask, ...tasks.slice(idx + 1)];
            updated = true;
            break;
          }
        }
        if (updated) set({ columns: cols });
      }
      return;
    }

    let toColId = 'todo';
    if (new_status === 'To Do' || task_data.status === 'To Do') toColId = 'todo';
    else if (new_status === 'In Progress' || task_data.status === 'In Progress') toColId = 'inprogress';
    else if (new_status === 'In Review' || task_data.status === 'In Review') toColId = 'inreview';
    else if (new_status === 'Done' || task_data.status === 'Done') toColId = 'done';

    const cols = { ...get().columns };
    
    let mappedTask = {
      ...task_data,
      id: task_data.id.toString(),
      columnId: toColId,
      assigneeName: task_data.assignee_details?.username || new_assignee_name || '',
    };
    
    if (event_type === 'TASK_CREATED') {
      // Check if it already exists (from optimistic UI)
      const existing = cols[toColId].find(t => t.id === mappedTask.id || (t.title === mappedTask.title && t.id.startsWith('task-')));
      if (existing) {
        // Replace temp ID with real ID
        cols[toColId] = cols[toColId].map(t => t === existing ? { ...t, ...mappedTask } : t);
      } else {
        cols[toColId] = [...cols[toColId], mappedTask].sort((a, b) => a.position - b.position);
      }
    } else {
      // TASK_MOVED, TASK_UPDATED, TASK_REASSIGNED, TASK_ASSIGNED
      let found = false;
      const taskIdStr = (task_id || task_data.id).toString();
      for (const [cId, tasks] of Object.entries(cols)) {
        const idx = tasks.findIndex(t => t.id === taskIdStr);
        if (idx !== -1) {
          if (!found) {
            mappedTask = { ...tasks[idx], ...mappedTask };
            found = true;
          }
          cols[cId] = tasks.filter(t => t.id !== taskIdStr);
        }
      }
      cols[toColId] = [...cols[toColId], mappedTask].sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    
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
    let status = 'To Do';
    if (toColId === 'todo') status = 'To Do';
    else if (toColId === 'inprogress') status = 'In Progress';
    else if (toColId === 'inreview') status = 'In Review';
    else if (toColId === 'done') status = 'Done';

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
    let status = 'To Do';
    if (colId === 'todo') status = 'To Do';
    else if (colId === 'inprogress') status = 'In Progress';
    else if (colId === 'inreview') status = 'In Review';
    else if (colId === 'done') status = 'Done';

    try {
      const { taskApi } = await import('../api/taskApi');
      await taskApi.moveTask(task.id, status, newPos);
    } catch (e) {
      console.error('Failed to reorder task:', e);
    }
  },

  getAllTasks: () => Object.values(get().columns).flat(),
}));
