import { apiClient } from './client.js';
import type { Note } from './types.js';

export const notesApi = {
  getAll: (lessonId: string) => apiClient.get<Note[]>(`/lessons/${lessonId}/notes`),
  create: (lessonId: string, data: { content: string; order: number }) =>
    apiClient.post<Note>(`/lessons/${lessonId}/notes`, data),
  update: (id: string, data: { content?: string; order?: number }) =>
    apiClient.put<Note>(`/notes/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/notes/${id}`),
};
