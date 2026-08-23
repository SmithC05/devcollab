import { create } from 'zustand';

export const usePresenceStore = create((set, get) => ({
  presenceMap: {},      // { user_id: 'ACTIVE' | 'IDLE' | 'OFFLINE' | 'UNAVAILABLE' }
  taskViewers: {},      // { task_id: Set(user_id) }
  // Phase 3: Tracks intentional unavailability with metadata
  unavailableMembers: {}, // { user_id: { until: ISO_string, username: string } }
  currentUser: null,

  setPresence: (userId, status) => set((state) => ({
    presenceMap: {
      ...state.presenceMap,
      [userId]: status
    }
  })),

  // Phase 3: Mark a member as intentionally UNAVAILABLE with end time
  setUnavailable: (userId, until, username) => set((state) => ({
    presenceMap: {
      ...state.presenceMap,
      [userId]: 'UNAVAILABLE'
    },
    unavailableMembers: {
      ...state.unavailableMembers,
      [userId]: { until, username }
    }
  })),

  // Phase 3: Clear unavailability (e.g. after demo reset or user returns)
  clearUnavailable: (userId) => set((state) => {
    const { [userId]: _, ...rest } = state.unavailableMembers;
    return { unavailableMembers: rest };
  }),

  isUnavailable: (userId) => {
    const { unavailableMembers } = get();
    return !!unavailableMembers[userId];
  },

  addTaskViewer: (taskId, userId) => set((state) => {
    const viewers = new Set(state.taskViewers[taskId] || []);
    viewers.add(userId);
    return { taskViewers: { ...state.taskViewers, [taskId]: viewers } };
  }),

  removeTaskViewer: (taskId, userId) => set((state) => {
    const viewers = new Set(state.taskViewers[taskId] || []);
    viewers.delete(userId);
    return { taskViewers: { ...state.taskViewers, [taskId]: viewers } };
  }),

  setCurrentUser: (user) => set({ currentUser: user }),

  clearPresence: () => set({ presenceMap: {}, taskViewers: {}, unavailableMembers: {} })
}));
