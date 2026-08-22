import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoaded: false,

  fetchNotifications: async () => {
    try {
      const { realtimeApi } = await import('../api/realtimeApi');
      const data = await realtimeApi.getNotifications();
      
      const unread = data.filter(n => !n.read).length;
      
      set({ notifications: data, unreadCount: unread, isLoaded: true });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  },

  markAsRead: async (id) => {
    try {
      const { realtimeApi } = await import('../api/realtimeApi');
      await realtimeApi.markNotificationRead(id);
      
      set(state => {
        const updated = state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        );
        return { 
          notifications: updated, 
          unreadCount: updated.filter(n => !n.read).length 
        };
      });
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  }
}));
