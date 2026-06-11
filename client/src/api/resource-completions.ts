import { apiClient } from './client.js';
import type { CompletionsResponse } from './types.js';

export const resourceCompletionsApi = {
  get: (lessonId: string) =>
    apiClient.get<CompletionsResponse>(`/lessons/${lessonId}/completions`),
  toggle: (lessonId: string, assignmentId: string) =>
    apiClient.post<CompletionsResponse>(`/lessons/${lessonId}/completions`, {
      assignmentId,
    }),
};
