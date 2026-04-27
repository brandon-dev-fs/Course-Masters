import { apiClient } from './client.js';
import type { LessonResource, ResourceType } from './types.js';

interface CreateResourceInput {
  type: ResourceType;
  title: string;
  content: Record<string, unknown>;
  order: number;
}

interface UpdateResourceInput {
  type?: ResourceType;
  title?: string;
  content?: Record<string, unknown>;
  order?: number;
  isRequired?: boolean;
}

export const lessonResourcesApi = {
  getAll: (lessonId: string, type?: ResourceType) => {
    const url = type
      ? `/lessons/${lessonId}/resources?type=${type}`
      : `/lessons/${lessonId}/resources`;
    return apiClient.get<LessonResource[]>(url);
  },
  create: (lessonId: string, data: CreateResourceInput) =>
    apiClient.post<LessonResource>(`/lessons/${lessonId}/resources`, data),
  update: (id: string, data: UpdateResourceInput) =>
    apiClient.put<LessonResource>(`/resources/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/resources/${id}`),
};
