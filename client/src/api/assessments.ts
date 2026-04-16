import { apiClient } from './client.js';
import type { Assessment, AttemptResult, AttemptSummary } from './types.js';

interface QuestionInput {
  type?: string;
  question: string;
  content: Record<string, unknown>;
  order: number;
}

interface AssessmentInput {
  questions: QuestionInput[];
  calculatorAllowed?: boolean;
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

  getAttempts: (assessmentId: string) =>
    apiClient.get<AttemptSummary[]>(`/assessments/${assessmentId}/attempts`),
  submitAttempt: (assessmentId: string, answers: unknown[]) =>
    apiClient.post<AttemptResult>(`/assessments/${assessmentId}/attempts`, { answers }),
};
