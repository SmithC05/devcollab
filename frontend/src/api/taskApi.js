import { apiClient } from './client';

export const taskApi = {
  getTasks: async (projectId) => {
    let url = '/tasks/';
    if (projectId) {
      url += `?project_id=${projectId}`;
    }
    return apiClient(url);
  },

  moveTask: async (taskId, newStatus, newPosition) => {
    return apiClient(`/tasks/${taskId}/move/`, {
      method: 'POST',
      body: JSON.stringify({
        status: newStatus,
        position: newPosition,
      }),
    });
  },

  getComments: async (taskId) => {
    return apiClient(`/tasks/${taskId}/comments/`);
  },

  addComment: async (taskId, content) => {
    return apiClient(`/tasks/${taskId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};
