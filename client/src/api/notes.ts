import { apiClient } from './client.js';
import type { Note } from './types.js';

export const notesApi = {
  getAll: (lessonId: string) => apiClient.get<Note[]>(`/lessons/${lessonId}/notes`),
  create: (lessonId: string, data: { title: string; content: Record<string, unknown>; order: number }) =>
    apiClient.post<Note>(`/lessons/${lessonId}/notes`, data),
  update: (id: string, data: { title?: string; content?: Record<string, unknown>; order?: number }) =>
    apiClient.put<Note>(`/notes/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/notes/${id}`),
};
