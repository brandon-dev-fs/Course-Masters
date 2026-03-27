import { apiClient } from './client.js';
import type { LessonTool, ToolType } from './types.js';

interface CreateToolInput {
  type: ToolType;
  title: string;
  content: Record<string, unknown>;
  order: number;
}

interface UpdateToolInput {
  type?: ToolType;
  title?: string;
  content?: Record<string, unknown>;
  order?: number;
}

export const lessonToolsApi = {
  getAll: (lessonId: string, type?: ToolType) => {
    const url = type
      ? `/lessons/${lessonId}/tools?type=${type}`
      : `/lessons/${lessonId}/tools`;
    return apiClient.get<LessonTool[]>(url);
  },
  create: (lessonId: string, data: CreateToolInput) =>
    apiClient.post<LessonTool>(`/lessons/${lessonId}/tools`, data),
  update: (id: string, data: UpdateToolInput) =>
    apiClient.put<LessonTool>(`/tools/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/tools/${id}`),
};
