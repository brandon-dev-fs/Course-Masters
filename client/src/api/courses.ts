import { apiClient } from './client.js';
import type { Course } from './types.js';

export const coursesApi = {
  getAll: () => apiClient.get<Course[]>('/courses'),
  getOne: (id: string) => apiClient.get<Course>(`/courses/${id}`),
  create: (data: { title: string; description?: string }) =>
    apiClient.post<Course>('/courses', data),
  update: (id: string, data: { title?: string; description?: string }) =>
    apiClient.put<Course>(`/courses/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/courses/${id}`),
};
