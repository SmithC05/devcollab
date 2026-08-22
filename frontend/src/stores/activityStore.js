import { create } from 'zustand';
import { subDays, format, parseISO } from 'date-fns';

function generateActivityGrid() {
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = subDays(today, i);
    const count = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 8);
    days.push({ date: format(date, 'yyyy-MM-dd'), count });
  }
  return days;
}

const SEED_EVENTS = [
  { id: 'ev-1', type: 'task',    user: 'Arjun',  action: 'moved "Payment API integration" to In Progress',   time: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'ev-2', type: 'task',    user: 'Arjun',  action: 'completed "Database schema"',              time: new Date(Date.now() - 40 * 3600000).toISOString() },
  { id: 'ev-3', type: 'task',    user: 'Priya',  action: 'created "User registration API"',          time: new Date(Date.now() - 100 * 3600000).toISOString() },
  { id: 'ev-4', type: 'member',  user: 'Rahul',  action: 'joined the project',                       time: new Date(Date.now() - 240 * 3600000).toISOString() },
  { id: 'ev-5', type: 'docs',    user: 'Libin',  action: 'updated "Getting Started" wiki page',      time: new Date(Date.now() - 26 * 3600000).toISOString() },
  { id: 'ev-6', type: 'code',    user: 'Rahul',  action: 'saved snippet "JWT Auth Header Helper"',   time: new Date(Date.now() - 30 * 3600000).toISOString() },
  { id: 'ev-7', type: 'task',    user: 'Libin',  action: 'created "Project setup"',                  time: new Date(Date.now() - 300 * 3600000).toISOString() },
  { id: 'ev-8', type: 'comment', user: 'Priya',  action: 'commented on "Payment API integration"',   time: new Date(Date.now() - 50 * 3600000).toISOString() },
];

// All grayscale — type colors
export const TYPE_COLORS = {
  task:    '#aaa',
  member:  '#ccc',
  docs:    '#888',
  code:    '#bbb',
  comment: '#666',
};

export const useActivityStore = create((set, get) => ({
  events: SEED_EVENTS,
  activityGrid: generateActivityGrid(),
  activeFilter: 'all',

  setFilter: (filter) => set({ activeFilter: filter }),

  addEvent: (event) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    set((state) => {
      const updatedGrid = state.activityGrid.map((d) =>
        d.date === today ? { ...d, count: d.count + 1 } : d
      );
      return {
        events: [{ id: `ev-${Date.now()}`, ...event, time: new Date().toISOString() }, ...state.events],
        activityGrid: updatedGrid,
      };
    });
  },

  getFilteredEvents: () => {
    const { events, activeFilter } = get();
    if (activeFilter === 'all') return events;
    const map = { tasks: 'task', members: 'member', documentation: 'docs', code: 'code', comments: 'comment' };
    return events.filter((e) => e.type === map[activeFilter]);
  },
}));
