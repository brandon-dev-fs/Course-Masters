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

import { lessonToolsApi } from '../../api/lesson-tools.js';

const mockTool = {
  id: 't1',
  lessonId: 'lesson-1',
  type: 'flash_card' as const,
  title: 'Flash Card Tool',
  content: { front: 'Question', back: 'Answer' },
  order: 1,
  isRequired: false,
};

describe('lessonToolsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /lessons/:lessonId/tools without type filter', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockTool]);
    const result = await lessonToolsApi.getAll('lesson-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/tools');
    expect(result).toEqual([mockTool]);
  });

  it('getAll calls GET /lessons/:lessonId/tools?type=flash_card when type provided', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockTool]);
    const result = await lessonToolsApi.getAll('lesson-1', 'flash_card');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/tools?type=flash_card');
    expect(result).toEqual([mockTool]);
  });

  it('getAll calls GET with type=vocab when vocab type is provided', async () => {
    apiClientMock.get.mockResolvedValueOnce([]);
    await lessonToolsApi.getAll('lesson-1', 'vocab');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/tools?type=vocab');
  });

  it('create calls POST /lessons/:lessonId/tools with payload', async () => {
    const payload = { type: 'flash_card' as const, title: 'New Tool', content: { front: 'Q', back: 'A' }, order: 1 };
    apiClientMock.post.mockResolvedValueOnce(mockTool);
    const result = await lessonToolsApi.create('lesson-1', payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-1/tools', payload);
    expect(result).toEqual(mockTool);
  });

  it('update calls PUT /tools/:id with payload', async () => {
    const updates = { title: 'Updated Tool', order: 2 };
    const updated = { ...mockTool, ...updates };
    apiClientMock.put.mockResolvedValueOnce(updated);
    const result = await lessonToolsApi.update('t1', updates);
    expect(apiClientMock.put).toHaveBeenCalledWith('/tools/t1', updates);
    expect(result).toEqual(updated);
  });

  it('delete calls DELETE /tools/:id', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await lessonToolsApi.delete('t1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/tools/t1');
    expect(result).toBeUndefined();
  });
});
