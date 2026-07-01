import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import { builderApi } from '../../api/builder.js';
import type { BuilderOutline, ReorderItem } from '../../api/types.js';

const mockOutline: BuilderOutline = {
  course: { id: 'c1', title: 'Test Course', description: '' },
  units: [],
  courseAssessment: null,
};

const mockReorderItems: ReorderItem[] = [
  { id: 'u1', order: 1 },
  { id: 'u2', order: 2 },
];

describe('builderApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOutline', () => {
    it('calls GET /courses/:courseId/builder/outline', async () => {
      apiClientMock.get.mockResolvedValueOnce(mockOutline);
      const result = await builderApi.getOutline('c1');
      expect(apiClientMock.get).toHaveBeenCalledWith('/courses/c1/builder/outline');
      expect(result).toEqual(mockOutline);
    });

    it('returns outline with units and assessments', async () => {
      const outlineWithData: BuilderOutline = {
        course: { id: 'c1', title: 'Course', description: 'Desc' },
        units: [
          {
            id: 'u1',
            title: 'Unit 1',
            description: '',
            order: 1,
            lessons: [],
            assessment: { id: 'a1', type: 'unit_quiz', questionCount: 5 },
          },
        ],
        courseAssessment: { id: 'ca1', type: 'course_exam', questionCount: 10 },
      };
      apiClientMock.get.mockResolvedValueOnce(outlineWithData);
      const result = await builderApi.getOutline('c1');
      expect(result.units).toHaveLength(1);
      expect(result.courseAssessment?.questionCount).toBe(10);
    });
  });

  describe('reorderUnits', () => {
    it('calls PUT /courses/:courseId/units/reorder with items', async () => {
      apiClientMock.put.mockResolvedValueOnce(undefined);
      const result = await builderApi.reorderUnits('c1', mockReorderItems);
      expect(apiClientMock.put).toHaveBeenCalledWith('/courses/c1/units/reorder', {
        items: mockReorderItems,
      });
      expect(result).toBeUndefined();
    });

    it('passes empty items array', async () => {
      apiClientMock.put.mockResolvedValueOnce(undefined);
      await builderApi.reorderUnits('c1', []);
      expect(apiClientMock.put).toHaveBeenCalledWith('/courses/c1/units/reorder', { items: [] });
    });
  });

  describe('reorderLessons', () => {
    it('calls PUT /units/:unitId/lessons/reorder with items', async () => {
      apiClientMock.put.mockResolvedValueOnce(undefined);
      const result = await builderApi.reorderLessons('u1', mockReorderItems);
      expect(apiClientMock.put).toHaveBeenCalledWith('/units/u1/lessons/reorder', {
        items: mockReorderItems,
      });
      expect(result).toBeUndefined();
    });

    it('passes empty items array', async () => {
      apiClientMock.put.mockResolvedValueOnce(undefined);
      await builderApi.reorderLessons('u1', []);
      expect(apiClientMock.put).toHaveBeenCalledWith('/units/u1/lessons/reorder', { items: [] });
    });
  });
});
