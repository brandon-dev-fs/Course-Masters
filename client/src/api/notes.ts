import { apiClient } from './client.js';
import type { Note } from './types.js';

export const notesApi = {
  get: (lessonId: string) => apiClient.get<Note | null>(`/lessons/${lessonId}/notes`),
  upsert: (lessonId: string, content: Record<string, unknown>) =>
    apiClient.put<Note>(`/lessons/${lessonId}/notes`, { content }),
};
