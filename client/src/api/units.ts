import { apiClient } from './client.js';
import type { Unit } from './types.js';

export const unitsApi = {
  getAll: (courseId: string) => apiClient.get<Unit[]>(`/courses/${courseId}/units`),
  getOne: (courseId: string, unitId: string) =>
    apiClient.get<Unit>(`/courses/${courseId}/units/${unitId}`),
  create: (courseId: string, data: { title: string; description: string; order: number }) =>
    apiClient.post<Unit>(`/courses/${courseId}/units`, data),
  update: (courseId: string, unitId: string, data: { title?: string; description?: string; order?: number }) =>
    apiClient.put<Unit>(`/courses/${courseId}/units/${unitId}`, data),
  delete: (courseId: string, unitId: string) =>
    apiClient.delete<void>(`/courses/${courseId}/units/${unitId}`),
};
