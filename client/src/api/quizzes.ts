import { apiClient } from './client.js';
import type { Quiz, AttemptResult, AttemptSummary } from './types.js';

export const quizzesApi = {
  get: (lessonId: string) => apiClient.get<Quiz | null>(`/lessons/${lessonId}/quiz`),
  create: (lessonId: string, data: { questions: { question: string; options: string[]; correctIndex: number; order: number }[] }) =>
    apiClient.post<Quiz>(`/lessons/${lessonId}/quiz`, data),
  getAttempts: (quizId: string) => apiClient.get<AttemptSummary[]>(`/quizzes/${quizId}/attempts`),
  submitAttempt: (quizId: string, answers: number[]) =>
    apiClient.post<AttemptResult>(`/quizzes/${quizId}/attempts`, { answers }),
};
