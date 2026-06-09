import { apiClient } from './client.js';
import type { Lesson } from './types.js';

export const lessonsApi = {
  getAll: (unitId: string) => apiClient.get<Lesson[]>(`/units/${unitId}/lessons`),
  getOne: (unitId: string, lessonId: string) =>
    apiClient.get<Lesson>(`/units/${unitId}/lessons/${lessonId}`),
  create: (unitId: string, data: { title: string; description: string; order: number }) =>
    apiClient.post<Lesson>(`/units/${unitId}/lessons`, data),
  update: (unitId: string, lessonId: string, data: {
    title?: string;
    description?: string;
    order?: number;
    objective?: string;
    planContent?: Record<string, unknown>;
  }) =>
    apiClient.put<Lesson>(`/units/${unitId}/lessons/${lessonId}`, data),
  delete: (unitId: string, lessonId: string) =>
    apiClient.delete<void>(`/units/${unitId}/lessons/${lessonId}`),
};
