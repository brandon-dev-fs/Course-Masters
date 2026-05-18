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

import { lessonResourcesApi } from '../../api/lesson-resources.js';

const mockResource = {
  id: 'r1',
  lessonId: 'lesson-1',
  type: 'note' as const,
  title: 'Test Resource',
  content: { body: {} },
  order: 1,
  isRequired: false,
};

describe('lessonResourcesApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /lessons/:lessonId/resources without type filter', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockResource]);
    const result = await lessonResourcesApi.getAll('lesson-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/resources');
    expect(result).toEqual([mockResource]);
  });

  it('getAll calls GET /lessons/:lessonId/resources?type=note when type provided', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockResource]);
    const result = await lessonResourcesApi.getAll('lesson-1', 'note');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/resources?type=note');
    expect(result).toEqual([mockResource]);
  });

  it('getAll calls GET with type=video when video type is provided', async () => {
    apiClientMock.get.mockResolvedValueOnce([]);
    await lessonResourcesApi.getAll('lesson-1', 'video');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/resources?type=video');
  });

  it('create calls POST /lessons/:lessonId/resources with payload', async () => {
    const payload = { type: 'note' as const, title: 'New Resource', content: { body: {} }, order: 1 };
    apiClientMock.post.mockResolvedValueOnce(mockResource);
    const result = await lessonResourcesApi.create('lesson-1', payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-1/resources', payload);
    expect(result).toEqual(mockResource);
  });

  it('update calls PUT /resources/:id with payload', async () => {
    const updates = { title: 'Updated Title', order: 2 };
    const updated = { ...mockResource, ...updates };
    apiClientMock.put.mockResolvedValueOnce(updated);
    const result = await lessonResourcesApi.update('r1', updates);
    expect(apiClientMock.put).toHaveBeenCalledWith('/resources/r1', updates);
    expect(result).toEqual(updated);
  });

  it('delete calls DELETE /resources/:id', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await lessonResourcesApi.delete('r1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/resources/r1');
    expect(result).toBeUndefined();
  });
});
