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

import { progressApi } from '../../api/progress.js';

const mockCourseProgress = {
  courseId: 'course-1',
  completedLessons: 3,
  totalLessons: 10,
  percentage: 27,
  examPassed: false,
};

const mockUnitProgress = {
  unitId: 'unit-1',
  completedLessons: 2,
  totalLessons: 4,
  percentage: 50,
};

describe('progressApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getCourse calls GET /courses/:courseId/progress', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockCourseProgress);
    const result = await progressApi.getCourse('course-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/courses/course-1/progress');
    expect(result).toEqual(mockCourseProgress);
  });

  it('getUnit calls GET /courses/:courseId/units/:unitId/progress', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockUnitProgress);
    const result = await progressApi.getUnit('course-1', 'unit-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/courses/course-1/units/unit-1/progress');
    expect(result).toEqual(mockUnitProgress);
  });

  it('getCourse interpolates courseId into the URL', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockCourseProgress);
    await progressApi.getCourse('course-abc-123');
    expect(apiClientMock.get).toHaveBeenCalledWith('/courses/course-abc-123/progress');
  });

  it('getUnit interpolates both courseId and unitId into the URL', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockUnitProgress);
    await progressApi.getUnit('course-abc', 'unit-xyz');
    expect(apiClientMock.get).toHaveBeenCalledWith('/courses/course-abc/units/unit-xyz/progress');
  });
});
