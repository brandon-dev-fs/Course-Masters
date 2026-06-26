import { apiClient } from './client.js';

import type { BuilderOutline, ReorderItem } from './types.js';

export const builderApi = {
  getOutline: (courseId: string): Promise<BuilderOutline> =>
    apiClient.get<BuilderOutline>(`/courses/${courseId}/builder/outline`),

  reorderUnits: (courseId: string, items: ReorderItem[]): Promise<void> =>
    apiClient.put<void>(`/courses/${courseId}/units/reorder`, { items }),

  reorderLessons: (unitId: string, items: ReorderItem[]): Promise<void> =>
    apiClient.put<void>(`/units/${unitId}/lessons/reorder`, { items }),
};
