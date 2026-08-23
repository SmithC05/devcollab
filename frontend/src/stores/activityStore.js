import { create } from 'zustand';
import { subDays, format, parseISO } from 'date-fns';

function generateActivityGrid() {
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = subDays(today, i);
    days.push({ date: format(date, 'yyyy-MM-dd'), count: 0 });
  }
  return days;
}

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

  return { id: String(id), type, user, action, time: timestamp };
};

export const useActivityStore = create((set, get) => ({
  events: [],
  activityGrid: generateActivityGrid(),
  activeFilter: 'all',
  // Track which project's data is currently loaded — null means nothing loaded yet
  loadedProjectId: null,

  fetchEvents: async (projectId) => {
    const pid = String(projectId);
    // Always re-fetch when projectId changes — never reuse another project's data
    if (get().loadedProjectId === pid) return;

    // Reset state immediately so old project data is never shown for new project
    set({
      events: [],
      activityGrid: generateActivityGrid(),
      activeFilter: 'all',
      loadedProjectId: pid,
    });

    try {
      const { realtimeApi } = await import('../api/realtimeApi');
      const data = await realtimeApi.getEvents(projectId);
      const formattedEvents = data.map(mapBackendEventToFrontend);

      // Compute grid from actual events for this project
      const grid = generateActivityGrid();
      formattedEvents.forEach(ev => {
        const d = format(parseISO(ev.time), 'yyyy-MM-dd');
        const cell = grid.find(g => g.date === d);
        if (cell) cell.count += 1;
      });

      set({ events: formattedEvents, activityGrid: grid });
    } catch (error) {
      console.error('Failed to fetch events', error);
      // loadedProjectId stays set — prevents retry loops, but state is empty
    }
  },

  setFilter: (filter) => set({ activeFilter: filter }),

  addEvent: (backendEvent) => {
    const formatted = mapBackendEventToFrontend(backendEvent);
    const today = format(new Date(), 'yyyy-MM-dd');
    set((state) => {
      if (state.events.find(e => e.id === formatted.id)) return state;
      const updatedGrid = state.activityGrid.map((d) =>
        d.date === today ? { ...d, count: d.count + 1 } : d
      );
      return { events: [formatted, ...state.events], activityGrid: updatedGrid };
    });
  },

  getFilteredEvents: () => {
    const { events, activeFilter } = get();
    if (activeFilter === 'all') return events;
    const map = { tasks: 'task', members: 'member', documentation: 'docs', code: 'code', comments: 'comment' };
    return events.filter((e) => e.type === map[activeFilter]);
  },

  // Call this when leaving a project — ensures next project always fetches fresh
  reset: () => set({
    events: [],
    activityGrid: generateActivityGrid(),
    activeFilter: 'all',
    loadedProjectId: null,
  }),
}));
