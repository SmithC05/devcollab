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

// All grayscale — type colors
export const TYPE_COLORS = {
  task:    '#aaa',
  member:  '#ccc',
  docs:    '#888',
  code:    '#bbb',
  comment: '#666',
};

const mapBackendEventToFrontend = (backendEvent) => {
  const { event_type, actor_details, payload, timestamp, id } = backendEvent;
  const user = actor_details?.username || 'Unknown';
  let type = 'task';
  let action = event_type;

  if (event_type === 'TASK_MOVED') {
    type = 'task';
    action = `moved task to ${payload.new_status}`;
  } else if (event_type === 'COMMENT_ADDED') {
    type = 'comment';
    action = `commented: "${payload.comment_data?.content?.substring(0, 30)}..."`;
  } else if (event_type === 'TASK_VIEW_STARTED') {
    type = 'member';
    action = `started viewing a task`;
  }

  return {
    id: String(id),
    type,
    user,
    action,
    time: timestamp,
  };
};

export const useActivityStore = create((set, get) => ({
  events: [],
  activityGrid: generateActivityGrid(),
  activeFilter: 'all',
  isLoaded: false,

  fetchEvents: async (projectId) => {
    try {
      const { realtimeApi } = await import('../api/realtimeApi');
      const data = await realtimeApi.getEvents(projectId);
      const formattedEvents = data.map(mapBackendEventToFrontend);
      
      // Compute grid from actual events
      const grid = generateActivityGrid();
      formattedEvents.forEach(ev => {
        const d = format(parseISO(ev.time), 'yyyy-MM-dd');
        const cell = grid.find(g => g.date === d);
        if (cell) cell.count += 1;
      });

      set({ events: formattedEvents, activityGrid: grid, isLoaded: true });
    } catch (error) {
      console.error('Failed to fetch events', error);
    }
  },

  setFilter: (filter) => set({ activeFilter: filter }),

  addEvent: (backendEvent) => {
    const formatted = mapBackendEventToFrontend(backendEvent);
    const today = format(new Date(), 'yyyy-MM-dd');
    set((state) => {
      // Check for duplicates
      if (state.events.find(e => e.id === formatted.id)) return state;
      
      const updatedGrid = state.activityGrid.map((d) =>
        d.date === today ? { ...d, count: d.count + 1 } : d
      );
      return {
        events: [formatted, ...state.events],
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
