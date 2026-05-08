import { apiClient } from './client.js';
import type { Assessment, AttemptResult, AttemptSummary, PaginatedAttempts } from './types.js';

interface QuestionInput {
  type?: string;
  question: string;
  content: Record<string, unknown>;
  order: number;
  calculatorEnabled?: boolean;
}

interface AssessmentInput {
  questions: QuestionInput[];
}

export const assessmentsApi = {
  getLessonQuiz: (lessonId: string) =>
    apiClient.get<Assessment | null>(`/lessons/${lessonId}/assessment`),
  createLessonQuiz: (lessonId: string, data: AssessmentInput) =>
    apiClient.post<Assessment>(`/lessons/${lessonId}/assessment`, data),

  getUnitQuiz: (unitId: string) =>
    apiClient.get<Assessment | null>(`/units/${unitId}/assessment`),
  createUnitQuiz: (unitId: string, data: AssessmentInput) =>
    apiClient.post<Assessment>(`/units/${unitId}/assessment`, data),

  getCourseExam: (courseId: string) =>
    apiClient.get<Assessment | null>(`/courses/${courseId}/assessment`),
  createCourseExam: (courseId: string, data: AssessmentInput) =>
    apiClient.post<Assessment>(`/courses/${courseId}/assessment`, data),

  update: (assessmentId: string, data: AssessmentInput) =>
    apiClient.put<Assessment>(`/assessments/${assessmentId}`, data),

  getAttempts: (assessmentId: string, page = 1, pageSize = 20) =>
    apiClient.get<PaginatedAttempts>(`/assessments/${assessmentId}/attempts?page=${page}&pageSize=${pageSize}`),
  submitAttempt: (assessmentId: string, answers: unknown[]) =>
    apiClient.post<AttemptResult>(`/assessments/${assessmentId}/attempts`, { answers }),

  bulkUpdateCalculator: (
    assessmentId: string,
    data: { questionIds: string[]; calculatorEnabled: boolean },
  ) =>
    apiClient.patch<Assessment>(`/assessments/${assessmentId}/questions/calculator`, data),
};
