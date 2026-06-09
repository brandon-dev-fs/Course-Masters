import { apiClient } from './client.js';

import type { ChecklistItem } from './types.js';

export type { ChecklistItem };

export const checklistApi = {
  getAll: (lessonId: string): Promise<ChecklistItem[]> =>
    apiClient.get<ChecklistItem[]>(`/lessons/${lessonId}/checklist`),

  create: (lessonId: string, text: string): Promise<ChecklistItem> =>
    apiClient.post<ChecklistItem>(`/lessons/${lessonId}/checklist`, { text }),

  update: (itemId: string, data: { text?: string; checked?: boolean }): Promise<ChecklistItem> =>
    apiClient.put<ChecklistItem>(`/checklist-items/${itemId}`, data),

  delete: (itemId: string): Promise<void> =>
    apiClient.delete<void>(`/checklist-items/${itemId}`),

  reorder: (lessonId: string, itemIds: string[]): Promise<ChecklistItem[]> =>
    apiClient.put<ChecklistItem[]>(`/lessons/${lessonId}/checklist/reorder`, { itemIds }),
};
