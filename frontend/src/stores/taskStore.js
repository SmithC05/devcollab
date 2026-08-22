import { create } from 'zustand';
import { nanoid } from 'nanoid';

const SEED_TASKS = {
  todo: [
    {
      id: 'task-1',
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      assignee: 'Libin',
      priority: 'P1',
      dueDate: '2026-08-30',
      labels: ['devops', 'infra'],
      columnId: 'todo',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Write API documentation',
      description: 'Document all REST endpoints using OpenAPI spec.',
      assignee: 'Priya',
      priority: 'P2',
      dueDate: '2026-09-05',
      labels: ['docs'],
      columnId: 'todo',
      createdAt: new Date().toISOString(),
    },
  ],
  inprogress: [
    {
      id: 'task-3',
      title: 'Payment API integration',
      description: 'Integrate Razorpay for subscription billing.',
      assignee: 'Arjun',
      priority: 'P0',
      dueDate: '2026-08-25',
      labels: ['backend', 'payments'],
      columnId: 'inprogress',
      createdAt: new Date().toISOString(),
    },
  ],
  inreview: [
    {
      id: 'task-4',
      title: 'Authentication middleware',
      description: 'Implement JWT-based auth middleware for DRF.',
      assignee: 'Libin',
      priority: 'P1',
      dueDate: '2026-08-22',
      labels: ['backend', 'security'],
      columnId: 'inreview',
      createdAt: new Date().toISOString(),
    },
  ],
  done: [
    {
      id: 'task-5',
      title: 'Database schema design',
      description: 'Finalize the PostgreSQL schema for projects and tasks.',
      assignee: 'Priya',
      priority: 'P1',
      dueDate: '2026-08-20',
      labels: ['backend', 'db'],
      columnId: 'done',
      createdAt: new Date().toISOString(),
    },
  ],
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
  columns: SEED_TASKS,

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

  moveTask: (taskId, fromColId, toColId, toIndex) => {
    const cols = { ...get().columns };
    const fromTasks = [...cols[fromColId]];
    const taskIdx = fromTasks.findIndex((t) => t.id === taskId);
    if (taskIdx === -1) return;
    const [task] = fromTasks.splice(taskIdx, 1);
    task.columnId = toColId;
    const toTasks = [...cols[toColId]];
    const insertAt = toIndex != null ? toIndex : toTasks.length;
    toTasks.splice(insertAt, 0, task);
    set({ columns: { ...cols, [fromColId]: fromTasks, [toColId]: toTasks } });
  },

  reorderTask: (colId, fromIndex, toIndex) => {
    const tasks = [...get().columns[colId]];
    const [task] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, task);
    set((state) => ({ columns: { ...state.columns, [colId]: tasks } }));
  },

  getAllTasks: () => Object.values(get().columns).flat(),
}));
