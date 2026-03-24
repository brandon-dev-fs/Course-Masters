import { apiClient } from './client.js';
import type { ResourceCompletionItem } from './types.js';

export const resourceCompletionsApi = {
  get: (lessonId: string) =>
    apiClient.get<{ completions: ResourceCompletionItem[] }>(`/lessons/${lessonId}/completions`),
  toggle: (lessonId: string, resourceType: string, resourceId: string) =>
    apiClient.post<{ completions: ResourceCompletionItem[] }>(`/lessons/${lessonId}/completions`, {
      resourceType,
      resourceId,
    }),
};
