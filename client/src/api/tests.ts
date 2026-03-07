import { apiClient } from './client.js';
import type { Test, AttemptResult } from './types.js';

export const testsApi = {
  get: (unitId: string) => apiClient.get<Test | null>(`/units/${unitId}/test`),
  create: (unitId: string, data: { questions: { question: string; options: string[]; correctIndex: number; order: number }[] }) =>
    apiClient.post<Test>(`/units/${unitId}/test`, data),
  submitAttempt: (testId: string, answers: number[]) =>
    apiClient.post<AttemptResult>(`/tests/${testId}/attempts`, { answers }),
};
