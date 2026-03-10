import { apiClient } from './client.js';
import type { Vocab } from './types.js';

export const vocabApi = {
  getAll: (lessonId: string) => apiClient.get<Vocab[]>(`/lessons/${lessonId}/vocab`),
  create: (lessonId: string, data: { term: string; definition: string; order: number }) =>
    apiClient.post<Vocab>(`/lessons/${lessonId}/vocab`, data),
  update: (id: string, data: { term?: string; definition?: string; order?: number }) =>
    apiClient.put<Vocab>(`/vocab/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/vocab/${id}`),
};
