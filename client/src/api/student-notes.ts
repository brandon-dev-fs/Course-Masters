import { apiClient } from './client.js';
import type { StudentNote } from './types.js';

export const studentNotesApi = {
  get: (lessonId: string) => apiClient.get<StudentNote | null>(`/lessons/${lessonId}/student-notes`),
  upsert: (lessonId: string, data: { content: string }) =>
    apiClient.post<StudentNote>(`/lessons/${lessonId}/student-notes`, data),
  delete: (id: string) => apiClient.delete<void>(`/student-notes/${id}`),
};
