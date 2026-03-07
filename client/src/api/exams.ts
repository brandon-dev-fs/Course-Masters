import { apiClient } from './client.js';
import type { FinalExam, AttemptResult } from './types.js';

export const examsApi = {
  get: (courseId: string) => apiClient.get<FinalExam | null>(`/courses/${courseId}/final-exam`),
  create: (courseId: string, data: { questions: { question: string; options: string[]; correctIndex: number; order: number }[] }) =>
    apiClient.post<FinalExam>(`/courses/${courseId}/final-exam`, data),
  submitAttempt: (examId: string, answers: number[]) =>
    apiClient.post<AttemptResult>(`/exams/${examId}/attempts`, { answers }),
};
