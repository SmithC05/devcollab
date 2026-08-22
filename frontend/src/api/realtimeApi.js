import { apiClient } from './client';

export const realtimeApi = {
  getEvents: async (projectId) => {
    let url = '/realtime/events/';
    if (projectId) {
      url += `?project_id=${projectId}`;
    }
    return apiClient(url);
  },

  getNotifications: async () => {
    return apiClient('/realtime/notifications/');
  },

  markNotificationRead: async (id) => {
    return apiClient(`/realtime/notifications/${id}/mark_read/`, {
      method: 'POST',
    });
  },
  
  markAllNotificationsRead: async () => {
    return apiClient('/realtime/notifications/mark_all_read/', {
      method: 'POST',
    });
  },
};
