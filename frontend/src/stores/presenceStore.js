import { create } from 'zustand';

export const usePresenceStore = create((set) => ({
  presenceMap: {}, // { user_id: 'ACTIVE' | 'IDLE' | 'OFFLINE' }
  taskViewers: {}, // { task_id: Set(user_id) }
  
  setPresence: (userId, status) => set((state) => ({
    presenceMap: {
      ...state.presenceMap,
      [userId]: status
    }
  })),
  
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

  clearPresence: () => set({ presenceMap: {}, taskViewers: {} })
}));
