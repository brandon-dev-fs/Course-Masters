import { apiClient } from './client.js';
import type { Bookmark } from './types.js';

export const bookmarksApi = {
  upsert: (assignmentId: string, note: string): Promise<Bookmark> =>
    apiClient.put<Bookmark>(`/assignments/${assignmentId}/bookmark`, { note }),

  delete: (assignmentId: string): Promise<void> =>
    apiClient.delete<void>(`/assignments/${assignmentId}/bookmark`),
};
