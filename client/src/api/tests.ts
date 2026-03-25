import { apiClient } from './client.js';
import type { Test, AttemptResult } from './types.js';

type QuestionWithCorrect = { id: string; question: string; options: string[]; correctIndex: number; order: number };

export const testsApi = {
  get: (unitId: string) => apiClient.get<Test | null>(`/units/${unitId}/test`),
  getForEdit: (unitId: string) => apiClient.get<(Test & { questions: QuestionWithCorrect[] }) | null>(`/units/${unitId}/test/edit`),
  create: (unitId: string, data: { questions: { question: string; options: string[]; correctIndex: number; order: number }[] }) =>
    apiClient.post<Test>(`/units/${unitId}/test`, data),
  update: (unitId: string, data: { questions: { question: string; options: string[]; correctIndex: number; order: number }[] }) =>
    apiClient.put<Test>(`/units/${unitId}/test`, data),
  submitAttempt: (testId: string, answers: number[]) =>
    apiClient.post<AttemptResult>(`/tests/${testId}/attempts`, { answers }),
};
