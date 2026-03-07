import { apiClient } from './client.js';
import type { CourseProgress, UnitProgress } from './types.js';

export const progressApi = {
  getCourse: (courseId: string) => apiClient.get<CourseProgress>(`/courses/${courseId}/progress`),
  getUnit: (courseId: string, unitId: string) =>
    apiClient.get<UnitProgress>(`/courses/${courseId}/units/${unitId}/progress`),
};
