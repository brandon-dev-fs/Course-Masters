import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }));

import { assessmentsApi } from '../../api/assessments.js';

const mockAssessment = {
  id: 'a1',
  type: 'lesson_quiz',
  questions: [],
  lastAttempt: null,
};

const mockAttemptResult = {
  id: 'attempt-1',
  score: 0.8,
  passed: true,
  answers: [],
};

const mockPaginatedAttempts = {
  data: [{ id: 'attempt-1', score: 0.8, passed: true, createdAt: '2024-01-01' }],
  total: 1,
  page: 1,
  pageSize: 20,
};

describe('assessmentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lesson quiz', () => {
    it('getLessonQuiz calls GET /lessons/:lessonId/assessment', async () => {
      apiClientMock.get.mockResolvedValueOnce(mockAssessment);
      const result = await assessmentsApi.getLessonQuiz('l1');
      expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/l1/assessment');
      expect(result).toEqual(mockAssessment);
    });

    it('getLessonQuiz returns null when no quiz exists', async () => {
      apiClientMock.get.mockResolvedValueOnce(null);
      const result = await assessmentsApi.getLessonQuiz('l1');
      expect(result).toBeNull();
    });

    it('createLessonQuiz calls POST /lessons/:lessonId/assessment with data', async () => {
      const payload = { questions: [] };
      apiClientMock.post.mockResolvedValueOnce(mockAssessment);
      const result = await assessmentsApi.createLessonQuiz('l1', payload);
      expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/l1/assessment', payload);
      expect(result).toEqual(mockAssessment);
    });
  });

  describe('unit quiz', () => {
    it('getUnitQuiz calls GET /units/:unitId/assessment', async () => {
      apiClientMock.get.mockResolvedValueOnce(mockAssessment);
      await assessmentsApi.getUnitQuiz('u1');
      expect(apiClientMock.get).toHaveBeenCalledWith('/units/u1/assessment');
    });

    it('createUnitQuiz calls POST /units/:unitId/assessment with data', async () => {
      const payload = { questions: [] };
      apiClientMock.post.mockResolvedValueOnce(mockAssessment);
      await assessmentsApi.createUnitQuiz('u1', payload);
      expect(apiClientMock.post).toHaveBeenCalledWith('/units/u1/assessment', payload);
    });
  });

  describe('course exam', () => {
    it('getCourseExam calls GET /courses/:courseId/assessment', async () => {
      apiClientMock.get.mockResolvedValueOnce(mockAssessment);
      await assessmentsApi.getCourseExam('c1');
      expect(apiClientMock.get).toHaveBeenCalledWith('/courses/c1/assessment');
    });

    it('createCourseExam calls POST /courses/:courseId/assessment with data', async () => {
      const payload = { questions: [] };
      apiClientMock.post.mockResolvedValueOnce(mockAssessment);
      await assessmentsApi.createCourseExam('c1', payload);
      expect(apiClientMock.post).toHaveBeenCalledWith('/courses/c1/assessment', payload);
    });
  });

  describe('update', () => {
    it('update calls PUT /assessments/:assessmentId with data', async () => {
      const payload = { questions: [] };
      apiClientMock.put.mockResolvedValueOnce(mockAssessment);
      const result = await assessmentsApi.update('a1', payload);
      expect(apiClientMock.put).toHaveBeenCalledWith('/assessments/a1', payload);
      expect(result).toEqual(mockAssessment);
    });
  });

  describe('attempts', () => {
    it('getAttempts calls GET /assessments/:id/attempts with default pagination', async () => {
      apiClientMock.get.mockResolvedValueOnce(mockPaginatedAttempts);
      const result = await assessmentsApi.getAttempts('a1');
      expect(apiClientMock.get).toHaveBeenCalledWith('/assessments/a1/attempts?page=1&pageSize=20');
      expect(result).toEqual(mockPaginatedAttempts);
    });

    it('getAttempts uses provided page and pageSize', async () => {
      apiClientMock.get.mockResolvedValueOnce(mockPaginatedAttempts);
      await assessmentsApi.getAttempts('a1', 2, 10);
      expect(apiClientMock.get).toHaveBeenCalledWith('/assessments/a1/attempts?page=2&pageSize=10');
    });

    it('submitAttempt calls POST /assessments/:id/attempts with answers', async () => {
      const answers = [{ questionId: 'q1', value: 'A' }];
      apiClientMock.post.mockResolvedValueOnce(mockAttemptResult);
      const result = await assessmentsApi.submitAttempt('a1', answers);
      expect(apiClientMock.post).toHaveBeenCalledWith('/assessments/a1/attempts', { answers });
      expect(result).toEqual(mockAttemptResult);
    });
  });

  describe('bulkUpdateCalculator', () => {
    it('calls PATCH /assessments/:id/questions/calculator with data', async () => {
      const payload = { questionIds: ['q1', 'q2'], calculatorEnabled: true };
      apiClientMock.patch.mockResolvedValueOnce(mockAssessment);
      const result = await assessmentsApi.bulkUpdateCalculator('a1', payload);
      expect(apiClientMock.patch).toHaveBeenCalledWith(
        '/assessments/a1/questions/calculator',
        payload,
      );
      expect(result).toEqual(mockAssessment);
    });
  });
});
