import { apiClient } from './client';

export const taskApi = {
  getTasks: async (projectId) => {
    let url = '/tasks/';
    if (projectId) {
      url += `?project_id=${projectId}`;
    }
    return apiClient(url);
  },

  createTask: async (projectId, taskData) => {
    return apiClient('/tasks/', {
      method: 'POST',
      body: JSON.stringify({ ...taskData, project: projectId }),
    });
  },

  updateTask: async (taskId, taskData) => {
    return apiClient(`/tasks/${taskId}/`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
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

  getTaskEngineeringContext: async (taskId) => {
    return apiClient(`/tasks/${taskId}/engineering-context/`);
  },
};
