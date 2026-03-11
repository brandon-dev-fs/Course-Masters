import { apiClient } from './client.js';
import type { PracticeProblem } from './types.js';

export const practiceProblemsApi = {
  getAll: (lessonId: string) => apiClient.get<PracticeProblem[]>(`/lessons/${lessonId}/practice-problems`),
  create: (lessonId: string, data: { question: string; options: string[]; correctIndex: number; order: number }) =>
    apiClient.post<PracticeProblem>(`/lessons/${lessonId}/practice-problems`, data),
  update: (id: string, data: { question?: string; options?: string[]; correctIndex?: number; order?: number }) =>
    apiClient.put<PracticeProblem>(`/practice-problems/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/practice-problems/${id}`),
};
