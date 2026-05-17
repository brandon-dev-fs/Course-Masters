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

import { lessonsApi } from '../../api/lessons.js';

const mockLesson = { id: 'l1', title: 'Lesson 1', order: 1, unitId: 'u1' };

describe('lessonsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /units/:unitId/lessons', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockLesson]);
    const result = await lessonsApi.getAll('u1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/units/u1/lessons');
    expect(result).toEqual([mockLesson]);
  });

  it('getOne calls GET /units/:unitId/lessons/:lessonId', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockLesson);
    const result = await lessonsApi.getOne('u1', 'l1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/units/u1/lessons/l1');
    expect(result).toEqual(mockLesson);
  });

  it('create calls POST /units/:unitId/lessons with data', async () => {
    const payload = { title: 'New Lesson', order: 1 };
    apiClientMock.post.mockResolvedValueOnce(mockLesson);
    const result = await lessonsApi.create('u1', payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/units/u1/lessons', payload);
    expect(result).toEqual(mockLesson);
  });

  it('update calls PUT /units/:unitId/lessons/:lessonId with data', async () => {
    const updates = { title: 'Updated Lesson' };
    apiClientMock.put.mockResolvedValueOnce({ ...mockLesson, ...updates });
    const result = await lessonsApi.update('u1', 'l1', updates);
    expect(apiClientMock.put).toHaveBeenCalledWith('/units/u1/lessons/l1', updates);
    expect(result).toMatchObject({ title: 'Updated Lesson' });
  });

  it('update accepts description, objective, and planContent', async () => {
    const updates = {
      description: 'A lesson',
      objective: 'Learn things',
      planContent: { type: 'doc', content: [] },
    };
    apiClientMock.put.mockResolvedValueOnce(mockLesson);
    await lessonsApi.update('u1', 'l1', updates);
    expect(apiClientMock.put).toHaveBeenCalledWith('/units/u1/lessons/l1', updates);
  });

  it('delete calls DELETE /units/:unitId/lessons/:lessonId', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await lessonsApi.delete('u1', 'l1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/units/u1/lessons/l1');
    expect(result).toBeUndefined();
  });
});
