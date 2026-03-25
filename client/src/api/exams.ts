import { apiClient } from './client.js';
import type { FinalExam, AttemptResult } from './types.js';

export const examsApi = {
  get: (courseId: string) => apiClient.get<FinalExam | null>(`/courses/${courseId}/final-exam`),
  getForEdit: (courseId: string) => apiClient.get<(FinalExam & { questions: Array<{ id: string; question: string; options: string[]; correctIndex: number; order: number }> }) | null>(`/courses/${courseId}/final-exam/edit`),
  create: (courseId: string, data: { questions: { question: string; options: string[]; correctIndex: number; order: number }[] }) =>
    apiClient.post<FinalExam>(`/courses/${courseId}/final-exam`, data),
  update: (courseId: string, data: { questions: { question: string; options: string[]; correctIndex: number; order: number }[] }) =>
    apiClient.put<FinalExam>(`/courses/${courseId}/final-exam`, data),
  submitAttempt: (examId: string, answers: number[]) =>
    apiClient.post<AttemptResult>(`/exams/${examId}/attempts`, { answers }),
};
